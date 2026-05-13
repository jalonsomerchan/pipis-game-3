export function readNumber(key, fallback = 0) {
  const value = Number.parseInt(localStorage.getItem(key) ?? '', 10);

  return Number.isFinite(value) ? value : fallback;
}

export function writeNumber(key, value) {
  localStorage.setItem(key, String(value));
}
