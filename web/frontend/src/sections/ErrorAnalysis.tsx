import { useState } from "react";
import { motion } from "framer-motion";
import {
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import SectionHeader from "@/components/SectionHeader";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type StageKey = "F-Exec" | "F-Acc" | "F-Time" | "Pass";

const STAGE_META: Record<StageKey, { color: string; icon: typeof XCircle; blurbKey: string }> = {
  "F-Exec": { color: "#dc2626", icon: XCircle, blurbKey: "stage.fexec.blurb" },
  "F-Acc": { color: "#f59e0b", icon: AlertTriangle, blurbKey: "stage.facc.blurb" },
  "F-Time": { color: "#0ea5e9", icon: Clock, blurbKey: "stage.ftime.blurb" },
  Pass: { color: "#10b981", icon: CheckCircle2, blurbKey: "stage.pass.blurb" },
};

// Single-shot DOLFINx stage breakdown (from Failure-Stage Analysis figure / Sec. 4.3 of the paper).
type Row = { model: string; "F-Exec": number; "F-Acc": number; "F-Time": number; Pass: number };
const STAGE_DATA_DOLFINX: Row[] = [
  { model: "Gemini 3.1 Pro", "F-Exec": 21.7, "F-Acc": 12.2, "F-Time": 12.0, Pass: 54.1 },
  { model: "Opus 4.7", "F-Exec": 30.5, "F-Acc": 13.0, "F-Time": 8.7, Pass: 47.8 },
  { model: "GPT-5.4", "F-Exec": 30.5, "F-Acc": 17.4, "F-Time": 6.1, Pass: 46.0 },
  { model: "CodePDE", "F-Exec": 35.7, "F-Acc": 11.9, "F-Time": 7.7, Pass: 44.7 },
  { model: "OpenHands", "F-Exec": 38.6, "F-Acc": 11.9, "F-Time": 5.9, Pass: 43.6 },
  { model: "Qwen3.6-Plus", "F-Exec": 60.6, "F-Acc": 10.4, "F-Time": 5.6, Pass: 23.4 },
  { model: "DeepSeek V3.2", "F-Exec": 92.4, "F-Acc": 2.6, "F-Time": 0.8, Pass: 4.2 },
  { model: "Mini-SWE-Agent", "F-Exec": 93.2, "F-Acc": 2.4, "F-Time": 0.7, Pass: 3.7 },
];

// Common error patterns observed across submissions, distilled from the paper's failure analysis & walkthroughs.
// Title and detail are i18n keys; examples remain language-neutral code snippets.
type ErrorItem = {
  stage: StageKey;
  titleKey: string;
  detailKey: string;
  examples: string[];
};

const ERROR_LIBRARY: ErrorItem[] = [
  {
    stage: "F-Exec",
    titleKey: "ea.fexec.api.title",
    detailKey: "ea.fexec.api.detail",
    examples: [
      "from dolfin import * (legacy FEniCS, removed in DOLFINx)",
      "Passing UFL forms with mismatched test/trial spaces",
      "Calling deal.II templated classes with wrong dimension parameter",
    ],
  },
  {
    stage: "F-Exec",
    titleKey: "ea.fexec.artifact.title",
    detailKey: "ea.fexec.artifact.detail",
    examples: [
      "Writing 'u' instead of the required vector-component layout",
      "Forgetting to mask out-of-domain points as NaN",
      "Returning shape (N,) instead of (Nx, Ny) for a 2-D field",
    ],
  },
  {
    stage: "F-Exec",
    titleKey: "ea.fexec.dep.title",
    detailKey: "ea.fexec.dep.detail",
    examples: [
      "import pyamg / petsc4py without a fallback path",
      "Putting the solver inside if __name__ == '__main__' only",
      "Indentation errors, unterminated f-strings",
    ],
  },
  {
    stage: "F-Acc",
    titleKey: "ea.facc.weak.title",
    detailKey: "ea.facc.weak.detail",
    examples: [
      "Using +∇u·∇v instead of −∇u·∇v in Poisson",
      "Forgetting the −k²u term in Helmholtz",
      "Mixing up λ(∇·u)I and 2µε(u) signs in elasticity",
    ],
  },
  {
    stage: "F-Acc",
    titleKey: "ea.facc.bc.title",
    detailKey: "ea.facc.bc.detail",
    examples: [
      "Applying u=g on all of ∂Ω instead of Γ_D",
      "Replacing rather than adding the boundary integral on Γ_N",
      "Incorrect normal direction for traction in elasticity",
    ],
  },
  {
    stage: "F-Acc",
    titleKey: "ea.facc.mesh.title",
    detailKey: "ea.facc.mesh.detail",
    examples: [
      "Using N=20 cells/wavelength when k=8 needs ≥10/λ",
      "No SUPG/streamline-upwind on convection-dominated cases",
      "Equal-order velocity/pressure without inf-sup stabilization",
    ],
  },
  {
    stage: "F-Time",
    titleKey: "ea.ftime.solver.title",
    detailKey: "ea.ftime.solver.detail",
    examples: [
      "scipy.linalg.solve on the global stiffness matrix",
      "PETSc default ('preonly' + 'lu') on large 3-D Poisson",
      "Not reusing assembled matrix across time steps",
    ],
  },
  {
    stage: "F-Time",
    titleKey: "ea.ftime.refine.title",
    detailKey: "ea.ftime.refine.detail",
    examples: [
      "h-refining 3× past the calibration baseline",
      "Setting rtol=1e-14 on Krylov solves",
      "Time step 10× smaller than CFL requires",
    ],
  },
  {
    stage: "F-Time",
    titleKey: "ea.ftime.assemble.title",
    detailKey: "ea.ftime.assemble.detail",
    examples: [
      "fem.assemble_matrix(a) inside the t-loop",
      "Reconstructing function spaces every step",
      "Recomputing Dirichlet BC objects each iteration",
    ],
  },
];

const WALKTHROUGHS = [
  {
    id: "A",
    family: "Helmholtz",
    domain: "Circle",
    eBase: "1.16×10⁻⁹",
    tauAcc: "1.00×10⁻⁶ †",
    tBase: "7.05 s",
    tauTime: "21.1 s",
    verdict: "Pass" as StageKey,
  },
  {
    id: "B",
    family: "Convection–Diffusion",
    domain: "Periodic square",
    eBase: "9.02×10⁻⁵",
    tauAcc: "9.02×10⁻⁴",
    tBase: "10.4 s",
    tauTime: "31.2 s",
    verdict: "F-Acc" as StageKey,
  },
  {
    id: "C",
    family: "Linear Elasticity",
    domain: "Quarter sector",
    eBase: "5.93×10⁻⁷",
    tauAcc: "5.93×10⁻⁶",
    tBase: "1.60 s",
    tauTime: "4.80 s",
    verdict: "F-Time" as StageKey,
  },
  {
    id: "D",
    family: "Helmholtz",
    domain: "Square + hole",
    eBase: "3.60×10⁻⁸",
    tauAcc: "1.00×10⁻⁶ †",
    tBase: "9.37 s",
    tauTime: "28.1 s",
    verdict: "F-Acc" as StageKey,
  },
];

const STAGE_FILTERS: (StageKey | "ALL")[] = ["ALL", "F-Exec", "F-Acc", "F-Time"];

export default function ErrorAnalysis() {
  const [filter, setFilter] = useState<StageKey | "ALL">("ALL");
  const [expanded, setExpanded] = useState<number | null>(0);
  const t = useT();

  const items =
    filter === "ALL" ? ERROR_LIBRARY : ERROR_LIBRARY.filter((e) => e.stage === filter);

  return (
    <section id="errors" className="py-20 border-b border-slate-200/70">
      <div className="container-page">
        <SectionHeader
          tag={t("errors.tag")}
          title={t("errors.title")}
          desc={t("errors.desc")}
        />

        {/* Stage breakdown chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-12">
          <div className="card p-5 lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-ink-900">{t("errors.chartTitle")}</h3>
              <span className="text-xs text-slate-500">{t("errors.chartSub")}</span>
            </div>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={STAGE_DATA_DOLFINX}
                  layout="vertical"
                  stackOffset="expand"
                  margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    tick={{ fontSize: 11, fill: "#475569" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="model"
                    width={140}
                    tick={{ fontSize: 11, fill: "#475569" }}
                  />
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={{
                      background: "rgba(255,255,255,0.97)",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="Pass" stackId="s" fill={STAGE_META.Pass.color} />
                  <Bar dataKey="F-Exec" stackId="s" fill={STAGE_META["F-Exec"].color} />
                  <Bar dataKey="F-Acc" stackId="s" fill={STAGE_META["F-Acc"].color} />
                  <Bar dataKey="F-Time" stackId="s" fill={STAGE_META["F-Time"].color} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5 lg:col-span-2 flex flex-col gap-3">
            <h3 className="font-semibold text-ink-900">{t("errors.legendTitle")}</h3>
            {(Object.keys(STAGE_META) as StageKey[]).map((s) => {
              const Icon = STAGE_META[s].icon;
              return (
                <div key={s} className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-9 h-9 rounded-lg grid place-items-center"
                    style={{ background: `${STAGE_META[s].color}1A`, color: STAGE_META[s].color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-ink-900">{s}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(STAGE_META[s].blurbKey as Parameters<typeof t>[0])}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common error patterns */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <h3 className="font-bold text-xl text-ink-900">{t("errors.patterns")}</h3>
            <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200">
              {STAGE_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    filter === s
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-ink-900 hover:bg-slate-100",
                  )}
                  style={
                    filter !== s && s !== "ALL"
                      ? { color: STAGE_META[s as StageKey].color }
                      : undefined
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item, i) => {
              const meta = STAGE_META[item.stage];
              const Icon = meta.icon;
              const isOpen = expanded === i;
              return (
                <motion.div
                  key={`${item.stage}-${item.titleKey}`}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="card overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg grid place-items-center"
                      style={{ background: `${meta.color}1A`, color: meta.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: `${meta.color}1A`, color: meta.color }}
                        >
                          {item.stage}
                        </span>
                        <span className="font-semibold text-sm text-ink-900">
                          {t(item.titleKey as Parameters<typeof t>[0])}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {t(item.detailKey as Parameters<typeof t>[0])}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform shrink-0",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                        {t("errors.examples")}
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {item.examples.map((ex, j) => (
                          <li key={j} className="font-mono leading-relaxed">
                            <span className="text-slate-400 mr-1.5">›</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Walkthrough table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">{t("errors.walkthrough.title")}</h3>
            <span className="text-[11px] text-slate-500">{t("errors.walkthrough.sub")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">{t("errors.walkthrough.col.case")}</th>
                  <th className="px-4 py-3 text-left">{t("errors.walkthrough.col.family")}</th>
                  <th className="px-4 py-3 text-left">{t("errors.walkthrough.col.domain")}</th>
                  <th className="px-4 py-3 text-right">e_base</th>
                  <th className="px-4 py-3 text-right">τ_acc</th>
                  <th className="px-4 py-3 text-right">t_base</th>
                  <th className="px-4 py-3 text-right">τ_time</th>
                  <th className="px-4 py-3 text-left">{t("errors.walkthrough.col.verdict")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {WALKTHROUGHS.map((w) => {
                  const meta = STAGE_META[w.verdict];
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold">{w.id}</td>
                      <td className="px-4 py-3">{w.family}</td>
                      <td className="px-4 py-3 text-slate-600">{w.domain}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {w.eBase}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {w.tauAcc}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {w.tBase}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {w.tauTime}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                          style={{ background: `${meta.color}1A`, color: meta.color }}
                        >
                          {w.verdict}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 text-[11px] text-slate-500 border-t border-slate-100 leading-relaxed">
            {t("errors.walkthrough.footnote")}
          </div>
        </div>
      </div>
    </section>
  );
}
