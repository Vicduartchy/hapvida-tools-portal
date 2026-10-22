import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadToolScript } from "./helpers/loadTool";

const hubFile = readFileSync("client/public/shared/data/hub-squads.js", "utf-8");
const hubModel = JSON.parse(hubFile.slice(hubFile.indexOf("window.HUB_SQUADS = ") + "window.HUB_SQUADS = ".length).replace(/;\s*$/, ""));
const PRELOAD = ["shared/data/hub-squads.js", "shared/data/hub-core.js"];

/** Ferramentas que consomem o hub-core: contrato "toda squad do hub resolve, e sem SM não vira '—'". */
const CONSUMERS: Array<{ file: string; snippet: string }> = [
  {
    file: "horas-sem-rastreabilidade.html",
    snippet: "__capture__.smOf = smOf; __capture__.loadSmMapping = loadSmMapping; __capture__.STATE = STATE;",
  },
  {
    file: "qualidade-entregas.html",
    snippet: "__capture__.smOf = smOf; __capture__.loadSmMapping = loadSmMapping; __capture__.STATE = STATE;",
  },
];

describe.each(CONSUMERS)("$file lê SM, diretoria e status da base do hub", ({ file, snippet }) => {
  const tool = loadToolScript(file, 0, snippet, PRELOAD);
  tool.loadSmMapping();

  it("resolve todas as squads do hub (inclusive desativadas e aliases)", () => {
    const faltando: string[] = [];
    for (const s of hubModel.squads) {
      for (const nome of [s.squad, ...s.nomes]) if (!tool.smOf(nome)) faltando.push(nome);
    }
    expect(faltando).toEqual([]);
  });

  it("devolve o SM do levantamento e sinaliza squad sem SM com texto vazio", () => {
    const comSm = hubModel.squads.find((s: any) => s.ativa && s.sm);
    const semSm = hubModel.squads.find((s: any) => s.ativa && !s.sm);
    expect(tool.smOf(comSm.squad)).toMatchObject({ sm: comSm.sm, diretoria: comSm.diretoria, semSm: false });
    expect(tool.smOf(semSm.squad)).toMatchObject({ sm: "", semSm: true, ativa: true });
  });

  it("não inventa squad desconhecida", () => {
    expect(tool.smOf("Projeto que não existe no Azure")).toBeNull();
  });
});

describe("aging-po-lecom: mapeamento Produto → Squad → SM usa a base do hub", () => {
  const tool = loadToolScript(
    "aging-po-lecom.html",
    0,
    "__capture__.STATE = STATE; __capture__.loadSquads = loadSquads; __capture__.smDaSquad = smDaSquad;",
    PRELOAD,
  );
  tool.loadSquads();

  it("oferece só as squads ativas do hub, com SM e diretoria atuais", () => {
    const ativas = hubModel.squads.filter((s: any) => s.ativa);
    expect(tool.STATE.squads).toHaveLength(ativas.length);
    const amostra = ativas.find((s: any) => s.sm);
    expect(tool.STATE.squads.find((s: any) => s.squad === amostra.squad)).toMatchObject({ sm_atual: amostra.sm, area: amostra.diretoria });
  });

  it("lê o SM da squad no momento do cálculo (não o que ficou salvo no mapeamento)", () => {
    const amostra = hubModel.squads.find((s: any) => s.ativa && s.sm);
    expect(tool.smDaSquad(amostra.squad)).toBe(amostra.sm);
    expect(tool.smDaSquad("Squad inexistente")).toBe("");
  });
});
