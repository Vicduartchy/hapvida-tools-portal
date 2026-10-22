import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { JSDOM } from "jsdom";

const read = (file: string) => readFileSync(`client/public/shared/data/${file}`, "utf-8");

function loadHub(options: { file?: boolean; canon?: boolean; snapshot?: unknown } = {}) {
  const { file = true, canon = false, snapshot } = options;
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
  const context = dom.window as unknown as vm.Context;
  if (snapshot) dom.window.localStorage.setItem("hac_hub_model_v1", JSON.stringify(snapshot));
  vm.createContext(context);
  if (canon) vm.runInContext(read("squad-canon.js"), context);
  if (file) vm.runInContext(read("hub-squads.js"), context);
  vm.runInContext(read("hub-core.js"), context);
  return { hub: (context as any).HubCore, win: context as any };
}

describe("hub-core: modelo único de squads e SMs", () => {
  it("resolve todas as squads do arquivo gerado pelo próprio nome e por qualquer alias", () => {
    const { hub, win } = loadHub();
    const model = win.HUB_SQUADS;
    expect(model.squads.length).toBeGreaterThanOrEqual(240);
    for (const s of model.squads) {
      for (const nome of [s.squad, ...s.nomes]) {
        const r = hub.resolve(nome);
        expect(r.found, nome).toBe(true);
      }
    }
  });

  it("ignora caixa, acento e '(DESATIVADO)' e prefere a squad ativa em caso de colisão", () => {
    const { hub } = loadHub({
      file: false,
      snapshot: {
        v: 1, generatedAt: "2026-10-22T00:00:00Z",
        squads: [
          { id: "a", squad: "Digital - Jornada", nomes: [], diretoria: "Digital", sm: "Ana Souza", ativa: true },
          { id: "b", squad: "(DESATIVADO) Digital - Jornada", nomes: [], diretoria: "Digital", sm: "", ativa: false },
        ],
        sms: [{ nome: "Ana Souza" }],
      },
    });
    expect(hub.resolve("(DESATIVADO) Digital - Jornada").squad.id).toBe("b");
    expect(hub.resolve("digital – JORNADA").squad.id).toBe("a");
    expect(hub.resolve("Squad que não existe").found).toBe(false);
    expect(hub.smOf("Digital - Jornada")).toBe("Ana Souza");
    expect(hub.smOf("(DESATIVADO) Digital - Jornada")).toBe("");
  });

  it("monta o mapa nome -> dados com SM vazio (e não '—') quando a squad não tem SM", () => {
    const { hub, win } = loadHub();
    const semSm = win.HUB_SQUADS.squads.find((s: any) => s.ativa && !s.sm);
    expect(semSm).toBeTruthy();
    const mapping = hub.getSmSquadMapping();
    expect(mapping[semSm.squad]).toMatchObject({ sm: "", semSm: true, ativa: true });
    expect(Object.keys(mapping).length).toBeGreaterThanOrEqual(win.HUB_SQUADS.squads.length);
  });

  it("reconhece SM por nome exato ou parcial e recusa nome ambíguo ou desconhecido", () => {
    const { hub } = loadHub({
      file: false,
      snapshot: {
        v: 1, generatedAt: "2026-10-22T00:00:00Z", squads: [{ id: "a", squad: "X", nomes: [], ativa: true }],
        sms: [{ nome: "Renata Mikaely Santiago Marques" }, { nome: "Renata Souza Lima" }, { nome: "João Paulo Reis" }],
      },
    });
    expect(hub.matchSm("renata mikaely santiago marques")).toMatchObject({ via: "exato" });
    expect(hub.matchSm("João Reis")).toMatchObject({ nome: "João Paulo Reis", via: "parcial" });
    expect(hub.matchSm("Renata")).toBeNull();
    expect(hub.matchSm("Fulano de Tal")).toBeNull();
  });

  it("marca SMs desligados", () => {
    const { hub } = loadHub();
    expect(hub.isDesligado("Pollyana Souza")).toBe(true);
    expect(hub.isDesligado("Renata Marques")).toBe(false);
  });

  it("usa o resumo do dashboard quando ele é mais novo que o arquivo, e o arquivo quando é mais velho", () => {
    const base = { v: 1, squads: [{ id: "z", squad: "Squad Z", nomes: [], ativa: true, sm: "Zé" }], sms: [] };
    const novo = loadHub({ snapshot: { ...base, generatedAt: "2999-01-01T00:00:00Z" } });
    expect(novo.hub.status().origem).toBe("resumo do dashboard");
    expect(novo.hub.status().squads).toBe(1);
    const velho = loadHub({ snapshot: { ...base, generatedAt: "2000-01-01T00:00:00Z" } });
    expect(velho.hub.status().origem).toBe("arquivo do hub");
    expect(velho.hub.status().squads).toBeGreaterThanOrEqual(240);
  });

  it("cai na lista antiga só quando não há resumo nem arquivo, e avisa no selo", () => {
    const { hub, win } = loadHub({ file: false, canon: true });
    expect(hub.status().origem).toBe("lista antiga (desatualizada)");
    const el = win.document.createElement("span");
    hub.renderBadge(el);
    expect(el.getAttribute("data-hub-badge")).toBe("alerta");
  });

  it("monta e lê o escopo de links entre ferramentas", () => {
    const { hub } = loadHub();
    expect(hub.scopeLink("qualidade-entregas", { sm: "Ana Souza", diretoria: "TI" })).toBe(
      "/ferramentas/qualidade-entregas.html?sm=Ana%20Souza&diretoria=TI",
    );
    expect(hub.scopeLink("x", {})).toBe("/ferramentas/x.html");
  });
});
