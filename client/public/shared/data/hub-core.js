/*
 * Núcleo compartilhado do Hub do Agile Coach.
 *
 * Fonte única do modelo "squad = projeto do Azure DevOps": nome, aliases, diretoria,
 * diretor, gerente, SM, status (ativa/desativada), pessoas, boards e saúde. Quem
 * produz o modelo é o Dashboard SMs x Squads; as demais ferramentas só leem.
 *
 * Ordem de preferência das fontes (a mais recente vence):
 *   1. resumo gravado pelo dashboard no navegador (localStorage "hac_hub_model_v1"),
 *      que já inclui importações e edições manuais;
 *   2. arquivo gerado shared/data/hub-squads.js (window.HUB_SQUADS), que vale em
 *      qualquer navegador;
 *   3. lista antiga window.SQUAD_CANON, só como último recurso.
 *
 * API principal: HubCore.resolve(nome), HubCore.smOf(nome), HubCore.matchSm(nome),
 * HubCore.getSmSquadMapping(), HubCore.status(), HubCore.renderBadge(elemento).
 */
(function (global) {
  'use strict';

  var LS_MODEL = 'hac_hub_model_v1';
  var LS_OVERRIDES = 'hac_shared_dashboard_overrides_v1';
  var MODEL_VERSION = 1;
  /* SMs/PMOs desligados: ainda podem aparecer em bases de origem e devem ser sinalizados */
  var DESLIGADOS = ['pollyana', 'victor vasconcelos', 'alexandre viana'];
  var SEM_SM = 'Sem SM';

  /* ---------- normalização de nomes ---------- */
  function clean(value) {
    return String(value == null ? '' : value).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  }
  function fold(value) {
    return clean(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  /* chave de comparação de squad: sem acento, sem "(DESATIVADO)", hífens uniformes */
  function normSquad(value) {
    return fold(value)
      .replace(/^\(desativado\)\s*/, '')
      .replace(/\s*[-–—]+\s*/g, ' - ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function normPerson(value) {
    return fold(value).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function uniq(list) {
    var seen = {}, out = [];
    list.forEach(function (item) {
      var v = clean(item);
      if (v && !seen[v]) { seen[v] = true; out.push(v); }
    });
    return out;
  }

  /* ---------- carga do modelo ---------- */
  function readStorage(key) {
    try {
      var raw = global.localStorage && global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function validModel(m) {
    return !!(m && m.v === MODEL_VERSION && Array.isArray(m.squads) && m.squads.length);
  }

  /* último recurso: monta o modelo a partir da lista antiga, aplicando as edições manuais salvas */
  function modelFromLegacyCanon() {
    if (!Array.isArray(global.SQUAD_CANON)) return null;
    var ov = readStorage(LS_OVERRIDES) || {};
    var deleted = ov.deletedSquadIds || [], renames = ov.smRenames || {}, deletedSm = ov.deletedSMKeys || [];
    function effectiveSm(name) {
      var cur = clean(name);
      if (!cur || cur === '—') return '';
      for (var i = 0; i < 5; i++) {
        var key = normPerson(cur);
        if (deletedSm.indexOf(key) >= 0) return '';
        var next = renames[key];
        if (!next || normPerson(next) === key) return cur;
        cur = clean(next);
      }
      return cur;
    }
    var squads = global.SQUAD_CANON.filter(function (s) { return deleted.indexOf(s.id) < 0; }).map(function (s) {
      var merged = Object.assign({}, s, (ov.squads || {})[s.id] || {});
      return {
        id: merged.id, squad: clean(merged.squad), nomes: uniq([merged.squad].concat(merged.aliases || [])),
        diretoria: clean(merged.diretoria), diretor: clean(merged.diretor), gerente: clean(merged.gerente),
        sm: effectiveSm(merged.sm_atual || merged.sm_proposto), ativa: true, pessoas: 0, boards: 0, saude: ''
      };
    });
    return { v: MODEL_VERSION, generatedAt: '', origem: 'legado', squads: squads, sms: [], desligados: DESLIGADOS.slice() };
  }

  var cache = null;
  function pickModel() {
    var candidates = [];
    var snap = readStorage(LS_MODEL);
    if (validModel(snap)) candidates.push({ model: snap, origem: 'resumo do dashboard' });
    if (validModel(global.HUB_SQUADS)) candidates.push({ model: global.HUB_SQUADS, origem: 'arquivo do hub' });
    candidates.sort(function (a, b) { return String(b.model.generatedAt || '').localeCompare(String(a.model.generatedAt || '')); });
    if (candidates.length) return { model: candidates[0].model, origem: candidates[0].origem };
    var legacy = modelFromLegacyCanon();
    return legacy ? { model: legacy, origem: 'lista antiga (desatualizada)' } : { model: null, origem: 'nenhuma' };
  }

  function buildIndex(model) {
    var idx = { exact: {}, norm: {}, byId: {}, smKeys: {} };
    function put(map, key, rec) {
      if (!key) return;
      var cur = map[key];
      /* em colisão, a squad ativa prevalece sobre a desativada */
      if (!cur || (rec.ativa && !cur.ativa)) map[key] = rec;
    }
    model.squads.forEach(function (rec) {
      idx.byId[rec.id] = rec;
      uniq([rec.squad].concat(rec.nomes || [])).forEach(function (nome) {
        put(idx.exact, clean(nome).toLowerCase(), rec);
        put(idx.norm, normSquad(nome), rec);
      });
    });
    (model.sms || []).forEach(function (sm) { idx.smKeys[normPerson(sm.nome)] = sm; });
    return idx;
  }

  function load(force) {
    if (cache && !force) return cache;
    var picked = pickModel();
    cache = { model: picked.model, origem: picked.origem, index: picked.model ? buildIndex(picked.model) : null };
    return cache;
  }
  function reload() { cache = null; return load(true); }

  /* ---------- consultas ---------- */
  function resolve(name) {
    var c = load();
    var raw = clean(name);
    if (!c.index || !raw) return { found: false, via: '', squad: null };
    var rec = c.index.exact[raw.toLowerCase()];
    if (rec) return { found: true, via: 'nome', squad: rec };
    rec = c.index.norm[normSquad(raw)];
    if (rec) return { found: true, via: 'normalizado', squad: rec };
    return { found: false, via: '', squad: null };
  }
  function smOf(name) {
    var r = resolve(name);
    return r.found ? clean(r.squad.sm) : '';
  }
  function isDesligado(name) {
    var key = normPerson(name);
    return !!key && DESLIGADOS.some(function (d) { return key.indexOf(d) >= 0; });
  }
  function smNames() {
    var c = load();
    return c.model ? (c.model.sms || []).map(function (s) { return s.nome; }) : [];
  }
  /* reconhece um nome de SM digitado em qualquer planilha: exato, ou todas as palavras do mais curto contidas no mais longo */
  function matchSm(name) {
    var key = normPerson(name);
    if (!key) return null;
    var c = load();
    if (!c.model) return null;
    var list = c.model.sms || [];
    for (var i = 0; i < list.length; i++) if (normPerson(list[i].nome) === key) return { nome: list[i].nome, via: 'exato' };
    var tokens = key.split(' ');
    var hits = list.filter(function (sm) {
      var other = normPerson(sm.nome).split(' ');
      var small = tokens.length <= other.length ? tokens : other, big = tokens.length <= other.length ? other : tokens;
      return small.length >= 2 && small.every(function (t) { return big.indexOf(t) >= 0; });
    });
    return hits.length === 1 ? { nome: hits[0].nome, via: 'parcial' } : null;
  }
  function squads() { var c = load(); return c.model ? c.model.squads.slice() : []; }

  /* mapa nome -> dados, uma entrada por nome conhecido da squad (inclui aliases); mesmo formato que as ferramentas já esperavam */
  function getSmSquadMapping() {
    var c = load();
    var mapping = {};
    if (!c.model) return mapping;
    c.model.squads.forEach(function (rec) {
      uniq([rec.squad].concat(rec.nomes || [])).forEach(function (nome) {
        if (mapping[nome] && !rec.ativa) return;
        mapping[nome] = {
          sm: clean(rec.sm), area: rec.diretoria || '', diretoria: rec.diretoria || '', diretor: rec.diretor || '',
          gerente: rec.gerente || '', ativa: rec.ativa !== false, semSm: !clean(rec.sm), id: rec.id
        };
      });
    });
    return mapping;
  }

  function status() {
    var c = load();
    var m = c.model;
    var list = m ? m.squads : [];
    var ativas = list.filter(function (s) { return s.ativa !== false; });
    return {
      origem: c.origem, generatedAt: m ? (m.generatedAt || '') : '', ref: m ? (m.ref || '') : '',
      squads: list.length, ativas: ativas.length,
      semSm: ativas.filter(function (s) { return !clean(s.sm); }).length,
      sms: m ? (m.sms || []).length : 0,
      imports: m && m.imports ? m.imports : null
    };
  }

  function formatWhen(iso) {
    var d = iso ? new Date(iso) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'data desconhecida';
  }

  /* selo padrão "base do hub" para o topo/rodapé de cada ferramenta */
  function renderBadge(el) {
    if (!el) return null;
    var s = status();
    var stale = s.origem.indexOf('antiga') >= 0 || s.origem === 'nenhuma';
    el.setAttribute('data-hub-badge', stale ? 'alerta' : 'ok');
    el.title = stale
      ? 'Base antiga ou ausente. Abra o Dashboard SMs x Squads neste navegador para atualizar.'
      : 'Fonte: ' + s.origem + '. Atualizada em ' + formatWhen(s.generatedAt) + '. Quem edita é o Dashboard SMs x Squads.';
    el.style.cssText = 'display:inline-block;font-size:11px;font-weight:700;border-radius:12px;padding:3px 10px;' +
      (stale ? 'background:#FFF4E5;color:#8A4B00;border:1px solid #F7C98B;' : 'background:#EEF2FF;color:#1A3DAA;border:1px solid #C9D3F5;');
    el.textContent = stale
      ? 'Base do hub desatualizada — abra o Dashboard SMs x Squads'
      : 'Base do hub: ' + s.squads + ' squads (' + s.ativas + ' ativas) · ' + s.sms + ' SMs · ' + formatWhen(s.generatedAt);
    return s;
  }

  /* escopo vindo de link do dashboard: ?sm=...&squad=...&diretoria=... */
  function readScope() {
    var out = { sm: '', squad: '', diretoria: '' };
    try {
      var params = new URLSearchParams(global.location.search || '');
      out.sm = clean(params.get('sm')); out.squad = clean(params.get('squad')); out.diretoria = clean(params.get('diretoria'));
    } catch (e) { /* ambiente sem URLSearchParams */ }
    return out;
  }
  function scopeLink(slug, scope) {
    var params = [];
    ['sm', 'squad', 'diretoria'].forEach(function (k) {
      if (scope && scope[k]) params.push(k + '=' + encodeURIComponent(scope[k]));
    });
    return '/ferramentas/' + slug + '.html' + (params.length ? '?' + params.join('&') : '');
  }

  global.HubCore = {
    LS_MODEL: LS_MODEL, MODEL_VERSION: MODEL_VERSION, DESLIGADOS: DESLIGADOS, SEM_SM: SEM_SM,
    clean: clean, normSquad: normSquad, normPerson: normPerson,
    load: load, reload: reload, resolve: resolve, smOf: smOf, isDesligado: isDesligado,
    smNames: smNames, matchSm: matchSm, squads: squads, getSmSquadMapping: getSmSquadMapping,
    status: status, renderBadge: renderBadge, readScope: readScope, scopeLink: scopeLink
  };
})(typeof window !== 'undefined' ? window : globalThis);
