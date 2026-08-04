import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const appBasePath = env.VITE_APP_BASE_PATH || '/';
  const proxyTarget = apiBaseUrl.replace(/\/api\/?$/, '');

  return {
    envDir: '..',
    base: appBasePath,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
