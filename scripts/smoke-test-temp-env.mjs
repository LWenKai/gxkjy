const BASE_URL = process.env.BASE_URL || 'http://182.92.75.122';
const API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api`;
const CLIENT_USERNAME = process.env.CLIENT_USERNAME || 'demo';
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || 'Demo@2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const results = [];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
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

let clientToken = '';

await check('/api/health', async () => {
  const data = await api('/health');
  if (data.database !== 'ok') throw new Error(`database=${data.database}`);
  return 'database ok';
});

await check('/api/public/settings', async () => {
  const data = await api('/public/settings');
  if (!data.platform_name) throw new Error('platform_name missing');
  return data.platform_name;
});

await check('/c/invalid-token', async () => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/c/invalid-token`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes('<html') && !html.includes('<div')) {
    throw new Error('response does not look like page html');
  }
  return `HTTP ${response.status}`;
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
  const data = await api('/client/dashboard/summary', { headers: auth(clientToken) });
  if (!data.company?.name) throw new Error('company missing');
  if (!data.stats) throw new Error('stats missing');
  return `${data.company.name} / 可开证 ${data.stats.certifiable_count}`;
});

await check('client detection records', async () => {
  const data = await api('/client/detection-records?page=1&page_size=5', {
    headers: auth(clientToken),
  });
  if (!Array.isArray(data.items)) throw new Error('items missing');
  return `records ${data.total}`;
});

await check('client certifiable records', async () => {
  const data = await api('/client/certifiable-records?page=1&page_size=5', {
    headers: auth(clientToken),
  });
  if (!Array.isArray(data.items)) throw new Error('items missing');
  return `certifiable ${data.total}`;
});

await check('client certificates', async () => {
  const data = await api('/client/certificates?page=1&page_size=5', {
    headers: auth(clientToken),
  });
  if (!Array.isArray(data.items)) throw new Error('items missing');
  return `certificates ${data.total}`;
});

if (ADMIN_USERNAME && ADMIN_PASSWORD) {
  await check('admin login optional', async () => {
    const data = await api('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    });
    if (!data.access_token) throw new Error('access_token missing');
    return ADMIN_USERNAME;
  });
}

const failed = results.filter((item) => !item.ok);
if (failed.length) {
  console.error(`\nSmoke test failed: ${failed.length}/${results.length}`);
  process.exit(1);
}

console.log(`\nSmoke test passed: ${results.length}/${results.length}`);
