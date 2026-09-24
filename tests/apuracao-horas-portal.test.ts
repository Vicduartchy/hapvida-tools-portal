import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const toolHtml = readFileSync(
  "client/public/ferramentas/alocacao-horas-tipo-demanda.html",
  "utf-8",
);
const homeTsx = readFileSync("client/src/pages/Home.tsx", "utf-8");

describe("apuracao de horas por recursos x squad no portal", () => {
  it("usa a rota substituida e o design HAC", () => {
    expect(toolHtml).toContain("Apuração de Horas por Recursos x Squad");
    expect(toolHtml).toContain("/assets/hac-mark.png");
    expect(toolHtml).toContain("Hub do Agile Coach · Hapvida");
    expect(toolHtml).toContain("portal-badge");
    expect(toolHtml).toContain("--bg:#eef2f8");
  });

  it("mantem o cruzamento de quatro bases e a exportacao local", () => {
    expect(toolHtml).toContain('id="file-base1"');
    expect(toolHtml).toContain('id="file-base2"');
    expect(toolHtml).toContain('id="file-base3"');
    expect(toolHtml).toContain('id="file-base4"');
    expect(toolHtml).toContain('id="downloadBtn"');
    expect(toolHtml).toContain('/shared/vendor/xlsx-full.min.js');
    expect(toolHtml).toContain('/shared/vendor/exceljs-4.4.0.min.js');
    expect(toolHtml).not.toContain("cdnjs.cloudflare.com");
    expect(toolHtml).not.toContain("cdn.jsdelivr.net");
  });

  it("usa BASE_SET.26 para cargos e detecta as abas reais automaticamente", () => {
    expect(toolHtml).toContain("BASE_SET.26");
    expect(toolHtml).toContain("base4Organograma");
    expect(toolHtml).toContain("parseSheetRowsWithHeader");
    expect(toolHtml).toContain("organogramaRows");
    expect(toolHtml).toContain("var compatible = meta.visible.filter");
    expect(toolHtml).toContain("AJUSTE: ");
    expect(toolHtml).toContain("Consulta: ");
  });

  it("normaliza formatos de nome e não trata N/A como cargo válido", () => {
    expect(toolHtml).toContain('"SOBRENOME, NOME"');
    expect(toolHtml).toContain("function isOrgEmpty");
    expect(toolHtml).toContain('"#N/A"');
    expect(toolHtml).toContain("function nameTokens");
  });

  it("substitui o card de alocacao no catalogo", () => {
    const cardStart = homeTsx.indexOf('slug: "alocacao-horas-tipo-demanda"');
    const cardEnd = homeTsx.indexOf("\n  },", cardStart);
    const card = homeTsx.slice(cardStart, cardEnd);
    expect(card).toContain("Apuração de Horas por Recursos x Squad");
    expect(card).toContain('category: "Governança"');
    expect(card).toContain('tags: ["Horas", "Recursos", "Squads"]');
  });
});
