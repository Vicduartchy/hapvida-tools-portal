/* Design System HAC — Centro de Operações Azul Clínico.
   Este arquivo mantém as ferramentas existentes intactas e atua apenas como catálogo/navegação.
   A interface prioriza contexto, status, busca e acesso rápido às páginas HTML preservadas. */
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  Command,
  ExternalLink,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  Menu,
  Network,
  PanelLeft,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

type ToolCategory = "Análise" | "Governança" | "Portal";

type Tool = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ToolCategory;
  icon: typeof Activity;
  accent: string;
  status: string;
  version: string;
  tags: string[];
  updated: string;
};

const ASSET_BASE = import.meta.env.BASE_URL;

const tools: Tool[] = [
  {
    slug: "dashboard-sms-squads",
    name: "Dashboard SMs x Squads 2.0",
    shortName: "SMs x Squads 2.0",
    description: "Base operacional de pessoas, squads, diretorias, boards e capacidade.",
    category: "Governança",
    icon: Network,
    accent: "blue",
    status: "Fonte de referência",
    version: "2.0",
    tags: ["SMs", "Squads", "Boards"],
    updated: "Base 2.0",
  },
  {
    slug: "horas-sem-rastreabilidade",
    name: "Horas sem Rastreabilidade",
    shortName: "Horas sem origem",
    description: "Identifique horas sem origem, classifique ocorrências e prepare comunicações.",
    category: "Análise",
    icon: Clock3,
    accent: "amber",
    status: "Operacional",
    version: "1.1",
    tags: ["Horas", "Task avulsa", "WhatsApp"],
    updated: "Atualizada",
  },
  {
    slug: "qualidade-entregas",
    name: "Qualidade das Entregas",
    shortName: "Qualidade",
    description: "Acompanhe bugs, defects, incidents, aging e fechamento por squad.",
    category: "Análise",
    icon: ShieldCheck,
    accent: "green",
    status: "Operacional",
    version: "1.0",
    tags: ["Bugs", "Aging", "Fechamento"],
    updated: "Estável",
  },
  {
    slug: "aging-po-lecom",
    name: "Aging PO Lecom",
    shortName: "Aging PO",
    description: "Priorize itens parados, estágios e responsáveis para tomada de decisão.",
    category: "Análise",
    icon: Gauge,
    accent: "red",
    status: "Operacional",
    version: "1.0",
    tags: ["Aging", "Lecom", "POs"],
    updated: "Estável",
  },
  {
    slug: "calculadora-aging",
    name: "Calculadora Aging",
    shortName: "Calculadora",
    description: "Configure parâmetros, mapeie colunas e simule faixas de aging.",
    category: "Análise",
    icon: SlidersHorizontal,
    accent: "violet",
    status: "Simulação",
    version: "1.0",
    tags: ["Parâmetros", "Simulação", "Planilha"],
    updated: "Estável",
  },
  {
    slug: "compromisso-trimestral",
    name: "Compromisso Trimestral por Squad",
    shortName: "Compromisso trimestral",
    description: "Compare compromisso e realizado por squad, diretoria e trimestre.",
    category: "Análise",
    icon: BarChart3,
    accent: "teal",
    status: "Operacional",
    version: "1.0",
    tags: ["Trimestre", "Compromisso", "Squads"],
    updated: "Estável",
  },
  {
    slug: "hub-agile-coach",
    name: "Hub do Agile Coach",
    shortName: "Hub Agile Coach",
    description: "Navegue pelas ferramentas e rotinas do ecossistema Agile Coach.",
    category: "Portal",
    icon: LayoutDashboard,
    accent: "navy",
    status: "Portal legado",
    version: "1.0",
    tags: ["Hub", "Rotinas", "Ferramentas"],
    updated: "Estável",
  },
];

const categories: { name: ToolCategory | "Todas"; icon: typeof Activity; label: string }[] = [
  { name: "Todas", icon: Sparkles, label: "Todas as ferramentas" },
  { name: "Análise", icon: BarChart3, label: "Análise operacional" },
  { name: "Governança", icon: UsersRound, label: "Pessoas e governança" },
  { name: "Portal", icon: LayoutDashboard, label: "Portais e navegação" },
];

const accentStyles: Record<string, { dot: string; wash: string; icon: string }> = {
  blue: { dot: "bg-blue-600", wash: "bg-blue-50", icon: "text-blue-700" },
  amber: { dot: "bg-amber-500", wash: "bg-amber-50", icon: "text-amber-700" },
  green: { dot: "bg-emerald-600", wash: "bg-emerald-50", icon: "text-emerald-700" },
  red: { dot: "bg-rose-600", wash: "bg-rose-50", icon: "text-rose-700" },
  violet: { dot: "bg-blue-600", wash: "bg-blue-50", icon: "text-blue-700" },
  teal: { dot: "bg-blue-600", wash: "bg-blue-50", icon: "text-blue-700" },
  lime: { dot: "bg-blue-600", wash: "bg-blue-50", icon: "text-blue-700" },
  navy: { dot: "bg-blue-600", wash: "bg-blue-50", icon: "text-blue-700" },
  slate: { dot: "bg-slate-500", wash: "bg-slate-50", icon: "text-slate-700" },
};

function ToolCard({ tool, onOpen }: { tool: Tool; onOpen: (tool: Tool) => void }) {
  const Icon = tool.icon;
  const accent = accentStyles[tool.accent] ?? accentStyles.blue;
  const topBorder = tool.accent === "amber" ? "border-t-amber-500" : tool.accent === "red" ? "border-t-rose-600" : tool.accent === "green" ? "border-t-emerald-600" : "border-t-blue-700";
  return (
    <article className={`group flex min-h-[218px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_3px_12px_rgba(20,37,63,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(20,37,63,0.1)] border-t-[3px] ${topBorder}`}>
      <div className="flex items-center justify-between gap-3 px-4 pt-4"><div className={`grid h-10 w-10 place-items-center rounded-lg ${accent.wash} ${accent.icon}`}><Icon size={19} strokeWidth={1.9} /></div><span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />{tool.status}</span></div>
      <div className="flex flex-1 flex-col px-4 pt-4"><div className="flex items-start justify-between gap-3"><h3 className="max-w-[240px] text-[15px] font-extrabold leading-[1.2] tracking-[-0.02em] text-slate-900">{tool.name}</h3><span className="shrink-0 rounded bg-slate-100 px-1.5 py-1 text-[9px] font-extrabold text-slate-500">v{tool.version}</span></div><p className="mt-2 text-[12px] leading-[1.45] text-slate-500">{tool.description}</p></div>
      <div className="mt-4 border-t border-slate-100 px-4 py-3"><div className="mb-2 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400"><span>{tool.updated}</span><span>Online</span></div><div className="flex items-center justify-between gap-2"><div className="flex flex-wrap gap-1">{tool.tags.map((tag) => <span key={tag} className="rounded bg-slate-50 px-1.5 py-1 text-[9px] font-semibold text-slate-500">{tag}</span>)}</div><button onClick={() => onOpen(tool)} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#1746a2] px-2.5 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-[#0c2c72]" type="button">Abrir <ArrowUpRight size={13} /></button></div></div>
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "Todas">("Todas");
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = activeTool ? `${activeTool.shortName} · Hub HAC` : "Hub de Ferramentas · HAC";
  }, [activeTool]);

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return tools.filter((tool) => {
      const matchesCategory = activeCategory === "Todas" || tool.category === activeCategory;
      const haystack = [tool.name, tool.description, tool.category, ...tool.tags].join(" ").toLocaleLowerCase("pt-BR");
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [activeCategory, query]);

  const openTool = (tool: Tool) => {
    setActiveTool(tool);
    setSidebarOpen(false);
  };

  if (activeTool) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setActiveTool(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Voltar ao portal">
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold tracking-[-0.01em] text-slate-900">{activeTool.name}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">{activeTool.category} · ferramenta preservada</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/ferramentas/${activeTool.slug}.html`} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 sm:inline-flex">
              <ExternalLink size={14} /> Nova aba
            </a>
            <button type="button" onClick={() => setActiveTool(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white transition hover:bg-blue-800 sm:hidden" aria-label="Fechar ferramenta">
              <X size={17} />
            </button>
          </div>
        </div>
        <iframe title={activeTool.name} src={`/ferramentas/${activeTool.slug}.html`} className="h-[calc(100vh-68px)] w-full border-0 bg-white" />
      </div>
    );
  }

  return (
    <div className="hac-shell min-h-screen bg-[#eef2f8] text-slate-900">
      <main className="min-w-0">
        <header className="bg-[linear-gradient(110deg,#0c2c72_0%,#1746a2_60%,#1e56b8_100%)] text-white shadow-[0_3px_14px_rgba(12,44,114,0.2)]"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-7 lg:px-10"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white p-2 shadow-sm"><img src={`${ASSET_BASE}assets/hac-mark.png`} alt="" className="h-full w-full object-contain" /></div><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-100/75">Hub do Agile Coach · Hapvida</p><h1 className="truncate text-[22px] font-extrabold leading-tight tracking-[-0.03em]">Portal de Ferramentas</h1><p className="hidden text-[11px] font-medium text-blue-100/75 sm:block">Entrada única para análise, governança e comunicação operacional</p></div></div><div className="flex shrink-0 items-center gap-3"><span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold sm:flex"><Activity size={13} className="text-emerald-300" /> Sistema estável</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold">100% online</span></div></div></header>
        <div className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-10"><p className="text-[11px] leading-4 text-slate-500"><span className="font-extrabold text-slate-700">Centro de operações.</span> Selecione uma ferramenta para abrir sua rotina de análise.</p><span className="hidden text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400 sm:block">Dados processados localmente</span></div></div>
        <div className="mx-auto max-w-[1500px] px-4 sm:px-7 lg:px-10"><nav className="flex gap-1 overflow-x-auto border-b border-slate-200 py-2" aria-label="Categorias de ferramentas">{categories.map((category) => { const Icon = category.icon; const selected = activeCategory === category.name; return <button key={category.name} type="button" onClick={() => setActiveCategory(category.name)} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-[11px] font-extrabold transition ${selected ? "bg-[#1746a2] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={14} />{category.label}</button>; })}</nav>
          <section className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo do ecossistema">{[{ value: "07", label: "Ferramentas disponíveis", note: "catálogo online", icon: Boxes, tone: "text-blue-700 bg-blue-50" }, { value: "04", label: "Análise operacional", note: "qualidade e aging", icon: BarChart3, tone: "text-emerald-700 bg-emerald-50" }, { value: "01", label: "Fonte de referência", note: "Dashboard 2.0", icon: Network, tone: "text-amber-700 bg-amber-50" }, { value: "100%", label: "Processamento local", note: "sem envio de dados", icon: ShieldCheck, tone: "text-slate-700 bg-slate-100" }].map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_9px_rgba(20,37,63,0.04)]"><div className={`grid h-9 w-9 place-items-center rounded-lg ${metric.tone}`}><Icon size={17} /></div><div><p className="text-[22px] font-extrabold leading-none tracking-[-0.04em] text-slate-900">{metric.value}</p><p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.07em] text-slate-600">{metric.label}</p><p className="text-[10px] text-slate-400">{metric.note}</p></div></div>; })}</section>
          <div className="grid gap-5 pb-8 lg:grid-cols-[minmax(0,1fr)_290px]"><section><div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_2px_9px_rgba(20,37,63,0.04)] sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700">Catálogo operacional</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-slate-900">Ferramentas disponíveis <span className="ml-1 text-xs font-semibold text-slate-400">{filteredTools.length} de {tools.length}</span></h2></div><div className="relative w-full sm:max-w-[330px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar ferramenta ou tema..." className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" /></div></div>{filteredTools.length > 0 ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredTools.map((tool) => <ToolCard key={tool.slug} tool={tool} onOpen={openTool} />)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><Search className="mx-auto text-slate-300" size={26} /><p className="mt-3 text-sm font-extrabold text-slate-800">Nenhuma ferramenta encontrada</p><p className="mt-1 text-xs text-slate-500">Tente outro termo ou selecione outra categoria.</p></div>}</section><aside className="space-y-3 lg:pt-[67px]"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_9px_rgba(20,37,63,0.04)]"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700"><FileSpreadsheet size={16} /></div><div><p className="text-xs font-extrabold text-slate-900">Fluxo recomendado</p><p className="text-[10px] text-slate-500">Do dado à decisão</p></div></div><div className="mt-4 space-y-3">{[["01","Carregue a base","Importe a planilha ou Dashboard de referência."],["02","Analise o recorte","Use filtros, indicadores e detalhamento."],["03","Aja com contexto","Exporte, copie uma mensagem ou acione a squad."]].map(([number,title,description], index) => <div key={number} className="flex gap-2.5"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-extrabold ${index === 2 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{number}</span><div><p className="text-[11px] font-extrabold text-slate-800">{title}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-500">{description}</p></div></div>)}</div></div><div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4"><div className="flex items-center gap-2 text-blue-800"><BookOpen size={15} /><p className="text-xs font-extrabold">Fonte de referência</p></div><p className="mt-2 text-[11px] leading-4 text-blue-900/70">Comece pelo Dashboard SMs x Squads 2.0 para atualizar pessoas e squads. Depois, abra a análise específica.</p><button type="button" onClick={() => openTool(tools[0])} className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-900">Abrir Dashboard <ArrowUpRight size={13} /></button></div></aside></div><footer className="flex flex-col gap-2 border-t border-slate-200 py-4 text-[10px] font-medium text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Hub de Ferramentas · Agile Coach · Hapvida</span><span>Interface unificada · dados processados nas ferramentas</span></footer></div>
      </main>
    </div>
  );
}
