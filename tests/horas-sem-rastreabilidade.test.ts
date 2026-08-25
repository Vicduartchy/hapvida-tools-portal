import { describe, expect, it, beforeEach } from "vitest";
import { loadToolScript } from "./helpers/loadTool";

/**
 * Regressão do bug corrigido em 25/08/2026: os KPI cards da aba Resultado
 * mostravam sempre o total combinado (Origem em Branco + Task Avulsa),
 * ignorando o filtro de classificação — mesmo quando o usuário selecionava
 * apenas um dos dois tipos. A tabela de ranking já respeitava o filtro;
 * só os cards do topo não.
 */
describe("horas-sem-rastreabilidade: getKpiTotals respeita o filtro de classificação", () => {
  let tool: {
    STATE: any;
    aggregate: () => void;
    getKpiTotals: () => any;
  };

  beforeEach(() => {
    tool = loadToolScript(
      "horas-sem-rastreabilidade.html",
      2,
      "__capture__.STATE = STATE; __capture__.aggregate = aggregate; __capture__.getKpiTotals = getKpiTotals;",
    );

    tool.STATE.rows = [
      // Squad A: 10h Origem em Branco + 5h Task Avulsa
      row("Squad A", "Origem em Branco", 10, "2026-07-01"),
      row("Squad A", "Task Avulsa", 5, "2026-07-02"),
      // Squad B: só 3h Task Avulsa
      row("Squad B", "Task Avulsa", 3, "2026-07-03"),
      // Linha fora de escopo (não deve contar em nenhum cenário)
      row("Squad A", "Feature", 100, "2026-07-04"),
    ];
    tool.aggregate();
  });

  it("sem filtro, soma Origem em Branco + Task Avulsa (comportamento original preservado)", () => {
    tool.STATE.resultClassificacao = "";
    const totals = tool.getKpiTotals();
    expect(totals.totalSemOrigem).toBe(18); // 10 + 5 + 3
    expect(totals.qtdTasksSemOrigem).toBe(3);
    expect(totals.squadsImpactadas).toBe(2);
  });

  it("com filtro 'Origem em Branco', mostra só as horas dessa classificação", () => {
    tool.STATE.resultClassificacao = "Origem em Branco";
    const totals = tool.getKpiTotals();
    expect(totals.totalSemOrigem).toBe(10);
    expect(totals.qtdTasksSemOrigem).toBe(1);
    expect(totals.squadsImpactadas).toBe(1); // só Squad A
  });

  it("com filtro 'Task Avulsa', mostra só as horas dessa classificação", () => {
    tool.STATE.resultClassificacao = "Task Avulsa";
    const totals = tool.getKpiTotals();
    expect(totals.totalSemOrigem).toBe(8); // 5 + 3
    expect(totals.qtdTasksSemOrigem).toBe(2);
    expect(totals.squadsImpactadas).toBe(2); // Squad A e Squad B
  });
});

function row(
  projectName: string,
  tipoDemanda: string,
  completedWork: number,
  dataEncerramento: string,
) {
  return {
    idTask: Math.random().toString(36).slice(2),
    dataEncerramento: new Date(dataEncerramento),
    tipoDemanda,
    origemDemanda: null,
    workItemType: null,
    completedWork,
    usuario: null,
    usuarioEmail: null,
    titleTask: null,
    idStories: null,
    titleStories: null,
    projectName,
    diretoria: "(Sem diretoria)",
    gerente: null,
  };
}
