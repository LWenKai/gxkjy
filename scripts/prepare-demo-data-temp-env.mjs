const BASE_URL = process.env.BASE_URL || 'http://182.92.75.122';
const API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const DEMO_COMPANY_NAME = '山西谷芯演示食品有限公司';
const DEMO_CLIENT_USERNAME = 'demo';
const DEMO_CLIENT_PASSWORD = 'Demo@2026';
const DEMO_MANUFACTURER_CODE = 'GXTEST';
const DEMO_DEVICE_SN = 'GXDEMO001';

if (!ADMIN_PASSWORD) {
  console.error('缺少 ADMIN_PASSWORD。请临时通过环境变量传入后台管理员密码，不要写入代码或文档。');
  process.exit(1);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
    body = { raw: text };
  }

  if (!response.ok || body.success === false) {
    const message = body?.message || body?.raw || response.statusText;
    throw new Error(`${options.method || 'GET'} ${path} ${response.status}: ${message}`);
  }

  return body.data;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function addYears(date, years) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function iso(date) {
  return date.toISOString();
}

function findExact(items, key, value) {
  return items.find((item) => item[key] === value);
}

async function adminLogin() {
  const data = await request('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  return data.access_token;
}

async function ensureCompany(adminToken) {
  const today = new Date();
  const serviceExpireAt = addYears(today, 1);
  const payload = {
    name: DEMO_COMPANY_NAME,
    contact_name: '李经理',
    phone: '13363412262',
    address: '山西省太原市小店区演示地址',
    origin_address: '山西省太原市小店区演示基地',
    default_certificate_type: 'enterprise_quick_test_label',
    service_start_at: iso(today),
    service_expire_at: iso(serviceExpireAt),
    status: 'normal',
  };

  const list = await request(
    `/admin/companies?page=1&page_size=50&name=${encodeURIComponent(DEMO_COMPANY_NAME)}`,
    { headers: auth(adminToken) },
  );
  let company = findExact(list.items || [], 'name', DEMO_COMPANY_NAME);
  if (!company) {
    company = await request('/admin/companies', {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify(payload),
    });
  } else {
    company = await request(`/admin/companies/${company.id}`, {
      method: 'PUT',
      headers: auth(adminToken),
      body: JSON.stringify(payload),
    });
    await request(`/admin/companies/${company.id}/enable`, {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify({}),
    });
  }
  return company;
}

async function ensureCompanyUser(adminToken, companyId) {
  const list = await request(`/admin/companies/${companyId}/users?page=1&page_size=100`, {
    headers: auth(adminToken),
  });
  const existing = findExact(list.items || [], 'username', DEMO_CLIENT_USERNAME);
  if (existing) {
    await request(`/admin/company-users/${existing.id}/reset-password`, {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify({ password: DEMO_CLIENT_PASSWORD }),
    });
    await request(`/admin/company-users/${existing.id}/enable`, {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify({}),
    });
    return existing;
  }

  return request(`/admin/companies/${companyId}/users`, {
    method: 'POST',
    headers: auth(adminToken),
    body: JSON.stringify({
      username: DEMO_CLIENT_USERNAME,
      password: DEMO_CLIENT_PASSWORD,
      real_name: '演示账号',
      status: 'normal',
    }),
  });
}

async function ensureManufacturer(adminToken) {
  const list = await request(
    `/admin/manufacturer-interfaces?page=1&page_size=50&manufacturer_code=${DEMO_MANUFACTURER_CODE}`,
    { headers: auth(adminToken) },
  );
  let item = findExact(list.items || [], 'manufacturer_code', DEMO_MANUFACTURER_CODE);
  const payload = {
    manufacturer_name: '谷芯测试厂家',
    manufacturer_code: DEMO_MANUFACTURER_CODE,
    integration_type: 'http_api',
    sign_rule: 'HMAC-SHA256',
    allowed_ips: '',
    status: 'normal',
  };

  if (!item) {
    item = await request('/admin/manufacturer-interfaces', {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify(payload),
    });
  } else {
    item = await request(`/admin/manufacturer-interfaces/${item.id}`, {
      method: 'PUT',
      headers: auth(adminToken),
      body: JSON.stringify(payload),
    });
    await request(`/admin/manufacturer-interfaces/${item.id}/enable`, {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify({}),
    });
  }
  return item;
}

async function ensureDevice(adminToken, companyId) {
  const list = await request(
    `/admin/devices?page=1&page_size=100&manufacturer_code=${DEMO_MANUFACTURER_CODE}`,
    { headers: auth(adminToken) },
  );
  let device = (list.items || []).find((item) => item.device_sn === DEMO_DEVICE_SN);
  const payload = {
    manufacturer_code: DEMO_MANUFACTURER_CODE,
    device_sn: DEMO_DEVICE_SN,
    device_name: '谷芯测试快检仪',
    model: 'GX-DEMO-KJY',
    company_id: String(companyId),
    status: 'normal',
    remark: '演示环境测试设备，仅用于系统流程验证',
  };

  if (!device) {
    device = await request('/admin/devices', {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify(payload),
    });
  } else {
    device = await request(`/admin/devices/${device.id}`, {
      method: 'PUT',
      headers: auth(adminToken),
      body: JSON.stringify(payload),
    });
  }

  await request(`/admin/devices/${device.id}/bind`, {
    method: 'POST',
    headers: auth(adminToken),
    body: JSON.stringify({ company_id: String(companyId) }),
  });
  await request(`/admin/devices/${device.id}/enable`, {
    method: 'POST',
    headers: auth(adminToken),
    body: JSON.stringify({}),
  });

  return device;
}

const DEMO_PRODUCTS = [
  ['西红柿', '蔬菜', '山西省太原市小店区演示基地'],
  ['黄瓜', '蔬菜', '山西省太原市小店区演示基地'],
  ['菠菜', '蔬菜', '山西省太原市小店区演示基地'],
  ['苹果', '水果', '山西省运城市演示果园'],
  ['鸡蛋', '禽蛋', '山西省太原市演示养殖基地'],
  ['生鲜肉', '畜禽肉', '山西省太原市演示屠宰配送中心'],
];

async function ensureProducts(adminToken, companyId) {
  for (const [name, category, origin] of DEMO_PRODUCTS) {
    const list = await request(
      `/admin/products?page=1&page_size=20&company_id=${companyId}&product_name=${encodeURIComponent(name)}`,
      { headers: auth(adminToken) },
    );
    const existing = findExact(list.items || [], 'product_name', name);
    const payload = {
      company_id: String(companyId),
      product_name: name,
      product_category: category,
      spec_model: '演示批次',
      origin,
      default_unit: name === '鸡蛋' ? '盒' : 'kg',
      remark: '演示数据，仅用于测试环境展示',
      status: 'normal',
    };
    if (existing) {
      await request(`/admin/products/${existing.id}`, {
        method: 'PUT',
        headers: auth(adminToken),
        body: JSON.stringify(payload),
      });
      await request(`/admin/products/${existing.id}/enable`, {
        method: 'POST',
        headers: auth(adminToken),
        body: JSON.stringify({}),
      });
    } else {
      await request('/admin/products', {
        method: 'POST',
        headers: auth(adminToken),
        body: JSON.stringify(payload),
      });
    }
  }
}

async function ensureProfile(adminToken, companyId) {
  await request(`/admin/companies/${companyId}/profile`, {
    method: 'PUT',
    headers: auth(adminToken),
    body: JSON.stringify({
      intro:
        '山西谷芯演示食品有限公司为测试演示企业，模拟农产品配送和食品快检日常管理场景，用于展示检测记录、合格证和扫码查询流程。',
      main_products: '蔬菜、水果、农产品配送',
      display_address: '山西省太原市小店区演示地址',
      display_phone: '13363412262',
      qualification_description: '演示企业公开资料，仅用于测试环境展示。',
      is_public_enabled: true,
    }),
  });

  const profile = await request(`/admin/companies/${companyId}/profile`, {
    headers: auth(adminToken),
  });
  const existingNames = new Set((profile.assets || []).map((asset) => asset.file_name));
  const assets = [
    {
      file_name: '演示企业门头',
      file_type: 'other',
      file_url: 'https://dummyimage.com/900x560/e8f7e8/0b7a2a.png&text=GUXIN+DEMO+COMPANY',
      is_public: true,
      sort_order: 1,
    },
    {
      file_name: '演示资质图片',
      file_type: 'qualification_certificate',
      file_url: 'https://dummyimage.com/900x560/ffffff/0b7a2a.png&text=DEMO+QUALIFICATION',
      is_public: true,
      sort_order: 2,
    },
  ];

  for (const asset of assets) {
    if (!existingNames.has(asset.file_name)) {
      await request(`/admin/companies/${companyId}/profile/assets`, {
        method: 'POST',
        headers: auth(adminToken),
        body: JSON.stringify(asset),
      });
    }
  }
}

const DEMO_RECORDS = [
  {
    product_name: '西红柿',
    sample_name: '西红柿演示样品',
    sample_category: '蔬菜',
    overall_result: 'qualified',
    items: [
      ['农药残留', 'GB/T 5009.199-2003', '0.08', 'mg/kg', '≤0.50 mg/kg', 'qualified'],
      ['多菌灵', 'NY/T 761-2008', '未检出', '', '≤0.20 mg/kg', 'qualified'],
    ],
  },
  {
    product_name: '黄瓜',
    sample_name: '黄瓜演示样品',
    sample_category: '蔬菜',
    overall_result: 'qualified',
    items: [
      ['农药残留', 'GB/T 5009.199-2003', '0.06', 'mg/kg', '≤0.50 mg/kg', 'qualified'],
      ['毒死蜱', 'GB/T 5009.145-2003', '未检出', '', '≤0.10 mg/kg', 'qualified'],
    ],
  },
  {
    product_name: '菠菜',
    sample_name: '菠菜演示样品',
    sample_category: '蔬菜',
    overall_result: 'unqualified',
    items: [
      ['农药残留', 'GB/T 5009.199-2003', '0.82', 'mg/kg', '≤0.50 mg/kg', 'unqualified'],
      ['毒死蜱', 'GB/T 5009.145-2003', '0.21', 'mg/kg', '≤0.10 mg/kg', 'unqualified'],
    ],
  },
  {
    product_name: '苹果',
    sample_name: '苹果演示样品',
    sample_category: '水果',
    overall_result: 'qualified',
    items: [
      ['农药残留', 'GB/T 5009.199-2003', '0.03', 'mg/kg', '≤0.50 mg/kg', 'qualified'],
      ['多菌灵', 'NY/T 761-2008', '0.02', 'mg/kg', '≤0.20 mg/kg', 'qualified'],
    ],
  },
  {
    product_name: '鸡蛋',
    sample_name: '鸡蛋演示样品',
    sample_category: '禽蛋',
    overall_result: 'qualified',
    items: [
      ['兽药残留', 'GB/T 21317-2007', '未检出', '', '不得检出', 'qualified'],
      ['氟苯尼考', 'GB/T 22338-2008', '未检出', '', '不得检出', 'qualified'],
    ],
  },
  {
    product_name: '生鲜肉',
    sample_name: '生鲜肉演示样品',
    sample_category: '畜禽肉',
    overall_result: 'qualified',
    items: [
      ['瘦肉精', 'GB/T 22286-2008', '未检出', '', '不得检出', 'qualified'],
      ['莱克多巴胺', 'GB/T 22286-2008', '未检出', '', '不得检出', 'qualified'],
    ],
  },
];

async function ensureDetectionRecords(adminToken, companyId, deviceId) {
  const list = await request(`/admin/detection-records?page=1&page_size=100&company_id=${companyId}`, {
    headers: auth(adminToken),
  });
  const existingKeys = new Set(
    (list.items || []).map((item) => `${item.product_name}|${item.sample_name || ''}`),
  );
  let created = 0;
  const now = new Date();

  for (let index = 0; index < DEMO_RECORDS.length; index += 1) {
    const record = DEMO_RECORDS[index];
    const key = `${record.product_name}|${record.sample_name}`;
    if (existingKeys.has(key)) continue;

    await request('/admin/test-detection-records', {
      method: 'POST',
      headers: auth(adminToken),
      body: JSON.stringify({
        company_id: String(companyId),
        device_id: String(deviceId),
        product_name: record.product_name,
        sample_name: record.sample_name,
        sample_category: record.sample_category,
        overall_result: record.overall_result,
        test_time: iso(new Date(now.getTime() - (DEMO_RECORDS.length - index) * 60 * 60 * 1000)),
        items: record.items.map(([test_item, test_method, test_value, unit, standard_limit, result]) => ({
          test_item,
          test_method,
          test_value,
          unit,
          standard_limit,
          result,
        })),
      }),
    });
    created += 1;
  }
  return created;
}

async function clientLogin() {
  const data = await request('/client/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: DEMO_CLIENT_USERNAME, password: DEMO_CLIENT_PASSWORD }),
  });
  return data.access_token;
}

async function ensureCertificates(clientToken, adminToken, companyId) {
  const existing = await request(`/admin/certificates?page=1&page_size=100&company_id=${companyId}`, {
    headers: auth(adminToken),
  });
  const normalCount = (existing.items || []).filter((item) => item.status === 'normal').length;
  const voidedCount = (existing.items || []).filter((item) => item.status === 'voided').length;

  const certifiable = await request('/client/certifiable-records?page=1&page_size=100', {
    headers: auth(clientToken),
  });
  let created = 0;
  const targets = (certifiable.items || []).slice(0, Math.max(0, 3 - normalCount));

  for (const record of targets) {
    await request('/client/certificates', {
      method: 'POST',
      headers: auth(clientToken),
      body: JSON.stringify({
        detection_record_id: record.id,
        certificate_type: 'enterprise_quick_test_label',
        product_name: record.product_name || record.sample_name,
        quantity: record.product_name === '鸡蛋' ? '20' : '10',
        unit: record.product_name === '鸡蛋' ? '盒' : 'kg',
        origin: '山西省太原市小店区演示基地',
        issuer_name: DEMO_COMPANY_NAME,
        contact_phone: '13363412262',
        commitment_basis: '企业快检记录，检测结果符合演示合格要求',
      }),
    });
    created += 1;
  }

  const refreshed = await request(`/admin/certificates?page=1&page_size=100&company_id=${companyId}`, {
    headers: auth(adminToken),
  });
  const normal = (refreshed.items || []).find((item) => item.status === 'normal');
  if (normal) {
    await request(`/client/certificates/${normal.id}/print-logs`, {
      method: 'POST',
      headers: auth(clientToken),
      body: JSON.stringify({
        print_status: 'success',
        copies: 1,
        message: '演示环境模拟打印',
      }),
    });
  }

  if (voidedCount === 0) {
    const candidate = (refreshed.items || []).filter((item) => item.status === 'normal').at(-1);
    if (candidate) {
      await request(`/client/certificates/${candidate.id}/void`, {
        method: 'POST',
        headers: auth(clientToken),
        body: JSON.stringify({}),
      });
    }
  }

  const finalList = await request(`/admin/certificates?page=1&page_size=100&company_id=${companyId}`, {
    headers: auth(adminToken),
  });
  return {
    created,
    normal: (finalList.items || []).filter((item) => item.status === 'normal'),
    voided: (finalList.items || []).filter((item) => item.status === 'voided'),
  };
}

async function main() {
  const adminToken = await adminLogin();
  const company = await ensureCompany(adminToken);
  await ensureCompanyUser(adminToken, company.id);
  await ensureManufacturer(adminToken);
  const device = await ensureDevice(adminToken, company.id);
  await ensureProducts(adminToken, company.id);
  await ensureProfile(adminToken, company.id);
  const createdRecords = await ensureDetectionRecords(adminToken, company.id, device.id);
  const clientToken = await clientLogin();
  const certificateResult = await ensureCertificates(clientToken, adminToken, company.id);
  const demoPublic = certificateResult.normal[0]?.qr_url || null;
  const voidedPublic = certificateResult.voided[0]?.qr_url || null;

  console.log(
    JSON.stringify(
      {
        base_url: BASE_URL,
        company: { id: company.id, name: DEMO_COMPANY_NAME },
        client_user: DEMO_CLIENT_USERNAME,
        manufacturer_code: DEMO_MANUFACTURER_CODE,
        device_sn: DEMO_DEVICE_SN,
        created_detection_records: createdRecords,
        created_certificates: certificateResult.created,
        normal_certificate_count: certificateResult.normal.length,
        voided_certificate_count: certificateResult.voided.length,
        demo_public_url: demoPublic,
        voided_public_url: voidedPublic,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
