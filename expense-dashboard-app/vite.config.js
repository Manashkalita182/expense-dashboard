import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: true },
      manifest: {
        name: 'FinDash Enterprise',
        short_name: 'FinDash',
        description: 'Secure, Multi-Tenant Financial Management Vault',
        theme_color: '#0f111a',
        background_color: '#0f111a',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/875/875560.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
