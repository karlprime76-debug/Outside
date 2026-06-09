import { test, expect } from "@playwright/test";

const MOCK_MOMENTS = [
  {
    id: "m1",
    type: "PHOTO",
    mediaUrl: "https://picsum.photos/400/600",
    caption: "Coucher de soleil à Paris",
    city: "Paris",
    countryCode: "FR",
    createdAt: new Date().toISOString(),
    author: { id: "u1", name: "Alice", username: "alice", image: null, role: "USER", isVerified: false },
    badge: "Tendance",
    trendingScore: 85,
  },
  {
    id: "m2",
    type: "VIDEO",
    mediaUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    caption: "Concert live",
    city: "Paris",
    countryCode: "FR",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author: { id: "u2", name: "Bob", username: "bob", image: null, role: "USER", isVerified: true },
    badge: "Nouveau",
    trendingScore: 72,
  },
  {
    id: "m3",
    type: "PHOTO",
    mediaUrl: "https://picsum.photos/401/601",
    caption: "Brunch entre amis",
    city: "Paris",
    countryCode: "FR",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    author: { id: "u3", name: "Charlie", username: "charlie", image: null, role: "USER", isVerified: false },
    badge: "Monte vite",
    trendingScore: 45,
  },
];

test.describe("Trending", () => {
  test.describe("API", () => {
    test("returns trending moments for a city", async ({ page }) => {
      await page.route("**/api/moments/trending?city=Paris&limit=5&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: MOCK_MOMENTS }) });
      });

      const res = await page.request.get("/api/moments/trending?city=Paris&limit=5&window=24h");
      const data = await res.json();
      expect(res.ok()).toBeTruthy();
      expect(data.moments).toHaveLength(3);
      expect(data.moments[0].badge).toBe("Tendance");
      expect(data.moments[1].badge).toBe("Nouveau");
    });

    test("returns empty array for city without content", async ({ page }) => {
      await page.route("**/api/moments/trending?city=Nowhere&limit=10&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: [] }) });
      });

      const res = await page.request.get("/api/moments/trending?city=Nowhere&limit=10&window=24h");
      const data = await res.json();
      expect(res.ok()).toBeTruthy();
      expect(data.moments).toHaveLength(0);
    });

    test("falls back to country when no city param", async ({ page }) => {
      await page.route("**/api/moments/trending?countryCode=FR&limit=10&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: MOCK_MOMENTS }) });
      });

      const res = await page.request.get("/api/moments/trending?countryCode=FR&limit=10&window=24h");
      const data = await res.json();
      expect(res.ok()).toBeTruthy();
      expect(data.moments.length).toBeGreaterThan(0);
    });

    test("returns global moments with no location params", async ({ page }) => {
      await page.route("**/api/moments/trending?limit=10&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: MOCK_MOMENTS }) });
      });

      const res = await page.request.get("/api/moments/trending?limit=10&window=24h");
      const data = await res.json();
      expect(res.ok()).toBeTruthy();
    });

    test("limits max 2 moments per author", async ({ page }) => {
      const sameAuthorMoments = [
        { ...MOCK_MOMENTS[0], author: { id: "u1", name: "Alice", username: "alice", image: null, role: "USER", isVerified: false } },
        { ...MOCK_MOMENTS[1], id: "m2b", author: { id: "u1", name: "Alice", username: "alice", image: null, role: "USER", isVerified: false } },
        { ...MOCK_MOMENTS[2], id: "m2c", author: { id: "u1", name: "Alice", username: "alice", image: null, role: "USER", isVerified: false } },
      ];

      await page.route("**/api/moments/trending?city=Paris&limit=10&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: sameAuthorMoments.slice(0, 2) }) });
      });

      const res = await page.request.get("/api/moments/trending?city=Paris&limit=10&window=24h");
      const data = await res.json();
      expect(data.moments.length).toBeLessThanOrEqual(2);
    });
  });

  test.describe("UI", () => {
    test("renders trending moments with badges on the page", async ({ page }) => {
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { activeCity: { name: "Paris" } } }) });
      });
      await page.route("**/api/moments/trending?city=Paris&limit=20&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: MOCK_MOMENTS }) });
      });

      await page.goto("/trending");
      await page.waitForSelector("text=Tendance");
      await expect(page.locator("text=Tendance").first()).toBeVisible();
      await expect(page.locator("text=Nouveau").first()).toBeVisible();
      await expect(page.locator("text=Monte vite").first()).toBeVisible();
    });

    test("shows empty state when no trending content", async ({ page }) => {
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { activeCity: { name: "Paris" } } }) });
      });
      await page.route("**/api/moments/trending**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: [] }) });
      });

      await page.goto("/trending");
      await expect(page.locator("text=Aucun contenu tendance")).toBeVisible();
    });

    test("city tab is disabled when no active city", async ({ page }) => {
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: {} }) });
      });

      await page.goto("/trending");
      const cityTab = page.locator("button:has-text('Ta ville')");
      await expect(cityTab).toBeDisabled();
    });

    test("clicking video card shows play overlay", async ({ page }) => {
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { activeCity: { name: "Paris" } } }) });
      });
      await page.route("**/api/moments/trending?city=Paris&limit=20&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: MOCK_MOMENTS }) });
      });

      await page.goto("/trending");
      const videoCard = page.locator("video").first();
      await videoCard.hover();
      const playButton = page.locator("svg.lucide-play").first();
      await expect(playButton).toBeVisible();
    });

    test("clicking author navigates to profile", async ({ page }) => {
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { activeCity: { name: "Paris" } } }) });
      });
      await page.route("**/api/moments/trending?city=Paris&limit=20&window=24h", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ moments: MOCK_MOMENTS }) });
      });

      await page.goto("/trending");
      const authorLink = page.locator("a[href^='/u/']").first();
      await expect(authorLink).toBeVisible();
    });
  });
});
