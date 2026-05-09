import { motion } from "framer-motion";
import { useAuthors, withBase } from "@/lib/api";
import { useT } from "@/lib/i18n";

type LogoMeta = {
  file: string;
  fullName: string;
  /** Logo asset has an opaque white background. We strip it visually with mix-blend-mode. */
  whiteBg?: boolean;
  /** Multiplier on the displayed size — useful when the source image has heavy interior padding. */
  scale?: number;
};

const LOGO_MAP: Record<string, LogoMeta> = {
  USTC: { file: "ustc.svg", fullName: "University of Science and Technology of China" },
  BUPT: { file: "bupt.svg", fullName: "Beijing University of Posts and Telecommunications" },
  Tencent: { file: "tencent.svg", fullName: "Tencent" },
  SJTU: { file: "sjtu.svg", fullName: "Shanghai Jiao Tong University" },
  ZJU: { file: "zju.svg", fullName: "Zhejiang University" },
  Alibaba: { file: "alibaba.svg", fullName: "Alibaba Group" },
  NUS: { file: "nus.svg", fullName: "National University of Singapore" },
  THU: { file: "thu.svg", fullName: "Tsinghua University" },
  UTD: { file: "utd.svg", fullName: "The University of Texas at Dallas" },
  ASU: { file: "asu.svg", fullName: "Arizona State University" },
  Rice: { file: "rice.svg", fullName: "Rice University" },
  TUM: { file: "tum.svg", fullName: "Technical University of Munich" },
  Stanford: { file: "stanford.svg", fullName: "Stanford University" },
  CodeBuddy: { file: "codebuddy.png", fullName: "CodeBuddy", whiteBg: true, scale: 1.55 },
};

export default function Affiliations() {
  const { data } = useAuthors();
  const t = useT();
  if (!data) return null;

  return (
    <section className="py-12 border-b border-slate-200/70 bg-white">
      <div className="container-page">
        <div className="text-center mb-8">
          <span className="section-tag">{t("aff.tag")}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-10 max-w-6xl mx-auto">
          {data.affiliations.map((abbr, i) => {
            const meta = LOGO_MAP[abbr];
            const fullName = meta?.fullName ?? abbr;
            const hasLogo = Boolean(meta?.file);
            return (
              <motion.div
                key={abbr}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                title={fullName}
                className="flex flex-col items-center justify-end gap-3 w-40"
              >
                <div className="h-24 w-36 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 px-4 transition-shadow hover:shadow-sm overflow-hidden">
                  {hasLogo ? (
                    (() => {
                      const scale = meta?.scale ?? 1;
                      return (
                        <img
                          src={withBase(`logos/${meta!.file}`)}
                          alt={fullName}
                          className="object-contain"
                          style={{
                            maxHeight: `${64 * scale}px`,
                            maxWidth: `${120 * scale}px`,
                            ...(meta?.whiteBg ? { mixBlendMode: "multiply" } : {}),
                          }}
                        />
                      );
                    })()
                  ) : (
                    <span className="text-2xl font-bold text-ink-900">{abbr}</span>
                  )}
                </div>
                <div className="text-xs text-slate-600 font-medium tracking-wide">
                  {abbr}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
