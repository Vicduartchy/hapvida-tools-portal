/*
 * Camada de "SM efetivo" compartilhada entre todas as ferramentas do Hub.
 *
 * Lê a mesma chave de localStorage que o Dashboard SMs x Squads usa para
 * guardar edições manuais (troca de SM, renomeio, exclusão) e aplica por
 * cima da lista base (window.SQUAD_CANON, ver shared/data/squad-canon.js).
 *
 * Qualquer ferramenta que carregar squad-canon.js + sm-mapping.js antes do
 * seu próprio script tem acesso a window.getSmSquadMapping(), que devolve
 * o mesmo formato squad -> {sm, area, diretor, diretoria} que
 * horas-sem-rastreabilidade e qualidade-entregas já esperavam do upload
 * manual — só que agora sempre atualizado, sem precisar subir arquivo.
 *
 * Não escreve nada: só leitura. Quem edita de fato é o Dashboard SMs x
 * Squads, que já usa esta mesma chave para MANUAL_OVERRIDES.
 */
(function () {
  'use strict';

  var LS_SHARED_OVERRIDES = 'hac_shared_dashboard_overrides_v1';

  function loadSharedOverrides() {
    var defaults = {
      squads: {},
      deletedSquadIds: [],
      smRenames: {},
      deletedSMKeys: [],
    };
    try {
      var raw = localStorage.getItem(LS_SHARED_OVERRIDES);
      if (!raw) return defaults;
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaults, parsed || {});
    } catch (e) {
      return defaults;
    }
  }

  function boardKey(name) {
    return String(name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  // Resolve renomeios encadeados de SM (segue a corrente até 5 saltos,
  // igual à lógica original do Dashboard SMs x Squads).
  function effectiveSM(name, overrides) {
    if (!name || name === '—') return name;
    var cur = name;
    for (var i = 0; i < 5; i++) {
      var key = boardKey(cur);
      if (overrides.deletedSMKeys.indexOf(key) >= 0) return '';
      var renamed = overrides.smRenames[key];
      if (!renamed || boardKey(renamed) === key) return cur;
      cur = renamed;
    }
    return cur;
  }

  /**
   * Devolve { "Nome da Squad": { sm, area, diretor, diretoria } }
   * pronto pra usar como STATE.smMapping nas ferramentas consumidoras.
   * Retorna {} se SQUAD_CANON não estiver carregado (script não incluído).
   */
  window.getSmSquadMapping = function getSmSquadMapping() {
    if (!Array.isArray(window.SQUAD_CANON)) return {};
    var overrides = loadSharedOverrides();
    var mapping = {};
    window.SQUAD_CANON.forEach(function (s) {
      if (overrides.deletedSquadIds.indexOf(s.id) >= 0) return;
      var ov = overrides.squads[s.id] || {};
      var merged = Object.assign({}, s, ov);
      var squadName = String(merged.squad || '').replace(/\u00a0/g, ' ').trim();
      if (!squadName) return;
      var sm = effectiveSM(merged.sm_atual || merged.sm_proposto || '', overrides);
      mapping[squadName] = {
        sm: sm || '',
        area: merged.diretoria || '',
        diretoria: merged.diretoria || '',
        diretor: merged.diretor || '',
      };
    });
    return mapping;
  };
})();
