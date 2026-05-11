import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clipboard,
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

const MOCK_ARXIV_ID = "arXiv:2606.XXXXX";
const MOCK_DOI = "10.48550/arXiv.2606.XXXXX";

type Section = {
  id: string;
  title: string;
  level?: 1 | 2;
  body: React.ReactNode;
};

// ─── Inline helpers ───────────────────────────────────────────────────────────
function Eq({ children }: { children: string }) {
  return <TeX math={children} block className="my-3 overflow-x-auto" />;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 leading-relaxed">{children}</p>;
}
function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink-900">{children}</strong>;
}
function Em({ children }: { children: React.ReactNode }) {
  return <em className="italic">{children}</em>;
}
function TT({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.82em] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
      {children}
    </code>
  );
}
function Cite({ children }: { children: React.ReactNode }) {
  return <span className="text-slate-500 text-sm">[{children}]</span>;
}
function Para({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="mb-3 leading-relaxed">
      <B>{label}.</B> {children}
    </p>
  );
}
function SubH({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[15px] font-bold text-ink-900 mt-5 mb-2">{children}</h3>;
}
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="font-mono text-[0.72rem] bg-slate-950 text-green-200 rounded-lg p-4 overflow-x-auto whitespace-pre my-3 leading-relaxed">
      {children}
    </pre>
  );
}
function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 mb-3">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal pl-5 space-y-1 mb-3">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ol>
  );
}
function FigRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 my-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))` }}>{children}</div>;
}
function SubFig({ src, sub, caption }: { src?: string; sub: string; caption: string }) {
  if (!src) {
    return (
      <figure>
        <div className="rounded bg-slate-100 border border-dashed border-slate-300 p-6 grid place-items-center text-slate-400 text-xs text-center">
          [figure unavailable]
        </div>
        <figcaption className="mt-1 text-xs text-center text-slate-600">({sub}) {caption}</figcaption>
      </figure>
    );
  }
  return (
    <figure>
      <div className="rounded bg-slate-50 border border-slate-200 p-2 grid place-items-center">
        <img src={withBase(src)} alt={caption} className="max-w-full max-h-60 object-contain"
          onError={(e) => { (e.currentTarget.style as CSSStyleDeclaration).display = "none"; }} />
      </div>
      <figcaption className="mt-1 text-xs text-center text-slate-600">({sub}) {caption}</figcaption>
    </figure>
  );
}
// Simple small table
function Tbl({ head, rows, caption }: {
  head: string[];
  rows: (string | React.ReactNode)[][];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr className="bg-blue-50 border-t border-b border-slate-300">
            {head.map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-semibold text-slate-700 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className={r % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              {row.map((cell, c) => <td key={c} className="px-2 py-1.5 border-b border-slate-100 text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <p className="mt-1 text-xs text-slate-500 italic">{caption}</p>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PaperReader() {
  const { data: citation } = useCitation();
  const { data: authors } = useAuthors();
  const { data: figures } = useFigures();
  const { lang, toggle, t } = useLang();
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const figByKey = useMemo(() => {
    const m = new Map<string, { src: string; caption: string }>();
    (figures ?? []).forEach((f) => m.set(f.id, { src: f.src, caption: f.caption }));
    return m;
  }, [figures]);

  const abstract = lang === "zh" ? t("abstract.zhOverride") : citation?.abstract ?? "";

  const handleCopy = () => {
    const bibtex = citation?.bibtex ?? "";
    navigator.clipboard.writeText(bibtex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sections: Section[] = useMemo(
    () => [
      // ── Abstract ─────────────────────────────────────────────────────────────
      {
        id: "abstract",
        title: "Abstract",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            {abstract.split("\n\n").map((p, i) => <P key={i}>{p}</P>)}
          </div>
        ),
      },

      // ── 1. Introduction ───────────────────────────────────────────────────────
      {
        id: "introduction",
        title: "1  Introduction",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>Numerical solvers for partial differential equations (PDEs) are central to scientific computing
              and industrial simulation, with applications in fluid dynamics, structural mechanics, heat transfer,
              electromagnetics, and materials modeling. Constructing reliable PDE solvers, however, is not merely a
              coding task: it requires translating mathematical models and boundary conditions into stable
              discretizations, weak forms or time-stepping schemes, and properly configured linear or nonlinear solvers.
              Mistakes in these choices can produce programs that run but impose incorrect physical constraints, fail to
              converge, yield inaccurate solutions, or exceed practical resource budgets.</P>

            <P>Benchmarks for code generation agents already span a wide range of settings, from function-level
              programming problems to repository-level task solving. For example,
              HumanEval <Cite>Chen et al., 2021</Cite>, MBPP <Cite>Austin et al., 2021</Cite>,
              APPS <Cite>Hendrycks et al., 2021</Cite>, and CodeContests <Cite>Li et al., 2022</Cite> primarily evaluate
              code generation on programming tasks, while SWE-bench <Cite>Jimenez et al., 2024</Cite> and
              Terminal-Bench <Cite>Merrill et al., 2026</Cite> further assess repository modification and task execution
              in interactive terminal environments. These benchmarks typically rely on unit tests, task-completion
              signals, or patch validation, making them well suited for measuring discrete functional correctness.
              However, PDE solver synthesis is not evaluated by whether isolated tests pass, but by whether the generated
              program actually solves a specified PDE, which requires assessing numerical solution quality and
              computational cost.</P>

            <P>A benchmark for PDE-to-solver code generation therefore requires a stricter numerical evaluation
              protocol. Each instance must provide not only agent-facing PDE specifications, but also reliable reference
              solutions, prescribed evaluation grids, and consistent procedures for measuring error and runtime, enabling
              reproducible comparison across models and implementations. The evaluation must also distinguish execution
              failures, excessive numerical error, and insufficient computational efficiency, since a program may run
              successfully without correctly solving the target PDE. To reflect realistic scientific-computing practice,
              the benchmark should further cover solver implementations across professional FEM software stacks such as
              DOLFINx <Cite>Baratta et al., 2023</Cite>, Firedrake <Cite>Rathgeber et al., 2016</Cite>, and
              deal.II <Cite>Bangerth et al., 2007</Cite>.</P>

            <FigureBlock
              src={figByKey.get("intro")?.src ?? "figures/intro.png"}
              caption={figByKey.get("intro")?.caption ?? "Overview of PDEAgent-Bench: motivation, limitations of general code benchmarks, benchmark data structure, and evaluation protocol."}
              label="Figure 1"
            />

            <P>To address this gap, we introduce PDEAgent-Bench, the first multi-metric, multi-library benchmark
              for PDE-to-solver code generation by LLMs and code agents. PDEAgent-Bench contains 645 instances spanning
              6 mathematical categories and 11 representative PDE families, with library-specific tracks for DOLFINx,
              Firedrake, and deal.II. Each instance includes an agent-facing PDE specification, a prescribed evaluation
              grid, a reference solution, and case-specific accuracy and runtime targets to support reproducible
              numerical verification. By evaluating generated solvers across multiple FEM software stacks,
              PDEAgent-Bench assesses model capabilities across different scientific-computing libraries and
              implementation paradigms, rather than within a single API environment.</P>

            <P>PDEAgent-Bench adopts a staged evaluation framework centered on case-level pass rate. Generated solvers
              are executed in a controlled environment and must sequentially pass executability, numerical accuracy, and
              computational efficiency checks. Beyond the final pass rate, we report stage-level and auxiliary metrics to
              diagnose failure sources and analyze solution quality. Experiments with state-of-the-art LLMs and code
              agents show that current systems can generate runnable code for a subset of PDE instances, but their
              performance drops substantially once numerical and resource constraints are enforced, with clear
              library-dependent failure modes.</P>

            <Para label="Contributions">Our contributions are summarized as follows:</Para>
            <UL items={[
              <>We introduce PDEAgent-Bench, to the best of our knowledge, the first benchmark for evaluating whether LLMs and code agents can synthesize executable numerical solvers from PDE specifications, extending code-agent evaluation beyond discrete functional correctness to include numerical accuracy and computational efficiency.</>,
              <>We construct a collection of 645 PDE instances spanning 6 mathematical categories and 11 representative PDE families, with specifications, evaluation grids, reference solutions, and case-specific targets for reproducible verification.</>,
              <>We provide library-specific tracks for DOLFINx, Firedrake, and deal.II, covering Python and C++ FEM ecosystems and evaluating solver generation across scientific-computing software stacks.</>,
              <>We design a staged evaluation protocol centered on case-level pass rate, with stage-level and auxiliary metrics for diagnosing executability, numerical accuracy, computational efficiency, and solution quality.</>,
            ]} />

            <FigureBlock
              src={figByKey.get("method")?.src ?? "figures/method.png"}
              caption={figByKey.get("method")?.caption ?? "PDEAgent-Bench evaluation pipeline from PDE case specification to sandboxed execution and staged assessment (Execution → Accuracy → Time)."}
              label="Figure 2"
            />
          </div>
        ),
      },

      // ── 2. Benchmark Overview ─────────────────────────────────────────────────
      {
        id: "benchmark-overview",
        title: "2  Benchmark Overview",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <SubH>2.1  Task Scope and Evaluation Setting</SubH>
            <P>PDEAgent-Bench evaluates PDE-to-solver code generation: given a PDE or physics specification
              (input), a system must generate an executable numerical solver (output) that reaches target accuracy within
              practical resource budgets (success criteria). Our goal is not to propose a new solver-generation method,
              but to evaluate the capabilities, limitations, and failure modes of existing LLMs and code agents on this task.</P>
            <P>Each PDE problem defines a single evaluation instance. An instance abstracts the task faced by the
              code agent, separating agent-visible information from hidden evaluator-only details. The agent interacts
              with a problem description and structured case specification, while the evaluator retains reference
              solutions and other metadata to measure performance. Evaluation proceeds via a common interface with staged
              checks for executability, numerical accuracy, and runtime efficiency.</P>
            <P>PDEAgent-Bench contains 645 instances across 6 mathematical categories and 11 representative PDE
              families. It provides three FEM-library tracks: DOLFINx as the full-coverage primary track, and Firedrake
              and deal.II as cross-library tracks. These tracks evaluate whether code agents can transfer
              solver-synthesis capability across different FEM ecosystems, including both Python- and C++-based toolchains.</P>

            <SubH>2.2  Task Specification and Evaluation Interface</SubH>
            <P>Each instance contains a structured problem specification and a corresponding natural-language
              description. The structured specification defines the PDE family, computational domain, coefficient
              functions, source terms, boundary conditions, initial conditions, and temporal parameters when applicable.
              The natural-language description is generated from this specification and summarizes the PDE type, physical
              context, and computational requirements, including the evaluation grid and optional numerical hints.
              Together, they form the agent-facing task input, ensuring that different systems generate solvers from the
              same PDE information.</P>
            <P>The submitted solver receives the case specification through a unified interface and returns a
              numerical solution on the evaluation grid. Agents may choose their own internal mesh, discretization
              method, time-stepping scheme, and solver settings. Evaluation only requires that the returned solution have
              the correct output format and satisfy the subsequent accuracy and runtime checks. This interface allows
              diverse numerical implementation strategies while ensuring that all submissions are compared through a
              common output format.</P>
            <P>Evaluation is performed in an isolated environment with fixed resource limits. The evaluator invokes
              the generated solver, records elapsed runtime, and validates the format and dimensions of the returned
              solution. Reference solutions, calibration baselines, and hidden numerical settings used to generate them
              are not exposed to the agent. This information separation ensures that all submissions are evaluated under
              the same conditions.</P>

            <SubH>2.3  Evaluation Framework and Metrics</SubH>
            <P>PDEAgent-Bench distinguishes the reference solution used for scoring from the calibration baseline
              used for threshold setting. The reference solution <TeX math="u_{\mathrm{GT}}" /> is used to compute the
              error of a submitted solution. The calibration baseline <TeX math="u_{\mathrm{base}}" /> is a separately
              generated numerical solution used only to set case-specific accuracy and runtime thresholds, and is not
              included in model comparisons.</P>
            <P>For any submitted solution <TeX math="u" />, we compute the relative <TeX math="L^2" /> error on the
              evaluation grid and use it as the primary accuracy metric:</P>
            <Eq>{String.raw`e(u) = \frac{\|u - u_{\mathrm{GT}}\|_2}{\|u_{\mathrm{GT}}\|_2}`}</Eq>
            <P>Let <TeX math="e_{\mathrm{base}} = e(u_{\mathrm{base}})" /> denote the calibration error and let{" "}
              <TeX math="t_{\mathrm{base}}" /> denote the calibration-baseline runtime. Because numerical difficulty and
              computational cost vary substantially across PDE instances, PDEAgent-Bench adopts calibration-based,
              case-specific thresholds:</P>
            <Eq>{String.raw`\tau_{\mathrm{acc}} = \max\!\left(\alpha_{\mathrm{acc}}\,e_{\mathrm{base}},\;\tau_{\min}\right), \qquad \tau_{\mathrm{time}} = \alpha_{\mathrm{time}}\,t_{\mathrm{base}}`}</Eq>
            <P>The accuracy threshold applies a fixed tolerance multiplier to the calibration error, while a
              minimum floor avoids overly strict thresholds when the calibration error is near zero. By default, we set{" "}
              <TeX math="\alpha_{\mathrm{acc}} = 10" />, <TeX math="\alpha_{\mathrm{time}} = 3" />, and{" "}
              <TeX math="\tau_{\min} = 10^{-6}" />.</P>
            <P>Each library-instance is evaluated in stages: a submission must first execute successfully and return
              a result with valid format and dimensions; it must then satisfy the accuracy condition{" "}
              <TeX math="e(u_{\mathrm{agent}}) \leq \tau_{\mathrm{acc}}" /> and the runtime condition{" "}
              <TeX math="t_{\mathrm{agent}} \leq \tau_{\mathrm{time}}" />. We summarize model performance using the
              case-level pass rate:</P>
            <Eq>{String.raw`\mathrm{pass\_rate}(m) = \frac{1}{|\mathcal{D}|} \sum_{i \in \mathcal{D}} \mathrm{case\_pass}_{i}(m)`}</Eq>
            <P>In addition to the final pass rate, PDEAgent-Bench reports execution pass rate, accuracy pass rate,
              and runtime pass rate to identify failures at different evaluation stages. Auxiliary diagnostic metrics for
              analyzing solution quality, discretization choices, solver behavior, and efficiency patterns are also
              recorded.</P>
          </div>
        ),
      },

      // ── 3. Dataset Construction ───────────────────────────────────────────────
      {
        id: "dataset",
        title: "3  Dataset Construction",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>PDEAgent-Bench consists of 645 PDE instances covering diverse PDE families, mathematical problem
              types, and spatial geometries. The dataset is built through a controlled generation-and-validation
              pipeline: we first define family-level design axes to cover different numerical regimes, and then use
              structured templates with LLM-assisted generation to instantiate candidate <TT>case_spec</TT> records.
              Each candidate is paired with a reference solution, and a baseline solver is used to calibrate
              case-specific accuracy and runtime thresholds. Only candidates that pass schema checks and trial execution
              are included in the final dataset.</P>

            <SubH>3.1  PDE Families and Domain Coverage</SubH>
            <P>Each instance is labeled by its PDE family and a coarse-grained mathematical type. The benchmark
              spans 11 representative PDE families covering common numerical-simulation settings—including elliptic,
              parabolic, hyperbolic, incompressible-flow, reaction-diffusion, and elasticity problems—and captures six
              mathematical categories reflecting dominant operator structures. Instances are designed to challenge solvers
              with numerical difficulties such as strong coefficient contrast, nonlinear terms, coupled variables, and
              stability-sensitive discretizations.</P>
            <P>The dataset also systematically covers diverse spatial geometries. It contains 14 domain templates,
              ranging from simple domains such as the unit square and unit cube to more complex geometries with
              nonconvex structures, curved boundaries, multiply connected regions, re-entrant corners, periodic
              boundaries, and irregular boundary tagging. For each domain, the output grid is defined on its bounding
              box; grid points outside the physical domain are marked as NaN and excluded from error computation.</P>

            <Tbl
              head={["PDE Family", "Math Type", "Instances"]}
              rows={[
                ["Poisson", "elliptic", "91"],
                ["Helmholtz", "elliptic", "62"],
                ["Biharmonic", "elliptic", "57"],
                ["Linear Elasticity", "elliptic", "63"],
                ["Heat", "parabolic", "50"],
                ["Convection–Diffusion", "elliptic / mixed / parabolic", "84"],
                ["Reaction–Diffusion", "reaction diffusion", "64"],
                ["Stokes", "elliptic / incompressible flow", "61"],
                ["Navier–Stokes", "incompressible flow", "28"],
                ["Burgers", "parabolic", "43"],
                ["Wave", "hyperbolic", "42"],
                [<B key="t">Total</B>, "", <B key="n">645</B>],
              ]}
              caption="Table: Dataset distribution across PDE families."
            />

            <SubH>3.2  Instance Format</SubH>
            <P>Each instance is stored as a JSONL record. The central agent-facing field is <TT>case_spec</TT>,
              which specifies the PDE, computational domain, boundary and initial conditions, coefficient functions,
              temporal parameters, and evaluation grid. The record also contains lightweight <TT>tags</TT> that describe
              structural properties and expected numerical difficulty.</P>
            <P>Reference solutions, calibration baselines and other construction-time information are stored as
              evaluator-side metadata and are not included in the agent-facing task input. During evaluation, only{" "}
              <TT>case_spec</TT> is included in the agent prompt and passed to the generated solver through the unified
              interface. For instances whose reference solutions are constructed from analytic expressions, those
              expressions are used internally to generate consistent source terms and boundary conditions; the
              agent-facing specification does not expose the target solution field.</P>

            <SubH>3.3  Extensibility and Validation</SubH>
            <P>PDEAgent-Bench is designed to support controlled extensions under the same evaluation protocol. To
              add a new instance, an author provides a structured PDE specification together with the corresponding
              domain, coefficients, boundary and initial conditions, temporal parameters, and output grid. The
              construction pipeline then builds or verifies the reference solution, runs the calibration baseline to
              obtain the calibration error and runtime, derives the case-specific thresholds, and exports the
              agent-facing specification.</P>
            <P>Before inclusion, each candidate instance must pass automated validation. Static checks verify schema
              completeness, identifier uniqueness, expression parsability, consistency between labels and specifications,
              and validity of reference and calibration settings. Trial execution verifies that reference generation and
              calibration runs are stable, and that output-format checking and error computation behave correctly.</P>
          </div>
        ),
      },

      // ── 4. Experiments ────────────────────────────────────────────────────────
      {
        id: "experiments",
        title: "4  Experiments",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <Para label="Experiment setup">All experiments use the staged evaluation framework defined in §2.3.
              Generated solvers are executed on a single-node CPU server (AMD EPYC 7K62, 32 visible cores, 62 GB RAM)
              running Ubuntu 22.04, with a per-case timeout of 300 s. The software stack uses Python 3.11, GCC 11.4,
              MPICH, PETSc 3.24, DOLFINx 0.10.0, Firedrake (2025), and deal.II 9.7.</Para>
            <Para label="Baseline models">We evaluate two classes of systems: base LLMs that directly generate
              complete solvers, and Code/PDE agents that use code-generation, editing, or execution workflows. The base
              LLMs include GPT-5.4, Opus 4.7, Gemini 3.1 Pro, Qwen3.6-Plus, and DeepSeek V3.2; the agent systems
              include CodePDE <Cite>Li et al., 2025</Cite>, OpenHands <Cite>Wang et al., 2024</Cite>, and
              Mini-SWE <Cite>Yang et al., 2024</Cite>. To separate the effect of agentic scaffolding from backbone model
              capability, all three agent systems use GPT-5.4 as the underlying model. All model calls use sampling
              temperature 0.</Para>

            <SubH>4.1  Single-shot Solver Synthesis</SubH>
            <P>We first evaluate the <Em>single-shot</Em> setting as the basic baseline for PDE-to-solver
              generation. In this setting, each model–FEM library–instance pair produces exactly one solver submission
              and receives no execution feedback before submission. This setting measures the ability of a system to
              complete the numerical formulation, FEM library implementation, and solver configuration in a single
              attempt.</P>

            <Para label="Overall ranking and capability gap">
              Table 1 reports single-shot pass rates across all models and FEM-library tracks. On the primary DOLFINx
              track, Gemini 3.1 Pro achieves the highest overall pass rate at <B>54.1%</B>, followed by Opus 4.7
              (47.8%), GPT-5.4 (46.0%), CodePDE (44.7%), and OpenHands (43.6%). The narrow spread among these
              top-performing systems suggests that, in the no-feedback single-shot setting, agent-style scaffolding does
              not yield a consistent advantage over direct generation by strong base LLMs. A substantial gap opens below
              this cluster: Qwen3.6-Plus reaches 23.4%, while DeepSeek V3.2 (4.2%) and Mini-SWE (3.7%) fail on nearly
              all instances.
            </Para>

            {/* Table 1 */}
            <div className="overflow-x-auto my-4">
              <table className="text-[0.7rem] border-collapse w-full min-w-[900px]">
                <thead>
                  <tr className="bg-blue-50 border-t-2 border-b-2 border-slate-400">
                    <th className="px-2 py-1.5 text-left font-bold">FEM library</th>
                    <th className="px-2 py-1.5 text-left font-bold">Type</th>
                    <th className="px-2 py-1.5 text-left font-bold">Model</th>
                    {["Biharmon.", "Conv.-Diff.", "Heat", "Helmholtz", "Lin.El.", "Stokes", "Poisson", "R.-Diff.", "N.-Stokes", "Burgers", "Wave"].map(h => (
                      <th key={h} className="px-1.5 py-1.5 text-center font-bold whitespace-nowrap">{h}</th>
                    ))}
                    <th className="px-2 py-1.5 text-center font-bold bg-green-50">All</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { lib: "DOLFINx", type: "Base LLM", model: "GPT-5.4",        vals: [47.4,46.4,48.0,46.8,47.6,34.4,47.3,46.9,50.0,46.5,47.6], all: 46.0 },
                    { lib: "",        type: "",          model: "Opus 4.7",        vals: [50.9,58.3,26.0,62.9,66.7,24.6,52.7,51.6,57.1,27.9,28.6], all: 47.8 },
                    { lib: "",        type: "",          model: "Gemini 3.1 Pro",  vals: [77.2,52.4,50.0,71.0,66.7,21.3,51.6,64.1,21.4,53.5,47.6], all: 54.1, best: true },
                    { lib: "",        type: "",          model: "Qwen3.6-Plus",    vals: [24.6,29.8,34.0,40.3,28.6, 6.6,16.5,17.2,17.9,18.6,21.4], all: 23.4 },
                    { lib: "",        type: "",          model: "DeepSeek V3.2",   vals: [ 8.8, 2.4,10.0, 0.0, 3.2, 1.6,13.2, 0.0, 0.0, 0.0, 0.0], all:  4.2 },
                    { lib: "",        type: "Agent",     model: "CodePDE",         vals: [38.6,45.2,50.0,69.4,61.9,19.7,39.6,56.2,32.1,41.9,23.8], all: 44.7 },
                    { lib: "",        type: "",          model: "OpenHands",       vals: [31.6,50.0,64.0,59.7,38.1,16.4,47.3,53.1,21.4,51.2,31.0], all: 43.6 },
                    { lib: "",        type: "",          model: "Mini-SWE",        vals: [ 5.3, 7.1, 2.0, 0.0, 6.3, 1.6, 3.3, 3.1, 3.6, 4.7, 2.4], all:  3.7 },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-2 py-1 border-b border-slate-100 font-semibold">{row.lib}</td>
                      <td className="px-2 py-1 border-b border-slate-100">{row.type}</td>
                      <td className="px-2 py-1 border-b border-slate-100 whitespace-nowrap">{row.model}</td>
                      {row.vals.map((v, j) => (
                        <td key={j} className="px-1.5 py-1 border-b border-slate-100 text-center">{v.toFixed(1)}</td>
                      ))}
                      <td className={`px-2 py-1 border-b border-slate-100 text-center font-bold bg-green-50 ${row.best ? "text-green-700" : ""}`}>
                        {row.all.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1.5 text-xs text-slate-500 italic">
                Table 1: Single-shot case-level pass rates (%) by PDE family on the primary DOLFINx track.
                Bold green indicates the highest overall pass rate.
              </p>
            </div>

            <Para label="Library transfer and PDE-family effects">
              Figure 3 and Table 1 show that single-shot performance depends strongly on both the target FEM library and
              the PDE family. Pass rates drop substantially on the Firedrake and deal.II tracks relative to DOLFINx.
              Under the current FEM-library track composition, deal.II yields the lowest overall pass rates: even the
              strongest model on this track, Gemini 3.1 Pro, reaches only 32.3%. This indicates that cross-library
              transfer remains a major bottleneck, especially when moving from Python-based FEM libraries to the
              C++-based deal.II library. Family-level results reveal similarly persistent structure. Stokes is among
              the hardest families on DOLFINx: most systems remain below 25%, with only GPT-5.4 reaching a non-trivial
              34.4%. Gemini 3.1 Pro reaches 77.2% on Biharmonic, while Opus 4.7 leads on Helmholtz and Linear
              Elasticity, indicating that capability is not uniform across PDE types.
            </Para>

            <div className="my-5">
              <p className="text-xs font-semibold text-slate-600 mb-2">Figure 3: Single-shot pass rates (%) by PDE family on Firedrake (left) and deal.II (right).</p>
              <FigRow>
                <SubFig src={figByKey.get("backend_eqtype_firedrake")?.src ?? "figures/backend_eqtype_firedrake.png"} sub="a" caption="Firedrake" />
                <SubFig src={figByKey.get("backend_eqtype_dealii")?.src ?? "figures/backend_eqtype_dealii.png"} sub="b" caption="deal.II" />
              </FigRow>
            </div>

            <SubH>4.2  Failure-Stage Analysis</SubH>
            <P>Figure 4 decomposes the single-shot outcomes into four mutually exclusive categories: Pass, execution
              failure (F-Exec), accuracy failure (F-Acc), and timeout failure (F-Time). F-Exec denotes cases where the
              generated program fails to run successfully or returns an invalid output format; F-Acc denotes executable
              cases whose numerical error exceeds the accuracy threshold; and F-Time denotes cases that pass execution
              and accuracy checks but exceed the runtime threshold.</P>
            <P>Overall, F-Exec is the dominant failure source for most models and library tracks. DeepSeek V3.2 and
              Mini-SWE fail almost entirely at the execution stage, indicating that they still struggle to generate
              runnable code for complex FEM libraries. Stronger systems, including Gemini 3.1 Pro, Opus 4.7, GPT-5.4,
              CodePDE, and OpenHands, show more distributed failure profiles: besides execution failures, F-Acc and
              F-Time also account for a visible fraction of outcomes.</P>
            <P>The failure profile also varies across FEM libraries. On deal.II, Gemini 3.1 Pro and Opus 4.7 show
              elevated F-Time rates of 35.1% and 24.3%, respectively, indicating that solver configuration and resource
              efficiency remain challenging on the C++ library track. On Firedrake, Gemini 3.1 Pro has a high F-Acc
              rate of 40.2%, suggesting that many failures arise from numerical errors related to variational forms or
              boundary-condition handling.</P>

            <div className="my-5">
              <p className="text-xs font-semibold text-slate-600 mb-2">Figure 4: Failure-stage breakdown by model and FEM library. Each bar is partitioned into F-Exec, F-Acc, F-Time, and Pass.</p>
              <FigRow>
                <SubFig src={figByKey.get("failure_stages_dolfinx")?.src ?? "figures/failure_stages_dolfinx.png"} sub="a" caption="DOLFINx" />
                <SubFig src="figures/failure_stages_firedrake.png" sub="b" caption="Firedrake" />
                <SubFig src="figures/failure_stages_dealii.png" sub="c" caption="deal.II" />
              </FigRow>
            </div>

            <SubH>4.3  Iterative Improvement with Execution Feedback</SubH>
            <P>To assess whether execution feedback helps models repair generated solvers, we evaluate a
              three-attempt iterative protocol using GPT-5.4 as a representative strong model. For each
              library–instance pair, the model can submit up to three solvers. After each attempt, it receives
              execution feedback, such as standard error messages or structured stage-level outcomes, but never the
              reference solution.</P>
            <P>Figure 5 compares GPT-5.4 under the single-shot setting and the three-attempt execution-feedback
              setting. Execution feedback improves pass rates on all three FEM-library tracks. The largest gain appears
              on DOLFINx, where the pass rate increases from 46.0% to 59.8%. Firedrake improves from 38.0% to 43.7%,
              and deal.II improves from 19.2% to 26.8%. These gains are accompanied by improved execution validity,
              indicating that a substantial fraction of single-shot failures arise from repairable compilation errors,
              runtime errors, output-format issues, or library API mistakes.</P>
            <P>Stokes problems, transport-dominated cases, and the C++ implementation complexity of deal.II remain
              difficult to repair within a few feedback rounds. Overall, execution feedback mainly mitigates
              implementation-level errors, but remains limited for failures requiring correct numerical formulation,
              discretization choices, or solver configuration.</P>

            <div className="my-5">
              <p className="text-xs font-semibold text-slate-600 mb-2">Figure 5: GPT-5.4 pass rates under single-shot and three-attempt execution-feedback settings.</p>
              <FigRow>
                <SubFig src={figByKey.get("iterative_dolfinx")?.src ?? "figures/iterative_dolfinx.png"} sub="a" caption="DOLFINx" />
                <SubFig src="figures/iterative_firedrake.png" sub="b" caption="Firedrake" />
                <SubFig src="figures/iterative_dealii.png" sub="c" caption="deal.II" />
              </FigRow>
            </div>

            <SubH>4.4  Template-Guided Numerical Reasoning</SubH>
            <P>The default end-to-end setting requires a model to perform two tasks simultaneously: making numerical
              decisions for a given PDE and implementing a complete solver in the target FEM library. To reduce the
              confounding effect of library boilerplate and API usage, we introduce a template-guided ablation in which
              the model receives a runnable solver skeleton and fills in the variational form, boundary or initial
              conditions, discretization choices, and solver parameters.</P>
            <P>Figure 6 compares Gemini 3.1 Pro under the default end-to-end setting and the template-guided
              setting. The template yields consistent but modest gains: DOLFINx improves from 54.1% to 56.3%,
              Firedrake from 32.4% to 35.3%, and deal.II from 32.3% to 35.8%. These results show that library
              boilerplate and API details are measurable sources of failure, but they do not fully explain the remaining
              performance gap. Some formulation-heavy PDE families improve under templating, while others decline,
              suggesting that a fixed scaffold can also constrain otherwise viable implementations.</P>

            <div className="my-5">
              <p className="text-xs font-semibold text-slate-600 mb-2">Figure 6: Template-guided ablation for Gemini 3.1 Pro on DOLFINx (a), Firedrake (b), and deal.II (c).</p>
              <FigRow>
                <SubFig src="figures/template_ablation_dolfinx.png" sub="a" caption="DOLFINx" />
                <SubFig src="figures/template_ablation_firedrake.png" sub="b" caption="Firedrake" />
                <SubFig src="figures/template_ablation_dealii.png" sub="c" caption="deal.II" />
              </FigRow>
            </div>
          </div>
        ),
      },

      // ── 5. Discussion ─────────────────────────────────────────────────────────
      {
        id: "discussion",
        title: "5  Discussion and Limitations",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>PDEAgent-Bench is a large-scale benchmark for PDE-to-solver synthesis that evaluates whether LLMs
              and code agents can produce solvers that are executable, accurate, and efficient. Unlike prior benchmarks,
              it uses a staged evaluation—checking execution, numerical accuracy, and runtime—since assessing only
              executability can overestimate solver quality.</P>
            <P>The benchmark still has limitations. For instance, the dataset is primarily constructed using
              manufactured solutions, or, when analytical solutions are unavailable, high-accuracy numerical solutions
              are used as references. This design ensures reproducible, automated evaluation, but it may not fully
              reflect the complexity and diversity of PDE modeling in real-world industrial or engineering
              applications <Cite>Huang et al., 2025</Cite>, such as large-scale 3D fluid-structure simulations,
              multi-condition scenarios, and multiphysics couplings.</P>
            <P>Notably, the development of PDE benchmarks shows a progression from early, purely simulation-based
              PDEBench datasets <Cite>Takamoto et al., 2022</Cite> to more realistic settings in
              RealPDEBench <Cite>Hu et al., 2026</Cite>. In contrast, PDE code agent research has yet to move beyond
              generating executable solvers, and our work provides a systematic evaluation platform for this
              foundational step, establishing a benchmark for future extensions toward real scientific and engineering
              tasks.</P>
          </div>
        ),
      },

      // ── 6. Conclusion ─────────────────────────────────────────────────────────
      {
        id: "conclusion",
        title: "6  Conclusion",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>We introduce PDEAgent-Bench, the first multi-metric, multi-library benchmark for PDE-to-solver code
              generation by LLMs and code agents. It contains 645 PDE instances across 11 families and three
              FEM-library tracks: DOLFINx, Firedrake, and deal.II. The benchmark uses a staged evaluation—checking
              execution, numerical accuracy, and runtime. Experiments show that while strong models can produce runnable
              solvers for many instances, performance drops under accuracy, runtime, cross-library transfer, and
              challenging PDEs. PDEAgent-Bench provides a reproducible, diagnostic, and extensible foundation for
              evaluating PDE code agents not just for code correctness, but for numerical accuracy and computational
              performance.</P>
          </div>
        ),
      },

      // ── References ────────────────────────────────────────────────────────────
      {
        id: "references",
        title: "References",
        level: 1,
        body: (
          <div className="text-[13px] text-slate-700 space-y-2">
            {[
              "Austin, J., Odena, A., Nye, M., et al. (2021). Program synthesis with large language models. arXiv:2108.07732.",
              "Bangerth, W., Hartmann, R., and Kanschat, G. (2007). deal.II — a general-purpose object-oriented finite element library. ACM Trans. Math. Softw., 33(4):24–es. doi:10.1145/1268776.1268779.",
              "Baratta, I. A., Dean, J. P., Dokken, J. S., et al. (2023). DOLFINx: the next generation FEniCS problem solving environment. Zenodo. doi:10.5281/zenodo.10447666.",
              "Bao, J., Boullé, N., Liu, T. J. B., Sarfati, R., and Earls, C. J. (2026). Text-trained LLMs can zero-shot extrapolate PDE dynamics, revealing a three-stage in-context learning mechanism. arXiv:2509.06322.",
              "Chen, M., Tworek, J., Jun, H., et al. (2021). Evaluating large language models trained on code. arXiv:2107.03374.",
              "Chen, H., Xiong, M., Lu, Y., et al. (2026). MLR-Bench: evaluating AI agents on open-ended machine learning research. NeurIPS Datasets and Benchmarks.",
              "Cheng, A., Zhang, L., and He, G. (2026). Re4: scientific computing agent with rewriting, resolution, review and revision. arXiv:2508.20729.",
              "Deng, X., Da, J., Pan, E., et al. (2025). SWE-bench pro: can AI agents solve long-horizon software engineering tasks? arXiv:2509.16941.",
              "Ham, D. A., Kelly, P. H. J., Mitchell, L., et al. (2023). Firedrake user manual. Imperial College London and University of Oxford. doi:10.25561/104839.",
              "Gebru, T., Morgenstern, J., Vecchione, B., et al. (2021). Datasheets for datasets. arXiv:1803.09010.",
              "Gupta, J. K. and Brandstetter, J. (2022). Towards multi-spatiotemporal-scale generalized PDE modeling. arXiv:2209.15616.",
              "Hao, Z., Yao, J., Su, C., et al. (2024). PINNacle: a comprehensive benchmark of physics-informed neural networks for solving PDEs. Adv. Neural Inf. Process. Syst., 37:76721–76774.",
              "Hendrycks, D., Basart, S., Kadavath, S., et al. (2021). Measuring coding challenge competence with APPS. NeurIPS Datasets and Benchmarks Track (Round 2).",
              "Hu, P., Feng, H., Liu, H., et al. (2026). RealPDEBench: a benchmark for complex physical systems with real-world data. arXiv:2601.01829.",
              "Huang, Y., Luo, J., Yu, Y., et al. (2024). DA-Code: agent data science code generation benchmark for large language models. EMNLP, pp. 13487–13521.",
              "Huang, Z., Wang, H., Yang, W., et al. (2025). Self-attention to operator learning-based 3D-IC thermal simulation. Proc. 62nd ACM/IEEE Design Automation Conference (DAC), pp. 1–7. IEEE.",
              "Hua, T., Hua, H., Xiang, V., et al. (2026). ResearchCodeBench: benchmarking LLMs on implementing novel machine learning research code. NeurIPS Datasets and Benchmarks.",
              "Jimenez, C. E., Yang, J., Wettig, A., et al. (2023). SWE-bench: can language models resolve real-world GitHub issues? arXiv:2310.06770.",
              "Li, Y., Choi, D., Chung, J., et al. (2022). Competition-level code generation with AlphaCode. Science, 378(6624):1092–1097.",
              "Li, S., Marwah, T., Shen, J., et al. (2025). CodePDE: an inference framework for LLM-driven PDE solver generation. arXiv:2505.08783.",
              "Liu, X., Yu, H., Zhang, H., et al. (2024). AgentBench: evaluating LLMs as agents. ICLR.",
              "Qiu, S., Guo, S., Song, Z.-Y., et al. (2025). PHYBench: holistic evaluation of physical perception and reasoning in large language models. arXiv:2504.16074.",
              "Liu, S., Zhao, Z., Hu, X., et al. (2026). A benchmark for evaluating repository-level code agents with intermediate reasoning on feature addition task. arXiv:2603.26337.",
              "Lorsung, C. and Farimani, A. B. (2024). Explain like I'm five: using LLMs to improve PDE surrogate models with text. ICLR Workshop.",
              "Luo, Y., Chen, Y., and Zhang, Z. (2023). CFDBench: a large-scale benchmark for machine learning methods in fluid dynamics. arXiv:2310.05963.",
              "Luo, X., Wang, C., Sun, Y., and Wang, W. (2025). How do large language models perform on PDE discovery: a coarse-to-fine perspective. Findings of EMNLP 2025, pp. 2684–2697.",
              "Merrill, M. A., Shaw, A. G., Carlini, N., et al. (2026). Terminal-Bench: benchmarking agents on hard, realistic tasks in command line interfaces. ICLR.",
              "Ndzomga, F. (2026). Efficient benchmarking of AI agents. arXiv:2603.23749.",
              "Ni, Z., Wang, H., Zhang, S., et al. (2026). GitTaskBench: a benchmark for code agents solving real-world tasks through code repository leveraging. AAAI, 40(38):32564–32572.",
              "Ren, S., Xie, C., Jian, P., et al. (2026). Towards scientific intelligence: a survey of LLM-based scientific agents. arXiv:2503.24047.",
              "Ruža, J. and Gomez-Bombarelli, R. (2026). Reasoning-to-simulation: an agentic framework for discovery of electrolyte materials. ICLR Workshop on AI for Accelerated Materials Design.",
              "Soroco, M., Song, J., Xia, M., et al. (2025). PDE-controller: LLMs for autoformalization and reasoning of PDEs. arXiv:2502.00963.",
              "Takamoto, M., Praditia, T., Leiteritz, R., et al. (2022). PDEBench: an extensive benchmark for scientific machine learning. Adv. Neural Inf. Process. Syst., 35:1596–1611.",
              "Tang, X., Liu, Y., Cai, Z., et al. (2025). ML-Bench: evaluating large language models and agents for machine learning tasks on repository-level code. ICLR Workshop.",
              "Wang, X., Li, B., Song, Y., et al. (2024). OpenHands: an open platform for AI software developers as generalist agents. arXiv:2407.16741.",
              "Wang, X., Hu, Z., Lu, P., et al. (2023). SciBench: evaluating college-level scientific problem-solving abilities of large language models. arXiv:2307.10635.",
              "Wang, Z., Hu, H., Deng, X., Mowlavi, S., and Nakahira, Y. (2026). OpInf-LLM: parametric PDE solving with LLMs via operator inference. ICLR Workshop on AI and PDEs.",
              "Wang, Z., Chang, Q., Patel, H., et al. (2026). MCP-Bench: benchmarking tool-using LLM agents with complex real-world tasks via MCP servers. ICLR.",
              "Wuwu, Q., Gao, C., Chen, T., et al. (2025). PINNsAgent: automated PDE surrogation with large language models. ICML.",
              "Wu, H., Zhang, X., and Zhu, L. (2025). Automated code development for PDE solvers using large language models. arXiv:2509.25194.",
              "Xie, T., Zhang, D., Chen, J., et al. (2024). OSWorld: benchmarking multimodal agents for open-ended tasks in real computer environments. NeurIPS Datasets and Benchmarks.",
              "Yang, J., Jimenez, C. E., Wettig, A., et al. (2024). SWE-agent: agent-computer interfaces enable automated software engineering. Adv. Neural Inf. Process. Syst., 37:50528–50652.",
              "Tian, M., Gao, L., Zhang, S. D., et al. (2024). SciCode: a research coding benchmark curated by scientists. Adv. Neural Inf. Process. Syst., 37:30624–30650.",
              "Zhou, S., Xu, F. F., Zhu, H., et al. (2024). WebArena: a realistic web environment for building autonomous agents. ICLR.",
            ].map((ref, i) => (
              <p key={i} className="pl-6 -indent-6 leading-relaxed">[{i + 1}] {ref}</p>
            ))}
          </div>
        ),
      },

      // ════════════════════════════════════════════════════════════════════════
      // APPENDIX
      // ════════════════════════════════════════════════════════════════════════

      // ── A. Related Work ───────────────────────────────────────────────────────
      {
        id: "app-related-work",
        title: "A  Related Work",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <SubH>A.1  Code Generation Benchmarks and Code Agents</SubH>
            <P>Code generation benchmarks have become standard for evaluating code agents, often using
              execution-based evaluation to assess agent performance. SWE-bench formulates tasks as patch generation for
              real-world issues and verifies correctness through test suites. Recent benchmarks such as SWE-Bench
              Pro <Cite>Deng et al., 2025</Cite>, GitTaskBench <Cite>Ni et al., 2025</Cite>,
              DA-Code <Cite>Huang et al., 2024</Cite>, and RACE-Bench <Cite>Liu et al., 2026</Cite> further cover
              long-horizon software engineering, repository-level task solving, data-science coding workflows, and
              intermediate reasoning.</P>
            <P>Beyond pure coding, generic tool-use and interactive environment benchmarks—including
              AgentBench <Cite>Liu et al., 2024</Cite>, WebArena <Cite>Zhou et al., 2024</Cite>,
              OSWorld <Cite>Xie et al., 2024</Cite>, and MCP-Bench <Cite>Wang et al., 2026</Cite>—evaluate models
              across diverse execution contexts. Platforms like ML-Bench <Cite>Tang et al., 2026</Cite> and
              ResearchCodeBench <Cite>Hua et al., 2025</Cite> rigorously evaluate whether agents can execute
              repository-level ML workflows or implement genuinely novel research ideas. Agent systems such as
              SWE-agent <Cite>Yang et al., 2024</Cite> and OpenHands <Cite>Wang et al., 2024</Cite> incorporate
              planning, editing, and iterative execution to handle more complex engineering tasks.</P>
            <P>While these benchmarks are well suited for assessing discrete functional correctness in conventional
              software development or ML scripting, PDE solver synthesis further requires generated programs to satisfy
              strict numerical accuracy and physics-based runtime constraints.</P>

            <SubH>A.2  PDE Benchmarks and PDE Code Agents</SubH>
            <P>PDE benchmarks in scientific machine learning, such as
              PDEBench <Cite>Takamoto et al., 2022</Cite>, PDEArena <Cite>Gupta et al., 2022</Cite>, and
              CFDBench <Cite>Luo et al., 2024</Cite>, primarily evaluate the predictive accuracy and generalization of
              learned surrogate solution operators, rather than the synthesis of executable PDE solvers from problem
              specifications. Other scientific benchmarks cover adjacent capabilities: SciBench evaluates scientific
              reasoning, SciCode evaluates scientific scripting, PHYBench focuses on physical reasoning, and PINNacle
              provides a systematic assessment of physics-informed neural networks.</P>
            <P>Recent work explores LLM-based agents for diverse scientific domains, spanning autonomous materials
              discovery, foundational zero-shot PDE extrapolation, and fusing multimodal text descriptions into PDE
              neural operators. Specifically for solver code generation, CodePDE <Cite>Li et al., 2025</Cite> studies
              LLM-driven synthesis; LLM-PDEDeveloper and Re4 investigate agentic workflows for scientific computing
              code generation; and PDE-Controller, LLM4PD, and OpInf-LLM examine related capabilities in PDE
              autoformalization, PDE discovery, and parametric PDE solving. However, these works are typically evaluated
              on limited or heterogeneous task collections, making unified and reproducible comparison difficult.</P>
          </div>
        ),
      },

      // ── B. Cross-Library Per-Family Results ───────────────────────────────────
      {
        id: "app-cross-library",
        title: "B  Cross-Library Per-Family Results",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>Table B.1 reports single-shot case-level pass rates for all models on the Firedrake and deal.II
              tracks, broken down by PDE equation family.</P>
            <div className="overflow-x-auto my-4">
              <table className="text-[0.7rem] border-collapse w-full min-w-[900px]">
                <thead>
                  <tr className="bg-blue-50 border-t-2 border-b-2 border-slate-400">
                    <th className="px-2 py-1.5 font-bold text-left">Library</th>
                    <th className="px-2 py-1.5 font-bold text-left">Type</th>
                    <th className="px-2 py-1.5 font-bold text-left">Model</th>
                    {["Biharmon.", "Conv.-Diff.", "Heat", "Helmholtz", "Lin.El.", "Stokes", "Poisson", "R.-Diff.", "All"].map(h => (
                      <th key={h} className="px-1.5 py-1.5 text-center font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { lib: "Firedrake", type: "Base LLM", model: "GPT-5.4",       vals: [41.3,42.9,48.0,41.9,34.4, 7.7,42.9,39.1], all: 38.0 },
                    { lib: "",          type: "",          model: "Opus 4.7",       vals: [19.6,47.6,76.0,40.3,44.3,25.0,54.9,50.0], all: 45.9, best: true },
                    { lib: "",          type: "",          model: "Gemini 3.1 Pro", vals: [32.6,33.3,58.0,29.0,23.0,15.4,47.3,15.6], all: 32.4 },
                    { lib: "",          type: "",          model: "Qwen3.6-Plus",   vals: [32.6,25.0,26.0,17.7,23.0,15.4,27.5,15.6], all: 22.9 },
                    { lib: "",          type: "",          model: "DeepSeek V3.2",  vals: [ 2.2, 0.0, 0.0, 0.0, 0.0, 0.0,14.3, 0.0], all:  2.7 },
                    { lib: "",          type: "Agent",     model: "CodePDE",        vals: [10.9,26.2,56.0,21.0, 9.8, 7.7,37.4,26.6], all: 25.3 },
                    { lib: "",          type: "",          model: "OpenHands",      vals: [19.6,39.3,42.0,32.3, 9.8, 7.7,36.3,32.8], all: 28.8 },
                    { lib: "",          type: "",          model: "Mini-SWE",       vals: [ 8.7,27.4,12.0, 8.1, 4.9, 3.8,18.7, 9.4], all: 12.9 },
                    { lib: "deal.II", type: "Base LLM", model: "GPT-5.4",          vals: [26.7,21.2,20.0,20.7,20.0, 0.0,20.0,22.7], all: 19.2 },
                    { lib: "",          type: "",          model: "Opus 4.7",       vals: [93.3,15.4, 0.0,44.8,40.0,44.4,28.3, 0.0], all: 28.1 },
                    { lib: "",          type: "",          model: "Gemini 3.1 Pro", vals: [100,11.5,24.0,44.8,36.7,51.9,25.0,27.3], all: 32.3, best: true },
                    { lib: "",          type: "",          model: "Qwen3.6-Plus",   vals: [33.3,15.4,12.0,10.3,23.3,14.8, 8.3,27.3], all: 16.9 },
                    { lib: "",          type: "",          model: "DeepSeek V3.2",  vals: [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], all:  0.0 },
                    { lib: "",          type: "Agent",     model: "CodePDE",        vals: [33.3,15.4,22.0,31.0,33.3,14.8,25.0,27.3], all: 24.6 },
                    { lib: "",          type: "",          model: "OpenHands",      vals: [46.7, 9.6, 6.0,31.0,13.3, 7.4,16.7,13.6], all: 16.6 },
                    { lib: "",          type: "",          model: "Mini-SWE",       vals: [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], all:  0.0 },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-2 py-1 border-b border-slate-100 font-semibold">{row.lib}</td>
                      <td className="px-2 py-1 border-b border-slate-100">{row.type}</td>
                      <td className="px-2 py-1 border-b border-slate-100 whitespace-nowrap">{row.model}</td>
                      {row.vals.map((v, j) => (
                        <td key={j} className="px-1.5 py-1 border-b border-slate-100 text-center">{v.toFixed(1)}</td>
                      ))}
                      <td className={`px-2 py-1 border-b border-slate-100 text-center font-bold ${row.best ? "text-green-700" : ""}`}>
                        {row.all.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1.5 text-xs text-slate-500 italic">
                Table B.1: Single-shot case-level pass rates (%) by PDE family on Firedrake and deal.II cross-library
                tracks. Dashes indicate PDE families not included in the corresponding track. N.–Stokes and Burgers are
                omitted for brevity (N.–Stokes: deal.II only; Burgers/Wave: DOLFINx only).
              </p>
            </div>
            <P>On Firedrake, the strongest overall model is Opus 4.7 (45.9%), followed by GPT-5.4 (38.0%) and
              Gemini 3.1 Pro (32.4%). Performance remains relatively strong on Heat, Poisson,
              Convection–Diffusion, and Reaction–Diffusion, but drops sharply on Stokes for all systems. On deal.II,
              overall pass rates are lower than on DOLFINx and Firedrake. Gemini 3.1 Pro obtains the highest overall
              pass rate at 32.3%, followed by Opus 4.7 (28.1%) and CodePDE (24.6%).</P>
          </div>
        ),
      },

      // ── C. Dataset Documentation ──────────────────────────────────────────────
      {
        id: "app-dataset-doc",
        title: "C  Dataset Documentation",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>We provide a Datasheet for Datasets <Cite>Gebru et al., 2021</Cite> to document the motivation,
              composition, collection process, intended uses, distribution, and maintenance of PDEAgent-Bench.</P>
            <Para label="Motivation">PDEAgent-Bench was created to evaluate end-to-end PDE-to-solver code generation.
              It addresses the lack of benchmarks that simultaneously assess executability, numerical accuracy,
              computational efficiency, and proficiency with multiple professional finite-element libraries. The dataset
              was curated by the authors as an academic research artifact; no third-party funding influenced case
              selection.</Para>
            <Para label="Composition">The dataset consists of 645 PDE cases grouped into 11 equation families: Poisson,
              Helmholtz, Biharmonic, Linear Elasticity, Heat, Convection–Diffusion, Reaction–Diffusion, Stokes,
              Navier–Stokes, Burgers, and Wave. Cases span 14 geometric templates: unit square, unit cube, L-shape,
              square-with-hole, multi-hole, circle, annulus, eccentric annulus, sector, star, gear, T-junction,
              dumbbell, and periodic square. Each case is a self-contained record containing the PDE specification,
              evaluation grid, calibration-baseline configuration, evaluator-side reference metadata, and supported
              FEM-library tracks among {"{"}DOLFINx, Firedrake, deal.II{"}"}.</Para>
            <Para label="Collection process">All cases were synthetically constructed by the authors. PDE coefficients,
              source terms, boundary conditions, and initial conditions are derived analytically from manufactured
              solutions where possible. No personal, proprietary, or otherwise restricted data is included.</Para>
            <Para label="Agent-visible and evaluator-only fields">Each instance separates agent-visible information from
              evaluator-only metadata. The agent-visible fields include the PDE family, domain description, coefficient
              functions, source terms, boundary and initial conditions, temporal parameters when applicable, and the
              required output-grid specification. Evaluator-only fields include reference solutions, calibration
              baselines, reference-generation settings, threshold-setting metadata, and hidden numerical configurations.</Para>
            <Para label="Preprocessing, cleaning, and labeling">Each candidate record passes a static validation suite
              checking schema conformance, identifier uniqueness, cross-field consistency, symbolic parsability of
              expressions, boundary-tag validity, and the presence of a high-fidelity <TT>reference_config</TT> when no
              manufactured solution is available. Records are then trial-executed to verify stable error computation.</Para>
            <Para label="Uses">The intended use is benchmarking LLM-based code agents and code generation systems on
              PDE-to-solver tasks. PDEAgent-Bench is designed for research on scientific code generation, numerical
              reasoning, FEM-library usage, and agent evaluation. Inappropriate uses include directly deploying
              LLM-generated solvers in safety-critical engineering or scientific pipelines without independent
              verification.</Para>
            <Para label="Distribution and license">The case records are released under a permissive license suitable
              for benchmark redistribution. The evaluation harness, reference-generation scripts, and Docker recipes are
              released under an OSI-approved open-source license.</Para>
            <Para label="Maintenance">The benchmark is maintained by the corresponding author group. Versioning follows
              semantic versioning, and changes are tracked in a public changelog. Prior major versions are retained for
              at least two years to support reproducibility of published results.</Para>
          </div>
        ),
      },

      // ── D. Additional Diagnostics ─────────────────────────────────────────────
      {
        id: "app-diagnostics",
        title: "D  Additional Solution-Quality and Solver-Behavior Diagnostics",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>The staged evaluation protocol reports whether a generated solver executes, satisfies the calibrated
              accuracy threshold, and runs within the runtime budget. This appendix provides additional metrics over
              passed cases to characterize the numerical quality and solver behavior behind the binary pass labels.</P>
            <Para label="Solution quality on passing cases">Table D.1 reports solution-quality metrics averaged over
              passed cases for each model and FEM library: RMSE, MAE, <TeX math="R^2" />, and frequency-domain RMSE
              (fRMSE). On DOLFINx, Opus 4.7 and Gemini 3.1 Pro achieve <TeX math="R^2 \geq 0.999" /> with RMSE in the{" "}
              <TeX math="10^{-4}" /> range, whereas GPT-5.4 has <TeX math="\mathrm{RMSE} = 2.16 \times 10^{-3}" />,
              suggesting a larger share of threshold-marginal passes. On deal.II, CodePDE has{" "}
              <TeX math="R^2 = 0.739" /> and <TeX math="\mathrm{RMSE} = 7.33 \times 10^{-2}" /> over its passed cases,
              indicating that some solvers can clear the calibrated accuracy gate while remaining numerically
              marginal.</Para>
            <Para label="Solver-behavior diagnostics">Table D.2 reports numerical-behavior diagnostics over passed
              DOLFINx cases, including discretization scale, CFL values, linear-iteration counts, nonlinear-iteration
              counts, residual indicators, and work-rate statistics. The same binary pass label can correspond to
              qualitatively different solver behavior: Gemini 3.1 Pro obtains many elliptic passes with moderate mesh
              sizes and linear-iteration counts, whereas OpenHands attains many parabolic passes with substantially
              larger average CFL values. DeepSeek V3.2's few elliptic passes rely on unusually large meshes, consistent
              with a strategy closer to brute-force refinement.</Para>
          </div>
        ),
      },

      // ── E. Threshold Sensitivity ──────────────────────────────────────────────
      {
        id: "app-threshold",
        title: "E  Threshold Sensitivity Analysis",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>The evaluation framework uses two global multipliers: <TeX math="\alpha_{\mathrm{acc}} = 10" /> for the
              accuracy gate and <TeX math="\alpha_{\mathrm{time}} = 3" /> for the runtime gate. These values are fixed
              for all models, PDE families, and instances. They are not tuned on model outcomes.</P>
            <Para label="Accuracy multiplier">The accuracy gate requires</Para>
            <Eq>{String.raw`e(u_{\mathrm{agent}}) \leq \tau_{\mathrm{acc}}, \qquad \tau_{\mathrm{acc}} = \max(\alpha_{\mathrm{acc}}\,e_{\mathrm{base}},\;\tau_{\min})`}</Eq>
            <P>The default value <TeX math="\alpha_{\mathrm{acc}} = 10" /> requires the submitted solution to be within
              one order of magnitude of the calibration-baseline error, subject to the minimum floor. This is
              deliberately permissive: agents are allowed to choose their own meshes, finite-element spaces,
              discretization orders, time-stepping schemes, and solver settings. We evaluate sensitivity by varying{" "}
              <TeX math="\alpha_{\mathrm{acc}} \in \{2, 5, 10, 50, 100\}" /> while holding{" "}
              <TeX math="\alpha_{\mathrm{time}} = 3" /> fixed. The relative ordering is stable across the tested range:
              Gemini 3.1 Pro remains the top-performing model, followed by Opus 4.7 and GPT-5.4.</P>
            <Para label="Runtime multiplier">The runtime gate requires</Para>
            <Eq>{String.raw`t_{\mathrm{agent}} \leq \tau_{\mathrm{time}}, \qquad \tau_{\mathrm{time}} = \alpha_{\mathrm{time}}\,t_{\mathrm{base}}`}</Eq>
            <P>We evaluate sensitivity by varying{" "}
              <TeX math="\alpha_{\mathrm{time}} \in \{1, 2, 3, 5\}" /> while holding{" "}
              <TeX math="\alpha_{\mathrm{acc}} = 10" /> fixed. Across all tested values, the ordering
              Gemini 3.1 Pro {">"} Opus 4.7 ≈ GPT-5.4 is preserved. Varying <TeX math="\alpha_{\mathrm{time}}" /> from
              1 to 5 changes each model's pass rate by at most 4 percentage points.</P>
            <figure className="my-5">
              <img src="figures/acc_threshold_sensitivity.png" alt="Figure 7" className="rounded-lg w-full max-w-xl mx-auto block" />
              <figcaption className="mt-2 text-xs text-center text-slate-600">Figure 7: DOLFINx pass rate for the three top-performing models as a function of the accuracy multiplier α_acc, with α_time = 3 fixed. The dashed vertical line marks the default value α_acc = 10.</figcaption>
            </figure>
            <figure className="my-5">
              <img src="figures/time_threshold_sensitivity.png" alt="Figure 8" className="rounded-lg w-full max-w-xl mx-auto block" />
              <figcaption className="mt-2 text-xs text-center text-slate-600">Figure 8: DOLFINx pass rate for the three top-performing models as a function of the runtime multiplier α_time, with α_acc = 10 fixed. The dashed vertical line marks the default value α_time = 3.</figcaption>
            </figure>
          </div>
        ),
      },

      // ── F. Calibration Distribution ───────────────────────────────────────────
      {
        id: "app-calibration",
        title: "F  Calibration Baseline Distribution and Reference-Solution Validity",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>This appendix reports the empirical distribution of calibration-baseline errors and runtimes on the
              DOLFINx primary track, explains the role of the accuracy floor, and describes how reference-solution
              credibility is checked for cases without analytic manufactured solutions.</P>
            <Para label="Reference solutions and calibration baselines">For each case, the submitted solution{" "}
              <TeX math="u_{\mathrm{agent}}" /> is compared against a reference solution <TeX math="u_{\mathrm{GT}}" />{" "}
              on the prescribed evaluation grid. Separately, a calibration baseline <TeX math="u_{\mathrm{base}}" /> is
              generated during benchmark construction and used to derive the case-specific accuracy threshold through</Para>
            <Eq>{String.raw`\tau_{\mathrm{acc}} = \max(\alpha_{\mathrm{acc}}\,e_{\mathrm{base}},\;\tau_{\min}), \qquad e_{\mathrm{base}} = \frac{\|u_{\mathrm{base}} - u_{\mathrm{GT}}\|_2}{\|u_{\mathrm{GT}}\|_2}`}</Eq>
            <Para label="Manufactured-solution cases">Most instances (536 of 645 cases) are constructed from analytic
              manufactured solutions. For these cases, the reference solution <TeX math="u_{\mathrm{GT}}" /> is obtained
              by evaluating the analytic solution directly on the prescribed evaluation grid, without FEM projection.
              The calibration baseline is generated by a well-configured numerical solve using the benchmark
              reference-generation pipeline.</Para>
            <Para label="Reference-based cases without analytic solutions">The remaining 109 instances do not have
              analytic manufactured solutions. For these cases, <TeX math="u_{\mathrm{GT}}" /> is generated by a
              higher-fidelity reference run. During dataset construction, all reference-based cases are filtered by the
              coarser-to-finer gap: cases with <TeX math="e_{\mathrm{base}} \geq 0.05" /> are discarded.</Para>
            <Para label="Effect of the accuracy floor">For smooth manufactured problems, the calibration baseline can
              agree with the analytic manufactured solution to near-machine precision. The smallest observed{" "}
              <TeX math="e_{\mathrm{base}}" /> is <TeX math="6.7 \times 10^{-15}" />. Without a floor, the threshold
              would require agent submissions to match the reference to an unrealistically strict tolerance. The floor{" "}
              <TeX math="\tau_{\min} = 10^{-6}" /> prevents such degenerate thresholds. The floor is active for 155
              DOLFINx cases (24% of the primary track).</Para>
          </div>
        ),
      },

      // ── G. Compute Budget ─────────────────────────────────────────────────────
      {
        id: "app-compute",
        title: "G  Compute Budget and API Access",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>All evaluated hosted models were accessed through their official provider APIs. Each evaluated system
              has 1,468 completed single-shot calls, corresponding to the sum of the DOLFINx, Firedrake, and deal.II
              tracks: <TeX math="645 + 510 + 313 = 1{,}468" />. The total API budget across all 8 systems was{" "}
              62,894,768 input tokens and 27,701,986 output tokens, with an estimated total API cost of
              <B> $505.30</B>.</P>
            <Tbl
              head={["System", "Calls", "Input tokens", "Output tokens", "API cost (USD)"]}
              rows={[
                ["GPT-5.4",         "1,468", "7,611,184",  "2,654,991",  "$58.85"],
                ["Opus 4.7",        "1,468", "8,103,786",  "2,119,274",  "$93.50"],
                ["Gemini 3.1 Pro",  "1,468", "8,147,346",  "2,036,612",  "$40.73"],
                ["Qwen3.6-Plus",    "1,468", "8,154,417",  "2,493,845",  "$24.75"],
                ["DeepSeek V3.2",   "1,468", "8,156,484",  "3,243,411",  "$3.36"],
                ["CodePDE",         "1,468", "6,926,984",  "3,029,059",  "$62.75"],
                ["OpenHands",       "1,468", "8,067,585",  "8,834,482",  "$152.69"],
                ["Mini-SWE-Agent",  "1,468", "7,726,982",  "3,290,312",  "$68.67"],
                [<B key="t">Total</B>, "11,744", "62,894,768", "27,701,986", <B key="c">$505.30</B>],
              ]}
              caption="Table G.1: API usage and estimated cost by evaluated system."
            />
            <P>All model calls use deterministic or near-deterministic decoding (temperature = 0 whenever supported
              by the provider API). The reported USD values should be interpreted as estimated replication costs under
              the evaluation-client configuration at the time of the experiments, not as fixed benchmark constants.</P>
          </div>
        ),
      },

      // ── H. Evaluation Metrics ─────────────────────────────────────────────────
      {
        id: "app-metrics",
        title: "H  Evaluation Metrics",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>This appendix gives the mathematical definitions of the metrics used in PDEAgent-Bench. We
              distinguish between <Em>primary gates</Em>, which determine the binary <TT>case_pass</TT> outcome, and{" "}
              <Em>auxiliary metrics</Em>, which are used only for diagnostic analysis.</P>

            <SubH>H.1  Primary Gates</SubH>
            <Para label="Relative L² error and accuracy gate">Let <TeX math="u_{\mathrm{agent}}" /> be the submitted
              solution on the valid evaluation grid and <TeX math="u_{\mathrm{GT}}" /> the reference solution. The
              primary numerical-error metric is the relative <TeX math="L^2" /> error:</Para>
            <Eq>{String.raw`e(u) = \frac{\|u - u_{\mathrm{GT}}\|_2}{\max(\|u_{\mathrm{GT}}\|_2, \epsilon_{\mathrm{norm}})}`}</Eq>
            <P>where <TeX math="\epsilon_{\mathrm{norm}}" /> is a small numerical safeguard used only to avoid division
              by zero for degenerate near-zero reference fields. The accuracy gate passes iff{" "}
              <TeX math="e(u_{\mathrm{agent}}) \leq \tau_{\mathrm{acc}}" />.</P>
            <Para label="Wall-clock runtime and efficiency gate">Let <TeX math="t_{\mathrm{agent}}" /> be the measured
              wall-clock runtime of the submitted solver. The runtime gate passes iff{" "}
              <TeX math="t_{\mathrm{agent}} \leq \tau_{\mathrm{time}} = \alpha_{\mathrm{time}}\,t_{\mathrm{base}}" />.</Para>
            <Para label="Case-level pass indicator">For model <TeX math="m" /> on instance <TeX math="i" />, the
              case-level pass indicator is:</Para>
            <Eq>{String.raw`\mathrm{case\_pass}_{i}(m) = \mathrm{exec\_pass}_{i}(m) \cdot \mathrm{acc\_pass}_{i}(m) \cdot \mathrm{time\_pass}_{i}(m)`}</Eq>

            <SubH>H.2  Auxiliary Solution-Quality Metrics</SubH>
            <Para label="RMSE and MAE">For <TeX math="N = |\Omega_{\mathrm{eval}}|" /> valid grid points and{" "}
              <TeX math="c" /> output components:</Para>
            <Eq>{String.raw`\mathrm{RMSE}(u) = \sqrt{\frac{1}{Nc} \sum_{i \in \Omega_{\mathrm{eval}}} \sum_{j=1}^{c} \left(u_{ij} - u_{\mathrm{GT},ij}\right)^2}`}</Eq>
            <Eq>{String.raw`\mathrm{MAE}(u) = \frac{1}{Nc} \sum_{i \in \Omega_{\mathrm{eval}}} \sum_{j=1}^{c} \left|u_{ij} - u_{\mathrm{GT},ij}\right|`}</Eq>
            <Para label="Coefficient of determination"><TeX math="R^2" /> is computed over valid grid entries and
              output components:</Para>
            <Eq>{String.raw`R^{2}(u) = 1 - \frac{\sum_{i,j}(u_{ij} - u_{\mathrm{GT},ij})^2}{\sum_{i,j}(u_{\mathrm{GT},ij} - \bar{u}_{\mathrm{GT}})^2}`}</Eq>
            <Para label="Frequency-domain RMSE">fRMSE measures discrepancy after applying a discrete Fourier transform
              to the evaluated fields:</Para>
            <Eq>{String.raw`\mathrm{fRMSE}(u) = \sqrt{\frac{1}{|\mathcal{K}|c} \sum_{\boldsymbol{k} \in \mathcal{K}} \sum_{j=1}^{c} \left|\hat{u}_{\boldsymbol{k}j} - \hat{u}_{\mathrm{GT},\boldsymbol{k}j}\right|^2}`}</Eq>
            <P>The primary accuracy gate uses relative <TeX math="L^2" /> error because it is scale-normalized,
              compatible with scalar and multi-component fields, and naturally supports per-case calibration through{" "}
              <TeX math="e_{\mathrm{base}}" />. RMSE, MAE, <TeX math="R^2" />, fRMSE, and solver-behavior statistics
              are reported as auxiliary diagnostics.</P>
          </div>
        ),
      },

      // ── I. PDE Family Definitions ─────────────────────────────────────────────
      {
        id: "app-pde-families",
        title: "I  PDE Family Definitions and Numerical Considerations",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>This appendix summarizes the PDE families included in PDEAgent-Bench and the main numerical
              considerations relevant to solver generation. The agent is responsible for producing an executable solver
              that chooses appropriate discretization spaces, mesh resolution, time-stepping schemes when applicable,
              nonlinear or linear solver settings, and output interpolation.</P>

            <Para label="Poisson with variable coefficient">Poisson-type instances are written as</Para>
            <Eq>{String.raw`-\nabla\!\cdot\!\left(\kappa(\boldsymbol{x})\nabla u\right) = f \quad \text{in } \Omega, \qquad u = g \quad \text{on } \Gamma_D`}</Eq>
            <P>where <TeX math="\kappa(\boldsymbol{x})" /> may be constant or spatially varying. High-contrast
              coefficients and nonconvex geometries can increase conditioning difficulty.</P>

            <Para label="Helmholtz">Helmholtz instances take the form</Para>
            <Eq>{String.raw`-\Delta u - k^{2}u = f \quad \text{in } \Omega`}</Eq>
            <P>The key parameter is the wavenumber <TeX math="k" />. The mesh must resolve the oscillatory solution,
              and high-wavenumber cases may suffer from dispersion or pollution error if the discretization is too
              coarse.</P>

            <Para label="Biharmonic">Biharmonic instances are governed by a fourth-order elliptic equation,</Para>
            <Eq>{String.raw`\Delta^{2}u = f \quad \text{in } \Omega`}</Eq>
            <P>Because the operator is fourth order, practical solver strategies include mixed formulations,{" "}
              <TeX math="C^0" /> interior-penalty methods, or other weak formulations compatible with the target FEM
              library.</P>

            <Para label="Linear elasticity">Linear elasticity instances use the small-strain equilibrium equation</Para>
            <Eq>{String.raw`-\nabla\!\cdot\!\boldsymbol{\sigma}(\boldsymbol{u}) = \boldsymbol{f} \quad \text{in } \Omega, \qquad \boldsymbol{\sigma}(\boldsymbol{u}) = \lambda(\nabla\!\cdot\!\boldsymbol{u})\boldsymbol{I} + 2\mu\,\boldsymbol{\varepsilon}(\boldsymbol{u})`}</Eq>
            <P>where <TeX math="\boldsymbol{\varepsilon}(\boldsymbol{u}) = \tfrac{1}{2}(\nabla\boldsymbol{u} + \nabla\boldsymbol{u}^\top)" />.
              Nearly incompressible regimes can cause volumetric locking for naive low-order displacement formulations.</P>

            <Para label="Heat">Heat-equation instances are time-dependent parabolic problems:</Para>
            <Eq>{String.raw`\partial_{t}u - \nabla\!\cdot\!\left(\kappa\nabla u\right) = f(\boldsymbol{x},t) \quad \text{in } \Omega\times(0,T], \qquad u(\boldsymbol{x},0) = u_{0}(\boldsymbol{x})`}</Eq>

            <Para label="Convection–Diffusion">Convection–diffusion instances are written as</Para>
            <Eq>{String.raw`-\epsilon\Delta u + \boldsymbol{\beta}\!\cdot\!\nabla u = f \quad \text{in } \Omega`}</Eq>
            <P>When advection dominates diffusion (large Péclet number), unresolved boundary or internal layers can
              lead to oscillations unless the discretization or stabilization is chosen carefully.</P>

            <Para label="Reaction–Diffusion">Reaction–diffusion instances have the general form</Para>
            <Eq>{String.raw`-\epsilon\Delta u + R(u) = f \quad \text{in } \Omega`}</Eq>
            <P>The reaction term <TeX math="R(u)" /> may be linear or nonlinear. For nonlinear reactions with strong
              reaction strength, the solution may contain steep layers.</P>

            <Para label="Stokes">Stokes instances model steady incompressible viscous flow:</Para>
            <Eq>{String.raw`-\nu\Delta\boldsymbol{u} + \nabla p = \boldsymbol{f}, \qquad \nabla\!\cdot\!\boldsymbol{u} = 0 \quad \text{in } \Omega`}</Eq>
            <P>Common failures include incompatible function spaces, missing pressure null-space treatment, and
              incorrect handling of incompressibility constraints.</P>

            <Para label="Navier–Stokes">Steady incompressible Navier–Stokes instances:</Para>
            <Eq>{String.raw`-\nu\Delta\boldsymbol{u} + (\boldsymbol{u}\!\cdot\!\nabla)\boldsymbol{u} + \nabla p = \boldsymbol{f}, \qquad \nabla\!\cdot\!\boldsymbol{u} = 0 \quad \text{in } \Omega`}</Eq>
            <P>These cases combine the mixed saddle-point structure of Stokes with additional nonlinear-solver
              difficulty.</P>

            <Para label="Burgers">Burgers instances are viscous nonlinear transport problems:</Para>
            <Eq>{String.raw`\partial_{t}u + u\,\nabla u \cdot \boldsymbol{b} - \nu\Delta u = f(\boldsymbol{x},t) \quad \text{in } \Omega\times(0,T]`}</Eq>
            <P>Small viscosity can create sharp internal layers, making under-resolved solutions oscillatory or overly
              diffusive.</P>

            <Para label="Wave">Wave instances are second-order hyperbolic problems:</Para>
            <Eq>{String.raw`\partial_{tt}u - c^{2}\Delta u = f(\boldsymbol{x},t) \quad \text{in } \Omega\times(0,T], \qquad u(\boldsymbol{x},0) = u_{0}, \quad \partial_{t}u(\boldsymbol{x},0) = v_{0}`}</Eq>
            <P>Explicit schemes are constrained by a CFL-type condition involving <TeX math="c\Delta t/h" />, while
              implicit schemes can improve stability but still require adequate temporal and spatial resolution for phase
              accuracy.</P>
          </div>
        ),
      },

      // ── J. Case Record Schema ─────────────────────────────────────────────────
      {
        id: "app-schema",
        title: "J  Case Record Schema and Submission Contract",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>Each line of the benchmark JSONL file is a single case record. The evaluator-side record contains
              both the agent-facing problem specification and hidden metadata used for reference construction,
              calibration, and scoring.</P>
            <SubH>J.1  Evaluator-side case record (structure)</SubH>
            <CodeBlock>{`{
  "id": string,                         // unique case identifier
  "pde_classification": {
    "equation_family": string,          // one of 11 PDE families
    "math_type": [string]               // one or more mathematical categories
  },
  "case_spec": {
    "pde": { "type": string, "params": object,
              "forcing": object, "time": object? },
    "domain": { "type": string, "bounds": array,
                "geometry_params": object? },
    "bc": { "dirichlet": object?, "neumann": object?,
            "robin": object?, "periodic": object? },
    "ic": object?,
    "eval_grid": { "type": string, "nx": integer,
                   "ny": integer, "nz": integer?,
                   "bbox": array },
    "output": { "format": "npz", "field": string,
                "components": [string]? }
  },
  "evaluation_config": {
    "target_metric": "rel_L2_grid",
    "timeout_sec": number,
    "alpha_acc": number, "alpha_time": number, "tau_min": number
  },
  "evaluation_metadata": { /* evaluator-only */ },
  "tags": { "structure": [string]?, "difficulty": [string]? },
  "supported_libraries": [string]
}`}</CodeBlock>
            <P>Only <TT>case_spec</TT>, together with the target FEM-library name and the required solver entry
              point, is serialized into the agent prompt and passed to the generated solver. The{" "}
              <TT>evaluation_metadata</TT> block is retained by the evaluator and is never exposed to the agent.</P>
            <SubH>J.2  Solver entry point</SubH>
            <P>For Python-based tracks (DOLFINx and Firedrake), the evaluator imports the submitted file and calls:
            </P>
            <CodeBlock>{`def solve(case_spec: dict) -> None:
    """
    Solve the PDE described by case_spec and write the required
    artifacts to the working directory.
    """
    ...`}</CodeBlock>
            <P>For C++ deal.II submissions, the evaluator compiles and executes the submitted program through the
              provided harness, passing the case specification through a JSON file.</P>
            <SubH>J.3  Submission artifacts</SubH>
            <P>Every executed submission must produce a <TT>solution.npz</TT> file (NumPy archive containing the
              returned field on the prescribed evaluation grid) and a <TT>meta.json</TT> file:</P>
            <CodeBlock>{`{
  "wall_time_sec": number,
  "status": string,            // "success" or error category
  "message": string?,
  "solver_info": {             // optional diagnostic fields
    "mesh_resolution": integer?, "element_degree": integer?,
    "num_dofs": integer?,       "linear_iterations": integer?,
    "newton_iterations": integer?, "ksp_type": string?, ...
  }
}`}</CodeBlock>
          </div>
        ),
      },

      // ── K. Construction Pipeline ──────────────────────────────────────────────
      {
        id: "app-pipeline",
        title: "K  Construction Pipeline and FEM-Library Extension",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>This appendix documents the construction pipeline used to create PDEAgent-Bench cases and the
              procedure for adding new FEM-library tracks.</P>
            <Para label="Case-construction pipeline">Each candidate case is constructed through the following stages:
            </Para>
            <OL items={[
              <><B>Design matrix.</B> For each PDE family, we define a small set of variation axes corresponding to interpretable numerical challenges, such as coefficient contrast, source-term regularity, solution smoothness, boundary-condition type, geometry, time horizon, Reynolds or Péclet regime, nonlinearity strength, and stiffness.</>,
              <><B>Problem specification.</B> The contributor writes the agent-facing <TT>case_spec</TT>, including the PDE family, coefficients, forcing, domain, boundary conditions, initial conditions when applicable, temporal parameters, output field, and prescribed evaluation grid.</>,
              <><B>Reference construction path.</B> The contributor specifies how the reference solution is obtained. When possible, the case uses a manufactured solution. When an analytic manufactured solution is unavailable, the contributor provides a high-fidelity <TT>reference_config</TT>.</>,
              <><B>Calibration baseline.</B> The contributor provides a separate <TT>calibration_config</TT>. The calibration run is not used as the scoring reference; instead, it is compared with the reference solution to compute <TeX math="e_{\mathrm{base}}" /> and derive the case-specific thresholds.</>,
              <><B>Static validation.</B> The schema validator checks identifier uniqueness, required-field presence, consistency between <TT>pde.type</TT> and <TT>equation_family</TT>, domain and boundary-tag validity, output-grid validity, and symbolic parsability of expression fields.</>,
              <><B>Trial execution and calibration.</B> The build script executes the reference-generation and calibration procedures in the evaluation harness, verifying that reference solution generation, calibration error computation, and threshold derivation succeed.</>,
              <><B>Packaging.</B> Validated cases are exported into released JSONL files. Agent-visible fields are separated from evaluator-only metadata, and materialized thresholds are recorded for reproducible scoring.</>,
            ]} />
            <Para label="Adding a new FEM-library track">A new FEM-library track can be added without changing the
              benchmark task definition. The extension requires implementing the library-specific execution harness,
              solver-entry interface, dependency container, and output adapter. A library track is admitted only after
              its harness reproduces the reference-grid outputs for calibration solvers and passes the same
              artifact-validity and metric-computation checks as the existing tracks.</Para>
          </div>
        ),
      },

      // ── L. Prompt Templates ───────────────────────────────────────────────────
      {
        id: "app-prompts",
        title: "L  Prompt Templates",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>The benchmark uses two prompt tiers: a <Em>single-shot</Em> prompt for the default evaluation
              setting and an <Em>iterative-feedback</Em> prompt for the three-attempt repair setting. Both prompts are
              generated programmatically from the structured case record by{" "}
              <TT>pdebench/core/prompt_builder.py</TT> and <TT>pdebench/core/feedback_prompt.py</TT>.</P>
            <SubH>L.1  Single-Shot Prompt Structure</SubH>
            <Para label="(1) Task summary">The prompt begins with a short natural-language summary generated from
              the agent-visible <TT>case_spec</TT>. Example: "Solve a steady-state variable-coefficient Poisson problem
              on a unit-square domain with Dirichlet boundary conditions using DOLFINx. Return the numerical solution
              on the prescribed evaluation grid."</Para>
            <Para label="(2) Governing equation family">A Markdown heading identifies the PDE family, followed by a
              symbolic equation template for that family. The template states the mathematical form of the problem class,
              while the case-specific coefficients are provided separately from <TT>case_spec</TT>.</Para>
            <Para label="(3) Case-specific structured data">The prompt then includes the agent-visible{" "}
              <TT>case_spec</TT> in a structured block containing PDE type and parameters, forcing terms, domain,
              boundary conditions, initial conditions, evaluation grid, and output requirements.</Para>
            <Para label="(4) Implementation contract">For Python-based FEM libraries, the prompt specifies the
              required solver entry point (<TT>def solve(case_spec: dict) -{">"} None</TT>). For deal.II, the prompt
              specifies a C++ executable interface reading <TT>case_spec.json</TT>.</Para>
            <Para label="(5) Output and sandbox requirements">The prompt states that the submitted solver must run
              inside the provided sandbox, use only available dependencies, and produce outputs on the prescribed
              evaluation grid.</Para>
            <Para label="(6) FEM-library API guide">The prompt concludes with a target-library-specific API guide
              (e.g., <TT>DOLFINx_GUIDE.md</TT>) documenting library-version-specific syntax, imports, function-space
              construction, boundary-condition APIs, variational-form conventions, solver interfaces, and
              point-evaluation utilities.</Para>
            <SubH>L.2  Iterative-Feedback Prompt Structure</SubH>
            <P>After a failed attempt, the evaluator constructs a feedback prompt with four blocks:</P>
            <OL items={[
              <><B>Attempt header.</B> A separator indicating the current attempt number and a statement that the previous submission did not pass.</>,
              <><B>Previous submission excerpt.</B> A bounded excerpt (first 2000 characters) from the previous submitted code.</>,
              <><B>Failure-specific feedback.</B> Selected according to the first failed gate: execution/artifact failure (includes stderr excerpt and checklist), accuracy failure (reports relative L² error but not reference solution), or runtime failure (reports measured wall-clock time but not calibration runtime or threshold).</>,
              <><B>Task reminder.</B> The original single-shot prompt appended in full.</>,
            ]} />
            <P>The feedback protocol never reveals the reference solution values, analytic manufactured solution,
              calibration baseline solution, or hidden threshold-generation metadata.</P>
          </div>
        ),
      },

      // ── M. Template-Guided Ablation ───────────────────────────────────────────
      {
        id: "app-template-ablation",
        title: "M  Template-Guided Ablation Details",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>The template-guided ablation uses the same cases, reference solutions, evaluation grids, sandbox
              environment, and staged evaluation criteria as the standard end-to-end setting. Instead of asking the
              model to write a complete solver from a blank file, the evaluator provides a library-specific scaffold
              generated from the agent-visible <TT>case_spec</TT>.</P>
            <Para label="Template contents">For each target FEM library, the scaffold provides the surrounding
              program structure needed to produce a runnable submission: imports, solver entry-point definition,
              case-spec parsing, domain and mesh-construction placeholders, function-space construction placeholders,
              coefficient and forcing-expression parsing utilities, output-grid sampling utilities,{" "}
              <TT>solution.npz</TT> serialization, and <TT>meta.json</TT> writing. For time-dependent problems, the
              scaffold also provides the outer time-loop structure.</Para>
            <Para label="Model responsibilities">The model is still responsible for: selecting finite-element spaces
              and element degrees, choosing mesh resolution or refinement, writing the weak form or time-stepping update,
              imposing boundary and initial conditions correctly, selecting linear or nonlinear solver settings, handling
              mixed variables, choosing stabilization or linearization strategies, and ensuring that the computed
              solution is sampled on the prescribed evaluation grid.</Para>
            <Para label="Interpretation">The template-guided results should be interpreted as an API-decoupling
              diagnostic rather than as a new benchmark setting with a different task definition. If performance
              improves under templating, the improvement indicates that library setup, output serialization, or
              target-API usage accounts for part of the failure rate. If failures remain, they point to difficulties
              in numerical formulation, discretization choice, boundary-condition realization, time integration,
              nonlinear solving, or solver configuration.</Para>
          </div>
        ),
      },

      // ── N. Case Walkthroughs ──────────────────────────────────────────────────
      {
        id: "app-walkthroughs",
        title: "N  Case-Level Evaluation Walkthroughs",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>This appendix presents representative case-level walkthroughs from Gemini 3.1 Pro single-shot
              evaluations on the DOLFINx primary track, illustrating how the staged evaluation protocol behaves at the
              level of individual submissions.</P>
            <Tbl
              head={["Case", "Family", "Domain", "Reference", "e_base", "τ_acc", "t_base", "τ_time", "Verdict"]}
              rows={[
                ["A", "Helmholtz", "Circle", "analytic", "1.16×10⁻⁹", "10⁻⁶ (floor)", "7.05 s", "21.1 s", <B key="p">Pass</B>],
                ["B", "Conv.–Diff.", "Per. sq.", "analytic", "9.02×10⁻⁵", "9.02×10⁻⁴", "10.4 s", "31.2 s", "F-Acc"],
                ["C", "Lin. Elast.", "Qtr. sector", "analytic", "5.93×10⁻⁷", "5.93×10⁻⁶", "1.60 s", "4.80 s", "F-Time"],
                ["D", "Helmholtz", "Sq.+hole", "analytic", "3.60×10⁻⁸", "10⁻⁶ (floor)", "9.37 s", "28.1 s", "F-Acc"],
              ]}
              caption="Table N.1: Summary of the four walkthrough cases."
            />
            <Para label="Case A — clean pass">Helmholtz with k=8 on a circular domain. The generated solver uses P2
              Lagrange elements on a pygmsh circular mesh with h_max=0.008, a PETSc direct solve, and DOLFINx
              bounding-box collision detection. Observed L² error: 6.50×10⁻⁹ (threshold: 10⁻⁶). Runtime: 2.16 s
              (threshold: 21.1 s). The accuracy floor is active since the calibration baseline agrees with the analytic
              solution to near-machine precision.</Para>
            <Para label="Case B — accuracy failure">Convection–diffusion with ε=0.05 and β=(2,2) on a periodic
              square. The generated solver uses P2 elements with SUPG-style stabilization. Observed L² error:
              9.92×10⁻⁴ (threshold: 9.02×10⁻⁴) — exceeds the calibrated accuracy threshold by approximately 10%.
              This example illustrates why execution success alone is insufficient.</Para>
            <Para label="Case C — runtime failure">Linear elasticity with E=1.0 and ν_pr=0.3 on a quarter-circle
              sector. The generated solver uses vector P2 elements with a direct solver. Observed L² error: 1.68×10⁻⁷
              (well within threshold 5.93×10⁻⁶). Runtime: 7.53 s (threshold: 4.80 s) — highly accurate but too slow.
              This case illustrates that the staged protocol separately captures accuracy and efficiency.</Para>
            <Para label="Case D — accuracy-floor illustration">Helmholtz with k=15 on a square with a circular hole.
              The accuracy floor is active (10×e_base = 3.60×10⁻⁷ {"<"} 10⁻⁶, so τ_acc = 10⁻⁶). Observed L² error:
              1.30×10⁻⁶ — slightly exceeds the floor-controlled threshold. The floor avoids degenerate thresholds
              without automatically accepting marginal submissions.</Para>
          </div>
        ),
      },

      // ── O. Reproducibility Details ─────────────────────────────────────────────
      {
        id: "app-reproducibility",
        title: "O  Reproducibility Details",
        level: 1,
        body: (
          <div className="space-y-3 text-[15px] text-slate-800">
            <P>All reported evaluations are run through the released benchmark entry point{" "}
              <TT>scripts/run_benchmark.py</TT>. For each model, FEM library, and evaluation setting, the benchmark
              logs the generated source code, serialized prompt, model response, execution log, produced artifacts,
              relative L² error, runtime, stage-level outcomes, and final pass/fail verdict.</P>
            <Para label="Execution environment">Generated solvers are executed in the benchmark sandbox with pinned
              FEM-library dependencies and the same resource limits used during calibration. Runtime measurements are
              wall-clock times measured inside this execution environment. Table O.1 summarizes the hardware and
              software configuration.</Para>
            <Tbl
              head={["Component", "Details"]}
              rows={[
                [<Em key="hw">Hardware</Em>, ""],
                ["CPU model", "AMD EPYC 7K62 48-Core Processor"],
                ["Visible CPUs", "32"],
                ["Memory", "62 GB"],
                [<Em key="base">Base system</Em>, ""],
                ["OS", "Ubuntu 22.04"],
                ["Python", "3.11"],
                ["GCC", "11.4"],
                ["PETSc / petsc4py", "3.24.x"],
                [<Em key="dolfinx">DOLFINx track</Em>, ""],
                ["DOLFINx", "0.10.0"],
                ["pygmsh / meshio", "7.1.x / 5.3.x"],
                [<Em key="fd">Firedrake track</Em>, ""],
                ["Container image", "firedrakeproject/firedrake:latest (2025 cycle)"],
                [<Em key="dealii">deal.II track</Em>, ""],
                ["Container image", "dealii/dealii:v9.7.1-jammy"],
                ["deal.II", "9.7.1"],
                [<Em key="limits">Execution limits</Em>, ""],
                ["Per-case timeout", "300 s wall-clock"],
                ["Internet access", "Disabled inside execution sandbox"],
                ["Filesystem", "Isolated per-case working directory"],
              ]}
              caption="Table O.1: Hardware and software environment for the reported experiments."
            />
            <Para label="Replication protocol">To reproduce a reported table or figure, a third party should run
              the same benchmark version, model set, FEM-library tracks, prompt tier, and evaluation setting through{" "}
              <TT>scripts/run_benchmark.py</TT>, then aggregate the emitted verdict logs using the released metric
              scripts. The released case records materialize the prescribed evaluation grids, supported-library
              declarations, and scoring thresholds, so reproductions of the reported benchmark results do not require
              regenerating reference or calibration artifacts.</Para>
          </div>
        ),
      },

      // ── Citation (BibTeX) — LAST ───────────────────────────────────────────────
      {
        id: "bibtex",
        title: "Citation",
        level: 1,
        body: null, // rendered specially below
      },
    ],
    [citation, figByKey, abstract, lang, t],
  );

  // ─── Scroll-spy ──────────────────────────────────────────────────────────────
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
      {/* ─── Top bar ─────────────────────────────────────────────────────────── */}
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
        {/* ─── TOC sidebar ───────────────────────────────────────────────────── */}
        <aside
          className={`${tocOpen ? "block" : "hidden"} md:block md:sticky md:top-20 md:self-start`}
        >
          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-3">
              {t("paper.contents")}
            </div>
            <nav className="flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto pr-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                    setTocOpen(false);
                  }}
                  className={`block px-2 py-1 rounded text-[0.78rem] leading-tight transition-colors ${
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

        {/* ─── Paper body ────────────────────────────────────────────────────── */}
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          {/* Paper header */}
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

          {/* Sections */}
          <div className="px-6 sm:px-10 py-8 prose-paper">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 mb-10">
                <h2 className="text-xl font-bold tracking-tight text-ink-900 mb-4">
                  {s.title}
                </h2>

                {s.id === "bibtex" ? (
                  /* Citation section with copy button */
                  <div className="space-y-3">
                    <div className="relative">
                      <pre className="font-mono text-xs bg-slate-950 text-slate-100 rounded-lg p-4 pr-12 overflow-x-auto whitespace-pre">
                        {citation?.bibtex ?? "loading…"}
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopy}
                        title={copied ? "Copied!" : "Copy BibTeX"}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                      >
                        {copied
                          ? <Check className="w-4 h-4 text-green-400" />
                          : <Clipboard className="w-4 h-4" />}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-600 font-medium">BibTeX copied to clipboard!</p>
                    )}
                  </div>
                ) : (
                  <div className="text-[15px] leading-relaxed">{s.body}</div>
                )}
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

// ─── FigureBlock ──────────────────────────────────────────────────────────────
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
