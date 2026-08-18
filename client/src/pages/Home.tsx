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
  MessageSquareText,
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

type ToolCategory = "Análise" | "Governança" | "Comunicação" | "Portal";

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
    slug: "farol-whatsapp",
    name: "Farol WhatsApp",
    shortName: "Farol WhatsApp",
    description: "Organize mensagens, status de envio e comunicações por responsável.",
    category: "Comunicação",
    icon: MessageSquareText,
    accent: "lime",
    status: "Comunicação",
    version: "1.0",
    tags: ["Mensagens", "Status", "Farol"],
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
  {
    slug: "dashboard-sms-squads-legado",
    name: "Dashboard SMs x Squads — Legado",
    shortName: "SMs x Squads legado",
    description: "Versão anterior mantida para compatibilidade e consulta histórica.",
    category: "Governança",
    icon: Boxes,
    accent: "slate",
    status: "Legado",
    version: "1.0",
    tags: ["Compatibilidade", "Histórico"],
    updated: "Consulta",
  },
];

const categories: { name: ToolCategory | "Todas"; icon: typeof Activity; label: string }[] = [
  { name: "Todas", icon: Sparkles, label: "Todas as ferramentas" },
  { name: "Análise", icon: BarChart3, label: "Análise operacional" },
  { name: "Governança", icon: UsersRound, label: "Pessoas e governança" },
  { name: "Comunicação", icon: MessageSquareText, label: "Comunicação" },
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

  return (
    <article className={`group relative flex min-h-[244px] flex-col overflow-hidden rounded-[22px] border border-slate-200/80 border-t-4 ${tool.accent === "amber" ? "border-t-amber-500" : tool.accent === "red" ? "border-t-rose-600" : tool.accent === "green" ? "border-t-emerald-600" : "border-t-blue-600"} bg-white p-5 shadow-[0_10px_35px_rgba(20,37,63,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(20,37,63,0.12)]`}>
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[70px] bg-slate-50 transition duration-200 group-hover:bg-blue-50" />
      <div className="relative flex items-start justify-between gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${accent.wash} ${accent.icon}`}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
          {tool.status}
        </span>
      </div>
      <div className="relative mt-6 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="max-w-[240px] text-[17px] font-extrabold leading-[1.16] tracking-[-0.02em] text-slate-900">{tool.name}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">v{tool.version}</span>
        </div>
        <p className="mt-3 max-w-[290px] text-[13px] leading-5 text-slate-500">{tool.description}</p>
      </div>
      <div className="relative mt-5 border-t border-slate-100 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400"><span>{tool.updated}</span><span>Disponível online</span></div>
        <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tool.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">{tag}</span>)}
        </div>
        <button onClick={() => onOpen(tool)} className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-extrabold text-blue-700 transition hover:text-blue-900" type="button">
          Abrir <ArrowUpRight size={15} />
        </button>
        </div>
        </div>
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
    <div className="hac-shell flex min-h-screen bg-[#f5f7fb] text-slate-900">
      {sidebarOpen && <button aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[274px] -translate-x-full flex-col border-r border-slate-200/80 bg-[#0c1c43] text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : ""}`}>
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="grid h-11 w-11 place-items-center rounded-[15px] bg-white p-2 shadow-[0_8px_22px_rgba(255,255,255,0.12)]"><img src={`${ASSET_BASE}assets/hac-mark.png`} alt="" className="h-full w-full object-contain" /></div>
          <div>
            <p className="text-[15px] font-extrabold tracking-[-0.02em]">Hub de Ferramentas</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/70">Agile Coach · Hapvida</p>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-blue-100 lg:hidden" aria-label="Fechar navegação"><X size={17} /></button>
        </div>
        <div className="mx-4 h-px bg-white/10" />
        <nav className="flex-1 px-3 py-5">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/55">Explorar</p>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const selected = activeCategory === category.name;
              return <button key={category.name} type="button" onClick={() => { setActiveCategory(category.name); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${selected ? "bg-white text-[#0c1c43] shadow-lg" : "text-blue-100/75 hover:bg-white/10 hover:text-white"}`}><Icon size={17} strokeWidth={selected ? 2.4 : 1.8} /><span>{category.label}</span>{selected && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}</button>;
            })}
          </div>
          <p className="px-3 pb-3 pt-9 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/55">Acesso rápido</p>
          <button type="button" onClick={() => openTool(tools[0])} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-blue-100/75 transition hover:bg-white/10 hover:text-white"><Network size={17} /><span>Base de SMs e squads</span><ArrowUpRight size={14} className="ml-auto opacity-50" /></button>
          <button type="button" onClick={() => openTool(tools[1])} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold text-blue-100/75 transition hover:bg-white/10 hover:text-white"><Clock3 size={17} /><span>Horas sem origem</span><ArrowUpRight size={14} className="ml-auto opacity-50" /></button>
        </nav>
        <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-2 text-[11px] font-bold text-blue-100"><CheckCircle2 size={15} className="text-emerald-300" /> Ecossistema online</div>
          <p className="mt-2 text-[11px] leading-4 text-blue-100/55">Nove ferramentas disponíveis em uma única entrada.</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="relative isolate overflow-hidden bg-[#0c1c43]">
          <img src={`${ASSET_BASE}assets/hac-operations-hero.webp`} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-75" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(12,28,67,0.98)_0%,rgba(12,28,67,0.87)_42%,rgba(23,70,162,0.50)_100%)]" />
          <header className="flex items-center justify-between px-5 py-5 sm:px-9 lg:px-12">
            <button type="button" onClick={() => setSidebarOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 text-white lg:hidden" aria-label="Abrir navegação"><Menu size={19} /></button>
            <div className="hidden items-center gap-3 lg:flex"><div className="grid h-8 w-8 place-items-center rounded-[10px] bg-white p-1.5"><img src={`${ASSET_BASE}assets/hac-mark.png`} alt="" className="h-full w-full object-contain" /></div><div><p className="text-[12px] font-extrabold tracking-[0.02em] text-white">HAC Hub</p><p className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/60"><PanelLeft size={11} /> Centro de operações</p></div></div>
            <div className="ml-auto flex items-center gap-3 text-[11px] font-semibold text-blue-100/70"><span className="hidden items-center gap-1.5 sm:flex"><Activity size={14} className="text-emerald-300" /> Sistema estável</span><button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 text-white transition hover:bg-white/10" aria-label="Configurações"><Settings2 size={16} /></button></div>
          </header>
          <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 pb-14 pt-7 sm:px-9 lg:grid-cols-[1fr_310px] lg:px-12 lg:pb-20 lg:pt-14">
            <div className="max-w-[700px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-100"><Sparkles size={13} className="text-amber-300" /> Operação guiada por dados</div>
              <h1 className="max-w-[660px] text-[clamp(2.5rem,5.4vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-white">Encontre a ferramenta certa para a decisão de agora.</h1>
              <p className="mt-6 max-w-[590px] text-[15px] leading-7 text-blue-100/75">Um ponto de entrada único para acompanhar squads, pessoas, qualidade, aging, compromisso e comunicações do ecossistema Agile Coach.</p>
              <div className="relative mt-8 max-w-[620px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar por ferramenta, indicador ou tema..." className="h-14 w-full rounded-2xl border border-white/15 bg-white px-12 pr-14 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(0,0,0,0.18)] outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-300/20" />
                <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400 sm:flex"><Command size={12} /> K</div>
              </div>
            </div>
            <div className="hidden self-end rounded-[24px] border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100/60">Estado do ecossistema</p>
              <div className="mt-5 flex items-end justify-between"><span className="text-5xl font-extrabold tracking-[-0.06em] text-white">09</span><span className="mb-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-extrabold text-emerald-200">disponíveis</span></div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-300 to-blue-300" /></div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-blue-100/60"><span>Última atualização</span><span className="font-bold text-blue-50">Hoje</span></div>
            </div>
          </section>
        </div>

        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-9 lg:px-12 lg:py-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <section>
              <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">Catálogo operacional</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-900">Ferramentas disponíveis</h2></div><span className="hidden text-xs font-semibold text-slate-400 sm:block">{filteredTools.length} de {tools.length} ferramentas</span></div>
              <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => <button key={category.name} type="button" onClick={() => setActiveCategory(category.name)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${activeCategory === category.name ? "bg-[#0c1c43] text-white shadow-lg shadow-blue-950/10" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900"}`}>{category.name}</button>)}
              </div>
              {filteredTools.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredTools.map((tool) => <ToolCard key={tool.slug} tool={tool} onOpen={openTool} />)}</div> : <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-12 text-center"><Search className="mx-auto text-slate-300" size={28} /><p className="mt-4 font-bold text-slate-800">Nenhuma ferramenta encontrada</p><p className="mt-1 text-sm text-slate-500">Tente outro termo ou limpe os filtros.</p></div>}
            </section>
            <aside className="space-y-4 lg:pt-[72px]">
              <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(20,37,63,0.05)]"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><FileSpreadsheet size={17} /></div><div><p className="text-sm font-extrabold text-slate-900">Fluxo recomendado</p><p className="text-[11px] text-slate-500">Do dado à decisão</p></div></div><div className="mt-5 space-y-4"><div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-extrabold text-blue-700">01</span><div><p className="text-xs font-bold text-slate-800">Carregue a base</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">Importe a planilha ou Dashboard de referência.</p></div></div><div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-extrabold text-blue-700">02</span><div><p className="text-xs font-bold text-slate-800">Analise o recorte</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">Use filtros, indicadores e detalhamento.</p></div></div><div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-100 text-[10px] font-extrabold text-amber-700">03</span><div><p className="text-xs font-bold text-slate-800">Aja com contexto</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">Exporte, copie uma mensagem ou acione a squad.</p></div></div></div></div>
              <div className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-5"><div className="flex items-center gap-2 text-blue-800"><BookOpen size={16} /><p className="text-xs font-extrabold">Como escolher?</p></div><p className="mt-3 text-[12px] leading-5 text-blue-900/70">Comece pelo Dashboard SMs x Squads para atualizar a referência de pessoas e squads. Depois, abra a análise específica da decisão.</p></div>
            </aside>
          </div>
          <footer className="mt-14 flex flex-col gap-2 border-t border-slate-200 pt-5 text-[11px] font-medium text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Hub de Ferramentas · Agile Coach · Hapvida</span><span>Interface unificada · dados processados nas ferramentas</span></footer>
        </div>
      </main>
    </div>
  );
}
