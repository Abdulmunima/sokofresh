/**
 * Offline copies of signed-in pages (task 0.4) hold private business data. On a shared
 * phone they must go when someone logs out. The app's own files (precache, JS, CSS,
 * images) stay, so the app still opens offline for the next person.
 */
const DATA_CACHES = ["pages", "pages-rsc", "pages-rsc-prefetch", "others", "apis", "cross-origin"];
const OUTBOX_KEY = "sokofresh:outbox:v1";

export function isDataCache(name: string): boolean {
  return DATA_CACHES.includes(name);
}

export async function clearSavedPages(): Promise<void> {
  if (typeof caches !== "undefined") {
    const names = await caches.keys();
    await Promise.all(names.filter(isDataCache).map((name) => caches.delete(name)));
  }
  try {
    window.localStorage.removeItem(OUTBOX_KEY); // unsent changes belong to the person who left
  } catch {
    // storage blocked: nothing saved there anyway
  }
}
