const fs = require('fs');
const path = require('path');

const root = __dirname;
const screensDir = path.join(root, 'screens');
fs.mkdirSync(screensDir, { recursive: true });

const css = String.raw`
:root {
  --bg: #fafafa;
  --surface: #ffffff;
  --surface-warm: var(--surface);
  --fg: #111111;
  --fg-2: var(--fg);
  --muted: #6b6b6b;
  --meta: var(--muted);
  --border: #e5e5e5;
  --border-soft: var(--border);
  --accent: #2f6feb;
  --accent-on: #ffffff;
  --accent-hover: color-mix(in oklab, var(--accent), black 8%);
  --accent-active: color-mix(in oklab, var(--accent), black 14%);
  --success: #17a34a;
  --warn: #eab308;
  --danger: #dc2626;
  --font-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: ui-monospace, "JetBrains Mono", monospace;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 32px;
  --text-3xl: 48px;
  --text-4xl: 64px;
  --leading-body: 1.5;
  --leading-tight: 1.2;
  --tracking-display: -0.01em;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-20: 80px;
  --section-y-desktop: 80px;
  --section-y-tablet: 48px;
  --section-y-phone: 32px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
  --elev-flat: none;
  --elev-ring: 0 0 0 1px var(--border);
  --elev-raised: 0 2px 8px color-mix(in oklab, var(--fg), transparent 92%);
  --focus-ring: 0 0 0 3px color-mix(in oklab, var(--accent), transparent 70%);
  --motion-fast: 150ms;
  --motion-base: 200ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --container-max: 1200px;
  --container-gutter-desktop: 24px;
  --container-gutter-tablet: 16px;
  --container-gutter-phone: 12px;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--fg); font-family: var(--font-body); line-height: var(--leading-body); }
body { overflow-x: hidden; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
button, input, select, textarea { font: inherit; }
h1, h2, h3, h4, .title { font-family: var(--font-display); }
button, .btn { min-height: 44px; border: 0; border-radius: var(--radius-sm); padding: 10px 16px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: background var(--motion-fast) var(--ease-standard), border var(--motion-fast) var(--ease-standard), transform var(--motion-fast) var(--ease-standard); }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.btn-primary { background: var(--accent); color: var(--accent-on); }
.btn-primary:hover { background: var(--accent-hover); text-decoration: none; }
.btn-secondary { background: transparent; color: var(--fg); border: 1px solid var(--border); }
.btn-ghost { background: transparent; color: var(--fg); }
.btn-danger { background: color-mix(in oklab, var(--danger), white 88%); color: var(--danger); }
.app-shell { width: min(100%, 430px); min-height: 100vh; margin: 0 auto; background: var(--bg); position: relative; border-inline: 1px solid var(--border); }
.page { min-height: 100vh; padding: 16px 16px 96px; }
.page.public { padding-bottom: 32px; }
.topbar { min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 12px; position: sticky; top: 0; z-index: 20; background: color-mix(in oklab, var(--bg), transparent 6%); backdrop-filter: blur(8px); padding: 8px 0; }
.back { width: 40px; height: 40px; padding: 0; border: 1px solid var(--border); background: var(--surface); color: var(--fg); }
.title { font-size: var(--text-xl); line-height: var(--leading-tight); letter-spacing: var(--tracking-display); margin: 8px 0 4px; font-weight: 600; }
.subtitle { color: var(--muted); margin: 0; font-size: var(--text-sm); }
.section { margin-top: 16px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
.card + .card { margin-top: 12px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.row-start { display: flex; align-items: center; gap: 12px; }
.stack > * + * { margin-top: 12px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.metric { min-height: 88px; }
.metric strong { display: block; font-size: 26px; line-height: 1.1; margin-top: 8px; font-family: var(--font-mono); }
.label { color: var(--muted); font-size: var(--text-sm); }
.badge { display: inline-flex; align-items: center; gap: 6px; min-height: 28px; border-radius: var(--radius-pill); padding: 4px 10px; font-size: var(--text-xs); background: color-mix(in oklab, var(--border), white 45%); color: var(--fg); }
.badge.success { color: var(--success); background: color-mix(in oklab, var(--success), white 88%); }
.badge.warn { color: color-mix(in oklab, var(--warn), black 45%); background: color-mix(in oklab, var(--warn), white 82%); }
.badge.danger { color: var(--danger); background: color-mix(in oklab, var(--danger), white 88%); }
.dot { width: 8px; height: 8px; border-radius: 99px; background: currentColor; display: inline-block; }
.field { display: grid; gap: 6px; }
.field label { font-size: var(--text-sm); color: var(--fg); }
.field input, .field select, .field textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-sm); min-height: 44px; padding: 10px 12px; background: var(--surface); color: var(--fg); }
.field textarea { min-height: 88px; resize: vertical; }
.field small { color: var(--muted); }
.tabs, .segmented { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.tab, .chip { white-space: nowrap; border: 1px solid var(--border); background: var(--surface); color: var(--fg); border-radius: var(--radius-pill); padding: 8px 12px; min-height: 38px; }
.tab.active, .chip.active { background: var(--accent); border-color: var(--accent); color: var(--accent-on); }
.list-card { width: 100%; text-align: left; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; color: var(--fg); display: block; }
.list-card + .list-card { margin-top: 10px; }
.list-card:hover { transform: translateY(-1px); }
.fixed-action { position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, 430px); background: var(--surface); border-top: 1px solid var(--border); padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); z-index: 30; display: grid; gap: 8px; }
.bottom-nav { position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, 430px); background: var(--surface); border: 1px solid var(--border); border-bottom: 0; display: grid; grid-template-columns: repeat(4, 1fr); padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); z-index: 30; }
.bottom-nav a { min-height: 48px; color: var(--muted); display: grid; place-items: center; font-size: var(--text-xs); border-radius: var(--radius-sm); }
.bottom-nav a.active { color: var(--accent); background: color-mix(in oklab, var(--accent), white 92%); text-decoration: none; }
.icon-box { width: 42px; height: 42px; border-radius: var(--radius-sm); background: color-mix(in oklab, var(--accent), white 90%); color: var(--accent); display: grid; place-items: center; font-weight: 700; flex: 0 0 auto; }
.notice { border: 1px solid var(--border); background: color-mix(in oklab, var(--warn), white 90%); border-radius: var(--radius-md); padding: 12px; color: color-mix(in oklab, var(--warn), black 55%); }
.empty { text-align: center; color: var(--muted); padding: 28px 16px; border: 1px dashed var(--border); border-radius: var(--radius-md); background: var(--surface); }
.toast { position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%) translateY(20px); opacity: 0; pointer-events: none; background: var(--fg); color: var(--surface); border-radius: var(--radius-pill); padding: 10px 14px; z-index: 80; max-width: calc(100vw - 32px); transition: opacity var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard); }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.modal-backdrop { position: fixed; inset: 0; display: none; align-items: end; justify-content: center; background: color-mix(in oklab, var(--fg), transparent 72%); z-index: 70; padding: 16px; }
.modal-backdrop.show { display: flex; }
.modal { width: min(100%, 398px); background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 18px; box-shadow: var(--elev-raised); }
.qr { width: 116px; height: 116px; display: grid; grid-template-columns: repeat(7, 1fr); grid-template-rows: repeat(7, 1fr); gap: 3px; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); }
.qr span { background: var(--fg); border-radius: 1px; }
.label-preview { width: 100%; max-width: 300px; aspect-ratio: 3 / 4; margin: 0 auto; border: 1px solid var(--fg); background: var(--surface); padding: 14px; display: grid; gap: 8px; align-content: start; }
.status-hero { text-align: center; padding: 24px 16px; }
.status-mark { width: 72px; height: 72px; border-radius: 999px; margin: 0 auto 12px; display: grid; place-items: center; font-size: 34px; font-weight: 700; }
.status-mark.success { background: color-mix(in oklab, var(--success), white 86%); color: var(--success); }
.status-mark.warn { background: color-mix(in oklab, var(--warn), white 80%); color: color-mix(in oklab, var(--warn), black 45%); }
.status-mark.danger { background: color-mix(in oklab, var(--danger), white 88%); color: var(--danger); }
.launcher { max-width: var(--container-max); margin: 0 auto; padding: 40px 24px; }
.launcher-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 24px; }
.screen-link { min-height: 132px; color: var(--fg); }
.screen-link:hover { text-decoration: none; border-color: var(--accent); }
.phone-frame { width: min(100%, 430px); margin: 24px auto; border: 1px solid var(--border); border-radius: 28px; background: var(--surface); padding: 12px; box-shadow: var(--elev-raised); }
.phone-frame iframe { width: 100%; height: 780px; border: 0; border-radius: 20px; background: var(--bg); }
.hidden { display: none !important; }
@media (min-width: 744px) {
  .app-shell { margin-top: 24px; margin-bottom: 24px; min-height: 820px; border-radius: 24px; overflow: hidden; box-shadow: var(--elev-raised); }
  .bottom-nav, .fixed-action { border-radius: 0 0 24px 24px; }
}
@media (max-width: 374px) {
  .page { padding-inline: 12px; }
  .grid-2 { grid-template-columns: 1fr; }
  .title { font-size: var(--text-lg); }
}
`;

const js = String.raw`
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
function showToast(message) {
  let toast = $('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(window.__toastTimer);
  window.__toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2100);
}
function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('show'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('show'); }
function setLoading(button, text = '提交中') {
  const old = button.textContent;
  button.disabled = true;
  button.textContent = text;
  setTimeout(() => { button.disabled = false; button.textContent = old; }, 900);
}
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const type = action.dataset.action;
  if (type === 'toast') showToast(action.dataset.message || '操作已完成');
  if (type === 'modal') openModal(action.dataset.target);
  if (type === 'close') closeModal(action.dataset.target);
  if (type === 'loading') setLoading(action, action.dataset.loading || '提交中');
  if (type === 'confirm') {
    if (confirm(action.dataset.message || '确认继续操作？')) showToast(action.dataset.done || '已处理');
  }
});
document.addEventListener('input', (event) => {
  const search = event.target.closest('[data-search]');
  if (!search) return;
  const key = search.value.trim();
  const empty = $(search.dataset.empty || '#empty-state');
  let visible = 0;
  $$(search.dataset.search).forEach(item => {
    const hit = !key || item.textContent.includes(key);
    item.classList.toggle('hidden', !hit);
    if (hit) visible += 1;
  });
  if (empty) empty.classList.toggle('hidden', visible !== 0);
});
document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-filter]');
  if (!tab) return;
  const group = tab.parentElement;
  $$('.tab', group).forEach(el => el.classList.remove('active'));
  tab.classList.add('active');
  const value = tab.dataset.filter;
  const target = tab.dataset.target;
  $$(target).forEach(item => {
    item.classList.toggle('hidden', value !== '全部' && item.dataset.status !== value);
  });
});
document.addEventListener('change', (event) => {
  if (event.target.name === 'basis') {
    const upload = $('#upload-evidence');
    const record = $('#record-select');
    const isSelf = event.target.value === '自行检测合格';
    if (upload) upload.classList.toggle('hidden', isSelf);
    if (record) record.classList.toggle('hidden', !isSelf);
  }
});
`;

fs.writeFileSync(path.join(root, 'styles.css'), css);
fs.writeFileSync(path.join(root, 'app.js'), js);

const nav = (active) => `
<nav class="bottom-nav" data-od-id="bottom-nav">
  <a href="home.html" class="${active === 'home' ? 'active' : ''}" data-od-id="nav-home">首页</a>
  <a href="detections.html" class="${active === 'detections' ? 'active' : ''}" data-od-id="nav-detections">检测</a>
  <a href="certificate-create.html" class="${active === 'create' ? 'active' : ''}" data-od-id="nav-create">开证</a>
  <a href="profile.html" class="${active === 'profile' ? 'active' : ''}" data-od-id="nav-profile">我的</a>
</nav>`;

const qr = () => `<div class="qr" aria-label="二维码示意">${Array.from({ length: 49 }, (_, i) => `<span style="opacity:${[0,1,2,6,7,8,12,14,16,18,20,24,25,26,28,30,32,34,36,40,42,43,44,46,48].includes(i) ? 1 : 0}"></span>`).join('')}</div>`;

function shell(title, body, opts = {}) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}｜谷芯快检云</title>
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <main class="app-shell" data-od-id="${opts.id || 'app-shell'}">
    ${body}
  </main>
  <script src="../app.js"></script>
</body>
</html>`;
}

const topbar = (title, back = 'home.html') => `
<header class="topbar" data-od-id="topbar">
  <a class="back btn" href="${back}" data-od-id="back-button">‹</a>
  <strong>${title}</strong>
  <button class="btn btn-ghost" data-action="toast" data-message="已刷新当前页面" data-od-id="refresh-button">刷新</button>
</header>`;

const pages = {
  'login.html': shell('登录', `
<section class="page" data-od-id="login-page">
  <div style="height:40px"></div>
  <div class="status-hero">
    <div class="icon-box" style="margin:0 auto 16px;width:64px;height:64px">谷</div>
    <h1 class="title" data-od-id="login-title">谷芯快检云</h1>
    <p class="subtitle">检测、开证、打印管理</p>
  </div>
  <form class="card stack" data-od-id="login-form">
    <div class="field"><label>企业账号</label><input value="demo@guxin" autocomplete="username" data-od-id="account-input"></div>
    <div class="field"><label>登录密码</label><input type="password" value="123456" autocomplete="current-password" data-od-id="password-input"></div>
    <label class="row-start label"><input type="checkbox" checked> 记住账号</label>
    <a class="btn btn-primary" href="home.html" data-od-id="login-button">登录</a>
    <button type="button" class="btn btn-secondary" data-action="toast" data-message="登录失败，请检查账号或密码" data-od-id="login-error-button">模拟登录失败</button>
    <button type="button" class="btn btn-secondary" data-action="toast" data-message="网络异常，请稍后重试" data-od-id="network-error-button">模拟网络异常</button>
  </form>
  <button class="btn btn-secondary" style="width:100%;margin-top:16px" data-action="modal" data-target="expire-modal" data-od-id="expire-modal-button">查看服务提醒</button>
</section>
<div class="modal-backdrop show" id="expire-modal">
  <div class="modal stack" data-od-id="expire-modal">
    <h2 class="title">服务即将到期</h2>
    <p class="subtitle">当前企业服务将在 2026-08-20 到期，请提前联系谷芯科技续期，避免影响开证和打印。</p>
    <button class="btn btn-primary" data-action="close" data-target="expire-modal">知道了</button>
  </div>
</div>`, { id: 'login-shell' }),

  'home.html': shell('首页', `
<section class="page" data-od-id="home-page">
  <header class="topbar" data-od-id="home-topbar"><div><strong>山西谷芯科技</strong><p class="subtitle">服务有效至 2026-08-20</p></div><a class="btn btn-secondary" href="printers.html">打印机</a></header>
  <div class="notice" data-od-id="service-notice">服务还有 37 天到期，建议提前续期。</div>
  <section class="grid-2 section" data-od-id="home-metrics">
    <a class="card metric" href="detections.html"><span class="label">今日检测</span><strong>18</strong></a>
    <a class="card metric" href="select-detection.html"><span class="label">可开证</span><strong>9</strong></a>
    <a class="card metric" href="certificates.html"><span class="label">今日开证</span><strong>5</strong></a>
    <a class="card metric" href="certificates.html"><span class="label">累计开证</span><strong>286</strong></a>
  </section>
  <section class="grid-3 section" data-od-id="home-actions">
    <a class="card" href="certificate-create.html">开具合格证</a>
    <a class="card" href="detections.html">检测记录</a>
    <a class="card" href="certificates.html">合格证记录</a>
  </section>
  <section class="section stack" data-od-id="recent-detections">
    <div class="row"><h2 class="title">最近检测</h2><a href="detections.html">全部</a></div>
    <a class="list-card" href="detection-detail.html"><div class="row"><strong>西红柿</strong><span class="badge success"><i class="dot"></i>合格</span></div><p class="subtitle">农残快检 4 项 · 今天 09:42</p></a>
    <a class="list-card" href="detection-detail.html"><div class="row"><strong>黄瓜</strong><span class="badge success"><i class="dot"></i>可开证</span></div><p class="subtitle">农残快检 4 项 · 今天 08:50</p></a>
  </section>
  <section class="section stack" data-od-id="recent-certificates">
    <div class="row"><h2 class="title">最近合格证</h2><a href="certificates.html">全部</a></div>
    <a class="list-card" href="certificate-detail.html"><div class="row"><strong>GX-20260714-0021</strong><span class="badge success">正常</span></div><p class="subtitle">西红柿 · 25 kg · 自行检测合格</p></a>
  </section>
</section>${nav('home')}`),

  'detections.html': shell('检测记录', `
<section class="page" data-od-id="detections-page">
${topbar('检测记录')}
  <div class="field section"><input data-search=".detection-item" placeholder="搜索样品名称" data-od-id="detection-search"></div>
  <div class="tabs section" data-od-id="detection-filter"><button class="tab active" data-filter="全部" data-target=".detection-item">全部</button><button class="tab" data-filter="合格" data-target=".detection-item">合格</button><button class="tab" data-filter="不合格" data-target=".detection-item">不合格</button></div>
  <section class="section stack">
    <a class="list-card detection-item" data-status="合格" href="detection-detail.html"><div class="row"><strong>西红柿</strong><span class="badge success">合格 · 可开证</span></div><p class="subtitle">今天 09:42 · 检测 4 项</p><span class="btn btn-secondary">开具合格证</span></a>
    <a class="list-card detection-item" data-status="合格" href="detection-detail.html"><div class="row"><strong>黄瓜</strong><span class="badge success">合格 · 可开证</span></div><p class="subtitle">今天 08:50 · 检测 4 项</p></a>
    <a class="list-card detection-item" data-status="不合格" href="detection-detail.html"><div class="row"><strong>韭菜</strong><span class="badge danger">不合格</span></div><p class="subtitle">昨天 16:12 · 不可开证：检测结论不合格</p></a>
  </section>
  <div class="empty hidden" id="empty-state">暂无检测记录</div>
</section>${nav('detections')}`),

  'detection-detail.html': shell('检测详情', `
<section class="page" data-od-id="detection-detail-page">
${topbar('检测详情', 'detections.html')}
  <section class="card section stack"><div class="row"><div><p class="label">样品名称</p><h1 class="title">西红柿</h1></div><span class="badge success">检测合格</span></div><p class="subtitle">检测时间：2026-07-14 09:42</p></section>
  <section class="section stack" data-od-id="test-items">
    <h2 class="title">检测项目明细</h2>
    ${['有机磷','氨基甲酸酯','克百威','氧乐果'].map((n,i)=>`<div class="card"><div class="row"><strong>${n}</strong><span class="badge success">合格</span></div><p class="subtitle">检测值 ${i+1}.${i} mg/kg · 限量值 ≤ 5 mg/kg</p></div>`).join('')}
  </section>
  <div class="fixed-action"><a class="btn btn-primary" href="certificate-create.html">开具合格证</a><button class="btn btn-secondary" data-action="toast" data-message="不可开证时会在这里显示具体原因">查看不可开证提示</button></div>
</section>`),

  'certificate-create.html': shell('开具合格证', `
<section class="page" data-od-id="certificate-create-page">
${topbar('开具合格证')}
  <section class="card section stack" data-od-id="basis-selector">
    <h1 class="title">承诺依据</h1>
    ${['自行检测合格','质量安全控制符合要求','委托检测合格'].map((v,i)=>`<label class="row-start"><input type="radio" name="basis" value="${v}" ${i===0?'checked':''}> ${v}</label>`).join('')}
  </section>
  <section class="card section stack" id="record-select" data-od-id="selected-record">
    <div class="row"><div><strong>已选择检测记录</strong><p class="subtitle">西红柿 · 今天 09:42 · 检测合格</p></div><a class="btn btn-secondary" href="select-detection.html">更换</a></div>
  </section>
  <section class="card section stack hidden" id="upload-evidence" data-od-id="upload-evidence"><strong>依据资料</strong><p class="subtitle">请上传图片或 PDF 作为开证依据</p><button class="btn btn-secondary" data-action="toast" data-message="文件上传失败，请检查格式和大小">上传资料</button></section>
  <section class="card section stack" data-od-id="product-form">
    <h2 class="title">产品信息</h2>
    <div class="grid-2"><div class="field"><label>产品名称</label><input value="西红柿"></div><div class="field"><label>产品数量</label><input value="25"></div></div>
    <div class="grid-2"><div class="field"><label>单位</label><input value="kg"></div><div class="field"><label>产地</label><input value="山西太原"></div></div>
  </section>
  <section class="card section stack" data-od-id="promise-form">
    <h2 class="title">承诺信息</h2>
    <div class="field"><label>承诺主体</label><input value="山西谷芯示范食品有限公司"></div>
    <div class="field"><label>联系电话</label><input value="13363412262"></div>
    <div class="field"><label>承诺事项</label><textarea>本批次产品经检测或依据资料确认，符合质量安全相关要求。</textarea></div>
    <div class="field"><label>打印份数</label><input type="number" value="2" min="1" max="99"></div>
  </section>
  <div class="fixed-action"><a class="btn btn-primary" href="certificate-success.html" data-od-id="generate-certificate">生成合格证</a><button class="btn btn-secondary" data-action="toast" data-message="打印份数请输入 1-99">校验提示</button></div>
</section>${nav('create')}`),

  'select-detection.html': shell('选择检测记录', `
<section class="page" data-od-id="select-detection-page">
${topbar('选择检测记录', 'certificate-create.html')}
  <div class="field section"><input data-search=".select-record" placeholder="搜索可开证记录"></div>
  <div class="tabs section"><button class="tab active">今天</button><button class="tab">近 7 天</button><button class="tab">全部</button></div>
  <section class="section stack">
    <a class="list-card select-record" href="certificate-create.html"><div class="row"><strong>西红柿</strong><span class="badge success">可开证</span></div><p class="subtitle">检测 4 项 · 今天 09:42</p></a>
    <a class="list-card select-record" href="certificate-create.html"><div class="row"><strong>黄瓜</strong><span class="badge success">可开证</span></div><p class="subtitle">检测 4 项 · 今天 08:50</p></a>
  </section><div class="empty hidden" id="empty-state">暂无符合条件的检测记录</div>
</section>`),

  'products.html': shell('常用产品', `
<section class="page" data-od-id="products-page">
${topbar('常用产品', 'profile.html')}
  <div class="field section"><input data-search=".product-item" placeholder="搜索产品名称"></div>
  <section class="section stack">
    ${['西红柿|kg|山西太原','黄瓜|kg|山西晋中','净菜组合|盒|山西太原'].map(x=>{const [a,b,c]=x.split('|');return `<div class="list-card product-item"><div class="row"><div><strong>${a}</strong><p class="subtitle">默认单位：${b} · 默认产地：${c}</p></div><button class="btn btn-secondary" data-action="modal" data-target="product-modal">编辑</button></div></div>`}).join('')}
  </section>
  <div class="empty hidden" id="empty-state">暂无常用产品，可新增后快速开证</div>
  <div class="fixed-action"><button class="btn btn-primary" data-action="modal" data-target="product-modal">新增产品</button></div>
</section>
<div class="modal-backdrop" id="product-modal"><div class="modal stack"><h2 class="title">编辑产品</h2><div class="field"><label>产品名称</label><input value="西红柿"></div><div class="field"><label>默认单位</label><input value="kg"></div><div class="field"><label>默认产地</label><input value="山西太原"></div><button class="btn btn-primary" data-action="close" data-target="product-modal">保存</button><button class="btn btn-danger" data-action="confirm" data-message="确认删除该产品？" data-done="已删除产品">删除</button></div></div>`),

  'certificate-success.html': shell('生成成功', `
<section class="page" data-od-id="certificate-success-page">
  <div class="status-hero"><div class="status-mark success">✓</div><h1 class="title">合格证生成成功</h1><p class="subtitle">合格证编号：GX-20260714-0021</p></div>
  <section class="card stack"><div class="row"><span class="label">产品名称</span><strong>西红柿</strong></div><div class="row"><span class="label">开具时间</span><strong>2026-07-14 10:18</strong></div></section>
  <div class="fixed-action"><a class="btn btn-primary" href="certificate-detail.html">查看合格证</a><a class="btn btn-secondary" href="print-preview.html">打印合格证</a><a class="btn btn-ghost" href="home.html">返回首页</a></div>
</section>`),

  'certificates.html': shell('合格证记录', `
<section class="page" data-od-id="certificates-page">
${topbar('合格证记录')}
  <div class="field section"><input data-search=".certificate-item" placeholder="搜索编号或产品"></div>
  <div class="tabs section"><button class="tab active" data-filter="全部" data-target=".certificate-item">全部</button><button class="tab" data-filter="正常" data-target=".certificate-item">正常</button><button class="tab" data-filter="已作废" data-target=".certificate-item">已作废</button></div>
  <section class="section stack">
    <a class="list-card certificate-item" data-status="正常" href="certificate-detail.html"><div class="row"><strong>GX-20260714-0021</strong><span class="badge success">正常</span></div><p class="subtitle">西红柿 · 25 kg · 自行检测合格</p></a>
    <a class="list-card certificate-item" data-status="已作废" href="certificate-detail.html"><div class="row"><strong>GX-20260712-0016</strong><span class="badge warn">已作废</span></div><p class="subtitle">黄瓜 · 18 kg · 委托检测合格</p></a>
  </section><div class="empty hidden" id="empty-state">暂无合格证记录</div>
</section>${nav('home')}`),

  'certificate-detail.html': shell('合格证详情', `
<section class="page" data-od-id="certificate-detail-page">
${topbar('合格证详情', 'certificates.html')}
  <section class="card section stack"><div class="row"><div><p class="label">产品名称</p><h1 class="title">西红柿</h1></div><span class="badge success">正常</span></div><p class="subtitle">编号：GX-20260714-0021</p></section>
  <section class="card section stack"><div class="row"><span class="label">数量/单位</span><strong>25 kg</strong></div><div class="row"><span class="label">产地</span><strong>山西太原</strong></div><div class="row"><span class="label">承诺主体</span><strong>山西谷芯示范食品有限公司</strong></div><div class="row"><span class="label">联系电话</span><strong>13363412262</strong></div><div class="row"><span class="label">承诺依据</span><strong>自行检测合格</strong></div></section>
  <section class="card section row"><div><strong>扫码公开页</strong><p class="subtitle">可发给采购方或监管人员查看</p></div><a class="btn btn-secondary" href="public-valid.html">打开</a></section>
  <div class="fixed-action"><a class="btn btn-primary" href="print-preview.html">打印合格证</a><button class="btn btn-danger" data-action="confirm" data-message="确认作废该合格证？作废后不可打印。" data-done="合格证已作废">作废合格证</button></div>
</section>`),

  'print-preview.html': shell('打印预览', `
<section class="page" data-od-id="print-preview-page">
${topbar('打印预览', 'certificate-detail.html')}
  <section class="card section stack"><div class="row"><strong>打印机状态</strong><span class="badge warn">暂未连接</span></div><p class="subtitle">请先连接打印设备后再打印。</p><a class="btn btn-secondary" href="printers.html">连接打印设备</a></section>
  <section class="card section stack"><h1 class="title">60×80mm 标签预览</h1><div class="label-preview"><strong>食品安全合格证</strong><p>产品：西红柿</p><p>数量：25 kg</p><p>产地：山西太原</p><p>主体：山西谷芯示范食品有限公司</p><p>编号：GX-20260714-0021</p>${qr()}</div></section>
  <div class="fixed-action"><button class="btn btn-primary" data-action="toast" data-message="请先连接打印设备">打印</button><a class="btn btn-secondary" href="certificate-detail.html">返回证书详情</a></div>
</section>`),

  'printers.html': shell('打印机管理', `
<section class="page" data-od-id="printers-page">
${topbar('打印机管理', 'profile.html')}
  <section class="card section stack"><div class="row"><strong>当前打印机</strong><span class="badge warn">未连接</span></div><p class="subtitle">支持标签打印机连接、测试打印和异常状态提示。</p></section>
  <div class="field section"><input placeholder="搜索附近设备"></div>
  <section class="section stack">
    <div class="list-card"><div class="row"><div><strong>K329 标签打印机</strong><p class="subtitle">信号良好 · 电量 82%</p></div><button class="btn btn-primary" data-action="loading" data-loading="连接中">连接</button></div></div>
    <div class="list-card"><div class="row"><div><strong>GPrinter-680</strong><p class="subtitle">缺纸 · 需要检查耗材</p></div><span class="badge warn">缺纸</span></div></div>
  </section>
  <div class="fixed-action"><button class="btn btn-secondary" data-action="toast" data-message="测试打印已发送">测试打印</button><button class="btn btn-danger" data-action="toast" data-message="已断开当前设备">断开</button></div>
</section>`),

  'profile.html': shell('我的', `
<section class="page" data-od-id="profile-page">
  <header class="topbar"><strong>我的</strong><button class="btn btn-secondary" data-action="toast" data-message="已使用缓存企业信息">刷新</button></header>
  <section class="card section stack"><h1 class="title">山西谷芯示范食品有限公司</h1><p class="subtitle">联系人：王经理 · 13363412262</p><p class="subtitle">地址：山西省太原市小店区示范园区</p><span class="badge warn">服务有效至 2026-08-20</span></section>
  <section class="section stack">
    <a class="list-card" href="products.html">常用产品</a>
    <a class="list-card" href="printers.html">打印机管理</a>
    <a class="list-card" href="help.html">使用帮助</a>
    <button class="list-card" data-action="toast" data-message="客服电话：13363412262">联系客服</button>
    <button class="list-card" data-action="modal" data-target="password-modal">修改密码</button>
    <button class="list-card" data-action="confirm" data-message="确认清除本机记住的账号？" data-done="账号已清除">清除账号</button>
    <button class="list-card" data-action="confirm" data-message="确认退出登录？" data-done="已退出登录">退出登录</button>
  </section>
</section>${nav('profile')}
<div class="modal-backdrop" id="password-modal"><div class="modal stack"><h2 class="title">修改密码</h2><div class="field"><label>原密码</label><input type="password"></div><div class="field"><label>新密码</label><input type="password"></div><button class="btn btn-primary" data-action="close" data-target="password-modal">保存</button></div></div>`),

  'help.html': shell('使用帮助', `
<section class="page" data-od-id="help-page">
${topbar('使用帮助', 'profile.html')}
  <section class="section stack">
    ${['如何查看检测记录','如何开具合格证','如何选择承诺依据','如何上传依据资料','如何打印合格证','不合格怎么办','服务到期怎么办','联系谷芯科技'].map((t,i)=>`<details class="card" ${i===0?'open':''}><summary><strong>${t}</strong></summary><p class="subtitle">${['进入“检测”页，可按样品名称搜索，也可查看今日和历史结果。','进入“开证”页，选择承诺依据，补齐产品和承诺信息后生成。','有检测记录时选“自行检测合格”；没有检测记录但有资料时选择质量控制或委托检测。','点击上传区域，选择图片或 PDF。上传失败时请检查格式和大小。','先连接打印设备，再进入合格证详情或打印预览打印标签。','不合格记录不能开具合格证，请先处理产品质量问题。','请联系谷芯科技续期，避免影响开证和打印。','客服电话：13363412262。'][i]}</p></details>`).join('')}
  </section>
</section>`),

  'public-valid.html': shell('扫码查询有效', `
<section class="page public" data-od-id="public-valid-page">
  <section class="card section status-hero"><div class="status-mark success">✓</div><h1 class="title">查询有效</h1><p class="subtitle">食品安全追溯查询 · 谷芯快检云</p><p class="label">查询时间：2026-07-14 10:26</p></section>
  <section class="card section stack"><h2 class="title">西红柿</h2><div class="row"><span class="label">合格证编号</span><strong>GX-20260714-0021</strong></div><div class="row"><span class="label">数量</span><strong>25 kg</strong></div><div class="row"><span class="label">产地</span><strong>山西太原</strong></div><div class="row"><span class="label">承诺主体</span><strong>山西谷芯示范食品有限公司</strong></div><div class="row"><span class="label">开具时间</span><strong>2026-07-14 10:18</strong></div></section>
  <section class="card section stack"><h2 class="title">承诺信息</h2><p>本批次产品基于自行检测合格结果开具，当前合格证未作废。</p><p class="subtitle">联系电话：13363412262</p></section>
  <section class="section stack"><h2 class="title">检测结果</h2>${['有机磷','氨基甲酸酯','克百威','氧乐果'].map(n=>`<div class="card"><div class="row"><strong>${n}</strong><span class="badge success">合格</span></div><p class="subtitle">检测值符合限量要求</p></div>`).join('')}</section>
  <section class="card section stack"><h2 class="title">企业公开资料</h2><p>山西谷芯示范食品有限公司，主营农产品配送和净菜供应。</p><button class="btn btn-secondary" data-action="toast" data-message="资料暂时无法打开">查看资料</button></section>
  <section class="card section"><p class="subtitle">本查询结果由谷芯快检云实时生成，当前状态以本页面显示为准。如显示查询有效，表示该合格证当前未作废，可用于查看产品承诺信息及相关检测/依据资料。</p></section>
</section>`, { id: 'public-valid-shell' }),

  'public-void.html': shell('合格证已作废', `
<section class="page public" data-od-id="public-void-page">
  <section class="card section status-hero"><div class="status-mark warn">!</div><h1 class="title">该合格证已作废</h1><p class="subtitle">不得继续作为有效流通凭证使用。</p></section>
  <section class="card section stack"><div class="row"><span class="label">原合格证编号</span><strong>GX-20260712-0016</strong></div><div class="row"><span class="label">产品名称</span><strong>黄瓜</strong></div><div class="row"><span class="label">原开具时间</span><strong>2026-07-12 15:20</strong></div><div class="row"><span class="label">作废时间</span><strong>2026-07-13 09:15</strong></div></section>
  <section class="card section"><p class="subtitle">如需核对信息，请联系开具主体或谷芯科技客服。</p></section>
</section>`),

  'public-invalid.html': shell('未查询到有效合格证', `
<section class="page public" data-od-id="public-invalid-page">
  <section class="card section status-hero"><div class="status-mark danger">×</div><h1 class="title">未查询到有效合格证</h1><p class="subtitle">请核对二维码来源，或联系开具主体确认。</p></section>
  <section class="card section"><p class="subtitle">当前页面没有查询到可展示的合格证信息。页面不会显示技术错误或内部信息。</p></section>
</section>`)
};

function addSectionIds(file, html) {
  let index = 0;
  const base = path.basename(file, '.html');
  return html.replace(/<section\b([^>]*)>/g, (match, attrs) => {
    if (attrs.includes('data-od-id=')) return match;
    index += 1;
    return `<section data-od-id="${base}-section-${index}"${attrs}>`;
  });
}

Object.entries(pages).forEach(([file, html]) => fs.writeFileSync(path.join(screensDir, file), addSectionIds(file, html)));

const launcherCards = [
  ['登录页','screens/login.html','企业账号登录、失败提示、服务到期提醒'],
  ['首页','screens/home.html','工作台、指标、最近记录和打印入口'],
  ['检测记录','screens/detections.html','搜索、筛选、可开证状态'],
  ['检测详情','screens/detection-detail.html','检测项目明细和开证入口'],
  ['开具合格证','screens/certificate-create.html','依据切换、表单校验和上传状态'],
  ['选择检测记录','screens/select-detection.html','只展示可开证检测记录'],
  ['常用产品','screens/products.html','新增、编辑、删除确认'],
  ['生成成功','screens/certificate-success.html','查看、打印、返回首页'],
  ['合格证记录','screens/certificates.html','搜索和状态筛选'],
  ['合格证详情','screens/certificate-detail.html','扫码页、打印、作废确认'],
  ['打印预览','screens/print-preview.html','60×80mm 标签预览和打印提示'],
  ['打印机管理','screens/printers.html','搜索、连接、测试打印和异常状态'],
  ['我的','screens/profile.html','企业资料、客服、退出确认'],
  ['使用帮助','screens/help.html','短文案帮助中心'],
  ['扫码有效页','screens/public-valid.html','对外可信查询页'],
  ['扫码作废页','screens/public-void.html','作废状态说明'],
  ['扫码无效页','screens/public-invalid.html','正式无效链接提示']
];

const index = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>谷芯快检云小程序原型</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="launcher" data-od-id="prototype-launcher">
    <p class="badge">谷芯快检云 · 小程序端全套页面</p>
    <h1 class="title" style="font-size:var(--text-3xl);max-width:760px">面向食品企业的一线开证、检测查看与标签打印流程</h1>
    <p class="subtitle" style="max-width:760px">根据产品需求文档生成。每个页面都是独立 HTML，可逐页预览、评论和后续接入真实小程序实现。</p>
    <section class="launcher-grid" data-od-id="screen-gallery">
      ${launcherCards.map(([title, href, desc]) => `<a class="card screen-link" href="${href}" data-od-id="screen-${path.basename(href, '.html')}"><span class="badge">页面</span><h2 class="title">${title}</h2><p class="subtitle">${desc}</p></a>`).join('')}
    </section>
    <section class="phone-frame" data-od-id="phone-preview">
      <iframe src="screens/home.html" title="首页预览"></iframe>
    </section>
  </main>
</body>
</html>`;
fs.writeFileSync(path.join(root, 'index.html'), index);

const critique = {
  kind: 'critique-panel',
  score: 4,
  axes: {
    clarity: { score: 4, notes: '页面入口、状态和操作路径清楚，入口总览不混入产品 UI。' },
    hierarchy: { score: 4, notes: '每页以一个主任务为中心，底部固定主操作适合小程序。' },
    typography: { score: 4, notes: '使用 Neutral Modern 字体和字号层级，移动端可读。' },
    motion: { score: 4, notes: '交互状态使用短反馈、弹窗和按钮 loading，没有过度动效。' },
    brand: { score: 4, notes: '保留谷芯快检云务实可信表达，避免夸大认证措辞。' }
  }
};
fs.writeFileSync(path.join(root, 'critique.json'), JSON.stringify(critique, null, 2));

console.log(`generated ${Object.keys(pages).length + 4} files in ${root}`);
