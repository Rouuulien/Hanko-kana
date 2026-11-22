// Configuration des tests (Playwright). Le site est servi par tests/server.mjs, sans build.
import { defineConfig, devices } from '@playwright/test';

const PORT = 8123;
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, locale: 'fr-FR', timezoneId: 'Europe/Paris', trace: 'retain-on-failure' },
  webServer: {
    command: 'node tests/server.mjs',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
  projects: [
    // Logique critique (fusion, révisions, sauvegarde, romaji, tracé) : un seul moteur suffit.
    { name: 'logique', testDir: 'tests/logique', use: { ...devices['Desktop Chrome'] } },
    // Parcours complets du joueur : ordinateur (Chromium) et iPhone (WebKit, moteur de Safari).
    { name: 'parcours-chromium', testDir: 'tests/parcours', use: { ...devices['Desktop Chrome'] } },
    // WebKit demande des bibliothèques système (sudo npx playwright install-deps webkit) : toujours en CI, en local sur demande.
    ...(process.env.CI || process.env.WEBKIT
      ? [{ name: 'parcours-iphone', testDir: 'tests/parcours', use: { ...devices['iPhone 13'] } }]
      : []),
  ],
});
