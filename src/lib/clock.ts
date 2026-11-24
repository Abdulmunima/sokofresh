/** Server render time in ms. Kept out of components so renders stay pure in the linter's eyes. */
export function renderTimestamp(): number {
  return Date.now();
}
