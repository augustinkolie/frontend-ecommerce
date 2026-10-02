import { defineConfig, devices } from "@playwright/test";

/**
 * Parcours d'achat de bout en bout. Prérequis : services Docker, backend sur :4000
 * avec les données de démo (`npm run db:seed` dans backend/), frontend sur :3000.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "fr-FR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
