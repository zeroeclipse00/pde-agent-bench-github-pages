import { useEffect, useRef, type ReactNode } from "react";
import { sampleCmap, type CmapName } from "@/lib/colormaps";

export type FieldFn = (x: number, y: number) => number;

export type PdeFieldProps = {
  field: FieldFn;
  cmap?: CmapName;
  /** Number of equally-spaced isolines to overlay; 0 disables the contour pass. */
  contours?: number;
  /** Domain in problem coordinates: [xmin, xmax, ymin, ymax]. Defaults to the unit square. */
  domain?: [number, number, number, number];
  /** Force a symmetric value range around 0 (sensible for diverging fields like RdBu). */
  symmetric?: boolean;
  /** Optional pixel mask: returns true to paint the pixel, false to leave it transparent. */
  mask?: (x: number, y: number) => boolean;
  /** Subtle paper-grid overlay (helps suggest a FEM mesh). */
  showMesh?: boolean;
  /** SVG nodes drawn over the heatmap, in 0–1 coords (the SVG viewBox is the unit square). */
  overlay?: ReactNode;
  width?: number;
  height?: number;
  caption?: string;
  className?: string;
};

const DEFAULT_DOMAIN: [number, number, number, number] = [0, 1, 0, 1];

export default function PdeField({
  field,
  cmap = "viridis",
  contours = 0,
  domain = DEFAULT_DOMAIN,
  symmetric = false,
  mask,
  showMesh = false,
  overlay,
  width = 240,
  height = 180,
  caption,
  className,
}: PdeFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const W = Math.round(width * dpr);
    const H = Math.round(height * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sample on a grid sized to the canvas pixels.
    const nx = W;
    const ny = H;
    const [x0, x1, y0, y1] = domain;
    const data = new Float32Array(nx * ny);
    let vmin = Infinity;
    let vmax = -Infinity;

    for (let j = 0; j < ny; j++) {
      const y = y0 + ((y1 - y0) * j) / (ny - 1);
      for (let i = 0; i < nx; i++) {
        const x = x0 + ((x1 - x0) * i) / (nx - 1);
        const v = field(x, y);
        data[j * nx + i] = v;
        if (Number.isFinite(v)) {
          if (v < vmin) vmin = v;
          if (v > vmax) vmax = v;
        }
      }
    }

    if (symmetric) {
      const a = Math.max(Math.abs(vmin), Math.abs(vmax));
      vmin = -a;
      vmax = a;
    }
    const span = vmax - vmin || 1;

    // Paint the heatmap.
    const img = ctx.createImageData(nx, ny);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const x = x0 + ((x1 - x0) * i) / (nx - 1);
        const y = y0 + ((y1 - y0) * j) / (ny - 1);
        const masked = mask ? !mask(x, y) : false;
        if (masked) {
          const off = k * 4;
          img.data[off + 3] = 0;
          continue;
        }
        const v = data[k];
        const t = Number.isFinite(v) ? (v - vmin) / span : 0;
        const [r, g, b] = sampleCmap(cmap, t);
        const off = k * 4;
        img.data[off] = r;
        img.data[off + 1] = g;
        img.data[off + 2] = b;
        img.data[off + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Subtle paper-grid suggesting a FEM mesh, drawn after the field.
    if (showMesh) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 0.6 * dpr;
      const gridN = 12;
      ctx.beginPath();
      for (let i = 1; i < gridN; i++) {
        const xPx = (i / gridN) * W;
        ctx.moveTo(xPx, 0);
        ctx.lineTo(xPx, H);
      }
      for (let j = 1; j < gridN; j++) {
        const yPx = (j / gridN) * H;
        ctx.moveTo(0, yPx);
        ctx.lineTo(W, yPx);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Marching-squares isocontours.
    if (contours > 0) {
      const levels: number[] = [];
      for (let l = 1; l <= contours; l++) {
        levels.push(vmin + (span * l) / (contours + 1));
      }
      // Subsample for contour grid for performance & visual smoothness.
      const cn = 80;
      const cm = Math.round((cn * H) / W);
      const cgrid = new Float32Array(cn * cm);
      for (let j = 0; j < cm; j++) {
        for (let i = 0; i < cn; i++) {
          const x = x0 + ((x1 - x0) * i) / (cn - 1);
          const y = y0 + ((y1 - y0) * j) / (cm - 1);
          cgrid[j * cn + i] = field(x, y);
        }
      }

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 0.9 * dpr;
      ctx.lineJoin = "round";
      const cw = W / (cn - 1);
      const ch = H / (cm - 1);
      for (const level of levels) {
        ctx.beginPath();
        for (let j = 0; j < cm - 1; j++) {
          for (let i = 0; i < cn - 1; i++) {
            const a = cgrid[j * cn + i];
            const b = cgrid[j * cn + (i + 1)];
            const cv = cgrid[(j + 1) * cn + i];
            const d = cgrid[(j + 1) * cn + (i + 1)];
            const above = (v: number) => v >= level;
            const code =
              (above(a) ? 1 : 0) +
              (above(b) ? 2 : 0) +
              (above(cv) ? 4 : 0) +
              (above(d) ? 8 : 0);
            if (code === 0 || code === 15) continue;
            const points: [number, number][] = [];
            const lerp = (v1: number, v2: number) => (level - v1) / (v2 - v1);
            // top edge a–b
            if (above(a) !== above(b)) {
              const tx = lerp(a, b);
              points.push([(i + tx) * cw, j * ch]);
            }
            // left edge a–c
            if (above(a) !== above(cv)) {
              const ty = lerp(a, cv);
              points.push([i * cw, (j + ty) * ch]);
            }
            // right edge b–d
            if (above(b) !== above(d)) {
              const ty = lerp(b, d);
              points.push([(i + 1) * cw, (j + ty) * ch]);
            }
            // bottom edge c–d
            if (above(cv) !== above(d)) {
              const tx = lerp(cv, d);
              points.push([(i + tx) * cw, (j + 1) * ch]);
            }
            if (points.length >= 2) {
              ctx.moveTo(points[0][0], points[0][1]);
              ctx.lineTo(points[1][0], points[1][1]);
            }
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [field, cmap, contours, domain, symmetric, mask, showMesh, width, height]);

  return (
    <div className={className} style={{ width, height, position: "relative" }}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full rounded-md"
        style={{ display: "block" }}
      />
      {overlay && (
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {overlay}
        </svg>
      )}
      {caption && (
        <div className="absolute bottom-1 left-1 text-[9px] font-mono text-white/85 px-1.5 py-0.5 rounded bg-black/35 backdrop-blur-[2px]">
          {caption}
        </div>
      )}
    </div>
  );
}
