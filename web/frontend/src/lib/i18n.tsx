import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "zh";

const STORAGE_KEY = "pdeagent.lang";

type DictEntry = { en: string; zh: string };

// Flat keys keep the dictionary easy to scan. Use double-brace placeholders for interpolation.
const dict: Record<string, DictEntry> = {
  // Navbar
  "nav.leaderboard": { en: "Leaderboard", zh: "排行榜" },
  "nav.explorer": { en: "Explorer", zh: "结果分析" },
  "nav.findings": { en: "Findings", zh: "主要发现" },
  "nav.errors": { en: "Diagnostics", zh: "错误分析" },
  "nav.gettingStarted": { en: "Get Started", zh: "快速开始" },
  "nav.paper": { en: "Paper", zh: "论文" },
  "nav.dataset": { en: "Dataset", zh: "数据集" },
  "nav.github": { en: "GitHub", zh: "GitHub" },
  "nav.langToggle.toZh": { en: "中文", zh: "中文" },
  "nav.langToggle.toEn": { en: "EN", zh: "EN" },

  // Hero
  "hero.badge": { en: "Under Review", zh: "审稿中" },
  "hero.desc": {
    en: "A multi-metric, multi-library benchmark for PDE-to-solver code generation — 645 cases across 11 PDE families and three professional FEM libraries (DOLFINx, Firedrake, deal.II), staged through executability, accuracy, and runtime gates.",
    zh: "面向 PDE 求解器代码生成的多指标、多库基准——覆盖 11 个 PDE 家族、3 个专业 FEM 库（DOLFINx、Firedrake、deal.II）的 645 个实例，通过可执行性、精度与运行时三道关卡进行分级评估。",
  },
  "hero.descBoldA": { en: "multi-metric, multi-library", zh: "多指标、多库" },
  "hero.btn.viewLeaderboard": { en: "View Leaderboard", zh: "查看排行榜" },
  "hero.btn.readPaper": { en: "Read Paper", zh: "阅读论文" },
  "hero.btn.github": { en: "GitHub", zh: "GitHub" },
  "hero.btn.dataset": { en: "Dataset", zh: "数据集" },
  "hero.counter.cases": { en: "Benchmark Cases", zh: "基准实例" },
  "hero.counter.pdes": { en: "PDE Families", zh: "PDE 家族" },
  "hero.counter.tracks": { en: "FEM Library Tracks", zh: "FEM 库赛道" },
  "hero.counter.systems": { en: "Systems Evaluated", zh: "评估系统数" },

  // Abstract
  "abstract.tag": { en: "Paper", zh: "论文" },
  "abstract.heading": { en: "Abstract", zh: "摘要" },

  // Figures
  "figures.tag": { en: "Visuals", zh: "图表" },
  "figures.title": { en: "Figures from the Paper", zh: "论文中的图表" },
  "figures.desc": {
    en: "A selection of key figures from the manuscript. Click to enlarge.",
    zh: "论文中部分关键图表，点击可放大查看。",
  },
  // Figure section badges
  "fig.section.Introduction": { en: "Introduction", zh: "引言" },
  "fig.section.Method": { en: "Method", zh: "方法" },
  "fig.section.Results": { en: "Results", zh: "实验结果" },
  "fig.section.Failure Analysis": { en: "Failure Analysis", zh: "失败分析" },
  "fig.section.Iterative Analysis": { en: "Iterative Analysis", zh: "迭代分析" },
  // Figure captions (one entry per figure id from mock.json)
  "fig.caption.intro": {
    en: "Overview of PDEAgent-Bench: motivation, limitations of general code benchmarks, benchmark data structure, and the staged evaluation protocol.",
    zh: "PDEAgent-Bench 总览：动机、通用代码基准的局限、基准数据结构以及分级评估协议。",
  },
  "fig.caption.method": {
    en: "PDEAgent-Bench evaluation pipeline from PDE case specification to sandboxed execution and staged assessment (Execution → Accuracy → Time).",
    zh: "PDEAgent-Bench 评估流水线：从 PDE 实例规约到沙箱执行，再到分级评估（执行 → 精度 → 时间）。",
  },
  "fig.caption.backend_eqtype_firedrake": {
    en: "Single-shot pass rates (%) by PDE family on the Firedrake track. Solid lines: base LLMs; dashed lines: code/PDE agents. Unavailable family–library pairs are omitted.",
    zh: "Firedrake 赛道上各 PDE 家族的单次通过率（%）。实线：基座 LLM；虚线：代码/PDE 代理。未支持的家族-库组合已略去。",
  },
  "fig.caption.backend_eqtype_dealii": {
    en: "Single-shot pass rates (%) by PDE family on the deal.II track — the hardest of the three FEM-library tracks under the current composition.",
    zh: "deal.II 赛道上各 PDE 家族的单次通过率（%）——在当前组合下，这是三条 FEM 库赛道中最难的一条。",
  },
  "fig.caption.failure_stages_dolfinx": {
    en: "Failure-stage breakdown on DOLFINx: each bar splits into Pass, F-Exec (execution failure), F-Acc (accuracy failure), and F-Time (timeout failure).",
    zh: "DOLFINx 上的失败阶段构成：每根条柱按通过（Pass）、执行失败（F-Exec）、精度失败（F-Acc）、超时失败（F-Time）划分。",
  },
  "fig.caption.iterative_dolfinx": {
    en: "GPT-5.4 pass rates on DOLFINx under single-shot vs. three-attempt execution-feedback settings — extra attempts mostly recover execution-stage failures.",
    zh: "GPT-5.4 在 DOLFINx 上单次 vs. 三次执行反馈设置下的通过率——多次尝试主要修复了执行阶段的失败。",
  },

  // PDE Coverage
  "pde.tag": { en: "Coverage", zh: "覆盖范围" },
  "pde.title": { en: "11 PDE Families · 645 Cases", zh: "11 个 PDE 家族 · 645 个实例" },
  "pde.desc": {
    en: "Six mathematical categories spanning elliptic, parabolic, hyperbolic, mixed-type, incompressible-flow, and reaction-diffusion regimes — every case includes a problem spec, a reference solution on a prescribed grid, and per-case accuracy and runtime targets.",
    zh: "六大数学类别——椭圆、抛物、双曲、混合型、不可压流动与反应扩散——每个实例都包含问题规约、规定网格上的参考解，以及逐实例的精度与运行时目标。",
  },
  "pde.legendLabel": { en: "FEM-library abbreviations:", zh: "FEM 库缩写：" },
  "pde.filter.all": { en: "All", zh: "全部" },
  "pde.filter.elliptic": { en: "Elliptic", zh: "椭圆型" },
  "pde.filter.parabolic": { en: "Parabolic", zh: "抛物型" },
  "pde.filter.hyperbolic": { en: "Hyperbolic", zh: "双曲型" },
  "pde.filter.mixed_type": { en: "Mixed type", zh: "混合型" },
  "pde.filter.incompressible_flow": { en: "Incompressible flow", zh: "不可压流动" },
  "pde.filter.reaction_diffusion": { en: "Reaction–diffusion", zh: "反应扩散" },
  "pde.libraryTracks": { en: "Library tracks", zh: "库赛道" },
  "pde.equationLabel": { en: "Governing equation", zh: "控制方程" },
  "pde.casesUnit": { en: "{{n}} cases", zh: "{{n}} 个实例" },
  "pde.casesLabel": { en: "cases", zh: "实例" },
  "pde.matchCount": { en: "{{n}} of {{m}} families", zh: "{{m}} 个家族中的 {{n}} 个" },
  "pde.legendTail.en": {
    en: "The number after each label is the per-family case count on that FEM-library track; greyed-out entries mean the family is not included for that library.",
    zh: "每个缩写后的数字表示该 FEM 库赛道上对应家族的实例数；灰色条目表示该家族未包含在该库中。",
  },

  // Leaderboard
  "lb.tag": { en: "Results", zh: "结果" },
  "lb.title": { en: "Leaderboard", zh: "排行榜" },
  "lb.desc": {
    en: "Single-shot pass rates on each FEM-library track. Pass requires clearing all three gates (execution → accuracy → runtime).",
    zh: "各 FEM 库赛道上的单次（single-shot）通过率。通过需依次满足执行、精度、运行时三道关卡。",
  },
  "lb.col.rank": { en: "Rank", zh: "排名" },
  "lb.col.system": { en: "System", zh: "系统" },
  "lb.col.provider": { en: "Provider", zh: "厂商" },
  "lb.col.backend": { en: "FEM Library", zh: "FEM 库" },
  "lb.col.passRate": { en: "Pass Rate", zh: "通过率" },
  "lb.col.cost": { en: "Cost / 1K", zh: "千例成本" },
  "lb.filter.all": { en: "All", zh: "全部" },
  "lb.titleSection": { en: "Single-Shot Pass Rates", zh: "单次通过率" },
  "lb.tagSection": { en: "Rankings", zh: "排名" },
  "lb.descSection": {
    en: "Single-shot case-level pass rates by FEM library track. DOLFINx is the primary track (645 cases, 11 families); Firedrake and deal.II are reduced cross-library tracks. Numbers are taken directly from Tables 2 and 9 of the paper.",
    zh: "按 FEM 库赛道给出的单次实例级通过率。DOLFINx 是主赛道（645 实例、11 个家族），Firedrake 与 deal.II 是缩减后的跨库赛道。数据直接取自论文表 2 与表 9。",
  },
  "lb.note": {
    en: "API cost is the total spend across all three FEM-library tracks (Table 9).",
    zh: "API 成本为三条 FEM 库赛道上的总花费（见表 9）。",
  },
  "lb.col.hash": { en: "#", zh: "#" },
  "lb.col.model": { en: "Model", zh: "模型" },
  "lb.col.type": { en: "Type", zh: "类型" },
  "lb.col.apiCost": { en: "API Cost", zh: "API 成本" },
  "lb.tag.agent": { en: "Agent", zh: "代理" },
  "lb.type.agent": { en: "Code/PDE Agent", zh: "代码/PDE 代理" },
  "lb.type.llm": { en: "Base LLM", zh: "基座 LLM" },
  "lb.loading": { en: "Loading…", zh: "加载中…" },
  "lb.empty": { en: "No rows.", zh: "暂无数据。" },

  // ResultsExplorer
  "explorer.tag": { en: "Interactive", zh: "交互分析" },
  "explorer.title": { en: "Results Explorer", zh: "结果浏览器" },
  "explorer.desc": {
    en: "Compare per-PDE-family pass rates across all 8 evaluated systems on each FEM-library track. Numbers are taken verbatim from Tables 2 and 9 of the paper.",
    zh: "在每个 FEM 库赛道上对比 8 个被评估系统在各 PDE 家族上的通过率，数据直接取自论文的表 2 与表 9。",
  },
  "explorer.label.femLibrary": { en: "FEM library", zh: "FEM 库" },
  "explorer.label.tracksFams": {
    en: "· {{n}} PDE families on this track · {{m}} systems",
    zh: "· 该赛道含 {{n}} 个 PDE 家族 · {{m}} 个系统",
  },
  "explorer.radarTitle": { en: "Per-PDE Pass Rate (single-shot)", zh: "各 PDE 家族通过率（单次）" },
  "explorer.radarSub": { en: "radar · 0–100%", zh: "雷达图 · 0–100%" },
  "explorer.barTitle": { en: "Overall Pass Rate", zh: "总体通过率" },
  "explorer.barSub": { en: "bars · %", zh: "柱状图 · %" },
  "explorer.axisLegend": { en: "Axis abbreviations:", zh: "轴上的缩写：" },

  // EvaluationPipeline
  "eval.tag": { en: "Evaluation", zh: "评估方法" },
  "eval.title": { en: "Three-Stage Gate System", zh: "三段式门控评估" },
  "eval.desc": {
    en: "Each generated solver is evaluated through a staged protocol that mirrors real scientific workflows: first executability, then numerical accuracy, then computational efficiency.",
    zh: "每个生成的求解器都按照与真实科研流程一致的分级协议评估：先看是否可执行，再看数值精度，最后看计算效率。",
  },
  "eval.gate.exec.name": { en: "Execution Gate", zh: "执行关卡" },
  "eval.gate.exec.desc": {
    en: "Code runs without syntax errors, import failures, or runtime exceptions within timeout.",
    zh: "代码在超时之内运行，无语法错误、导入失败或运行时异常。",
  },
  "eval.gate.acc.name": { en: "Accuracy Gate", zh: "精度关卡" },
  "eval.gate.acc.desc": {
    en: "Relative L₂ error vs. the oracle solution falls below threshold (default 10×).",
    zh: "相对 L₂ 误差不超过参考解的阈值（默认 10×）。",
  },
  "eval.gate.time.name": { en: "Time Gate", zh: "时间关卡" },
  "eval.gate.time.desc": {
    en: "Wall-clock runtime is within tolerance of the oracle solver (default 3×).",
    zh: "墙钟运行时间不超过参考求解器的容差（默认 3×）。",
  },
  "eval.metric.l2": { en: "Relative L₂ Error", zh: "相对 L₂ 误差" },
  "eval.metric.l2.note": { en: "on the prescribed evaluation grid.", zh: "在规定的评估网格上计算。" },
  "eval.metric.runtime": { en: "Runtime", zh: "运行时" },
  "eval.metric.runtime.desc": {
    en: "Wall-clock execution time in an isolated sandbox with controlled resources.",
    zh: "在资源受控的隔离沙箱中测得的墙钟执行时间。",
  },
  "eval.metric.passRate": { en: "Pass Rate", zh: "通过率" },
  "eval.metric.passRate.desc": {
    en: "Fraction of cases passing all three gates.",
    zh: "通过全部三道关卡的实例占比。",
  },
  "eval.metric.cost": { en: "Cost / 1K", zh: "千例成本" },
  "eval.metric.cost.desc": {
    en: "Total API cost in USD per 1,000 benchmark cases.",
    zh: "每 1,000 个基准实例的 API 总成本（美元）。",
  },

  // Findings
  "findings.tag": { en: "Key Findings", zh: "主要发现" },
  "findings.title": { en: "What we learned", zh: "我们的观察" },
  "findings.desc": {
    en: "Eight headline takeaways from running the benchmark across frontier LLMs and code agents.",
    zh: "在前沿 LLM 与代码代理上运行基准后得到的八条核心结论。",
  },
  "findings.label.finding": { en: "finding", zh: "发现" },

  // Error analysis
  "errors.tag": { en: "Diagnostics", zh: "错误分析" },
  "errors.title": { en: "Where pass rate is lost", zh: "通过率损失在哪里？" },
  "errors.desc": {
    en: "The benchmark splits each non-pass into one of three staged failure types — F-Exec, F-Acc, F-Time. This panel shows the per-model breakdown on DOLFINx, the most frequent error patterns observed across submissions, and four representative case-level walkthroughs.",
    zh: "基准把每次未通过都归入三类分级失败：F-Exec（执行失败）、F-Acc（精度失败）、F-Time（超时失败）。本节展示 DOLFINx 上各模型的失败构成、最常见的错误模式以及四个有代表性的实例级走查。",
  },
  "errors.chartTitle": {
    en: "Failure-stage breakdown · DOLFINx (single-shot)",
    zh: "失败阶段构成 · DOLFINx（单次）",
  },
  "errors.chartSub": { en: "% of 645 cases", zh: "占 645 实例的百分比" },
  "errors.legendTitle": { en: "What each stage means", zh: "每个阶段的含义" },
  "errors.patterns": { en: "Common error patterns", zh: "常见错误模式" },
  "errors.examples": { en: "Concrete examples", zh: "具体示例" },
  "errors.walkthrough.title": {
    en: "Walkthrough cases · Gemini 3.1 Pro on DOLFINx",
    zh: "实例级走查 · DOLFINx 上的 Gemini 3.1 Pro",
  },
  "errors.walkthrough.sub": { en: "Appendix A of the paper", zh: "对应论文附录 A" },
  "errors.walkthrough.col.case": { en: "Case", zh: "实例" },
  "errors.walkthrough.col.family": { en: "Family", zh: "家族" },
  "errors.walkthrough.col.domain": { en: "Domain", zh: "区域" },
  "errors.walkthrough.col.verdict": { en: "Verdict", zh: "判定" },
  "errors.walkthrough.footnote": {
    en: "† accuracy floor active: when 10·e_base < 10⁻⁶, the threshold is clamped to τ_acc = 10⁻⁶.",
    zh: "† 精度下限触发：当 10·e_base < 10⁻⁶ 时，阈值被截断为 τ_acc = 10⁻⁶。",
  },

  // Stages
  "stage.fexec.blurb": {
    en: "Generated program fails to run, crashes, or returns an invalid output artifact. Dominant failure mode for weaker systems.",
    zh: "生成程序无法运行、崩溃或返回非法的输出文件。这是较弱系统最主要的失败模式。",
  },
  "stage.facc.blurb": {
    en: "Code runs and produces a valid solution, but the relative L² error exceeds the per-case accuracy threshold derived from a calibration baseline.",
    zh: "代码可运行并产生合法解，但相对 L² 误差超过了由校准基线推得的逐实例精度阈值。",
  },
  "stage.ftime.blurb": {
    en: "Solver passes execution and accuracy checks but exceeds the runtime gate (3× calibration-baseline runtime).",
    zh: "求解器通过了执行与精度检查，但超过了运行时关卡（3 倍校准基线运行时）。",
  },
  "stage.pass.blurb": { en: "All three staged gates cleared.", zh: "三道关卡全部通过。" },

  // Getting started
  "gs.tag": { en: "Quick Start", zh: "快速开始" },
  "gs.title": { en: "Getting Started", zh: "上手运行" },
  "gs.desc": {
    en: "Run PDEAgent-Bench in minutes. Pick your backend — DOLFINx, Firedrake, or deal.II.",
    zh: "几分钟内即可运行 PDEAgent-Bench。从 DOLFINx、Firedrake、deal.II 中任选一个后端。",
  },
  "gs.step.clone": { en: "Clone & Install", zh: "克隆并安装" },
  "gs.step.keys": { en: "Configure API Keys", zh: "配置 API 密钥" },
  "gs.step.run": { en: "Run Evaluation", zh: "运行评估" },
  "gs.copy": { en: "Copy", zh: "复制" },
  "gs.copied": { en: "Copied", zh: "已复制" },

  // Citation
  "cite.tag": { en: "Citation", zh: "引用" },
  "cite.title": { en: "Cite Our Work", zh: "引用我们的工作" },
  "cite.copy": { en: "Copy BibTeX", zh: "复制 BibTeX" },
  "cite.copied": { en: "Copied", zh: "已复制" },

  // Authors
  "authors.tag": { en: "Team", zh: "团队" },
  "authors.title": { en: "Authors", zh: "作者" },
  "authors.equalNote": { en: "equal contribution", zh: "共同贡献" },
  "authors.correspondingNote": { en: "corresponding author", zh: "通讯作者" },

  // Affiliations
  "aff.tag": { en: "Affiliations", zh: "所属机构" },

  // Footer
  "footer.brand": { en: "PDEAgent-Bench", zh: "PDEAgent-Bench" },
  "footer.copyright": { en: "© 2026 PDEAgent-Bench. All rights reserved.", zh: "© 2026 PDEAgent-Bench 版权所有。" },
  "footer.backToTop": { en: "Back to top ↑", zh: "返回顶部 ↑" },

  // Paper reader
  "paper.back": { en: "Back to site", zh: "返回主页" },
  "paper.preview": { en: "preview", zh: "预览" },
  "paper.contents": { en: "Contents", zh: "目录" },
  "paper.code": { en: "Code", zh: "代码仓库" },
  "paper.dataset": { en: "Dataset", zh: "数据集" },
  "paper.contact": { en: "Contact", zh: "联系" },
  "paper.mockedNote": { en: "mocked arXiv link", zh: "占位的 arXiv 链接" },
  "paper.pdfMockAlert": {
    en: "PDF link will be available once the paper is posted on arXiv.",
    zh: "论文上线 arXiv 后即可下载 PDF。",
  },
  "paper.previewNote": {
    en: "This in-browser preview is rendered from the same source data the rest of the site uses; the official PDF and arXiv listing will replace the placeholder identifiers above once the paper is posted.",
    zh: "本页内的预览与站点其余部分共用同一份数据源；论文正式上线 arXiv 后，上方的占位标识将被替换为正式的 PDF 与 arXiv 链接。",
  },
  "paper.section.abstract": { en: "Abstract", zh: "摘要" },
  "paper.section.intro": { en: "1  Introduction", zh: "一  引言" },
  "paper.section.task": { en: "2  Task Formulation", zh: "二  任务定义" },
  "paper.section.method": { en: "3  Method", zh: "三  方法" },
  "paper.section.results": { en: "4  Results", zh: "四  实验结果" },
  "paper.section.failure": { en: "5  Failure-Stage Analysis", zh: "五  失败阶段分析" },
  "paper.section.iterative": { en: "6  Iterative Execution Feedback", zh: "六  迭代式执行反馈" },
  "paper.section.conclusion": { en: "7  Conclusion", zh: "七  结论" },
  "paper.section.bibtex": { en: "Citation", zh: "引用" },
  "paper.intro.p1": {
    en: "PDE-to-solver code generation aims to translate a partial differential equation specification into an executable numerical solver. Unlike general code-generation tasks, success is not determined by syntactic correctness or unit-test coverage alone: a program may run yet impose wrong physical constraints, fail to converge, or exceed practical runtime budgets.",
    zh: "PDE-到-求解器代码生成的目标是把偏微分方程的规约自动翻译为可执行的数值求解器。与通用代码生成不同，成功与否并不仅由语法正确性或单元测试覆盖率决定：程序可以运行，但仍可能施加错误的物理约束、不收敛，或超出实用的运行时预算。",
  },
  "paper.intro.p2": {
    en: "We introduce PDEAgent-Bench, the first multi-metric, multi-library benchmark for PDE-to-solver code generation. The benchmark contains 645 instances across 6 mathematical categories and 11 PDE families, evaluated on three professional FEM libraries: DOLFINx (Python), Firedrake (Python), and deal.II (C++).",
    zh: "我们提出 PDEAgent-Bench——据我们所知首个面向 PDE-到-求解器代码生成的多指标、多库基准。该基准包含跨越 6 个数学类别、11 个 PDE 家族的 645 个实例，并在三个专业 FEM 库（DOLFINx、Firedrake、deal.II）上进行评估。",
  },
  "paper.task.p1": {
    en: "Each instance provides an agent-facing problem specification, a hidden reference solution u_GT, a prescribed evaluation grid, and case-specific accuracy and runtime targets. For any submitted solution u we compute the relative L² error on the evaluation grid:",
    zh: "每个实例都提供代理可见的问题规约、隐藏参考解 u_GT、规定的评估网格，以及逐实例的精度与运行时目标。对于任意提交解 u，我们在评估网格上计算相对 L² 误差：",
  },
  "paper.task.p2": {
    en: "and use it as the primary accuracy metric (or the absolute error if the reference is identically zero, to avoid division by zero).",
    zh: "并将其作为主要精度指标（若参考解恒为零，则改用绝对误差以避免除零）。",
  },
  "paper.task.p3.pre": { en: "Let ", zh: "记 " },
  "paper.task.p3.mid": {
    en: " denote the calibration-baseline error and ",
    zh: " 为校准基线误差，",
  },
  "paper.task.p3.tail": { en: " the calibration runtime. The accuracy gate is", zh: " 为校准运行时。精度关卡为：" },
  "paper.task.p4.pre": { en: "and the runtime gate is ", zh: "运行时关卡为 " },
  "paper.task.p4.tail": {
    en: ". A submission passes only if it clears execution, then accuracy, then runtime, in that order.",
    zh: "。仅当提交依次通过执行、精度、运行时三道关卡，才算通过。",
  },
  "paper.method.p1": {
    en: "Our evaluation pipeline takes a PDE case specification, hands it to the model under a consistent agent-facing contract, runs the generated solver in a sandbox, and applies the staged evaluation framework. Generation, execution, and scoring are intentionally decoupled so that no evaluator-only metadata leaks into the prompt.",
    zh: "评估流水线接收 PDE 实例规约，按一致的代理可见接口交给模型，在沙箱中运行生成的求解器，并应用分级评估框架。生成、执行、评分被有意解耦，以避免任何仅评估者可见的元数据泄露到提示词中。",
  },
  "paper.results.p1": {
    en: "On the primary DOLFINx track, Gemini 3.1 Pro achieves the highest overall pass rate at 54.1%, followed by Opus 4.7 (47.8%), GPT-5.4 (46.0%), CodePDE (44.7%), and OpenHands (43.6%). The narrow spread among these top systems suggests that, in the no-feedback single-shot setting, agentic scaffolding does not yield a consistent advantage over direct generation by strong base LLMs.",
    zh: "在主赛道 DOLFINx 上，Gemini 3.1 Pro 以 54.1% 的总体通过率领先，紧随其后是 Opus 4.7（47.8%）、GPT-5.4（46.0%）、CodePDE（44.7%）和 OpenHands（43.6%）。头部系统之间的差距很小，说明在无反馈的单次设置下，代理式脚手架相对强基座 LLM 直接生成并不具有稳定优势。",
  },
  "paper.results.p2": {
    en: "A substantial gap opens below this cluster: Qwen3.6-Plus reaches 23.4%, while DeepSeek V3.2 (4.2%) and Mini-SWE-Agent (3.7%) fail on nearly all instances — overwhelmingly at the execution stage.",
    zh: "之后则出现显著断层：Qwen3.6-Plus 仅达 23.4%，而 DeepSeek V3.2（4.2%）和 Mini-SWE-Agent（3.7%）在绝大多数实例上失败——几乎全部卡在执行阶段。",
  },
  "paper.failure.p1": {
    en: "We decompose every single-shot outcome into four mutually exclusive labels: Pass, execution failure (F-Exec), accuracy failure (F-Acc), and timeout failure (F-Time). F-Exec is the dominant failure source for most models and library tracks. Stronger systems show more distributed profiles — once basic executability is achieved, numerical accuracy and computational efficiency become the next bottlenecks.",
    zh: "我们把每个单次结果分成四个互斥类：通过（Pass）、执行失败（F-Exec）、精度失败（F-Acc）、超时失败（F-Time）。在大多数模型和库赛道上，F-Exec 是主要失败来源。更强的系统失败分布更分散——一旦获得基本可执行性，数值精度与计算效率便成为下一个瓶颈。",
  },
  "paper.failure.p2": {
    en: "The failure profile also varies across libraries. On deal.II, Gemini 3.1 Pro and Opus 4.7 show elevated F-Time rates of 35.1% and 24.3%, indicating that solver configuration and resource efficiency remain challenging on the C++ track. On Firedrake, Gemini 3.1 Pro has a high F-Acc rate of 40.2%, suggesting many failures arise from numerical errors related to variational forms, boundary-condition handling, or output interpolation.",
    zh: "失败构成也随库不同而变化。deal.II 上，Gemini 3.1 Pro 与 Opus 4.7 的 F-Time 分别达 35.1% 与 24.3%，表明 C++ 赛道上求解器配置与资源效率仍然棘手。Firedrake 上，Gemini 3.1 Pro 的 F-Acc 高达 40.2%，提示许多失败源于变分形式、边界条件处理或输出插值方面的数值误差。",
  },
  "paper.iterative.p1": {
    en: "In a three-attempt iterative protocol with execution feedback (no reference leakage), GPT-5.4 improves from 46.0% → 59.8% on DOLFINx, 38.0% → 43.7% on Firedrake, and 19.2% → 26.8% on deal.II. The largest gain on DOLFINx confirms that a substantial fraction of single-shot failures arise from repairable compilation errors, runtime errors, output-format issues, or library-API mistakes — but failures requiring correct numerical formulation, discretization choice, or solver configuration largely persist.",
    zh: "在三次尝试、带执行反馈（不泄露参考解）的迭代协议下，GPT-5.4 在 DOLFINx 上从 46.0% 提升至 59.8%，Firedrake 从 38.0% 提升至 43.7%，deal.II 从 19.2% 提升至 26.8%。DOLFINx 上的最大增益印证了相当一部分单次失败来自可修复的编译错误、运行时错误、输出格式或库 API 误用——但需要正确数值表述、离散化选择或求解器配置的失败基本仍然存在。",
  },
  // ErrorAnalysis common-error patterns
  "ea.fexec.api.title": { en: "FEM library API misuse", zh: "FEM 库 API 误用" },
  "ea.fexec.api.detail": {
    en: "Calls to library APIs that don't exist in the target version, wrong import paths, or wrong argument order — particularly common when models confuse legacy FEniCS with FEniCSx (DOLFINx) or mix Firedrake / deal.II conventions.",
    zh: "调用了目标版本中并不存在的 API、错误的导入路径或错误的参数顺序——尤其常见的是把旧版 FEniCS 与 FEniCSx（DOLFINx）混淆，或把 Firedrake / deal.II 的写法弄混。",
  },
  "ea.fexec.artifact.title": { en: "Invalid output artifact / wrong shape", zh: "输出文件非法 / 形状错误" },
  "ea.fexec.artifact.detail": {
    en: "Solver returns successfully but writes solution.npz with wrong field names, wrong array shape, or non-finite values inside the domain — the evaluator rejects the artifact at the format-check step.",
    zh: "求解器虽然成功返回，但写出的 solution.npz 字段名错误、数组形状错误、或区域内含非有限值——评估器在格式检查阶段就会拒绝。",
  },
  "ea.fexec.dep.title": { en: "Missing dependency / wrong entry point", zh: "缺失依赖 / 入口错误" },
  "ea.fexec.dep.detail": {
    en: "Generated solver imports a package not in the sandbox, defines no top-level solve() entry, or has a Python-side syntax error that prevents the evaluator from invoking it.",
    zh: "生成的求解器导入了沙箱中不存在的包，没有定义顶层 solve() 入口，或者存在 Python 语法错误，导致评估器根本无法调用。",
  },
  "ea.facc.weak.title": { en: "Incorrect weak form or coefficient sign", zh: "弱形式错误或系数符号错" },
  "ea.facc.weak.detail": {
    en: "Code runs but the variational form is mathematically wrong: a sign flip on the Laplacian, missing the boundary integral term, or a coefficient applied to the wrong test function.",
    zh: "代码可运行，但变分形式数学上不对：拉普拉斯项符号反了、缺失边界积分项，或者把系数乘到了错误的测试函数上。",
  },
  "ea.facc.bc.title": { en: "Boundary-condition misapplication", zh: "边界条件用错" },
  "ea.facc.bc.detail": {
    en: "Dirichlet data applied to the wrong sub-boundary, Neumann fluxes treated as essential BCs, or non-homogeneous data not lifted into the bilinear form correctly.",
    zh: "Dirichlet 数据被加到了错误的边界片，或把 Neumann 通量当作本质边界处理，或非齐次数据未被正确地提升到双线性形式中。",
  },
  "ea.facc.mesh.title": { en: "Insufficient mesh resolution", zh: "网格分辨率不足" },
  "ea.facc.mesh.detail": {
    en: "Mesh is too coarse for the case's accuracy gate — usually triggered for high-wavenumber Helmholtz, sharp boundary layers in convection-diffusion, or thin Stokes channel flows.",
    zh: "网格过粗、达不到该实例的精度阈值——常见于高波数 Helmholtz、对流扩散中的陡边界层，以及狭窄的 Stokes 通道流。",
  },
  "ea.ftime.solver.title": { en: "Suboptimal solver / preconditioner", zh: "求解器 / 预条件器选择不佳" },
  "ea.ftime.solver.detail": {
    en: "Defaulting to a dense direct solver, calling LU on a 10⁵-DOF system, or running CG without a preconditioner pushes runtime past the 3× calibration gate.",
    zh: "默认使用稠密直接求解器、在 10⁵ 自由度的系统上调用 LU，或在没有预条件器的情况下运行 CG，都会让运行时超过 3 倍校准阈值。",
  },
  "ea.ftime.refine.title": { en: "Over-refined mesh / over-strict tolerances", zh: "过度加密网格 / 容差过严" },
  "ea.ftime.refine.detail": {
    en: "Generated code adds defensive global refinement or sets KSP/SNES tolerances multiple orders below what's needed, paying for accuracy already inside the gate.",
    zh: "生成的代码出于保险做了全局加密，或把 KSP/SNES 容差设到了远低于必要的数量级，为已经达标的精度付出了多余成本。",
  },
  "ea.ftime.assemble.title": { en: "Redundant assembly inside time loop", zh: "时间循环中重复装配" },
  "ea.ftime.assemble.detail": {
    en: "Re-assembling time-independent matrices on every step turns an O(NT) cost into O(N²T) — common on Heat, Burgers, and Wave cases.",
    zh: "在每个时间步都重新装配本不随时间变化的矩阵，会把 O(NT) 的开销膨胀成 O(N²T)——在 Heat、Burgers、Wave 实例中很常见。",
  },

  // Findings (parallel to mock.json findings array)
  "finding.1.title": { en: "Top model reaches only 54.1% pass rate", zh: "最强模型也只有 54.1% 的通过率" },
  "finding.1.body": {
    en: "Even Gemini 3.1 Pro, the strongest system on the primary DOLFINx track, clears all three gates on just over half of the 645 cases. PDE-to-solver code generation remains far from solved.",
    zh: "即便是在主赛道 DOLFINx 上表现最好的 Gemini 3.1 Pro，也仅在 645 个实例中略超一半的实例上通过全部三道关卡。PDE-到-求解器代码生成仍远未被解决。",
  },
  "finding.2.title": { en: "Agent scaffolds don't beat strong base LLMs in single-shot", zh: "单次设置下，代理脚手架未能超越强基座 LLM" },
  "finding.2.body": {
    en: "CodePDE (44.7%) and OpenHands (43.6%) sit just below GPT-5.4 (46.0%) on DOLFINx, while top base LLMs Gemini 3.1 Pro (54.1%) and Opus 4.7 (47.8%) lead. In the no-feedback setting, agentic scaffolding does not yield a consistent advantage.",
    zh: "DOLFINx 上，CodePDE（44.7%）与 OpenHands（43.6%）仅略低于 GPT-5.4（46.0%），而 Gemini 3.1 Pro（54.1%）与 Opus 4.7（47.8%）领跑。在无反馈设置下，代理式脚手架并未带来稳定优势。",
  },
  "finding.3.title": { en: "Execution failures dominate the bottom of the field", zh: "末位系统几乎完全卡在执行阶段" },
  "finding.3.body": {
    en: "DeepSeek V3.2 (4.2%) and Mini-SWE-Agent (3.7%) fail almost entirely at the execution stage — they still struggle to generate runnable code against complex FEM library APIs.",
    zh: "DeepSeek V3.2（4.2%）和 Mini-SWE-Agent（3.7%）的失败几乎全部出现在执行阶段——它们在面对复杂 FEM 库 API 时还很难生成可运行的代码。",
  },
  "finding.4.title": { en: "Cross-library transfer is a major bottleneck", zh: "跨库迁移是主要瓶颈" },
  "finding.4.body": {
    en: "Pass rates drop substantially on Firedrake and deal.II relative to DOLFINx. Even the strongest model on deal.II — Gemini 3.1 Pro — reaches only 32.3%, exposing the gap when moving from Python to a C++-based FEM library.",
    zh: "相比 DOLFINx，Firedrake 与 deal.II 上的通过率显著下降。即便是 deal.II 上最强的 Gemini 3.1 Pro 也只有 32.3%，凸显了从 Python 到 C++ FEM 库的迁移差距。",
  },
  "finding.5.title": { en: "Stokes is the hardest family on DOLFINx", zh: "DOLFINx 上 Stokes 是最难的家族" },
  "finding.5.body": {
    en: "Most systems remain below 25% on Stokes; only GPT-5.4 reaches 34.4%. Saddle-point structure, pressure null-space handling, and inf-sup compatibility remain difficult for current systems.",
    zh: "大多数系统在 Stokes 上低于 25%，仅 GPT-5.4 达到 34.4%。鞍点结构、压力零空间处理与 inf-sup 兼容性对当前系统而言仍然困难。",
  },
  "finding.6.title": { en: "Per-family strengths are model-specific", zh: "各家族强项因模型而异" },
  "finding.6.body": {
    en: "Gemini 3.1 Pro reaches 77.2% on Biharmonic, Opus 4.7 leads on Helmholtz and Linear Elasticity, GPT-5.4 leads on Stokes — capability is far from uniform across PDE types.",
    zh: "Gemini 3.1 Pro 在 Biharmonic 上达到 77.2%，Opus 4.7 在 Helmholtz 与 Linear Elasticity 上领先，GPT-5.4 在 Stokes 上领先——各 PDE 类型上的能力远非均衡。",
  },
  "finding.7.title": { en: "Once executable, accuracy and runtime become the next walls", zh: "一旦可执行，精度与运行时就成为下一道墙" },
  "finding.7.body": {
    en: "For stronger systems, execution failures shrink and F-Acc / F-Time grow. On deal.II, Gemini 3.1 Pro and Opus 4.7 hit timeout-failure (F-Time) rates of 35.1% and 24.3% respectively — solver configuration and resource efficiency are the next-level challenges.",
    zh: "对更强的系统而言，执行失败减少，F-Acc / F-Time 上升。deal.II 上，Gemini 3.1 Pro 和 Opus 4.7 的 F-Time 分别达 35.1% 与 24.3%——求解器配置与资源效率成为新的挑战。",
  },
  "finding.8.title": { en: "Compute envelope is modest", zh: "计算开销可控" },
  "finding.8.body": {
    en: "The full benchmark across 8 systems × 3 FEM-library tracks consumed 11,744 calls, ~62.9M input tokens, ~27.7M output tokens, and ~$505 USD in API costs — making PDEAgent-Bench a tractable evaluation target.",
    zh: "覆盖 8 个系统 × 3 条 FEM 库赛道的完整基准共消耗 11,744 次调用、约 62.9M 输入 token、约 27.7M 输出 token、约 505 美元 API 成本——PDEAgent-Bench 是一个可负担的评估目标。",
  },

  // Abstract override for Chinese (when lang=zh, replaces data.abstract)
  "abstract.zhOverride": {
    en: "",
    zh: "PDE-到-求解器代码生成的目标是从偏微分方程（PDE）规约自动合成可执行的数值求解器。该任务不仅要求理解 PDE 的数学结构，还要求选择合适的离散化方案与求解器配置，并在有限元方法（FEM）库中正确地实现得到的形式。已有代码生成基准主要评估语法正确性或预定义测试用例的成功率；据我们所知，目前并没有专门面向 PDE-到-求解器代码生成的公开基准，而通用代码基准也无法充分刻画数值 PDE 求解的独特挑战，例如保证求解精度、效率以及与专业 FEM 库的兼容性。\n\n我们提出 PDEAgent-Bench——据我们所知首个面向 PDE-到-求解器代码生成的多指标、多库基准。PDEAgent-Bench 包含跨 6 个数学类别、11 个 PDE 家族的 645 个实例，并支持常见的 FEM 库 DOLFINx、Firedrake 与 deal.II。每个实例都提供代理可见的问题规约、规定评估网格上的参考解，以及逐实例的精度与运行时目标。PDEAgent-Bench 采用分级评估框架，生成的求解器需依次通过可执行性、数值精度与计算效率检查。在代表性 LLM 与代码代理上的实验表明：模型通常能产出可运行代码，但一旦施加精度与效率要求，通过率就会显著下降。这些结果说明当前代理在产出数值可靠且高效的 PDE 求解器方面仍受限，而 PDEAgent-Bench 则提供了一个紧贴数值 PDE 求解实际需求的可复现测试床。",
  },

  "paper.conclusion.p1": {
    en: "PDEAgent-Bench provides a reproducible testbed grounded in the practical requirements of numerical PDE solving. Current frontier systems can often produce runnable code, but their pass rate drops substantially once accuracy and efficiency requirements are enforced. We hope this benchmark accelerates work on agents that produce numerically reliable and efficient PDE solvers.",
    zh: "PDEAgent-Bench 提供了一个紧扣数值 PDE 求解实际需求的可复现测试床。当前前沿系统通常能产出可运行的代码，但一旦加入精度与效率要求，通过率就会显著下降。我们希望这一基准能加速对“能产出数值可靠且高效的 PDE 求解器”的智能体研究。",
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: keyof typeof dict, vars?: Record<string, string | number>) => string;
};

const LangContext = createContext<Ctx | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const hash = window.location.hash.toLowerCase();
  if (hash.includes("lang=zh")) return "zh";
  if (hash.includes("lang=en")) return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "zh" || stored === "en") return stored;
  // Auto-detect from browser language.
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readInitialLang());

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore quota / private mode
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const toggle = useCallback(() => setLang(lang === "en" ? "zh" : "en"), [lang, setLang]);

  const t = useCallback(
    (key: keyof typeof dict, vars?: Record<string, string | number>) => {
      const entry = dict[key];
      if (!entry) return String(key);
      let s = entry[lang] ?? entry.en;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
        }
      }
      return s;
    },
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LangContext.Provider>
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

export function useT() {
  return useLang().t;
}
