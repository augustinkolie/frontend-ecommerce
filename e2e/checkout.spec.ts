import { expect, test, type Page } from "@playwright/test";

const PRODUCT = "/p/t-shirt-coton-bio-220-g-m";

/** Choisit la première taille disponible du coloris affiché et ajoute au panier. */
async function addFirstAvailableSize(page: Page) {
  const stockLoaded = page.waitForResponse((r) => /\/api\/products\/[^/]+\/stock/.test(r.url()) && r.ok());
  await page.goto(PRODUCT);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("T-shirt");
  // Attendre le stock temps réel, puis prendre une taille non barrée.
  await stockLoaded;
  const sizes = page.locator('fieldset:has(legend:text-is("Taille")) input[type="radio"]:not([disabled])');
  await expect(sizes.first()).toBeAttached();
  await sizes.first().locator("xpath=..").click();
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("T-shirt coton bio")).toBeVisible();
  return drawer;
}

async function fillContact(page: Page, email: string) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Nom complet").fill("Client Recette");
  await page.getByLabel("Téléphone").fill("620 12 34 56");
  await page.getByLabel("Adresse", { exact: true }).fill("Rue KA-001, Kaloum");
  await page.getByLabel("Ville ou commune").fill("Conakry");
  await page.getByRole("button", { name: "Continuer vers le paiement" }).click();
  await expect(page.getByRole("group", { name: "Paiement" })).toBeVisible();
}

test("commande payée par carte (test) de bout en bout", async ({ page }) => {
  const drawer = await addFirstAvailableSize(page);
  await drawer.getByRole("link", { name: "Commander" }).click();
  await expect(page).toHaveURL(/\/commande$/);

  await fillContact(page, `recette+${Date.now()}@exemple.gn`);
  await page.getByLabel(/Carte bancaire/).check();
  await page.getByRole("button", { name: "Payer" }).click();

  // Page de l'opérateur (simulée) puis confirmation.
  await expect(page).toHaveURL(/paiement-test/);
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(page).toHaveURL(/commande\/confirmation/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Merci, votre commande est confirmée");
  await expect(page.getByText(/Commande n°/)).toBeVisible();
});

test("commande invitée payée à la livraison", async ({ page }) => {
  const drawer = await addFirstAvailableSize(page);
  await drawer.getByRole("link", { name: "Commander" }).click();
  await fillContact(page, `invite+${Date.now()}@exemple.gn`);
  await page.getByLabel("Paiement à la livraison").check();
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page).toHaveURL(/commande\/confirmation/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Merci, votre commande est confirmée");
});

test("le panier refuse un code promo inconnu et accepte BIENVENUE10", async ({ page }) => {
  await addFirstAvailableSize(page);
  await page.goto("/panier");
  await page.getByLabel("Code promo").fill("FAUXCODE");
  await page.getByRole("button", { name: "Appliquer" }).click();
  await expect(page.getByText("Code promo inconnu.")).toBeVisible();
  await page.getByLabel("Code promo").fill("BIENVENUE10");
  await page.getByRole("button", { name: "Appliquer" }).click();
  await expect(page.getByText("BIENVENUE10")).toBeVisible();
  await expect(page.getByText("Remise")).toBeVisible();
});
