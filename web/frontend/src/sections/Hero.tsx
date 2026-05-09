import { motion } from "framer-motion";
import { ArrowRight, Github, BookOpen, Database, Sparkles } from "lucide-react";
import { useStats } from "@/lib/api";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useLang } from "@/lib/i18n";

export default function Hero() {
  const { data: stats } = useStats();
  const { lang, t } = useLang();

  const counters = [
    { value: stats?.totalCases ?? 645, label: t("hero.counter.cases") },
    { value: stats?.pdeTypes ?? 11, label: t("hero.counter.pdes") },
    { value: stats?.backends ?? 3, label: t("hero.counter.tracks") },
    { value: stats?.modelsEvaluated ?? 8, label: t("hero.counter.systems") },
  ];

  // Render the bold inline span ("multi-metric, multi-library" / "多指标、多库") inside the description
  // by splitting on the bold marker text in each language.
  const desc = t("hero.desc");
  const boldA = t("hero.descBoldA");
  const parts = desc.split(boldA);
  const beforeBold = parts[0] ?? desc;
  const afterBold = parts.length > 1 ? parts.slice(1).join(boldA) : "";
  const showBold = parts.length > 1;

  return (
    <section id="home" className="relative hero-bg text-white overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 hero-grid pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-cyan/20 rounded-full blur-3xl" />

      <div className="relative container-page">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <span className="pill bg-white/10 text-white border border-white/15 backdrop-blur">
            <Sparkles className="w-3 h-3" />
            {t("hero.badge")}
          </span>

          <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            <span className="gradient-text">PDEAgent</span>
            <span className="text-white">-Bench</span>
          </h1>

          <p
            className={`mt-6 ${
              lang === "zh" ? "text-base sm:text-lg" : "text-lg sm:text-xl"
            } text-white/80 max-w-3xl mx-auto leading-relaxed`}
          >
            {showBold ? (
              <>
                {beforeBold}
                <strong className="text-white">{boldA}</strong>
                {afterBold}
              </>
            ) : (
              desc
            )}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href="#leaderboard" className="btn btn-primary">
              {t("hero.btn.viewLeaderboard")} <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#/paper" className="btn btn-ghost">
              <BookOpen className="w-4 h-4" /> {t("hero.btn.readPaper")}
            </a>
            <a
              href="https://github.com/YusanX/pde-agent-bench"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <Github className="w-4 h-4" /> {t("hero.btn.github")}
            </a>
            <a
              href="https://huggingface.co/datasets/eclipse00/PDEAgent-Bench"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <Database className="w-4 h-4" /> {t("hero.btn.dataset")}
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {counters.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-left"
              >
                <div className="text-4xl font-extrabold tracking-tight text-white">
                  <AnimatedCounter value={c.value} />
                </div>
                <div className="mt-1 text-sm text-white/60 font-medium">{c.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
