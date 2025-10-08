import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/omni-tcg-sim/', // GitHub のリポジトリ名と一致させる
  plugins: [react()],
})
