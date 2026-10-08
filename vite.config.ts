import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
// variável cadastrada VAZIA (ex.: na Vercel) teria prioridade sobre o .env.production e apagaria a conexão
for (const k of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) if (process.env[k] !== undefined && !process.env[k]!.trim()) delete process.env[k]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // build de produção sem banco = site sem login (o painel exige sessão do Supabase): melhor falhar o deploy
  if (mode === 'production' && env.VITE_DEMO_MODE !== 'true' && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY)) {
    throw new Error('Build de produção sem VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: o login não funcionaria. Veja .env.production.')
  }
  return {
    plugins: [react()],
    server: {
      watch: {
        ignored: ['**/data/**', '**/*.xlsx', '**/*.xls', '**/*.csv']
      }
    }
  }
})
