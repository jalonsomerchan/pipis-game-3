export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
