import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { useFigures, withBase, type Figure } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function FigureGallery() {
  const { data } = useFigures();
  const [active, setActive] = useState<Figure | null>(null);
  const figures = data ?? [];
  const { lang, t } = useLang();

  // Translate the section badge and caption when in zh; fall back to the original English from mock.json.
  const sectionLabel = (f: Figure) => {
    if (lang !== "zh") return f.section;
    const key = `fig.section.${f.section}` as Parameters<typeof t>[0];
    const translated = t(key);
    return translated === key ? f.section : translated;
  };
  const captionLabel = (f: Figure) => {
    if (lang !== "zh") return f.caption;
    const key = `fig.caption.${f.id}` as Parameters<typeof t>[0];
    const translated = t(key);
    return translated === key ? f.caption : translated;
  };

  return (
    <section className="py-20 bg-slate-50/60 border-y border-slate-200/70">
      <div className="container-page">
        <SectionHeader
          tag={t("figures.tag")}
          title={t("figures.title")}
          desc={t("figures.desc")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {figures.map((f, i) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActive(f)}
              className="card card-hover overflow-hidden text-left group"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                <img
                  src={withBase(f.thumb)}
                  alt={captionLabel(f)}
                  className="w-full h-full object-contain p-3 transition-transform group-hover:scale-[1.03]"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget.style as CSSStyleDeclaration).display = "none";
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className="pill bg-white/90 text-ink-700 backdrop-blur">
                    {sectionLabel(f)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-700 leading-snug line-clamp-3">{captionLabel(f)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-5xl w-full max-h-[88vh] overflow-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
                <span className="pill bg-brand-50 text-brand-700">{sectionLabel(active)}</span>
                <button
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-slate-50 grid place-items-center">
                <img src={withBase(active.src)} alt={captionLabel(active)} className="max-w-full max-h-[60vh]" />
              </div>
              <p className="p-6 text-sm text-slate-700 leading-relaxed">{captionLabel(active)}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
