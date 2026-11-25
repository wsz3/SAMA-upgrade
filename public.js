/**
 * ============================================================================
 * SAMA - Sistema Autônomo de Monitoramento Ambiental (Lagoa da Chapadinha)
 * VISÃO PÚBLICA (Cidadão) - public.js
 * ============================================================================
 */

// Configuração do Supabase (URL + chave pública)
const SUPABASE_URL = "https://uuzeswbizdzqnrexhriw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qB7KlES-jMIGy0A9Fi7CvA_JyluRlNL";

const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function generate30DayHistory(cfg) {
  const list = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const factor = Math.sin(i * 0.4) * 0.5 + (Math.random() - 0.5) * 0.5;
    list.push({
      date: dayLabel,
      dayOffset: i,
      ph: Number((cfg.basePh + factor * cfg.varPh).toFixed(2)),
      turbidity: Number(Math.max(1, cfg.baseTurbidity + factor * cfg.varTurbidity).toFixed(1)),
      eColi: Math.round(Math.max(10, cfg.baseEColi + factor * cfg.varEColi)),
      od: Number(Math.max(1, cfg.baseOD - factor * cfg.varOD).toFixed(1))
    });
  }
  return list;
}

const INITIAL_POINTS = [
  {
    id: 'P1',
    code: 'P1',
    name: 'Foz Oeste / Entrada das Águas',
    coordsDesc: '10°04\'28\'\' S, 44°17\'52\'\' W',
    xPercent: 14.0,
    yPercent: 70.0,
    lastUpdate: 'Hoje, 09:30',
    operator: 'Bióloga Marina Costa (SAMA)',
    current: {
      ph: 7.30,
      turbidity: 58.0,
      eColi: 1450,
      dissolvedOxygen: 3.4,
      waterTemp: 26.5,
      airTemp: 29.8,
      totalPhosphorus: 0.082
    },
    history30d: generate30DayHistory({
      basePh: 7.25, varPh: 0.2,
      baseTurbidity: 48, varTurbidity: 18,
      baseEColi: 1200, varEColi: 350,
      baseOD: 3.8, varOD: 0.6
    })
  },
  {
    id: 'P2',
    code: 'P2',
    name: 'Margem Norte / Parque Regina Freire',
    coordsDesc: '10°04\'42\'\' S, 44°17\'30\'\' W',
    xPercent: 32.0,
    yPercent: 64.0,
    lastUpdate: 'Hoje, 08:45',
    operator: 'Eng. Renato Salles (SAMA)',
    current: {
      ph: 6.85,
      turbidity: 32.0,
      eColi: 650,
      dissolvedOxygen: 4.8,
      waterTemp: 25.8,
      airTemp: 28.5,
      totalPhosphorus: 0.038
    },
    history30d: generate30DayHistory({
      basePh: 6.9, varPh: 0.2,
      baseTurbidity: 30, varTurbidity: 8,
      baseEColi: 600, varEColi: 180,
      baseOD: 4.9, varOD: 0.5
    })
  },
  {
    id: 'P3',
    code: 'P3',
    name: 'Lâmina Central / Águas Profundas',
    coordsDesc: '10°04\'50\'\' S, 44°17\'42\'\' W',
    xPercent: 52.0,
    yPercent: 60.0,
    lastUpdate: 'Hoje, 10:15',
    operator: 'Téc. Carlos Eduardo (SAMA)',
    current: {
      ph: 7.20,
      turbidity: 12.5,
      eColi: 110,
      dissolvedOxygen: 6.8,
      waterTemp: 24.5,
      airTemp: 28.0,
      totalPhosphorus: 0.018
    },
    history30d: generate30DayHistory({
      basePh: 7.2, varPh: 0.15,
      baseTurbidity: 14, varTurbidity: 4,
      baseEColi: 130, varEColi: 40,
      baseOD: 6.7, varOD: 0.4
    })
  },
  {
    id: 'P4',
    code: 'P4',
    name: 'Enseada Nordeste / Macrófitas',
    coordsDesc: '10°04\'58\'\' S, 44°17\'55\'\' W',
    xPercent: 72.0,
    yPercent: 48.0,
    lastUpdate: 'Hoje, 09:10',
    operator: 'Bióloga Marina Costa (SAMA)',
    current: {
      ph: 7.40,
      turbidity: 68.0,
      eColi: 1850,
      dissolvedOxygen: 3.1,
      waterTemp: 27.2,
      airTemp: 30.1,
      totalPhosphorus: 0.095
    },
    history30d: generate30DayHistory({
      basePh: 7.4, varPh: 0.25,
      baseTurbidity: 62, varTurbidity: 12,
      baseEColi: 1700, varEColi: 400,
      baseOD: 3.3, varOD: 0.5
    })
  },
  {
    id: 'P5',
    code: 'P5',
    name: 'Foz Leste / Vertedouro Sul',
    coordsDesc: '10°05\'15\'\' S, 44°17\'35\'\' W',
    xPercent: 85.0,
    yPercent: 58.0,
    lastUpdate: 'Hoje, 08:00',
    operator: 'Eng. Renato Salles (SAMA)',
    current: {
      ph: 7.10,
      turbidity: 9.8,
      eColi: 80,
      dissolvedOxygen: 7.2,
      waterTemp: 24.1,
      airTemp: 27.5,
      totalPhosphorus: 0.012
    },
    history30d: generate30DayHistory({
      basePh: 7.1, varPh: 0.1,
      baseTurbidity: 10, varTurbidity: 3,
      baseEColi: 95, varEColi: 30,
      baseOD: 7.1, varOD: 0.3
    })
  }
];

// Busca pontos e última medição no Supabase (com fallback para localStorage / INITIAL_POINTS)
async function loadPointsFromSupabase() {
  if (!supabaseClient) return null;

  try {
    const { data: pontos, error: errPontos } = await supabaseClient
      .from("pontos_coleta")
      .select("*")
      .order("codigo", { ascending: true });

    if (errPontos || !pontos || pontos.length === 0) return null;

    const { data: medicoes } = await supabaseClient
      .from("medicoes")
      .select("*")
      .order("data_hora", { ascending: false })
      .order("id", { ascending: false });

    const ultimaPorPonto = new Map();
    (medicoes || []).forEach((m) => {
      if (!ultimaPorPonto.has(m.ponto_coleta_id)) {
        ultimaPorPonto.set(m.ponto_coleta_id, m);
      }
    });

    return pontos.map((p) => {
      const m = ultimaPorPonto.get(p.id);
      const initMatch = INITIAL_POINTS.find((i) => i.code === p.codigo || i.id === p.codigo);
      return {
        id: p.codigo,
        code: p.codigo,
        name: p.nome || (initMatch ? initMatch.name : p.codigo),
        coordsDesc: (p.latitude != null && p.longitude != null)
          ? `${Number(p.latitude).toFixed(5)}°, ${Number(p.longitude).toFixed(5)}°`
          : (initMatch ? initMatch.coordsDesc : ""),
        xPercent: p.x_percent != null ? Number(p.x_percent) : (initMatch ? initMatch.xPercent : 50),
        yPercent: p.y_percent != null ? Number(p.y_percent) : (initMatch ? initMatch.yPercent : 50),
        lastUpdate: m && m.data_hora
          ? new Date(m.data_hora).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
          : (initMatch ? initMatch.lastUpdate : "Sem medição"),
        operator: (m && m.operador_nome) || p.operador_responsavel || "Equipe Técnica SAMA",
        current: m ? {
          ph: Number(m.ph ?? 7.0),
          turbidity: Number(m.turbidez ?? 0),
          eColi: Number(m.e_coli ?? 0),
          dissolvedOxygen: Number(m.oxigenio_dissolvido ?? 0),
          waterTemp: Number(m.temperatura_agua ?? 0),
          airTemp: Number(m.temperatura_ar ?? 0),
          totalPhosphorus: Number(m.fosforo_total ?? 0)
        } : (initMatch ? initMatch.current : {
          ph: 7.0, turbidity: 10, eColi: 100, dissolvedOxygen: 6.0,
          waterTemp: 25.0, airTemp: 28.0, totalPhosphorus: 0.02
        }),
        history30d: initMatch ? initMatch.history30d : []
      };
    });
  } catch (e) {
    console.warn("[SAMA Public] Falha ao consultar Supabase, usando fallback local:", e);
    return null;
  }
}

(function () {
  'use strict';

  const THRESHOLDS = {
    ph: { min: 6.0, max: 9.0, criticalMin: 5.0, criticalMax: 9.5, unit: '' },
    turbidity: { idealMax: 25.0, criticalMax: 40.0, unit: 'NTU' },
    eColi: { idealMax: 250, criticalMax: 1000, unit: 'NMP/100mL' },
    dissolvedOxygen: { idealMin: 5.0, criticalMin: 4.0, unit: 'mg/L' },
    totalPhosphorus: { idealMax: 0.03, criticalMax: 0.05, unit: 'mg/L' }
  };

  const VALID_PASSWORDS = ['sama2026', 'admin123', 'operador2026'];
  const STORAGE_KEY_POINTS = 'SAMA_MONITORAMENTO_DB';

  function evaluateWorstCaseStatus(p) {
    const criticalViolations = [];
    const warningViolations = [];

    let phStatus = 'green';
    if (p.ph < THRESHOLDS.ph.criticalMin || p.ph > THRESHOLDS.ph.criticalMax) {
      criticalViolations.push(`pH fora do padrão severo (${p.ph.toFixed(2)})`);
      phStatus = 'red';
    } else if (p.ph < THRESHOLDS.ph.min || p.ph > THRESHOLDS.ph.max) {
      warningViolations.push(`pH em desvio moderado (${p.ph.toFixed(2)})`);
      phStatus = 'yellow';
    }

    if (p.eColi > THRESHOLDS.eColi.criticalMax) {
      criticalViolations.push(`Contaminação Biológica Severa: E. coli (${p.eColi} NMP/100mL > limite de 1.000)`);
    } else if (p.eColi > THRESHOLDS.eColi.idealMax) {
      warningViolations.push(`E. coli em Alerta (${p.eColi} NMP/100mL)`);
    }

    if (p.turbidity > THRESHOLDS.turbidity.criticalMax) {
      criticalViolations.push(`Turbidez Crítica (${p.turbidity.toFixed(1)} NTU > limite de 40.0)`);
    } else if (p.turbidity > THRESHOLDS.turbidity.idealMax) {
      warningViolations.push(`Turbidez Elevada (${p.turbidity.toFixed(1)} NTU)`);
    }

    if (p.dissolvedOxygen < THRESHOLDS.dissolvedOxygen.criticalMin) {
      criticalViolations.push(`Oxigênio Dissolvido Crítico (${p.dissolvedOxygen.toFixed(1)} mg/L < 4.0 mg/L)`);
    } else if (p.dissolvedOxygen < THRESHOLDS.dissolvedOxygen.idealMin) {
      warningViolations.push(`Oxigênio Dissolvido em Atenção (${p.dissolvedOxygen.toFixed(1)} mg/L)`);
    }

    if (criticalViolations.length > 0) {
      let rationaleText = phStatus === 'green'
        ? `Apesar do pH estar na faixa ideal de conformidade (${p.ph.toFixed(2)}), este ponto foi classificado como CRÍTICO devido a desvios severos: ${criticalViolations.join('; ')}.`
        : `Classificação Crítica por desconformidade regulatória: ${criticalViolations.join('; ')}.`;

      return {
        level: 'red',
        badge: 'CRÍTICO',
        condition: 'Imprópria para Recreação e Consumo',
        color: '#ef4444',
        rationale: rationaleText,
        isWorstCaseTriggered: phStatus === 'green',
        criticalList: criticalViolations
      };
    }

    if (warningViolations.length > 0) {
      return {
        level: 'yellow',
        badge: 'ATENÇÃO',
        condition: 'Qualidade Tolerável - Requer Cautela',
        color: '#f59e0b',
        rationale: `Ponto sob alerta preventivo devido a: ${warningViolations.join('; ')}. Recomenda-se evitar ingestão acidental e contato prolongado.`,
        isWorstCaseTriggered: false,
        warningList: warningViolations
      };
    }

    return {
      level: 'green',
      badge: 'IDEAL',
      condition: 'Própria para Recreação e Contato Primário',
      color: '#10b981',
      rationale: `Todos os parâmetros biológicos, físicos e químicos atendem rigorosamente aos limites da Resolução CONAMA 357 (Classe 2).`,
      isWorstCaseTriggered: false
    };
  }

  const state = {
    points: [],
    selectedPoint: null,
    activeFilter: 'all',
    activeChartMetric: 'turbidity',
    zoomLevel: 1.0,
    currentMapLayer: 'complete'
  };

  const DOM = {
    btnToggleDrawer: document.getElementById('btnToggleDrawer'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    sideDrawer: document.getElementById('sideDrawer'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    drawerPointsList: document.getElementById('drawerPointsList'),
    filterButtons: document.querySelectorAll('.filter-btn'),

    mapViewport: document.getElementById('mapViewport'),
    pinsLayer: document.getElementById('pinsLayer'),
    mapCanvasWrapper: document.getElementById('mapCanvasWrapper'),
    mapImage: document.getElementById('mapImage'),
    btnLayerComplete: document.getElementById('btnLayerComplete'),
    btnLayerIsolated: document.getElementById('btnLayerIsolated'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomReset: document.getElementById('btnZoomReset'),

    kpiTotalPoints: document.getElementById('kpiTotalPoints'),
    kpiIdealPoints: document.getElementById('kpiIdealPoints'),
    kpiWarningPoints: document.getElementById('kpiWarningPoints'),
    kpiCriticalPoints: document.getElementById('kpiCriticalPoints'),
    globalStatusPill: document.getElementById('globalStatusPill'),

    floatingCard: document.getElementById('floatingCard'),
    btnCloseCard: document.getElementById('btnCloseCard'),
    cardPointCode: document.getElementById('cardPointCode'),
    cardPointName: document.getElementById('cardPointName'),
    cardPointCoords: document.getElementById('cardPointCoords'),
    cardVerdictBox: document.getElementById('cardVerdictBox'),
    cardVerdictIcon: document.getElementById('cardVerdictIcon'),
    cardVerdictBadge: document.getElementById('cardVerdictBadge'),
    cardVerdictCondition: document.getElementById('cardVerdictCondition'),
    cardVerdictRationale: document.getElementById('cardVerdictRationale'),
    valPh: document.getElementById('valPh'),
    barPh: document.getElementById('barPh'),
    valTurbidity: document.getElementById('valTurbidity'),
    threshTurbidity: document.getElementById('threshTurbidity'),
    valEColi: document.getElementById('valEColi'),
    threshEColi: document.getElementById('threshEColi'),
    valOd: document.getElementById('valOd'),
    threshOd: document.getElementById('threshOd'),
    valTemp: document.getElementById('valTemp'),
    valPhosphorus: document.getElementById('valPhosphorus'),
    cardLastCollectionDate: document.getElementById('cardLastCollectionDate'),
    cardOperator: document.getElementById('cardOperator'),

    miniTrendCanvas: document.getElementById('miniTrendCanvas'),
    chartTooltip: document.getElementById('chartTooltip'),
    chartMetricLabel: document.getElementById('chartMetricLabel'),
    chartTabs: document.querySelectorAll('.chart-tab'),
    chartStatMin: document.getElementById('chartStatMin'),
    chartStatAvg: document.getElementById('chartStatAvg'),
    chartStatMax: document.getElementById('chartStatMax'),
    chartStatLimit: document.getElementById('chartStatLimit'),

    btnOpenAuthModal: document.getElementById('btnOpenAuthModal'),
    btnDrawerOpenAuth: document.getElementById('btnDrawerOpenAuth'),
    authModal: document.getElementById('authModal'),
    authBackdrop: document.getElementById('authBackdrop'),
    authForm: document.getElementById('authForm'),
    operatorPasswordInput: document.getElementById('operatorPasswordInput'),
    btnTogglePassword: document.getElementById('btnTogglePassword'),
    authFieldGroup: document.getElementById('authFieldGroup'),
    authErrorMsg: document.getElementById('authErrorMsg'),
    authErrorText: document.getElementById('authErrorText'),
    btnCloseAuth: document.getElementById('btnCloseAuth'),
    btnCancelAuth: document.getElementById('btnCancelAuth')
  };

  function initDatabase() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_POINTS);
      if (stored) {
        state.points = JSON.parse(stored);
      } else {
        state.points = INITIAL_POINTS.map((pt) => ({ ...pt }));
        savePointsDatabase();
      }
    } catch (e) {
      console.warn('[SAMA Public] Falha ao ler localStorage. Usando banco em memória.', e);
      state.points = INITIAL_POINTS.map((pt) => ({ ...pt }));
    }

    state.points.forEach(pt => {
      pt.statusObj = evaluateWorstCaseStatus(pt.current);
    });
  }

  function savePointsDatabase() {
    try {
      localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(state.points));
    } catch (e) {
      console.warn('[SAMA Public] Erro ao salvar dados no localStorage.', e);
    }
  }

  function renderMapPins() {
    if (!DOM.pinsLayer) return;
    DOM.pinsLayer.innerHTML = '';

    state.points.forEach(point => {
      if (state.activeFilter !== 'all' && point.statusObj.level !== state.activeFilter) {
        return;
      }

      const pin = document.createElement('button');
      pin.className = `map-pin pin--${point.statusObj.level}`;
      pin.setAttribute('data-point-id', point.id);
      pin.setAttribute('aria-label', `Ponto ${point.code}: ${point.name}. Status: ${point.statusObj.badge}`);
      pin.style.left = `${point.xPercent}%`;
      pin.style.top = `${point.yPercent}%`;

      if (state.selectedPoint && state.selectedPoint.id === point.id) {
        pin.classList.add('active');
      }

      pin.innerHTML = `
        <span class="pin-pulse" aria-hidden="true"></span>
        <span class="pin-core">${point.code}</span>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPoint(point.id);
      });

      DOM.pinsLayer.appendChild(pin);
    });
  }

  function renderDrawerInfo() {
    if (!DOM.drawerPointsList) return;

    const countTotal = state.points.length;
    let countGreen = 0;
    let countYellow = 0;
    let countRed = 0;

    DOM.drawerPointsList.innerHTML = '';

    state.points.forEach(pt => {
      if (pt.statusObj.level === 'green') countGreen++;
      if (pt.statusObj.level === 'yellow') countYellow++;
      if (pt.statusObj.level === 'red') countRed++;

      const li = document.createElement('li');
      li.innerHTML = `
        <button class="point-item-btn" data-point-id="${pt.id}">
          <div class="point-item-left">
            <span class="point-item-code">${pt.code}</span>
            <span class="point-item-name">${pt.name}</span>
          </div>
          <span class="point-item-status-tag tag--${pt.statusObj.level}">
            ${pt.statusObj.badge}
          </span>
        </button>
      `;

      li.querySelector('button').addEventListener('click', () => {
        selectPoint(pt.id);
        closeDrawer();
      });

      DOM.drawerPointsList.appendChild(li);
    });

    if (DOM.kpiTotalPoints) DOM.kpiTotalPoints.textContent = countTotal;
    if (DOM.kpiIdealPoints) DOM.kpiIdealPoints.textContent = countGreen;
    if (DOM.kpiWarningPoints) DOM.kpiWarningPoints.textContent = countYellow;
    if (DOM.kpiCriticalPoints) DOM.kpiCriticalPoints.textContent = countRed;

    if (DOM.globalStatusPill) {
      const dot = DOM.globalStatusPill.querySelector('.status-dot');
      const text = DOM.globalStatusPill.querySelector('.status-text');
      if (countRed > 0) {
        dot.className = 'status-dot status-dot--red';
        text.innerHTML = 'Status: <strong>Alerta de Desconformidade</strong>';
      } else if (countYellow > 0) {
        dot.className = 'status-dot status-dot--yellow';
        text.innerHTML = 'Status: <strong>Atenção Geral</strong>';
      } else {
        dot.className = 'status-dot status-dot--green';
        text.innerHTML = 'Status: <strong>Bacia Segura</strong>';
      }
    }
  }

  function selectPoint(pointId) {
    const point = state.points.find(p => p.id === pointId);
    if (!point) return;

    state.selectedPoint = point;

    document.querySelectorAll('.map-pin').forEach(pin => {
      pin.classList.toggle('active', pin.getAttribute('data-point-id') === pointId);
    });

    DOM.cardPointCode.textContent = point.code;
    DOM.cardPointName.textContent = point.name;
    DOM.cardPointCoords.textContent = point.coordsDesc;
    DOM.cardLastCollectionDate.textContent = point.lastUpdate;
    DOM.cardOperator.textContent = point.operator;

    const st = point.statusObj;
    DOM.cardVerdictBox.className = `status-verdict-box verdict-box--${st.level}`;
    DOM.cardVerdictBadge.textContent = st.badge;
    DOM.cardVerdictCondition.textContent = st.condition;
    DOM.cardVerdictRationale.textContent = st.rationale;

    let iconSvg = '';
    if (st.level === 'green') {
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (st.level === 'yellow') {
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }
    DOM.cardVerdictIcon.innerHTML = iconSvg;

    const curr = point.current;
    DOM.valPh.textContent = curr.ph.toFixed(2);
    const phPercent = Math.min(100, Math.max(0, (curr.ph / 14) * 100));
    DOM.barPh.style.width = `${phPercent}%`;

    DOM.valTurbidity.textContent = curr.turbidity.toFixed(1);
    if (curr.turbidity > THRESHOLDS.turbidity.criticalMax) {
      DOM.threshTurbidity.innerHTML = '<span style="color:var(--status-red);font-weight:700;">&#9888; Não Conforme (>40 NTU)</span>';
    } else {
      DOM.threshTurbidity.textContent = 'Máx. CONAMA: 40 NTU';
    }

    DOM.valEColi.textContent = curr.eColi.toLocaleString('pt-BR');
    if (curr.eColi > THRESHOLDS.eColi.criticalMax) {
      DOM.threshEColi.innerHTML = '<span style="color:var(--status-red);font-weight:700;">&#9888; Contaminação Severa</span>';
    } else {
      DOM.threshEColi.textContent = 'Limite: 1.000 NMP/100mL';
    }

    DOM.valOd.textContent = curr.dissolvedOxygen.toFixed(1);
    if (curr.dissolvedOxygen < THRESHOLDS.dissolvedOxygen.criticalMin) {
      DOM.threshOd.innerHTML = '<span style="color:var(--status-red);font-weight:700;">&#9888; Anóxia / Baixo (<4.0)</span>';
    } else {
      DOM.threshOd.textContent = 'Mínimo: 5.0 mg/L';
    }

    DOM.valTemp.textContent = curr.waterTemp.toFixed(1);
    DOM.valPhosphorus.textContent = curr.totalPhosphorus.toFixed(3);

    if (DOM.floatingCard) {
      DOM.floatingCard.removeAttribute('hidden');
      DOM.floatingCard.style.display = 'flex';
      DOM.floatingCard.classList.add('active', 'open');
    }

    renderCanvasChart();
  }

  function closeCard() {
    if (DOM.floatingCard) {
      DOM.floatingCard.style.display = 'none';
      DOM.floatingCard.classList.remove('active', 'open');
      DOM.floatingCard.setAttribute('hidden', '');
    }
    state.selectedPoint = null;
    document.querySelectorAll('.map-pin').forEach(pin => pin.classList.remove('active'));
  }

  let chartPointsCoords = [];

  function renderCanvasChart() {
    if (!state.selectedPoint || !DOM.miniTrendCanvas) return;

    const canvas = DOM.miniTrendCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 380;
    const height = rect.height || 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const history = state.selectedPoint.history30d;
    if (!history || history.length === 0) return;

    const metric = state.activeChartMetric;
    const dataVals = history.map(h => h[metric]);

    let metricTitle = '';
    let unit = '';
    let limitVal = null;
    let limitLabel = '';
    let lineColor = '#0d9488';
    let gradientStart = 'rgba(13, 148, 136, 0.25)';

    switch (metric) {
      case 'turbidity':
        metricTitle = 'Turbidez';
        unit = 'NTU';
        limitVal = THRESHOLDS.turbidity.criticalMax;
        limitLabel = 'Limite CONAMA (40 NTU)';
        lineColor = '#f59e0b';
        gradientStart = 'rgba(245, 158, 11, 0.25)';
        break;
      case 'eColi':
        metricTitle = 'E. coli';
        unit = 'NMP/100mL';
        limitVal = THRESHOLDS.eColi.criticalMax;
        limitLabel = 'Limite Balneabilidade (1000 NMP)';
        lineColor = '#ef4444';
        gradientStart = 'rgba(239, 68, 68, 0.25)';
        break;
      case 'ph':
        metricTitle = 'pH';
        unit = '';
        limitVal = 9.0;
        limitLabel = 'Faixa Ideal (6.0 - 9.0)';
        lineColor = '#0d9488';
        gradientStart = 'rgba(13, 148, 136, 0.25)';
        break;
      case 'od':
        metricTitle = 'Oxigênio Dissolvido';
        unit = 'mg/L';
        limitVal = THRESHOLDS.dissolvedOxygen.criticalMin;
        limitLabel = 'Mínimo Aceitável (4.0 mg/L)';
        lineColor = '#3b82f6';
        gradientStart = 'rgba(59, 130, 246, 0.25)';
        break;
    }

    if (DOM.chartMetricLabel) {
      DOM.chartMetricLabel.textContent = `Parâmetro: ${metricTitle} (${unit || 'Escala'})`;
    }

    const minVal = Math.min(...dataVals);
    const maxVal = Math.max(...dataVals);
    const avgVal = dataVals.reduce((a, b) => a + b, 0) / dataVals.length;

    if (DOM.chartStatMin) DOM.chartStatMin.textContent = `${minVal.toFixed(1)} ${unit}`;
    if (DOM.chartStatAvg) DOM.chartStatAvg.textContent = `${avgVal.toFixed(1)} ${unit}`;
    if (DOM.chartStatMax) DOM.chartStatMax.textContent = `${maxVal.toFixed(1)} ${unit}`;
    if (DOM.chartStatLimit) DOM.chartStatLimit.textContent = limitLabel;

    const padTop = 20;
    const padBottom = 26;
    const padLeft = 42;
    const padRight = 16;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    let yMin = Math.min(minVal, limitVal !== null ? limitVal * 0.7 : minVal);
    let yMax = Math.max(maxVal, limitVal !== null ? limitVal * 1.3 : maxVal);
    if (yMin === yMax) {
      yMin *= 0.8;
      yMax *= 1.2;
    }
    const yRange = yMax - yMin;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    const gridLines = 3;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (chartH / gridLines) * i;
      const v = yMax - (yRange / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(v.toFixed(1), padLeft - 6, y + 3);
    }

    if (limitVal !== null && limitVal >= yMin && limitVal <= yMax) {
      const limitY = padTop + chartH - ((limitVal - yMin) / yRange) * chartH;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, limitY);
      ctx.lineTo(width - padRight, limitY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'left';
      ctx.fillText(`Meta CONAMA (${limitVal})`, padLeft + 6, limitY - 4);
    }

    chartPointsCoords = [];
    const stepX = chartW / (dataVals.length - 1);

    for (let i = 0; i < dataVals.length; i++) {
      const x = padLeft + i * stepX;
      const y = padTop + chartH - ((dataVals[i] - yMin) / yRange) * chartH;
      chartPointsCoords.push({
        x: x,
        y: y,
        val: dataVals[i],
        date: history[i].date,
        metric: metricTitle,
        unit: unit
      });
    }

    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    gradient.addColorStop(0, gradientStart);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.moveTo(chartPointsCoords[0].x, padTop + chartH);
    for (let i = 0; i < chartPointsCoords.length; i++) {
      ctx.lineTo(chartPointsCoords[i].x, chartPointsCoords[i].y);
    }
    ctx.lineTo(chartPointsCoords[chartPointsCoords.length - 1].x, padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < chartPointsCoords.length; i++) {
      if (i === 0) ctx.moveTo(chartPointsCoords[i].x, chartPointsCoords[i].y);
      else ctx.lineTo(chartPointsCoords[i].x, chartPointsCoords[i].y);
    }
    ctx.stroke();

    [chartPointsCoords[0], chartPointsCoords[chartPointsCoords.length - 1]].forEach(pt => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(history[0].date, padLeft, height - 8);
    ctx.textAlign = 'right';
    ctx.fillText('Hoje', width - padRight, height - 8);
  }

  function handleChartInteraction(e) {
    if (!DOM.miniTrendCanvas || chartPointsCoords.length === 0) return;

    const rect = DOM.miniTrendCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const mouseX = clientX - rect.left;

    let closest = null;
    let minDiff = Infinity;

    for (const pt of chartPointsCoords) {
      const diff = Math.abs(pt.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }

    if (closest && minDiff < 20) {
      DOM.chartTooltip.hidden = false;
      DOM.chartTooltip.style.left = `${closest.x}px`;
      DOM.chartTooltip.style.top = `${closest.y}px`;
      DOM.chartTooltip.innerHTML = `<strong>${closest.val.toFixed(1)} ${closest.unit}</strong><br><small>${closest.date}</small>`;
    } else {
      DOM.chartTooltip.hidden = true;
    }
  }

  function setZoom(level) {
    state.zoomLevel = Math.max(0.9, Math.min(2.5, level));
    if (DOM.mapCanvasWrapper) {
      DOM.mapCanvasWrapper.style.transform = `scale(${state.zoomLevel})`;
    }
  }

  function setMapLayer(layer) {
    state.currentMapLayer = layer;
    if (layer === 'isolated') {
      DOM.mapImage.src = 'lagoa-isolada.png';
      DOM.btnLayerIsolated.classList.add('active');
      DOM.btnLayerComplete.classList.remove('active');
    } else {
      DOM.mapImage.src = 'lagoa-completa.png';
      DOM.btnLayerComplete.classList.add('active');
      DOM.btnLayerIsolated.classList.remove('active');
    }
  }

  function openDrawer() {
    DOM.sideDrawer.classList.add('active');
    DOM.drawerBackdrop.classList.add('active');
    DOM.btnToggleDrawer.setAttribute('aria-expanded', 'true');
    DOM.sideDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    DOM.sideDrawer.classList.remove('active');
    DOM.drawerBackdrop.classList.remove('active');
    DOM.btnToggleDrawer.setAttribute('aria-expanded', 'false');
    DOM.sideDrawer.setAttribute('aria-hidden', 'true');
  }

  function openAuthModal() {
    closeDrawer();
    DOM.authBackdrop.hidden = false;
    DOM.authModal.hidden = false;
    DOM.operatorPasswordInput.value = '';
    clearAuthError();
    setTimeout(() => DOM.operatorPasswordInput.focus(), 100);
  }

  function closeAuthModal() {
    DOM.authBackdrop.hidden = true;
    DOM.authModal.hidden = true;
    clearAuthError();
  }

  function showAuthError(msg) {
    DOM.authErrorMsg.hidden = false;
    DOM.authErrorText.textContent = msg;
    DOM.operatorPasswordInput.focus();
    DOM.operatorPasswordInput.style.borderColor = 'var(--status-red)';
  }

  function clearAuthError() {
    DOM.authErrorMsg.hidden = true;
    DOM.operatorPasswordInput.style.borderColor = '';
  }

  function handleAuthSubmit(e) {
    e.preventDefault();
    const entered = DOM.operatorPasswordInput.value.trim();

    if (!entered) {
      showAuthError('Informe a senha de operador.');
      return;
    }

    if (VALID_PASSWORDS.includes(entered.toLowerCase())) {
      window.location.href = 'especialista.html';
    } else {
      showAuthError('Código/Senha incorreta. Acesso não autorizado.');
    }
  }

  function setupEventListeners() {
    if (DOM.btnToggleDrawer) DOM.btnToggleDrawer.addEventListener('click', openDrawer);
    if (DOM.btnCloseDrawer) DOM.btnCloseDrawer.addEventListener('click', closeDrawer);
    if (DOM.drawerBackdrop) DOM.drawerBackdrop.addEventListener('click', closeDrawer);

    if (DOM.btnCloseCard) {
      DOM.btnCloseCard.addEventListener('click', (e) => {
        e.stopPropagation();
        closeCard();
      });
    }

    if (DOM.btnLayerComplete) {
      DOM.btnLayerComplete.addEventListener('click', () => setMapLayer('complete'));
    }
    if (DOM.btnLayerIsolated) {
      DOM.btnLayerIsolated.addEventListener('click', () => setMapLayer('isolated'));
    }

    if (DOM.btnZoomIn) DOM.btnZoomIn.addEventListener('click', () => setZoom(state.zoomLevel + 0.2));
    if (DOM.btnZoomOut) DOM.btnZoomOut.addEventListener('click', () => setZoom(state.zoomLevel - 0.2));
    if (DOM.btnZoomReset) DOM.btnZoomReset.addEventListener('click', () => setZoom(1.0));

    DOM.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeFilter = btn.getAttribute('data-filter');
        renderMapPins();
      });
    });

    DOM.chartTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        DOM.chartTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeChartMetric = tab.getAttribute('data-chart-metric');
        renderCanvasChart();
      });
    });

    if (DOM.miniTrendCanvas) {
      DOM.miniTrendCanvas.addEventListener('mousemove', handleChartInteraction);
      DOM.miniTrendCanvas.addEventListener('mouseleave', () => {
        if (DOM.chartTooltip) DOM.chartTooltip.hidden = true;
      });
      DOM.miniTrendCanvas.addEventListener('touchstart', handleChartInteraction, { passive: true });
      DOM.miniTrendCanvas.addEventListener('touchmove', handleChartInteraction, { passive: true });
    }

    if (DOM.btnOpenAuthModal) DOM.btnOpenAuthModal.addEventListener('click', openAuthModal);
    if (DOM.btnDrawerOpenAuth) DOM.btnDrawerOpenAuth.addEventListener('click', openAuthModal);
    if (DOM.btnCloseAuth) DOM.btnCloseAuth.addEventListener('click', closeAuthModal);
    if (DOM.btnCancelAuth) DOM.btnCancelAuth.addEventListener('click', closeAuthModal);
    if (DOM.authBackdrop) DOM.authBackdrop.addEventListener('click', closeAuthModal);
    if (DOM.authForm) DOM.authForm.addEventListener('submit', handleAuthSubmit);

    if (DOM.btnTogglePassword) {
      DOM.btnTogglePassword.addEventListener('click', () => {
        const isPwd = DOM.operatorPasswordInput.type === 'password';
        DOM.operatorPasswordInput.type = isPwd ? 'text' : 'password';
      });
    }

    window.addEventListener('resize', () => {
      if (state.selectedPoint) renderCanvasChart();
    });
  }

  // BOOTSTRAP COM CONSULTA AO SUPABASE
  async function bootstrap() {
    initDatabase();

    // Consulta remota ao Supabase para atualizar os pontos
    const remotePoints = await loadPointsFromSupabase();
    if (remotePoints && remotePoints.length > 0) {
      state.points = remotePoints;
      state.points.forEach(pt => {
        pt.statusObj = evaluateWorstCaseStatus(pt.current);
      });
      savePointsDatabase();
    }

    renderMapPins();
    renderDrawerInfo();
    setupEventListeners();

    if (window.innerWidth >= 1024 && state.points.length > 0) {
      selectPoint('P1');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();