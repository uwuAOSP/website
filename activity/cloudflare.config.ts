import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  worker: {
    name: 'uwuaosp-activity',
    compatibilityDate: '2026-11-23',
    entrypoint: './worker.js',
    workersDev: true,
    previewUrls: false,
    observability: {
      enabled: true,
      logs: { enabled: true, invocationLogs: false },
      traces: { enabled: true, headSamplingRate: 0.1 },
    },
    env: {
      DB: bindings.d1({ name: 'uwuaosp-activity', id: process.env.ACTIVITY_D1_ID || undefined }),
      GITHUB_WEBHOOK_SECRET: bindings.secret(),
    },
  },
})
