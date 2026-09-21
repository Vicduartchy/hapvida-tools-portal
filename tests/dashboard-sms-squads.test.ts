import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { JSDOM } from "jsdom";

function loadResourcesImporter() {
  const js = readFileSync(
    "client/public/shared/data/resources-import.js",
    "utf-8",
  );
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const context = dom.window as unknown as vm.Context & {
    HACResourcesImport?: any;
  };
  vm.createContext(context);
  vm.runInContext(js, context);
  return (context as any).HACResourcesImport;
}

describe("resources-import: normalização e diff da base mensal", () => {
  it("aceita nomes de colunas usuais e ignora linhas vazias ou incompletas", () => {
    const importer = loadResourcesImporter();
    const rows = importer.normalizeRows([
      {
        Squad: "Squad A",
        "Nome completo": "Ana Silva",
        "Função na squad": "SM",
        "Recurso compartilhado?": "Não",
        Diretoria: "TI",
      },
      { Squad: "", "Nome completo": "" },
      { Squad: "Squad B", "Nome completo": "" },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      squad: "Squad A",
      colaborador: "Ana Silva",
      funcao: "SM",
      compartilhado: "Não",
      diretoria: "TI",
    });
    expect(rows[0].id).toMatch(/^res-import-/);
  });

  it("detecta remoção de recurso e alteração de squad no diff mensal", () => {
    const importer = loadResourcesImporter();
    const previous = importer.normalizeRows([
      { Squad: "Squad A", Colaborador: "Ana", Função: "SM" },
      { Squad: "Squad B", Colaborador: "Bruno", Função: "Dev" },
    ]);
    const next = importer.normalizeRows([
      { Squad: "Squad A", Colaborador: "Ana", Função: "SM" },
      { Squad: "Squad C", Colaborador: "Carla", Função: "Dev" },
    ]);

    expect(importer.diffRows(previous, next)).toMatchObject({
      added: 1,
      removed: 1,
      unchanged: 1,
    });
  });
});

describe("dashboard-sms-squads: remoção de SM atualiza SEM SM", () => {
  it("retira a squad do SM e inclui a squad no painel SEM SM", () => {
    const html = readFileSync(
      "client/public/ferramentas/dashboard-sms-squads.html",
      "utf-8",
    );
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0]?.[1];
    expect(script).toBeTruthy();
    const start = script.indexOf("let MANUAL_OVERRIDES =");
    const end = script.indexOf("/* ============================================================\n   RENDER — ABA SMs", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "http://localhost/",
    });
    const context = dom.window as unknown as vm.Context & { __capture__?: any };
    vm.createContext(context);
    (context as any).__capture__ = {};
    vm.runInContext(
      `
        function isBlank(value) { return value === null || value === undefined || String(value).trim() === ''; }
        function boardKey(value) { return String(value || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
        function uniqueSorted(values) { return [...new Set(values.filter(Boolean))].sort(); }
        function namesLikelyMatch() { return true; }
        ${script.slice(start, end)}
        UNIFIED = [{
          id: 'squad-a', squad: 'Squad A', source: 'handover',
          levantamento_sm: 'Ana Silva', diretoria: 'TI', diretor: 'Diretor', gerente: 'Gerente',
          recursos: [], boards: [], temRecursos: false, temBoards: false,
          sm_atual: 'Ana Silva', sm_proposto: '', email_sm: '', tipo: 'SQUAD', complexidade: 'MÉDIA'
        }];
        MANUAL_OVERRIDES.squads['squad-a'] = { levantamento_sm: '' };
        UNIFIED = applySquadOverrides(UNIFIED);
        buildSMView();
        Object.defineProperty(__capture__, 'UNIFIED', { get: () => UNIFIED });
        Object.defineProperty(__capture__, 'SM_VIEW', { get: () => SM_VIEW });
        Object.defineProperty(__capture__, 'SQUADS_SEM_SM', { get: () => SQUADS_SEM_SM });
      `,
      context,
    );
    const tool = (context as any).__capture__;

    const target = tool.UNIFIED.find((row: any) => row.temSM);
    expect(target).toBeUndefined();
    expect(tool.SQUADS_SEM_SM.some((row: any) => row.id === "squad-a")).toBe(true);
    expect(tool.SM_VIEW.some((sm: any) => sm.squads.some((row: any) => row.id === "squad-a"))).toBe(false);
  });
});
