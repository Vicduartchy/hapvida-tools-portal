import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { JSDOM } from "jsdom";

const read = (p: string) => readFileSync(path.resolve(process.cwd(), p), "utf-8");
const hubFile = read("client/public/shared/data/hub-squads.js");
const hubModel = JSON.parse(hubFile.slice(hubFile.indexOf("window.HUB_SQUADS = ") + "window.HUB_SQUADS = ".length).replace(/;\s*$/, ""));

/** Extrai o texto de uma função de topo (pelo nome) de um HTML e a executa com o hub-core carregado. */
function loadFn(html: string, name: string, deps: string[] = []) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
  const ctx = dom.window as unknown as vm.Context;
  vm.createContext(ctx);
  vm.runInContext(hubFile, ctx);
  vm.runInContext(read("client/public/shared/data/hub-core.js"), ctx);
  const grab = (n: string) => {
    const start = html.search(new RegExp(`function ${n}\\s*\\(`));
    if (start < 0) throw new Error(`função ${n} não encontrada`);
    let i = html.indexOf("{", start), depth = 0;
    for (; i < html.length; i++) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}" && --depth === 0) break;
    }
    return html.slice(start, i + 1);
  };
  const code = [...deps, name].map(grab).join("\n") + `\n;${name};`;
  return vm.runInContext(code, ctx) as (...a: any[]) => any;
}

describe("Consolidação de SMs valida o nome contra a base do hub", () => {
  const html = read("client/public/ferramentas/consolidacao-alocacao-horas-sm.html");
  const validar = loadFn(html, "validarSmHub");
  const ativo = hubModel.sms.find((s: any) => !/pollyana|victor vasconcelos|alexandre viana/i.test(s.nome));

  it("reconhece nome exato, sugere o canônico no parcial e marca desligado/desconhecido", () => {
    expect(validar(ativo.nome).tipo).toBe("ok");
    expect(validar("Pollyana").tipo).toBe("desligado");
    expect(validar("Fulano Inexistente").tipo).toBe("desconhecido");
    expect(validar("").tipo).toBe("desconhecido");
  });
});

describe("Apuração de Horas traz o SM da squad pela base do hub", () => {
  const html = read("client/public/ferramentas/alocacao-horas-tipo-demanda.html");
  // SEM_SM_LABEL é var de topo: executa o trecho que vai de SEM_SM_LABEL até CATS
  const smDa = (() => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
    const ctx = dom.window as unknown as vm.Context;
    vm.createContext(ctx);
    vm.runInContext(hubFile, ctx);
    vm.runInContext(read("client/public/shared/data/hub-core.js"), ctx);
    const start = html.indexOf('var SEM_SM_LABEL');
    const end = html.indexOf("var CATS = {");
    return vm.runInContext(html.slice(start, end) + ";smDaSquad;", ctx) as (n: string) => string;
  })();

  it("devolve o SM, o rótulo de cobrança para squad sem SM e sinaliza squad fora da base", () => {
    const comSm = hubModel.squads.find((s: any) => s.ativa && s.sm);
    const semSm = hubModel.squads.find((s: any) => s.ativa && !s.sm);
    expect(smDa(comSm.squad)).toBe(comSm.sm);
    expect(smDa(semSm.squad)).toBe("Sem SM (cobrar via coach)");
    expect(smDa("Squad que não existe")).toBe("(Squad fora da base do hub)");
  });
});
