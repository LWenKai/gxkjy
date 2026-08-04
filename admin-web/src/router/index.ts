import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue'), meta: { title: '\u6570\u636e\u770b\u677f' } },
        { path: 'customers', name: 'customers', component: () => import('@/pages/CustomersPage.vue'), meta: { title: '\u5ba2\u6237\u7ba1\u7406' } },
        { path: 'customers/:id', name: 'customer-detail', component: () => import('@/pages/CustomerDetailPage.vue'), meta: { title: '\u5ba2\u6237\u8be6\u60c5' } },
        { path: 'sales-products', name: 'sales-products', component: () => import('@/pages/SalesProductsPage.vue'), meta: { title: '\u9500\u552e\u4ea7\u54c1\u5e93' } },
        { path: 'sales-quotes', name: 'sales-quotes', component: () => import('@/pages/SalesQuotesPage.vue'), meta: { title: '\u62a5\u4ef7\u7ba1\u7406' } },
        { path: 'sales-orders', name: 'sales-orders', component: () => import('@/pages/SalesOrdersPage.vue'), meta: { title: '\u6210\u4ea4\u8ba2\u5355' } },
        { path: 'repurchase-reminders', name: 'repurchase-reminders', component: () => import('@/pages/RepurchaseRemindersPage.vue'), meta: { title: '\u590d\u8d2d\u63d0\u9192' } },
        { path: 'companies', name: 'companies', component: () => import('@/pages/CompaniesPage.vue'), meta: { title: '\u4f01\u4e1a\u7ba1\u7406' } },
        { path: 'companies/:id', name: 'company-detail', component: () => import('@/pages/CompanyDetailPage.vue'), meta: { title: '\u4f01\u4e1a\u8be6\u60c5' } },
        { path: 'companies/:id/profile', name: 'company-profile', component: () => import('@/pages/CompanyProfilePage.vue'), meta: { title: '\u4f01\u4e1a\u516c\u5f00\u8d44\u6599' } },
        { path: 'manufacturer-interfaces', name: 'manufacturer-interfaces', component: () => import('@/pages/ManufacturerInterfacesPage.vue'), meta: { title: '\u5382\u5bb6\u63a5\u53e3' } },
        { path: 'devices', name: 'devices', component: () => import('@/pages/DevicesPage.vue'), meta: { title: '\u8bbe\u5907\u7ba1\u7406' } },
        { path: 'printers', name: 'printers', component: () => import('@/pages/PrintersPage.vue'), meta: { title: '\u6253\u5370\u8bbe\u5907\u7ba1\u7406' } },
        { path: 'detection-records', name: 'detection-records', component: () => import('@/pages/DetectionRecordsPage.vue'), meta: { title: '\u68c0\u6d4b\u8bb0\u5f55' } },
        { path: 'test-detection-records/create', name: 'test-detection-record-create', component: () => import('@/pages/TestDetectionRecordCreatePage.vue'), meta: { title: '\u6d4b\u8bd5\u4e2d\u5fc3' } },
        { path: 'certificates', name: 'certificates', component: () => import('@/pages/CertificatesPage.vue'), meta: { title: '\u5408\u683c\u8bc1\u7ba1\u7406' } },
        { path: 'products', name: 'products', component: () => import('@/pages/ProductsPage.vue'), meta: { title: '\u4ea7\u54c1\u5e93' } },
        { path: 'operation-logs', name: 'operation-logs', component: () => import('@/pages/OperationLogsPage.vue'), meta: { title: '\u64cd\u4f5c\u65e5\u5fd7' } },
        { path: 'manufacturer-upload-logs', name: 'manufacturer-upload-logs', component: () => import('@/pages/ManufacturerUploadLogsPage.vue'), meta: { title: '\u5382\u5bb6\u4e0a\u4f20\u65e5\u5fd7' } },
        { path: 'help', name: 'help', component: () => import('@/pages/HelpPage.vue'), meta: { title: '\u5e2e\u52a9\u4e0e\u8bf4\u660e' } },
        { path: 'settings', name: 'settings', component: () => import('@/pages/SettingsPage.vue'), meta: { title: '\u7cfb\u7edf\u8bbe\u7f6e' } },
        { path: 'website/materials', name: 'website-materials', component: () => import('@/pages/WebsiteMaterialsPage.vue'), meta: { title: '\u5b98\u7f51\u8d44\u6599\u7ba1\u7406' } },
        { path: 'website/settings', name: 'website-settings', component: () => import('@/pages/WebsiteSettingsPage.vue'), meta: { title: '\u5b98\u7f51\u5185\u5bb9\u914d\u7f6e' } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.public) {
    if (to.path === '/login' && authStore.isLoggedIn) {
      return '/dashboard';
    }
    return true;
  }

  if (!authStore.isLoggedIn) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    };
  }

  return true;
});
