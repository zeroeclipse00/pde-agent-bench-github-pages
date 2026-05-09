import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { useLeaderboard, type LeaderboardRow } from "@/lib/api";
import { cn, fmtPct, rankColor, BACKEND_LABELS } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type SortKey = "passRate" | "costPer1K";
const DEFAULT_DIR: Record<SortKey, "asc" | "desc"> = {
  passRate: "desc",
  costPer1K: "asc",
};

export default function Leaderboard() {
  const [backend, setBackend] = useState<string>("dolfinx");
  const [sort, setSort] = useState<SortKey>("passRate");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const { data, isLoading } = useLeaderboard(backend);
  const t = useT();

  const rows = useMemo(() => {
    const r = (data ?? []).slice();
    r.sort((a, b) => {
      const av = (a[sort] ?? 0) as number;
      const bv = (b[sort] ?? 0) as number;
      return dir === "desc" ? bv - av : av - bv;
    });
    return r;
  }, [data, sort, dir]);

  const handleSort = (key: SortKey) => {
    if (key === sort) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir(DEFAULT_DIR[key]);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort !== k) return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    return dir === "desc" ? (
      <ChevronDown className="w-3 h-3 text-brand-600" />
    ) : (
      <ChevronUp className="w-3 h-3 text-brand-600" />
    );
  };

  return (
    <section id="leaderboard" className="py-20">
      <div className="container-page">
        <SectionHeader
          tag={t("lb.tagSection")}
          title={t("lb.titleSection")}
          desc={t("lb.descSection")}
        />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-xl bg-slate-100">
            {(["dolfinx", "firedrake", "dealii"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBackend(b)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  backend === b
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-600 hover:text-ink-900",
                )}
              >
                {BACKEND_LABELS[b]}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500 italic">
            {t("lb.note")}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 w-14">{t("lb.col.hash")}</th>
                  <th className="text-left px-4 py-3">{t("lb.col.model")}</th>
                  <th className="text-left px-4 py-3">{t("lb.col.type")}</th>
                  <th className="text-right px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("passRate")}>
                    <div className="inline-flex items-center gap-1 justify-end">
                      {t("lb.col.passRate")} <SortIcon k="passRate" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("costPer1K")}>
                    <div className="inline-flex items-center gap-1 justify-end">
                      {t("lb.col.apiCost")} <SortIcon k="costPer1K" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t("lb.loading")}</td>
                  </tr>
                )}
                {!isLoading &&
                  rows.map((r, i) => (
                    <Row row={r} rank={i + 1} key={`${r.id}-${r.backend}`} />
                  ))}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">{t("lb.empty")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ row, rank }: { row: LeaderboardRow; rank: number }) {
  const t = useT();
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3 font-bold text-slate-400 tabular-nums">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-900">{row.model}</span>
          {row.agent && (
            <span className="pill bg-brand-50 text-brand-700">{t("lb.tag.agent")}</span>
          )}
        </div>
        <div className="text-xs text-slate-500">{row.provider}</div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-700">
          {row.agent ? t("lb.type.agent") : t("lb.type.llm")}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-2 tabular-nums font-semibold">
          <span className="w-2 h-2 rounded-full" style={{ background: rankColor(row.passRate) }} />
          {fmtPct(row.passRate)}
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
        {row.costPer1K == null ? "—" : `$${row.costPer1K.toFixed(2)}`}
      </td>
    </tr>
  );
}
