import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// 💡 修正: VITE_APP_BASE 環境変数があればそれを使用し、なければデフォルトの '/omni-tcg-sim/' を使用
const BASE_URL = process.env.VITE_APP_BASE || '/omni-tcg-sim/';

// https://vitejs.dev/config/
export default defineConfig({
  // 💡 修正: baseプロパティを環境変数で設定
  base: BASE_URL, 
  plugins: [react()],
});