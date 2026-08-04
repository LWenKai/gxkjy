const BASE_URL = (process.env.BASE_URL || 'https://api.gxkjy.com').replace(/\/$/, '');
const API_BASE_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
const CERT_BASE_URL = (process.env.CERT_BASE_URL || 'https://cert.gxkjy.com').replace(/\/$/, '');
const ADMIN_BASE_URL = (process.env.ADMIN_BASE_URL || 'https://admin.gxkjy.com').replace(/\/$/, '');
const NORMAL_CERT_TOKEN =
  process.env.NORMAL_CERT_TOKEN || 'f600b41e76e1c4504aacbc8a13de3344';
const VOIDED_CERT_TOKEN =
  process.env.VOIDED_CERT_TOKEN || '9ea7a4e2031482df5eccdb2b92959de9';
const CLIENT_USERNAME = process.env.CLIENT_USERNAME || 'demo';
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || 'Demo@2026';

const results = [];

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  return { response, text };
}

async function fetchJson(url, options = {}) {
  const { response, text } = await fetchText(url, options);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { response, body };
}

async function api(path, options = {}) {
  const { response, body } = await fetchJson(`${API_BASE_URL}${path}`, options);
  if (!response.ok || body.success === false) {
    const message = body?.message || body?.raw || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return body.data;
}

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`PASS ${name}${detail ? ` - ${detail}` : ''}`);
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
    console.error(`FAIL ${name} - ${error.message}`);
  }
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function assertPage(url) {
  const { response, text } = await fetchText(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!text.includes('<html') && !text.includes('<div')) {
    throw new Error('response does not look like page html');
  }
  return `HTTP ${response.status}`;
}

let clientToken = '';

await check('api health', async () => {
  const data = await api('/health');
  if (data.database !== 'ok') throw new Error(`database=${data.database}`);
  return 'database ok';
});

await check('public settings', async () => {
  const data = await api('/public/settings');
  if (!data.platform_name) throw new Error('platform_name missing');
  return data.platform_name;
});

await check('admin home', async () => {
  const { response } = await fetchText(`${ADMIN_BASE_URL}/`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return `HTTP ${response.status}`;
});

await check('invalid certificate page', async () => {
  return assertPage(`${CERT_BASE_URL}/c/invalid-token`);
});

await check('normal certificate page', async () => {
  return assertPage(`${CERT_BASE_URL}/c/${NORMAL_CERT_TOKEN}`);
});

await check('voided certificate page', async () => {
  return assertPage(`${CERT_BASE_URL}/c/${VOIDED_CERT_TOKEN}`);
});

await check('invalid certificate api', async () => {
  const data = await api('/public/certificates/invalid-token');
  if (data.valid !== false || data.status !== 'invalid') {
    throw new Error(`unexpected status ${data.status}`);
  }
  return data.status;
});

await check('normal certificate api', async () => {
  const data = await api(`/public/certificates/${NORMAL_CERT_TOKEN}`);
  if (!data.valid || data.status !== 'normal') {
    throw new Error(`unexpected status ${data.status}`);
  }
  return data.certificate?.certificate_no || data.status;
});

await check('voided certificate api', async () => {
  const data = await api(`/public/certificates/${VOIDED_CERT_TOKEN}`);
  if (!data.valid || data.status !== 'voided') {
    throw new Error(`unexpected status ${data.status}`);
  }
  return data.status;
});

await check('client login', async () => {
  const data = await api('/client/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: CLIENT_USERNAME, password: CLIENT_PASSWORD }),
  });
  if (!data.access_token) throw new Error('access_token missing');
  clientToken = data.access_token;
  return CLIENT_USERNAME;
});

await check('client dashboard', async () => {
  const data = await api('/client/dashboard/summary', {
    headers: auth(clientToken),
  });
  if (!data.company?.name) throw new Error('company missing');
  if (!data.stats) throw new Error('stats missing');
  return `${data.company.name} / 可开证 ${data.stats.certifiable_count}`;
});

await check('client records', async () => {
  const data = await api('/client/detection-records?page=1&page_size=3', {
    headers: auth(clientToken),
  });
  if (!Array.isArray(data.items)) throw new Error('items missing');
  return `records ${data.total}`;
});

await check('client certificates', async () => {
  const data = await api('/client/certificates?page=1&page_size=3', {
    headers: auth(clientToken),
  });
  if (!Array.isArray(data.items)) throw new Error('items missing');
  return `certificates ${data.total}`;
});

const failed = results.filter((item) => !item.ok);
if (failed.length) {
  console.error(`\nHTTPS smoke test failed: ${failed.length}/${results.length}`);
  process.exit(1);
}

console.log(`\nHTTPS smoke test passed: ${results.length}/${results.length}`);
