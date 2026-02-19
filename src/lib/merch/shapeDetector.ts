/**
 * Traces the alpha channel of a PNG image and generates an SVG path string
 * for use as a CSS clip-path. Uses marching squares on a downsampled alpha grid.
 */

interface Point {
  x: number;
  y: number;
}

/**
 * Extract alpha channel from an image, downsampled to a manageable grid.
 */
function getAlphaGrid(
  imageData: ImageData,
  gridSize: number,
): boolean[][] {
  const { width, height, data } = imageData;
  const cellW = width / gridSize;
  const cellH = height / gridSize;
  const grid: boolean[][] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    const row: boolean[] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      // Sample center of cell
      const px = Math.floor(gx * cellW + cellW / 2);
      const py = Math.floor(gy * cellH + cellH / 2);
      const idx = (py * width + px) * 4;
      row.push(data[idx + 3] > 20); // alpha threshold
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Simple contour tracing — finds outermost boundary of non-transparent pixels.
 * Returns an array of points in normalized [0,1] coordinates.
 */
function traceContour(grid: boolean[][], gridSize: number): Point[] {
  const points: Point[] = [];
  const visited = new Set<string>();

  // Find starting point (first opaque cell from top-left)
  let startX = -1;
  let startY = -1;
  outer: for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x]) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return [];

  // Simple boundary following
  const dirs = [
    [0, -1], [1, -1], [1, 0], [1, 1],
    [0, 1], [-1, 1], [-1, 0], [-1, -1],
  ];

  let cx = startX;
  let cy = startY;
  let dir = 0;

  const maxSteps = gridSize * gridSize * 2;
  for (let step = 0; step < maxSteps; step++) {
    const key = `${cx},${cy}`;
    if (step > 2 && cx === startX && cy === startY) break;

    if (!visited.has(key)) {
      visited.add(key);
      points.push({ x: cx / gridSize, y: cy / gridSize });
    }

    // Turn to find next boundary cell
    let found = false;
    const searchStart = (dir + 5) % 8; // start looking from behind-left
    for (let i = 0; i < 8; i++) {
      const d = (searchStart + i) % 8;
      const nx = cx + dirs[d][0];
      const ny = cy + dirs[d][1];
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && grid[ny][nx]) {
        cx = nx;
        cy = ny;
        dir = d;
        found = true;
        break;
      }
    }

    if (!found) break;
  }

  return points;
}

/**
 * Simplify a point array using Ramer-Douglas-Peucker algorithm.
 */
function simplifyPath(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointLineDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function pointLineDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Convert point array to SVG path string (percentage-based for clip-path).
 */
function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return "";

  const fmt = (p: Point) =>
    `${(p.x * 100).toFixed(1)}% ${(p.y * 100).toFixed(1)}%`;

  let d = `M ${fmt(points[0])}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${fmt(points[i])}`;
  }
  d += " Z";

  return d;
}

/**
 * Main function: takes a PNG file/blob, returns SVG clip-path string.
 * Runs entirely in the browser using canvas.
 */
export async function detectShape(
  imageSource: string | Blob,
  gridResolution = 64,
  simplifyEpsilon = 0.008,
): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";

  const url =
    imageSource instanceof Blob
      ? URL.createObjectURL(imageSource)
      : imageSource;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  if (imageSource instanceof Blob) {
    URL.revokeObjectURL(url);
  }

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const grid = getAlphaGrid(imageData, gridResolution);
  const contour = traceContour(grid, gridResolution);
  const simplified = simplifyPath(contour, simplifyEpsilon);

  return pointsToSvgPath(simplified);
}

/**
 * Generate a CSS polygon() clip-path from points.
 */
export function svgPathToPolygon(points: Point[]): string {
  if (points.length === 0) return "none";
  const coords = points
    .map((p) => `${(p.x * 100).toFixed(1)}% ${(p.y * 100).toFixed(1)}%`)
    .join(", ");
  return `polygon(${coords})`;
}
