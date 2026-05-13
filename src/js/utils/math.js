export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

export function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;

  return {
    x: x / length,
    y: y / length,
  };
}

export function moveTowards(from, to, distance) {
  const direction = normalize(to.x - from.x, to.y - from.y);

  return {
    x: from.x + direction.x * distance,
    y: from.y + direction.y * distance,
  };
}

export function pointInEllipse(point, ellipse) {
  const dx = (point.x - ellipse.x) / ellipse.radiusX;
  const dy = (point.y - ellipse.y) / ellipse.radiusY;

  return dx * dx + dy * dy <= 1;
}
