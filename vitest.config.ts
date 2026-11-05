import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      // Las pruebas no dependen de un .env local (que no se sube al repo)
      // Cobertura en formato LCOV para SonarQube Cloud (npm run test:coverage)
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/__tests__/**'],
      },
      env: {
        VITE_API_BASE_URL: 'http://localhost:5014',
        VITE_DOMINIO_INSTITUCIONAL: 'uttt.edu.mx',
        VITE_ZONA_HORARIA: 'America/Mexico_City',
      },
    },
  }),
)
