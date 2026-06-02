import { test, expect } from "@playwright/test";

test.describe("LiveKit E2E", () => {
  test("host can create live, get token, and viewer can join", async ({ browser }) => {
    // === ÉTAPE 1: Créer le contexte Host ===
    const hostContext = await browser.newContext({
      permissions: ["camera", "microphone"],
    });
    const hostPage = await hostContext.newPage();

    // === ÉTAPE 2: Host se connecte ===
    await hostPage.goto("http://localhost:3000/login");
    await hostPage.fill('input[type="email"]', "host@test.com");
    await hostPage.fill('input[type="password"]', "password123");
    await hostPage.click('button[type="submit"]');
    await hostPage.waitForURL("**/home");

    // === ÉTAPE 3: Host crée un live ===
    await hostPage.goto("http://localhost:3000/live/new");
    await hostPage.fill('input[placeholder*="titre"]', "Test LiveKit E2E");
    await hostPage.fill('input[placeholder*="ville"]', "Paris");
    await hostPage.click('button[type="submit"]');

    // Attendre la redirection vers /live/{id}
    await hostPage.waitForURL(/\/live\/.+/, { timeout: 10000 });
    const liveUrl = hostPage.url();
    console.log("[E2E] Live URL:", liveUrl);

    // === ÉTAPE 4: Host clique "Démarrer le live" ===
    await hostPage.click('text=Démarrer le live');
    await hostPage.waitForTimeout(3000);

    // Vérifier qu'on est dans la room LiveKit (plein écran noir ou loader)
    const hasLiveKit = await hostPage.locator('[data-lk-theme]').isVisible({ timeout: 10000 });
    expect(hasLiveKit).toBe(true);
    console.log("[E2E] Host connected to LiveKit room");

    // === ÉTAPE 5: Créer le contexte Viewer ===
    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();

    // === ÉTAPE 6: Viewer se connecte ===
    await viewerPage.goto("http://localhost:3000/login");
    await viewerPage.fill('input[type="email"]', "viewer@test.com");
    await viewerPage.fill('input[type="password"]', "password123");
    await viewerPage.click('button[type="submit"]');
    await viewerPage.waitForURL("**/home");

    // === ÉTAPE 7: Viewer rejoint le live ===
    await viewerPage.goto(liveUrl);
    await viewerPage.click('text=Regarder le live');
    await viewerPage.waitForTimeout(3000);

    // Vérifier que viewer est dans la room
    const viewerHasLiveKit = await viewerPage.locator('[data-lk-theme]').isVisible({ timeout: 10000 });
    expect(viewerHasLiveKit).toBe(true);
    console.log("[E2E] Viewer connected to LiveKit room");

    // === ÉTAPE 8: Host termine le live ===
    await hostPage.click('text=Terminer');
    await hostPage.waitForTimeout(2000);

    // Vérifier que le statut est "Terminé"
    const endedText = await viewerPage.locator('text=Ce live est terminé.').isVisible();
    expect(endedText).toBe(true);
    console.log("[E2E] Live ended successfully");

    await hostContext.close();
    await viewerContext.close();
  });
});
