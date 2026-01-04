
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // 如果部署在 GitHub Pages 的子路径（如 /art-nexus/），请将 base 设置为 '/项目名/'
    // 自动适配环境变量中的 BASE_URL，默认使用根路径
    base: env.BASE_URL || '/',
    plugins: [react()],
    define: {
      // 确保构建时能将 API_KEY 注入到前端代码中
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      // 产生相对路径的资源引用
      assetsDir: 'assets',
    }
  };
});