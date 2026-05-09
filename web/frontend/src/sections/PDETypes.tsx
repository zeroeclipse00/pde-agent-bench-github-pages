import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/SectionHeader";
import TeX from "@/components/TeX";
import PdeField, { type FieldFn } from "@/components/PdeField";
import { type CmapName } from "@/lib/colormaps";
import { usePdeTypes, type PdeType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const CATEGORY_BADGE: Record<string, string> = {
  elliptic: "bg-blue-100 text-blue-700",
  parabolic: "bg-amber-100 text-amber-700",
  hyperbolic: "bg-orange-100 text-orange-700",
  reaction_diffusion: "bg-pink-100 text-pink-700",
  incompressible_flow: "bg-violet-100 text-violet-700",
  mixed_type: "bg-slate-100 text-slate-700",
};

const BACKEND_META: Record<"dolfinx" | "firedrake" | "dealii", { short: string; full: string }> = {
  dolfinx: { short: "DOLFINx", full: "DOLFINx (FEniCSx, Python)" },
  firedrake: { short: "Firedrake", full: "Firedrake (Python)" },
  dealii: { short: "deal.II", full: "deal.II (C++)" },
};

// ── Per-PDE solution previews ────────────────────────────────────────────────
// Each entry is an analytical or semi-analytical field plotted on a heatmap,
// chosen to be visually evocative of the equation's behavior.
type FieldDef = {
  field: FieldFn;
  cmap: CmapName;
  contours?: number;
  symmetric?: boolean;
  domain?: [number, number, number, number];
  mask?: (x: number, y: number) => boolean;
  showMesh?: boolean;
  caption: string;
  overlay?: ReactNode;
};

const TWO_PI = Math.PI * 2;

const FIELD_DEFS: Record<string, FieldDef[]> = {
  poisson: [
    {
      // u = sin(πx) sin(πy) — solves -Δu = 2π² sin(πx) sin(πy) on the unit square.
      field: (x, y) => Math.sin(Math.PI * x) * Math.sin(Math.PI * y),
      cmap: "viridis",
      contours: 6,
      caption: "u = sin πx · sin πy",
      showMesh: true,
    },
    {
      // Variable-conductivity steady state: heated patch on the left, cold on right.
      field: (x, y) =>
        Math.exp(-((x - 0.25) ** 2 + (y - 0.5) ** 2) / 0.06) -
        0.7 * Math.exp(-((x - 0.8) ** 2 + (y - 0.4) ** 2) / 0.05),
      cmap: "RdBu",
      symmetric: true,
      contours: 7,
      caption: "−∇·(κ∇u) = f",
    },
  ],
  helmholtz: [
    {
      // Point-source scattering: Re[H₀(kr)] ≈ cos(kr)/√r.
      field: (x, y) => {
        const r = Math.hypot(x - 0.5, y - 0.5) + 0.04;
        const k = 22;
        return Math.cos(k * r) / Math.sqrt(r);
      },
      cmap: "RdBu",
      symmetric: true,
      caption: "k = 22 · point source",
    },
    {
      // Plane wave incident at an angle.
      field: (x, y) => Math.cos(18 * x - 12 * y),
      cmap: "RdBu",
      symmetric: true,
      contours: 6,
      caption: "incident plane wave",
    },
  ],
  biharmonic: [
    {
      // Clamped-plate deflection, w = (sin πx · sin πy)² — satisfies homogeneous BCs.
      field: (x, y) => Math.pow(Math.sin(Math.PI * x) * Math.sin(Math.PI * y), 2),
      cmap: "magma",
      contours: 8,
      caption: "Δ²w = f · clamped plate",
      showMesh: true,
    },
  ],
  linear_elasticity: [
    {
      // Cantilever bending: vertical displacement ~ x²(3L − x), shaded by σ_xx.
      field: (x, y) => {
        // Bending stress along the beam, signed.
        const sigma = (1 - 2 * y) * (1 - x * 0.4);
        return sigma;
      },
      cmap: "RdBu",
      symmetric: true,
      contours: 7,
      caption: "σ_xx · cantilever",
      overlay: (
        <>
          {/* fixed support hatch on the left */}
          <rect x="0" y="0" width="0.04" height="1" fill="rgba(15,23,42,0.7)" />
          {/* arrow indicating tip load */}
          <line
            x1="0.95"
            y1="0.5"
            x2="1.0"
            y2="0.85"
            stroke="rgba(15,23,42,0.85)"
            strokeWidth="0.012"
          />
          <polygon
            points="1.0,0.85 0.96,0.78 0.985,0.83"
            fill="rgba(15,23,42,0.85)"
          />
        </>
      ),
    },
  ],
  heat: [
    {
      // u(x,y,t=0) = exp(-((x-0.3)²+(y-0.5)²)/0.04) — Gaussian hot spot decaying.
      field: (x, y) =>
        Math.exp(-((x - 0.3) ** 2 + (y - 0.55) ** 2) / 0.04) * 0.95 +
        Math.exp(-((x - 0.75) ** 2 + (y - 0.3) ** 2) / 0.05) * 0.6,
      cmap: "inferno",
      contours: 7,
      caption: "∂ₜu − ∇·(κ∇u) = f",
    },
    {
      // Diffused mode-1 sin wave at intermediate time.
      field: (x, y) => Math.exp(-1.0) * Math.sin(Math.PI * x) * Math.sin(Math.PI * y),
      cmap: "plasma",
      contours: 6,
      caption: "mode-1 decay · t = 0.1",
    },
  ],
  convection_diffusion: [
    {
      // Boundary-layer: u = (exp(βx/ε) − 1) / (exp(β/ε) − 1) for high Péclet.
      field: (x, y) => {
        const eps = 0.04;
        const beta = 1;
        const denom = Math.exp(beta / eps) - 1;
        const u = (Math.exp((beta * x) / eps) - 1) / denom;
        // Shape it slightly with y for visual interest near the corners.
        return u * (1 - 0.15 * Math.cos(Math.PI * y));
      },
      cmap: "viridis",
      contours: 8,
      caption: "ε = 0.04 · boundary layer at x = 1",
      overlay: (
        <>
          {/* convection arrows along the streamline */}
          {[0.25, 0.5, 0.75].map((y) => (
            <g key={y}>
              <line
                x1="0.05"
                y1={y}
                x2="0.18"
                y2={y}
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="0.008"
              />
              <polygon
                points={`0.18,${y} 0.155,${y - 0.018} 0.155,${y + 0.018}`}
                fill="rgba(255,255,255,0.85)"
              />
            </g>
          ))}
        </>
      ),
    },
  ],
  reaction_diffusion: [
    {
      // Turing-style spot pattern: sum of randomly placed Gaussians, then thresholded.
      field: (x, y) => {
        const spots: [number, number, number][] = [
          [0.18, 0.28, 0.045],
          [0.42, 0.18, 0.05],
          [0.7, 0.34, 0.045],
          [0.88, 0.62, 0.05],
          [0.55, 0.55, 0.04],
          [0.26, 0.72, 0.05],
          [0.5, 0.85, 0.045],
          [0.78, 0.85, 0.045],
          [0.12, 0.5, 0.04],
        ];
        let s = 0;
        for (const [cx, cy, r] of spots) {
          s += Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / r);
        }
        return Math.tanh(s - 0.6);
      },
      cmap: "magma",
      contours: 5,
      caption: "Turing-style spots",
    },
  ],
  stokes: [
    {
      // Stream function ψ = sin(πx)·sin(πy) — Taylor-Green-like cavity flow.
      field: (x, y) => Math.sin(Math.PI * x) * Math.sin(Math.PI * y),
      cmap: "Blues",
      contours: 9,
      caption: "ψ = sin πx · sin πy",
      overlay: (
        <>
          {/* a few streamline arrowheads */}
          {[0.25, 0.5, 0.75].map((y) => (
            <polygon
              key={y}
              points={`${0.5 + 0.04},${y - 0.02} ${0.5 + 0.04},${y + 0.02} ${0.5 + 0.07},${y}`}
              fill="rgba(15,23,42,0.7)"
            />
          ))}
          <rect x="0" y="0" width="1" height="0.025" fill="rgba(15,23,42,0.55)" />
          <rect x="0" y="0.975" width="1" height="0.025" fill="rgba(15,23,42,0.55)" />
        </>
      ),
    },
  ],
  navier_stokes: [
    {
      // Approximated von-Kármán wake: counter-rotating vortices behind a cylinder.
      field: (x, y) => {
        const cyx = 0.22;
        const cyy = 0.5;
        const r = Math.hypot(x - cyx, y - cyy);
        if (r < 0.07) return 0; // inside the cylinder
        const v1 = Math.exp(-((x - 0.45) ** 2 + (y - 0.62) ** 2) / 0.012);
        const v2 = -Math.exp(-((x - 0.6) ** 2 + (y - 0.4) ** 2) / 0.012);
        const v3 = Math.exp(-((x - 0.78) ** 2 + (y - 0.6) ** 2) / 0.013);
        const v4 = -Math.exp(-((x - 0.92) ** 2 + (y - 0.42) ** 2) / 0.013);
        return v1 + v2 + v3 + v4;
      },
      cmap: "RdBu",
      symmetric: true,
      caption: "vortex shedding (Re ≈ 100)",
      overlay: (
        <>
          <circle cx="0.22" cy="0.5" r="0.07" fill="rgba(15,23,42,0.92)" />
          {/* incoming flow streamlines */}
          {[0.2, 0.4, 0.6, 0.8].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="0.12"
              y2={y}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="0.005"
              strokeDasharray="0.02 0.02"
            />
          ))}
        </>
      ),
    },
  ],
  burgers: [
    {
      // Steepening shock: u = -tanh((x − 0.5)/(2ε)) · (1 − 0.3y).
      field: (x, y) => {
        const eps = 0.025;
        return -Math.tanh((x - 0.5) / (2 * eps)) * (1 - 0.25 * (y - 0.5));
      },
      cmap: "RdBu",
      symmetric: true,
      contours: 5,
      caption: "shock front · ε = 0.025",
    },
  ],
  wave: [
    {
      // Radial wave packet u = cos(20r) · exp(−3r) emanating from the center.
      field: (x, y) => {
        const r = Math.hypot(x - 0.5, y - 0.5);
        return Math.cos(28 * r) * Math.exp(-3 * r);
      },
      cmap: "RdBu",
      symmetric: true,
      caption: "radial pulse",
    },
    {
      // Standing-wave eigenmode (m=2, n=1): u = sin(2πx) · sin(πy) · cos(ωt).
      field: (x, y) => Math.sin(2 * Math.PI * x) * Math.sin(Math.PI * y),
      cmap: "RdBu",
      symmetric: true,
      contours: 6,
      caption: "mode (2,1) standing wave",
      showMesh: true,
    },
  ],
};

// ensure TWO_PI is referenced (used by overlays elsewhere if needed)
void TWO_PI;

function firstCategory(cat: string): string {
  return cat.split("/")[0].trim().replace(/\s+/g, "_");
}

function categoryBadge(cat: string): string {
  return CATEGORY_BADGE[firstCategory(cat)] ?? "bg-slate-100 text-slate-700";
}

const CATEGORY_ORDER = [
  "elliptic",
  "parabolic",
  "hyperbolic",
  "incompressible_flow",
  "reaction_diffusion",
  "mixed_type",
] as const;
type CategoryKey = (typeof CATEGORY_ORDER)[number];

export default function PDETypes() {
  const { data } = usePdeTypes();
  const t = useT();
  const types = data ?? [];
  const [filter, setFilter] = useState<"all" | CategoryKey>("all");

  const categoryCounts = useMemo(() => {
    const m = new Map<CategoryKey, number>();
    for (const c of CATEGORY_ORDER) m.set(c, 0);
    for (const tt of types) {
      for (const part of tt.category.split("/")) {
        const key = part.trim().replace(/\s+/g, "_") as CategoryKey;
        if (m.has(key)) m.set(key, (m.get(key) ?? 0) + 1);
      }
    }
    return m;
  }, [types]);

  const visible = useMemo(() => {
    if (filter === "all") return types;
    return types.filter((tt) =>
      tt.category
        .split("/")
        .map((p) => p.trim().replace(/\s+/g, "_"))
        .includes(filter),
    );
  }, [types, filter]);

  return (
    <section id="benchmark" className="py-20">
      <div className="container-page">
        <SectionHeader tag={t("pde.tag")} title={t("pde.title")} desc={t("pde.desc")} />

        {/* Category filter pills */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={t("pde.filter.all")}
            count={types.length}
            tone="bg-brand-600 text-white"
            inactiveTone="bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          />
          {CATEGORY_ORDER.map((c) => {
            const count = categoryCounts.get(c) ?? 0;
            if (count === 0) return null;
            return (
              <FilterChip
                key={c}
                active={filter === c}
                onClick={() => setFilter(c)}
                label={t(`pde.filter.${c}` as Parameters<typeof t>[0])}
                count={count}
                tone={cn("ring-2 ring-offset-1", categoryBadge(c))}
                inactiveTone={cn(categoryBadge(c), "opacity-70 hover:opacity-100")}
              />
            );
          })}
        </div>

        {filter !== "all" && (
          <div className="mb-6 text-center text-xs text-slate-500">
            {t("pde.matchCount", { n: visible.length, m: types.length })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {visible.map((tt, i) => (
            <PdeCard key={tt.id} pde={tt} index={i} t={t} />
          ))}
        </div>

        <div className="mt-10 text-xs text-slate-500 max-w-3xl mx-auto text-center leading-relaxed">
          <span className="font-semibold">{t("pde.legendLabel")}</span>{" "}
          <span className="font-mono">DOLFINx</span> (FEniCSx, Python) ·{" "}
          <span className="font-mono">Firedrake</span> (Python) ·{" "}
          <span className="font-mono">deal.II</span> (C++). {t("pde.legendTail.en")}
        </div>
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
  inactiveTone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone: string;
  inactiveTone: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
        active ? tone : inactiveTone,
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-full",
          active ? "bg-white/20 text-white" : "bg-white/70 text-slate-700",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function PdeCard({
  pde,
  index,
  t,
}: {
  pde: PdeType;
  index: number;
  t: ReturnType<typeof useT>;
}) {
  const fields = FIELD_DEFS[pde.id] ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="card card-hover relative overflow-hidden flex flex-col"
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-15 pointer-events-none"
        style={{ background: pde.color }}
      />

      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="shrink-0 w-11 h-11 rounded-xl grid place-items-center font-bold text-sm"
              style={{ background: pde.bgColor, color: pde.color }}
            >
              {pde.abbr}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-ink-900 leading-tight text-base truncate">
                {pde.name}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {pde.category.split("/").map((c) => {
                  const key = c.trim().replace(/\s+/g, "_");
                  return (
                    <span
                      key={key}
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                        categoryBadge(key),
                      )}
                    >
                      {key.replace(/_/g, " ")}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-extrabold tabular-nums text-ink-900 leading-none">
              {pde.cases}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
              {t("pde.casesLabel")}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
          {t("pde.equationLabel")}
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 overflow-x-auto text-[15px] leading-relaxed">
          <TeX math={pde.equation} block />
        </div>
      </div>

      <p className="px-6 pt-4 text-[13px] text-slate-600 leading-relaxed">
        {t(`pde.desc.${pde.id}` as Parameters<typeof t>[0]) || pde.description}
      </p>

      {fields.length > 0 && (
        <div className="px-6 pt-4">
          <div className={cn("grid gap-2", fields.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {fields.map((fdef, i) => (
              <FieldThumb key={i} def={fdef} single={fields.length === 1} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto px-6 pt-5 pb-5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
          {t("pde.libraryTracks")}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["dolfinx", "firedrake", "dealii"] as const).map((b) => {
            const n = pde.backendCases[b];
            const meta = BACKEND_META[b];
            const included = n != null;
            return (
              <div
                key={b}
                title={`${meta.full}: ${included ? `${n} cases` : "not included"}`}
                className={cn(
                  "rounded-md px-2 py-1.5 text-center transition-colors",
                  included ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-300",
                )}
              >
                <div className="text-[10px] font-semibold">{meta.short}</div>
                <div className="text-sm font-bold tabular-nums leading-tight">{n ?? "—"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function FieldThumb({ def, single }: { def: FieldDef; single: boolean }) {
  const w = single ? 360 : 200;
  const h = single ? 200 : 150;
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
      <PdeField
        field={def.field}
        cmap={def.cmap}
        contours={def.contours ?? 0}
        symmetric={def.symmetric}
        domain={def.domain}
        mask={def.mask}
        showMesh={def.showMesh}
        overlay={def.overlay}
        caption={def.caption}
        width={w}
        height={h}
        className="w-full h-full"
      />
    </div>
  );
}
