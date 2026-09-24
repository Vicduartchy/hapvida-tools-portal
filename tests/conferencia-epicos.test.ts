import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(
  "client/public/ferramentas/conferencia-epicos-portfolio.html",
  "utf-8",
);

describe("conferencia de epicos: filtros e graficos por classificacao", () => {
  it("mantem os filtros acima dos KPIs e oferece selecao multipla de diretorias", () => {
    expect(html).toContain('class="filters-panel" aria-label="Filtros da conferência"');
    expect(html).toContain('id="diretoriaMenu" role="listbox"');
    expect(html).toContain('id="diretoriaTrigger"');
    expect(html).toContain("position:sticky");
    expect(html).toContain("selectedDiretorias.indexOf(item.diretoria || '(sem diretoria)') === -1");
    expect(html).toContain("selected.length + ' diretorias selecionadas'");
  });

  it("carrega Chart.js e possui um canvas para cada classificacao", () => {
    expect(html).toContain('<script src="/shared/vendor/chartjs-4.5.1.min.js"></script>');
    expect(html).toContain('<script src="/shared/vendor/chartjs-plugin-datalabels-2.2.0.min.js"></script>');
    expect(html).toContain('id="chartOperational"');
    expect(html).toContain('id="chartReview"');
    expect(html).toContain('id="chartHistorical"');
  });

  it("recalcula KPIs, graficos, mensagens e tabela pelo mesmo conjunto filtrado", () => {
    expect(html).toContain("function renderFilteredViews()");
    expect(html).toContain("var list = filteredItems();");
    expect(html).toContain("var source = filteredItems();");
    expect((html.match(/renderFilteredViews\(\);/g) || []).length).toBeGreaterThanOrEqual(6);
    expect(html).toContain("entries.sort(function(a,b){ return b.total - a.total");
    expect(html).toContain("datalabels: {");
    expect(html).toContain("formatter: function(value){ return value; }");
  });

  it("recebe a base de melhorias e separa projeto, conflito e melhoria isolada", () => {
    expect(html).toContain('id="input-improvements"');
    expect(html).toContain("function improvementRows(buffer)");
    expect(html).toContain("PROJECT_AND_IMPROVEMENT");
    expect(html).toContain("IMPROVEMENT_ONLY");
    expect(html).toContain("Melhoria — Epic não aplicável");
    expect(html).toContain("totalImprovementOnlyFeatures");
    expect(html).toContain('id="tabOrigem"');
    expect(html).toContain('id="originTableBody"');
  });

  it("mantem projeto + melhoria na auditoria de Epic e exibe o conflito", () => {
    expect(html).toContain("manter esta conferência como Projeto e confirmar a origem");
    expect(html).toContain("Conflito Projeto + Melhoria");
    expect(html).toContain("Auditar como Projeto quanto ao Epic");
    expect(html).toContain("Não cobrar Epic: acompanhar como Melhoria");
    expect(html).toContain("Apenas Projetos geram cobrança de vínculo com Epic");
  });
});
