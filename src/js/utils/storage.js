export function readNumber(key, fallback = 0) {
  const value = Number.parseFloat(localStorage.getItem(key) ?? '');

  return Number.isFinite(value) ? value : fallback;
}

export function writeNumber(key, value) {
  localStorage.setItem(key, String(value));
}
