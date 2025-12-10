import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/BI-Tool/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // ベンダーチャンクを分割
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-echarts': ['echarts'],
          'vendor-xlsx': ['xlsx', 'exceljs'],
          'vendor-pptx': ['pptxgenjs'],
          'vendor-jszip': ['jszip']
        }
      }
    }
  },
  // 開発サーバー最適化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'echarts']
  }
})
