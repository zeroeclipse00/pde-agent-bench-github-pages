// Compact colormap lookups using a small number of anchor stops.
// Linear interpolation is good enough for visualization.
type RGB = [number, number, number];

const VIRIDIS: RGB[] = [
  [68, 1, 84],
  [59, 82, 139],
  [33, 144, 141],
  [93, 201, 99],
  [253, 231, 37],
];

const PLASMA: RGB[] = [
  [13, 8, 135],
  [126, 3, 168],
  [203, 70, 121],
  [248, 149, 64],
  [240, 249, 33],
];

const MAGMA: RGB[] = [
  [0, 0, 4],
  [80, 18, 123],
  [183, 55, 121],
  [251, 136, 97],
  [252, 253, 191],
];

const INFERNO: RGB[] = [
  [0, 0, 4],
  [87, 16, 110],
  [187, 55, 84],
  [249, 142, 9],
  [252, 255, 164],
];

// Diverging — for signed fields. Centered at t=0.5.
const RDBU: RGB[] = [
  [103, 0, 31],
  [214, 96, 77],
  [247, 247, 247],
  [67, 147, 195],
  [5, 48, 97],
];

const REDS: RGB[] = [
  [255, 245, 240],
  [252, 187, 161],
  [251, 106, 74],
  [203, 24, 29],
  [103, 0, 13],
];

const BLUES: RGB[] = [
  [247, 251, 255],
  [198, 219, 239],
  [107, 174, 214],
  [33, 113, 181],
  [8, 48, 107],
];

const MAPS: Record<string, RGB[]> = {
  viridis: VIRIDIS,
  plasma: PLASMA,
  magma: MAGMA,
  inferno: INFERNO,
  RdBu: RDBU,
  Reds: REDS,
  Blues: BLUES,
};

export type CmapName = keyof typeof MAPS;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function sampleCmap(name: CmapName, t: number): RGB {
  const stops = MAPS[name];
  const tc = Math.min(1, Math.max(0, t));
  const scaled = tc * (stops.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = stops[i];
  const b = stops[Math.min(stops.length - 1, i + 1)];
  return [
    Math.round(lerp(a[0], b[0], f)),
    Math.round(lerp(a[1], b[1], f)),
    Math.round(lerp(a[2], b[2], f)),
  ];
}
