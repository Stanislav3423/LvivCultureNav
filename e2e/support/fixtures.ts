import { test as base, expect } from '@playwright/test';

// Тайли OpenStreetMap у тестах не завантажуємо: політика OSM забороняє автоматизоване навантаження,
// а для перевірки поведінки застосунку підкладка мапи не потрібна.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
    await use(page);
  },
});

export { expect };
