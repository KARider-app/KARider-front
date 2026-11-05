# KARider-front

Aplicación web progresiva para coordinar viajes compartidos entre miembros de la misma universidad.

PWA en **Vue 3 + TypeScript + Vite** que consume la API `KARider-back`. Sprint 1: HU-01 a HU-05.

## Requisitos

- Node.js 22 LTS (≥ 22.18) y npm

## Arranque local

```bash
npm install
cp .env.example .env.development   # apunta a la API local (http://localhost:5014)
npm run dev
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run test:unit` | Pruebas con Vitest (modo observador) |
| `npm run test:ci` | Pruebas una sola vez (CI) |
| `npm run test:coverage` | Pruebas con reporte de cobertura (LCOV para SonarQube Cloud) |
| `npm run lint` | oxlint + ESLint |
| `npm run build` | Type-check y compilación a `dist/` |

## Variables de entorno

Todo lo que empieza con `VITE_` termina en el JavaScript del navegador: **solo datos públicos**.
Los `.env` reales no se suben; la plantilla es `.env.example`. La configuración se valida al
arrancar en `src/core/config/env.ts`. En producción, `VITE_API_BASE_URL` se define en el workflow
de Azure Static Web Apps.

## Estructura

```
src/
├── app/        arranque, App.vue, router y guards
├── core/       config, cliente HTTP, errores de la API, sesión, utilidades
├── shared/     componentes base, composables y estilos
└── features/
    ├── catalogos/   carreras y puntos de encuentro
    ├── auth/        HU-01, HU-02, HU-03 (P1, P2, P3/P4, verificar correo, recuperar contraseña)
    └── viajes/      HU-04, HU-05 (P9, P10, P11, borradores)
```

Cada feature se divide en `domain/` (TypeScript puro), `api/` (una función por endpoint),
`application/` (stores y casos de uso) y `ui/` (vistas y componentes).

## Calidad de código (SonarQube Cloud)

El workflow [`.github/workflows/sonarcloud.yml`](.github/workflows/sonarcloud.yml) se ejecuta en cada push a
`develop`/`main` y en cada Pull Request: instala dependencias, corre las pruebas con cobertura
(`npm run test:coverage`, reporte LCOV en `coverage/lcov.info`) y publica el análisis en SonarQube Cloud.
La configuración del análisis está en [`sonar-project.properties`](sonar-project.properties).

Configuración (una sola vez):

1. En <https://sonarcloud.io> inicia sesión con GitHub, **Analyze new project** e importa `KARider-front`.
2. En el proyecto: **Administration › Analysis Method** › desactiva **Automatic Analysis**.
3. **My Account › Security** › genera un token.
4. En GitHub: **Settings › Secrets and variables › Actions** › secret `SONAR_TOKEN` con ese token.
5. Si la organización o la clave del proyecto cambian, actualízalas en `sonar-project.properties`.

Ejecución manual: **Actions › Calidad de código (SonarQube Cloud) › Run workflow**.
Localmente se puede revisar la cobertura con `npm run test:coverage` (abre `coverage/lcov-report/index.html`).

Las pruebas (`__tests__/`, `*.spec.ts`) se analizan como código de prueba; no se excluye código de la aplicación.

## Seguridad

- El access token vive solo en memoria; el refresh token en `localStorage` («Recordar mis
  credenciales») o `sessionStorage`. Se rota en cada renovación.
- Nunca se usa `v-html` con datos del usuario ni se registran tokens o contraseñas.
- Las cabeceras CSP y de seguridad para Azure están en `public/staticwebapp.config.json`.
