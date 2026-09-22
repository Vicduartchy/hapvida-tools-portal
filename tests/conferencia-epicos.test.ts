import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(
  "client/public/ferramentas/conferencia-epicos-portfolio.html",
  "utf-8",
);

describe("conferencia de epicos: filtros e graficos por classificacao", () => {
  it("carrega Chart.js e possui um canvas para cada classificacao", () => {
    expect(html).toContain('<script src="/shared/vendor/chartjs-4.5.1.min.js"></script>');
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
  });
});
