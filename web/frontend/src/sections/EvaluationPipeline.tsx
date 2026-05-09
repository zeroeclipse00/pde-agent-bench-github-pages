import { motion } from "framer-motion";
import { Cog, Target, Timer, ArrowRight } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import TeX from "@/components/TeX";
import { useT } from "@/lib/i18n";

export default function EvaluationPipeline() {
  const t = useT();

  const gates = [
    {
      icon: Cog,
      name: t("eval.gate.exec.name"),
      desc: t("eval.gate.exec.desc"),
      color: "from-slate-500 to-slate-700",
    },
    {
      icon: Target,
      name: t("eval.gate.acc.name"),
      desc: t("eval.gate.acc.desc"),
      color: "from-brand-500 to-brand-700",
    },
    {
      icon: Timer,
      name: t("eval.gate.time.name"),
      desc: t("eval.gate.time.desc"),
      color: "from-accent-cyan to-accent-violet",
    },
  ];

  const metrics: { glyph: string; color: string; title: string; desc: React.ReactNode }[] = [
    {
      glyph: "L₂",
      color: "bg-blue-100 text-blue-700",
      title: t("eval.metric.l2"),
      desc: (
        <>
          <TeX
            math={String.raw`e(u)=\dfrac{\lVert u-u_{\mathrm{GT}}\rVert_{L^{2}}}{\lVert u_{\mathrm{GT}}\rVert_{L^{2}}}`}
            block
          />
          <span className="block mt-1 text-[11px] text-slate-500">
            {t("eval.metric.l2.note")}
          </span>
        </>
      ),
    },
    {
      glyph: "⏱",
      color: "bg-emerald-100 text-emerald-700",
      title: t("eval.metric.runtime"),
      desc: t("eval.metric.runtime.desc"),
    },
    {
      glyph: "%",
      color: "bg-amber-100 text-amber-700",
      title: t("eval.metric.passRate"),
      desc: t("eval.metric.passRate.desc"),
    },
    {
      glyph: "$",
      color: "bg-pink-100 text-pink-700",
      title: t("eval.metric.cost"),
      desc: t("eval.metric.cost.desc"),
    },
  ];

  return (
    <section id="metrics" className="py-20">
      <div className="container-page">
        <SectionHeader tag={t("eval.tag")} title={t("eval.title")} desc={t("eval.desc")} />

        <div className="flex flex-col md:flex-row items-stretch gap-3 max-w-5xl mx-auto">
          {gates.map((g, i) => (
            <div key={g.name} className="flex items-stretch flex-1 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 card p-5 text-center"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${g.color} grid place-items-center text-white mx-auto`}>
                  <g.icon className="w-7 h-7" />
                </div>
                <div className="mt-3 font-bold text-ink-900">{g.name}</div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{g.desc}</p>
              </motion.div>
              {i < gates.length - 1 && (
                <div className="hidden md:grid place-items-center text-slate-300">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.title} className="card p-5">
              <div className={`w-11 h-11 rounded-lg ${m.color} grid place-items-center font-bold`}>{m.glyph}</div>
              <div className="mt-3 font-semibold text-ink-900 text-sm">{m.title}</div>
              <div className="mt-1 text-xs text-slate-600 leading-relaxed">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
