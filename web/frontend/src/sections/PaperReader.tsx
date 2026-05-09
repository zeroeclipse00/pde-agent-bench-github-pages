import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Github,
  Database,
  Mail,
  Menu,
  X,
  Languages,
} from "lucide-react";
import { useCitation, useAuthors, useFigures, withBase } from "@/lib/api";
import TeX from "@/components/TeX";
import { useLang } from "@/lib/i18n";

// Stand-in arXiv id and DOI — to be replaced with the real ones once the paper is posted.
const MOCK_ARXIV_ID = "arXiv:2606.XXXXX";
const MOCK_DOI = "10.48550/arXiv.2606.XXXXX";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

function Eq({ children }: { children: string }) {
  return <TeX math={children} block className="my-4 text-center" />;
}

export default function PaperReader() {
  const { data: citation } = useCitation();
  const { data: authors } = useAuthors();
  const { data: figures } = useFigures();
  const { lang, toggle, t } = useLang();
  const [tocOpen, setTocOpen] = useState(false);

  const figByKey = useMemo(() => {
    const m = new Map<string, { src: string; caption: string }>();
    (figures ?? []).forEach((f) => m.set(f.id, { src: f.src, caption: f.caption }));
    return m;
  }, [figures]);

  const abstract = lang === "zh" ? t("abstract.zhOverride") : citation?.abstract ?? "";

  const sections: Section[] = useMemo(
    () => [
      {
        id: "abstract",
        title: t("paper.section.abstract"),
        body: (
          <div className="space-y-4 text-slate-800">
            {abstract.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ),
      },
      {
        id: "introduction",
        title: t("paper.section.intro"),
        body: (
          <div className="space-y-4 text-slate-800">
            <p>{t("paper.intro.p1")}</p>
            <p>{t("paper.intro.p2")}</p>
            <FigureBlock
              src={figByKey.get("intro")?.src ?? "figures/intro.png"}
              caption={
                figByKey.get("intro")?.caption ??
                "Overview of PDEAgent-Bench: motivation, limitations of general code benchmarks, benchmark data structure, and the staged evaluation protocol."
              }
              label={lang === "zh" ? "图 1" : "Figure 1"}
            />
          </div>
        ),
      },
      {
        id: "task",
        title: t("paper.section.task"),
        body: (
          <div className="space-y-4 text-slate-800">
            <p>{t("paper.task.p1")}</p>
            <Eq>{String.raw`e(u) = \frac{\lVert u - u_{\mathrm{GT}} \rVert_{L^{2}}}{\lVert u_{\mathrm{GT}} \rVert_{L^{2}}}`}</Eq>
            <p>{t("paper.task.p2")}</p>
            <p>
              {t("paper.task.p3.pre")}
              <TeX math="e_{\mathrm{base}}" />
              {t("paper.task.p3.mid")}
              <TeX math="t_{\mathrm{base}}" />
              {t("paper.task.p3.tail")}
            </p>
            <Eq>{String.raw`\tau_{\mathrm{acc}} = \max\bigl(10\,e_{\mathrm{base}},\; 10^{-6}\bigr),`}</Eq>
            <p>
              {t("paper.task.p4.pre")}
              <TeX math="\tau_{\mathrm{time}} = 3\,t_{\mathrm{base}}" />
              {t("paper.task.p4.tail")}
            </p>
          </div>
        ),
      },
      {
        id: "method",
        title: t("paper.section.method"),
        body: (
          <div className="space-y-4 text-slate-800">
            <p>{t("paper.method.p1")}</p>
            <FigureBlock
              src={figByKey.get("method")?.src ?? "figures/method.png"}
              caption={
                figByKey.get("method")?.caption ??
                "PDEAgent-Bench evaluation pipeline from PDE case specification to sandboxed execution and staged assessment (Execution → Accuracy → Time)."
              }
              label={lang === "zh" ? "图 2" : "Figure 2"}
            />
          </div>
        ),
      },
      {
        id: "results",
        title: t("paper.section.results"),
        body: (
          <div className="space-y-4 text-slate-800">
            <p>{t("paper.results.p1")}</p>
            <p>{t("paper.results.p2")}</p>
            <FigureBlock
              src={figByKey.get("backend_eqtype_firedrake")?.src ?? "figures/backend_eqtype_firedrake.png"}
              caption={
                figByKey.get("backend_eqtype_firedrake")?.caption ??
                "Single-shot pass rates by PDE family on the Firedrake track."
              }
              label={lang === "zh" ? "图 3" : "Figure 3"}
            />
          </div>
        ),
      },
      {
        id: "failure",
        title: t("paper.section.failure"),
        body: (
          <div className="space-y-4 text-slate-800">
            <p>{t("paper.failure.p1")}</p>
            <p>{t("paper.failure.p2")}</p>
            <FigureBlock
              src={figByKey.get("failure_stages_dolfinx")?.src ?? "figures/failure_stages_dolfinx.png"}
              caption={
                figByKey.get("failure_stages_dolfinx")?.caption ??
                "Failure-stage breakdown on DOLFINx: each bar splits into Pass, F-Exec, F-Acc, and F-Time."
              }
              label={lang === "zh" ? "图 4" : "Figure 4"}
            />
          </div>
        ),
      },
      {
        id: "iterative",
        title: t("paper.section.iterative"),
        body: (
          <div className="space-y-4 text-slate-800">
            <p>{t("paper.iterative.p1")}</p>
            <FigureBlock
              src={figByKey.get("iterative_dolfinx")?.src ?? "figures/iterative_dolfinx.png"}
              caption={
                figByKey.get("iterative_dolfinx")?.caption ??
                "GPT-5.4 pass rates on DOLFINx under single-shot vs. three-attempt execution-feedback settings."
              }
              label={lang === "zh" ? "图 5" : "Figure 5"}
            />
          </div>
        ),
      },
      {
        id: "conclusion",
        title: t("paper.section.conclusion"),
        body: (
          <div className="space-y-4 text-slate-800">
            <p>{t("paper.conclusion.p1")}</p>
          </div>
        ),
      },
      {
        id: "bibtex",
        title: t("paper.section.bibtex"),
        body: (
          <div className="space-y-3">
            <pre className="font-mono text-xs bg-slate-950 text-slate-100 rounded-lg p-4 overflow-x-auto whitespace-pre">
              {citation?.bibtex ?? "loading…"}
            </pre>
          </div>
        ),
      },
    ],
    [citation, figByKey, abstract, lang, t],
  );

  // simple in-page scroll-spy for TOC highlight
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  useEffect(() => {
    const handler = () => {
      let current = sections[0]?.id ?? "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 140) current = s.id;
      }
      setActive(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [sections]);

  const correspondingEmail = "wanghong1700@mail.ustc.edu.cn";
  const langLabel = lang === "en" ? "中文" : "EN";
  const langTitle = lang === "en" ? "切换到中文" : "Switch to English";

  return (
    <div className="min-h-screen bg-slate-50 text-ink-900">
      {/* Top bar (arXiv-ish) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-ink-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("paper.back")}
          </a>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{MOCK_ARXIV_ID}</span>
            <span className="text-slate-300">·</span>
            <span>cs.LG</span>
            <span className="text-slate-300">·</span>
            <span>{citation?.venue ?? "Under Review"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              title={langTitle}
              aria-label={langTitle}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
            >
              <Languages className="w-3.5 h-3.5" />
              {langLabel}
            </button>
            <a
              href={withBase("paper.pdf")}
              className="btn btn-secondary !py-1.5 !px-3 text-xs"
              onClick={(e) => {
                e.preventDefault();
                alert(t("paper.pdfMockAlert"));
              }}
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </a>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setTocOpen((o) => !o)}
              aria-label="Toggle contents"
            >
              {tocOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
        {/* TOC sidebar */}
        <aside
          className={`${
            tocOpen ? "block" : "hidden"
          } md:block md:sticky md:top-20 md:self-start`}
        >
          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-3">
              {t("paper.contents")}
            </div>
            <nav className="flex flex-col gap-0.5">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setTocOpen(false)}
                  className={`block px-2 py-1.5 rounded text-sm leading-tight transition-colors ${
                    active === s.id
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {s.title}
                </a>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2 text-xs">
              <a
                href="https://github.com/YusanX/pde-agent-bench"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-600"
              >
                <Github className="w-3.5 h-3.5" /> {t("paper.code")}
              </a>
              <a
                href="https://huggingface.co/datasets/eclipse00/PDEAgent-Bench"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-600"
              >
                <Database className="w-3.5 h-3.5" /> {t("paper.dataset")}
              </a>
              <a
                href={`mailto:${correspondingEmail}`}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-600"
              >
                <Mail className="w-3.5 h-3.5" /> {t("paper.contact")}
              </a>
            </div>
          </div>
        </aside>

        {/* Paper body */}
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 sm:px-10 pt-10 pb-6 border-b border-slate-200">
            <div className="text-xs font-mono text-slate-500 mb-3">
              {MOCK_ARXIV_ID} · doi:{MOCK_DOI}{" "}
              <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-sans font-semibold">
                {t("paper.preview")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {citation?.title ?? "PDEAgent-Bench"}
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {(authors?.authors ?? [])
                .map((a) => `${a.name}${a.isCorresponding ? "✦" : ""}`)
                .join(", ")}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {(authors?.affiliations ?? []).join(" · ")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="pill bg-brand-50 text-brand-700">
                {citation?.venue ?? "Under Review"}
              </span>
              <span className="pill bg-slate-100 text-slate-700">
                {citation?.year ?? 2026}
              </span>
              <a
                href={`mailto:${correspondingEmail}`}
                className="pill bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <Mail className="w-3 h-3" /> ✦ {correspondingEmail}
              </a>
              <span className="pill bg-amber-50 text-amber-700">
                <ExternalLink className="w-3 h-3" /> {t("paper.mockedNote")}
              </span>
            </div>
          </div>

          <div className="px-6 sm:px-10 py-8 prose-paper">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 mb-10">
                <h2 className="text-xl font-bold tracking-tight text-ink-900 mb-3">
                  {s.title}
                </h2>
                <div className="text-[15px] leading-relaxed">{s.body}</div>
              </section>
            ))}
          </div>

          <div className="px-6 sm:px-10 py-5 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-500 rounded-b-2xl">
            {t("paper.previewNote")}
          </div>
        </article>
      </div>
    </div>
  );
}

function FigureBlock({
  src,
  caption,
  label,
}: {
  src: string;
  caption: string;
  label: string;
}) {
  return (
    <figure className="my-6">
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 grid place-items-center">
        <img
          src={withBase(src)}
          alt={caption}
          className="max-w-full max-h-[420px] object-contain"
          onError={(e) => {
            (e.currentTarget.style as CSSStyleDeclaration).display = "none";
          }}
        />
      </div>
      <figcaption className="mt-2 text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-ink-900">{label}.</span> {caption}
      </figcaption>
    </figure>
  );
}
