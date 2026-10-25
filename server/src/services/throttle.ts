/**
 * Обмеження частоти: кожен виклик повертає проміс, що виконується не раніше ніж
 * через minIntervalMs після попереднього слоту (політика OSRM: ≤ 1 запит/с).
 */
export function createThrottle(minIntervalMs: number): () => Promise<void> {
  let nextSlot = 0;
  return async function waitForSlot() {
    const now = Date.now();
    const wait = Math.max(0, nextSlot - now);
    nextSlot = Math.max(now, nextSlot) + minIntervalMs;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  };
}
