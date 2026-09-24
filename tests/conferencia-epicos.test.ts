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

  it("cruza LECOM contra a base de Melhorias antes de cobrar Epic", () => {
    expect(html).toContain('id="input-melhorias"');
    expect(html).toContain("function melhoriasRows(buffer)");
    expect(html).toContain("norm(n).indexOf('melhoria') > -1");
    expect(html).toContain("function classify(ado, parentId, excluded, isMelhoriaLecom)");
    expect(html).toContain("if(isMelhoriaLecom && project && !parentId)");
    expect(html).toContain("Melhoria não precisa de Epic");
    expect(html).toContain("var c = classify(a, pid, excluded, !!melhoriasSet[a.lecom]);");
  });
});
