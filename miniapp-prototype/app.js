
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
