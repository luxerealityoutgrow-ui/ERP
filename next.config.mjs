// next.config.mjs
export default {
  experimental: {
    serverActions: true
  },
  output: 'standalone',
  assetPrefix: '/',
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
}
