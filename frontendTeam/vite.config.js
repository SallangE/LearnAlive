import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

// https://vite.dev/config/
export default defineConfig({
  base: '/', 
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          global: true, // 👈 핵심!
        }),
      ],
    },
  },
  define: {
    global: 'globalThis' // 👈 이걸 추가해줘야 브라우저가 인식 가능
  },
})