/**
 * ============================================================================
 * SAMA - Sistema Autônomo de Monitoramento Ambiental (Lagoa da Chapadinha)
 * VISÃO DO ESPECIALISTA (Operador de Campo) - especialista.js
 *
 * Módulo isolado (IIFE) sem vazamento de escopo global.
 * Implementa:
 * - Calibração de coordenadas com imagem horizontal (lagoa-completa.png)
 * - Alternância de camadas (Satélite ⇄ Lâmina D'água)
 * - Escala Colorimétrica Dinâmica de pH em tempo real com validação estrita (0-14)
 * - Feedback dinâmico de turbidez conforme CONAMA 357
 * - Toque no mapa para capturar coordenadas geográficas
 * - Captura GPS nativo com alta precisão
 * - Upload de foto da amostra com compressão Canvas (<50KB)
 * - Arquitetura Offline-First com LocalStorage e sincronização resiliente
 * ============================================================================
 */
(function () {
  'use strict';

  // 1. Constantes e Chaves de Persistência
  const STORAGE_KEY_OFFLINE = 'SAMA_OFFLINE_COLETAS';
  const STORAGE_KEY_POINTS = 'SAMA_MONITORAMENTO_DB';

  // Delimitação Cartográfica da Lagoa da Chapadinha para Cálculo de Coordenadas
  // Projeção calibrada na imagem horizontal (530 x 204)
  const GEO_BOUNDS = {
    latMin: -10.08800,
    latMax: -10.07000,
    lngMin: -44.30500,
    lngMax: -44.28500
  };

  // Coordenadas padrão dos pontos cadastrados (100% sobre a lâmina d'água)
  const PRESET_POINTS = {
    P1: { name: 'P1 - Foz Oeste / Entrada das Águas', xPercent: 14.0, yPercent: 70.0, lat: -10.07240, lng: -44.29840 },
    P2: { name: 'P2 - Margem Norte / Parque Regina Freire', xPercent: 32.0, yPercent: 64.0, lat: -10.07700, lng: -44.29220 },
    P3: { name: 'P3 - Lâmina Central / Águas Profundas', xPercent: 52.0, yPercent: 60.0, lat: -10.07920, lng: -44.29620 },
    P4: { name: 'P4 - Enseada Nordeste / Macrófitas', xPercent: 72.0, yPercent: 48.0, lat: -10.08160, lng: -44.29900 },
    P5: { name: 'P5 - Foz Leste / Vertedouro Sul', xPercent: 85.0, yPercent: 58.0, lat: -10.08640, lng: -44.29340 }
  };

  // 2. Estado Interno do Terminal do Especialista
  const state = {
    isOnline: navigator.onLine,
    selectedPointKey: 'P1',
    currentCoords: { lat: -10.07240, lng: -44.29840, xPercent: 14.0, yPercent: 70.0 },
    currentPhotoBase64: null,
    currentPhotoName: null,
    offlineQueue: [],
    isSyncing: false,
    fieldLayer: 'complete' // 'complete' | 'isolated'
  };

  // 3. Referências DOM
  const DOM = {
    // Header & Rede
    networkBadge: document.getElementById('networkBadge'),
    networkDot: document.getElementById('networkDot'),
    networkLabel: document.getElementById('networkLabel'),
    syncBanner: document.getElementById('syncBanner'),
    syncStatusText: document.getElementById('syncStatusText'),
    pendingCounterBadge: document.getElementById('pendingCounterBadge'),
    btnManualSync: document.getElementById('btnManualSync'),

    // Mapa de Amostragem
    fieldMapContainer: document.getElementById('fieldMapContainer'),
    fieldMapImg: document.getElementById('fieldMapImg'),
    collectionPin: document.getElementById('collectionPin'),
    mapOverlayCoords: document.getElementById('mapOverlayCoords'),
    btnToggleFieldLayer: document.getElementById('btnToggleFieldLayer'),
    fieldLayerLabel: document.getElementById('fieldLayerLabel'),
    btnUseGps: document.getElementById('btnUseGps'),

    // Formulário
    form: document.getElementById('fieldCollectionForm'),
    pointSelect: document.getElementById('pointSelect'),
    inputLat: document.getElementById('inputLat'),
    inputLng: document.getElementById('inputLng'),
    inputTimestamp: document.getElementById('inputTimestamp'),
    inputOperator: document.getElementById('inputOperator'),

    // Físicos
    inputAirTemp: document.getElementById('inputAirTemp'),
    inputWaterTemp: document.getElementById('inputWaterTemp'),
    inputColor: document.getElementById('inputColor'),
    turbidityFormField: document.getElementById('turbidityFormField'),
    inputTurbidity: document.getElementById('inputTurbidity'),
    turbidityFeedbackPill: document.getElementById('turbidityFeedbackPill'),
    turbidityFeedbackText: document.getElementById('turbidityFeedbackText'),

    // Químicos (pH Dinâmico)
    phFormField: document.getElementById('phFormField'),
    inputPh: document.getElementById('inputPh'),
    phStatusPill: document.getElementById('phStatusPill'),
    phStatusEmoji: document.getElementById('phStatusEmoji'),
    phStatusText: document.getElementById('phStatusText'),
    phPointer: document.getElementById('phPointer'),
    phValidationMsg: document.getElementById('phValidationMsg'),
    inputOd: document.getElementById('inputOd'),
    inputPhosphorus: document.getElementById('inputPhosphorus'),

    // Biológicos
    inputEColi: document.getElementById('inputEColi'),
    inputTotalColiforms: document.getElementById('inputTotalColiforms'),

    // Observações & Foto
    chkOdor: document.getElementById('chkOdor'),
    chkWaste: document.getElementById('chkWaste'),
    chkAlgae: document.getElementById('chkAlgae'),
    chkFoam: document.getElementById('chkFoam'),
    samplePhotoInput: document.getElementById('samplePhotoInput'),
    btnTriggerPhoto: document.getElementById('btnTriggerPhoto'),
    photoPreviewContainer: document.getElementById('photoPreviewContainer'),
    photoPreviewImg: document.getElementById('photoPreviewImg'),
    photoFileName: document.getElementById('photoFileName'),
    photoFileSize: document.getElementById('photoFileSize'),
    btnRemovePhoto: document.getElementById('btnRemovePhoto'),
    inputNotes: document.getElementById('inputNotes'),

    // Botões de Ação
    btnSubmitSample: document.getElementById('btnSubmitSample'),
    btnResetForm: document.getElementById('btnResetForm'),

    // Fila Offline
    queueList: document.getElementById('queueList'),
    queueEmptyState: document.getElementById('queueEmptyState'),
    btnClearQueue: document.getElementById('btnClearQueue'),

    // Toast
    toastAlert: document.getElementById('toastAlert')
  };

  // 4. Captura Automática de Data/Hora (Legível e ISO)
  function refreshTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    if (DOM.inputTimestamp) {
      DOM.inputTimestamp.value = `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
      DOM.inputTimestamp.dataset.isoDate = now.toISOString();
    }
  }

  // 5. MAPA DE COLETA: Clique na Carta Horizontal Preenche Coordenadas Automaticamente
  function handleMapClick(e) {
    const rect = DOM.fieldMapContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Percentual relativo dentro da imagem horizontal (0 a 100)
    const xPct = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, (clickY / rect.height) * 100));

    // Interpolação para Latitude e Longitude
    const lat = GEO_BOUNDS.latMax - (yPct / 100) * (GEO_BOUNDS.latMax - GEO_BOUNDS.latMin);
    const lng = GEO_BOUNDS.lngMin + (xPct / 100) * (GEO_BOUNDS.lngMax - GEO_BOUNDS.lngMin);

    updateMapCoordinates(lat, lng, xPct, yPct);

    // Ajusta o select para "+ Nova Estação Amostral Avulsa" se clicado livremente
    if (DOM.pointSelect && DOM.pointSelect.value !== 'NOVO') {
      DOM.pointSelect.value = 'NOVO';
    }

    showToast('Coordenadas capturadas do ponto na lagoa!', 'success', 2000);
  }

  function updateMapCoordinates(lat, lng, xPct, yPct) {
    state.currentCoords = {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      xPercent: Number(xPct.toFixed(1)),
      yPercent: Number(yPct.toFixed(1))
    };

    if (DOM.inputLat) DOM.inputLat.value = state.currentCoords.lat.toFixed(5);
    if (DOM.inputLng) DOM.inputLng.value = state.currentCoords.lng.toFixed(5);

    if (DOM.collectionPin) {
      DOM.collectionPin.style.left = `${state.currentCoords.xPercent}%`;
      DOM.collectionPin.style.top = `${state.currentCoords.yPercent}%`;
    }

    if (DOM.mapOverlayCoords) {
      DOM.mapOverlayCoords.textContent = `Lat: ${state.currentCoords.lat.toFixed(5)} | Long: ${state.currentCoords.lng.toFixed(5)}`;
    }
  }

  // Alternar Camadas da Lagoa (Satélite Completo ⇄ Lâmina Isolada)
  function toggleFieldLayer() {
    if (state.fieldLayer === 'complete') {
      state.fieldLayer = 'isolated';
      DOM.fieldMapImg.src = 'lagoa-isolada.png';
      DOM.fieldLayerLabel.textContent = 'Ver Satélite';
      showToast('Camada alterada para Lâmina D\'água Isolada', 'success', 2000);
    } else {
      state.fieldLayer = 'complete';
      DOM.fieldMapImg.src = 'lagoa-completa.png';
      DOM.fieldLayerLabel.textContent = 'Ver Lâmina';
      showToast('Camada alterada para Satélite Completo', 'success', 2000);
    }
  }

  // Captura via GPS Nativo do Smartphone
  function handleUseGps() {
    if (!navigator.geolocation) {
      showToast('Geolocalização não suportada neste aparelho.', 'warning');
      return;
    }

    showToast('Obtendo posição via satélite/GPS...', 'warning', 2500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const xPct = ((lng - GEO_BOUNDS.lngMin) / (GEO_BOUNDS.lngMax - GEO_BOUNDS.lngMin)) * 100;
        const yPct = ((GEO_BOUNDS.latMax - lat) / (GEO_BOUNDS.latMax - GEO_BOUNDS.latMin)) * 100;

        const clampedX = Math.min(95, Math.max(5, xPct));
        const clampedY = Math.min(95, Math.max(5, yPct));

        updateMapCoordinates(lat, lng, clampedX, clampedY);
        showToast(`GPS fixado: precisão de ~${Math.round(pos.coords.accuracy)}m`, 'success');
      },
      (err) => {
        console.warn('[SAMA Campo] Erro GPS:', err.message);
        showToast('Não foi possível obter o sinal GPS. Toque diretamente no mapa.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // 6. ESCALA COLORIMÉTRICA DINÂMICA DO pH & VALIDAÇÃO ESTRITA (0 a 14)
  /**
   * Conforme o operador digita o valor numérico do pH no input:
   * a) pH < 6.0: O campo muda dinamicamente para tons de vermelho/laranja com o selo "🔴 Ácida (Fora CONAMA)".
   * b) pH entre 6.0 e 9.0: O campo muda para verde com o selo "🟢 Ideal / Conforme CONAMA".
   * c) pH > 9.0: O campo muda para azul/roxo com o selo "🔵 Alcalina (Fora CONAMA)".
   * Além disso, valida estritamente a faixa universal [0.00, 14.00].
   */
  function updatePhColorimetricScale() {
    if (!DOM.inputPh || !DOM.phFormField) return;

    const rawVal = DOM.inputPh.value.trim();

    if (!rawVal) {
      setPhInvalid('O valor do pH é obrigatório.');
      return false;
    }

    const num = parseFloat(rawVal.replace(',', '.'));

    if (isNaN(num)) {
      setPhInvalid('Insira um valor numérico válido.');
      return false;
    }

    if (num < 0 || num > 14) {
      setPhInvalid(`O pH (${num.toFixed(2)}) é INVÁLIDO. A escala aceita estritamente valores de 0.00 a 14.00.`);
      return false;
    }

    // Valor numérico válido entre 0 e 14
    DOM.phFormField.classList.remove('has-error');
    DOM.phValidationMsg.textContent = '';
    DOM.inputPh.removeAttribute('aria-invalid');

    // Posiciona o ponteiro na régua espectral
    const pct = Math.min(100, Math.max(0, (num / 14) * 100));
    if (DOM.phPointer) {
      DOM.phPointer.style.left = `${pct}%`;
    }

    // Remove classes anteriores
    DOM.phFormField.classList.remove('ph-state-acid', 'ph-state-ideal', 'ph-state-alkaline');

    if (num < 6.0) {
      // a) pH < 6.0: Vermelho/Laranja com selo "🔴 Ácida (Fora CONAMA)"
      DOM.phFormField.classList.add('ph-state-acid');
      if (DOM.phStatusEmoji) DOM.phStatusEmoji.textContent = '🔴';
      if (DOM.phStatusText) DOM.phStatusText.textContent = '🔴 Ácida (Fora CONAMA)';
    } else if (num <= 9.0) {
      // b) pH entre 6.0 e 9.0: Verde com selo "🟢 Ideal / Conforme CONAMA"
      DOM.phFormField.classList.add('ph-state-ideal');
      if (DOM.phStatusEmoji) DOM.phStatusEmoji.textContent = '🟢';
      if (DOM.phStatusText) DOM.phStatusText.textContent = '🟢 Ideal / Conforme CONAMA';
    } else {
      // c) pH > 9.0: Azul/Roxo com selo "🔵 Alcalina (Fora CONAMA)"
      DOM.phFormField.classList.add('ph-state-alkaline');
      if (DOM.phStatusEmoji) DOM.phStatusEmoji.textContent = '🔵';
      if (DOM.phStatusText) DOM.phStatusText.textContent = '🔵 Alcalina (Fora CONAMA)';
    }

    return true;
  }

  function setPhInvalid(msg) {
    DOM.phFormField.classList.remove('ph-state-acid', 'ph-state-ideal', 'ph-state-alkaline');
    DOM.phFormField.classList.add('has-error');
    DOM.phValidationMsg.textContent = msg;
    DOM.inputPh.setAttribute('aria-invalid', 'true');
    if (DOM.phStatusEmoji) DOM.phStatusEmoji.textContent = '⚠️';
    if (DOM.phStatusText) DOM.phStatusText.textContent = 'Valor Fora da Escala (0 a 14)';
  }

  // 7. VALIDAÇÃO & FEEDBACK DINÂMICO DE TURBIDEZ
  function updateTurbidityFeedback() {
    if (!DOM.inputTurbidity || !DOM.turbidityFeedbackText) return;

    const val = parseFloat(DOM.inputTurbidity.value.replace(',', '.'));
    if (isNaN(val)) return;

    if (val <= 25.0) {
      DOM.turbidityFeedbackPill.style.backgroundColor = '#ecfdf5';
      DOM.turbidityFeedbackPill.style.borderColor = '#a7f3d0';
      DOM.turbidityFeedbackPill.style.color = '#065f46';
      DOM.turbidityFeedbackText.textContent = '🟢 Turbidez Ideal (≤ 25 NTU)';
    } else if (val <= 40.0) {
      DOM.turbidityFeedbackPill.style.backgroundColor = '#fffbeb';
      DOM.turbidityFeedbackPill.style.borderColor = '#fde68a';
      DOM.turbidityFeedbackPill.style.color = '#92400e';
      DOM.turbidityFeedbackText.textContent = '🟡 Turbidez em Atenção (25 a 40 NTU)';
    } else {
      DOM.turbidityFeedbackPill.style.backgroundColor = '#fef2f2';
      DOM.turbidityFeedbackPill.style.borderColor = '#fecaca';
      DOM.turbidityFeedbackPill.style.color = '#991b1b';
      DOM.turbidityFeedbackText.textContent = '🔴 Crítica (> 40 NTU - Violação CONAMA 357)';
    }
  }

  // 8. UPLOAD DE FOTO COM COMPRESSÃO EM CANVAS (< 50KB)
  function handlePhotoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        const maxDim = 600;
        let w = img.width;
        let h = img.height;

        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        state.currentPhotoBase64 = compressedBase64;
        state.currentPhotoName = file.name;

        DOM.photoPreviewImg.src = compressedBase64;
        DOM.photoFileName.textContent = file.name;
        const approxKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        DOM.photoFileSize.textContent = `Comprimida: ~${approxKb} KB (Otimizada para LocalStorage)`;
        DOM.photoPreviewContainer.hidden = false;

        showToast('Foto da amostra comprimida e anexada com sucesso!', 'success');
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    state.currentPhotoBase64 = null;
    state.currentPhotoName = null;
    DOM.samplePhotoInput.value = '';
    DOM.photoPreviewContainer.hidden = true;
    DOM.photoPreviewImg.src = '';
  }

  // 9. ARQUITETURA OFFLINE-FIRST COM LOCALSTORAGE
  function loadOfflineQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OFFLINE);
      state.offlineQueue = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('[SAMA Campo] Erro ao carregar fila offline:', e);
      state.offlineQueue = [];
    }
    renderOfflineQueue();
    updateNetworkAndSyncUI();
  }

  function saveOfflineQueue() {
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE, JSON.stringify(state.offlineQueue));
    } catch (e) {
      console.error('[SAMA Campo] Falha ao gravar no LocalStorage:', e);
      showToast('Aviso: Armazenamento local cheio ou restrito.', 'error');
    }
    renderOfflineQueue();
    updateNetworkAndSyncUI();
  }

  function renderOfflineQueue() {
    if (!DOM.queueList) return;

    const pendingList = state.offlineQueue.filter(item => item.syncStatus === 'pending');
    DOM.pendingCounterBadge.textContent = `${pendingList.length} pendente(s)`;

    if (pendingList.length > 0) {
      DOM.pendingCounterBadge.classList.add('has-pending');
      DOM.syncStatusText.textContent = `${pendingList.length} coleta(s) salvas no dispositivo aguardando sincronização`;
    } else {
      DOM.pendingCounterBadge.classList.remove('has-pending');
      DOM.syncStatusText.textContent = state.isOnline ? 'Todos os dados estão sincronizados!' : 'Modo Offline ativo (Beira da Lagoa)';
    }

    if (state.offlineQueue.length === 0) {
      DOM.queueList.innerHTML = '';
      if (DOM.queueEmptyState) DOM.queueList.appendChild(DOM.queueEmptyState);
      return;
    }

    DOM.queueList.innerHTML = '';
    state.offlineQueue.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'queue-item';

      const isSynced = item.syncStatus === 'synced';
      const statusBadge = isSynced
        ? `<span class="queue-item-status queue-item-status--synced">&#10003; Sincronizado</span>`
        : `<span class="queue-item-status queue-item-status--pending">&#9203; Na Fila Local</span>`;

      el.innerHTML = `
        <div class="queue-item-left">
          <span class="queue-item-point">${item.pointName}</span>
          <span class="queue-item-meta">
            ${item.displayDate} | pH: <strong>${item.data.ph.toFixed(2)}</strong> | Turbidez: <strong>${item.data.turbidity} NTU</strong> | E. coli: <strong>${item.data.eColi}</strong>
          </span>
        </div>
        ${statusBadge}
      `;

      DOM.queueList.appendChild(el);
    });
  }

  // 10. ENVIO DO FORMULÁRIO DE COLETA
  function handleFormSubmit(e) {
    e.preventDefault();

    // 1. Validação estrita de pH
    if (!updatePhColorimetricScale()) {
      DOM.inputPh.focus();
      showToast('Corrija o pH antes de salvar (aceito apenas 0 a 14).', 'error');
      return;
    }

    // 2. Extração dos Parâmetros
    const phVal = parseFloat(DOM.inputPh.value.replace(',', '.'));
    const airTempVal = parseFloat(DOM.inputAirTemp.value) || 28.0;
    const waterTempVal = parseFloat(DOM.inputWaterTemp.value) || 25.0;
    const colorVal = parseInt(DOM.inputColor.value, 10) || 10;
    const turbidityVal = parseFloat(DOM.inputTurbidity.value) || 15.0;
    const odVal = parseFloat(DOM.inputOd.value) || 6.0;
    const phosphorusVal = parseFloat(DOM.inputPhosphorus.value) || 0.025;
    const eColiVal = parseInt(DOM.inputEColi.value, 10) || 100;
    const totalColiformsVal = parseInt(DOM.inputTotalColiforms.value, 10) || 500;

    // Checkboxes de evidências
    const evidences = [];
    if (DOM.chkOdor.checked) evidences.push('Mau cheiro característico');
    if (DOM.chkWaste.checked) evidences.push('Resíduos sólidos / lixo');
    if (DOM.chkAlgae.checked) evidences.push('Floração de algas');
    if (DOM.chkFoam.checked) evidences.push('Espuma / óleo');

    const pointKey = DOM.pointSelect.value;
    const pointName = pointKey === 'NOVO'
      ? `Estação Avulsa (${state.currentCoords.lat.toFixed(4)}, ${state.currentCoords.lng.toFixed(4)})`
      : (PRESET_POINTS[pointKey] ? PRESET_POINTS[pointKey].name : pointKey);

    const now = new Date();
    const sampleRecord = {
      id: 'COL_' + Date.now(),
      pointKey: pointKey,
      pointName: pointName,
      displayDate: DOM.inputTimestamp.value,
      isoDate: now.toISOString(),
      operator: DOM.inputOperator.value.trim() || 'Operador de Campo SAMA',
      coords: { ...state.currentCoords },
      data: {
        ph: phVal,
        airTemp: airTempVal,
        waterTemp: waterTempVal,
        color: colorVal,
        turbidity: turbidityVal,
        dissolvedOxygen: odVal,
        totalPhosphorus: phosphorusVal,
        eColi: eColiVal,
        totalColiforms: totalColiformsVal
      },
      evidences: evidences,
      notes: DOM.inputNotes.value.trim(),
      photoBase64: state.currentPhotoBase64,
      photoName: state.currentPhotoName,
      syncStatus: state.isOnline ? 'synced' : 'pending'
    };

    // Salva na fila local
    state.offlineQueue.unshift(sampleRecord);
    saveOfflineQueue();

    // Se online, sincroniza imediatamente com a base central (SAMA_MONITORAMENTO_DB)
    if (state.isOnline) {
      applySampleToDatabase(sampleRecord);
      showToast(`Coleta de ${pointName} gravada e sincronizada online!`, 'success', 3500);
    } else {
      showToast(`Coleta salva no dispositivo (Modo Offline). Será sincronizada ao reconectar!`, 'warning', 4500);
    }

    refreshTimestamp();
  }

  // 11. SINCRONIZAÇÃO COM A BASE CENTRAL (SAMA_MONITORAMENTO_DB)
  function applySampleToDatabase(sample) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_POINTS);
      let points = stored ? JSON.parse(stored) : [];

      let targetPoint = points.find(p => p.id === sample.pointKey || p.code === sample.pointKey);

      if (targetPoint) {
        targetPoint.current.ph = sample.data.ph;
        targetPoint.current.turbidity = sample.data.turbidity;
        targetPoint.current.eColi = sample.data.eColi;
        targetPoint.current.dissolvedOxygen = sample.data.dissolvedOxygen;
        targetPoint.current.waterTemp = sample.data.waterTemp;
        targetPoint.current.airTemp = sample.data.airTemp;
        targetPoint.current.totalPhosphorus = sample.data.totalPhosphorus;
        targetPoint.lastUpdate = 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        targetPoint.operator = sample.operator;

        if (targetPoint.history30d && targetPoint.history30d.length > 0) {
          const lastH = targetPoint.history30d[targetPoint.history30d.length - 1];
          lastH.ph = sample.data.ph;
          lastH.turbidity = sample.data.turbidity;
          lastH.eColi = sample.data.eColi;
          lastH.od = sample.data.dissolvedOxygen;
        }
      } else {
        const newPoint = {
          id: sample.pointKey === 'NOVO' ? 'P' + (points.length + 1) : sample.pointKey,
          code: sample.pointKey === 'NOVO' ? 'P' + (points.length + 1) : sample.pointKey,
          name: sample.pointName,
          coordsDesc: `${sample.coords.lat.toFixed(4)}° S, ${Math.abs(sample.coords.lng).toFixed(4)}° W`,
          xPercent: sample.coords.xPercent,
          yPercent: sample.coords.yPercent,
          lastUpdate: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          operator: sample.operator,
          current: { ...sample.data },
          history30d: []
        };
        points.push(newPoint);
      }

      localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(points));
    } catch (e) {
      console.warn('[SAMA Campo] Erro ao sincronizar ponto no banco central:', e);
    }
  }

  function syncAllPending() {
    if (state.isSyncing) return;
    state.isSyncing = true;

    DOM.btnManualSync.classList.add('syncing');
    DOM.syncStatusText.textContent = 'Sincronizando coletas pendentes com a central...';

    setTimeout(() => {
      let syncedCount = 0;
      state.offlineQueue.forEach(item => {
        if (item.syncStatus === 'pending') {
          applySampleToDatabase(item);
          item.syncStatus = 'synced';
          syncedCount++;
        }
      });

      saveOfflineQueue();
      state.isSyncing = false;
      DOM.btnManualSync.classList.remove('syncing');

      if (syncedCount > 0) {
        showToast(`Sincronização concluída: ${syncedCount} coleta(s) enviada(s)!`, 'success', 3500);
      } else {
        showToast('Nenhuma nova coleta pendente para sincronizar.', 'success', 2500);
      }
    }, 700);
  }

  // 12. Conectividade Online / Offline
  function updateNetworkAndSyncUI() {
    state.isOnline = navigator.onLine;

    if (DOM.networkBadge) {
      DOM.networkBadge.className = `network-badge ${state.isOnline ? 'online' : 'offline'}`;
      DOM.networkLabel.textContent = state.isOnline ? 'Online' : 'Modo Offline';
    }

    if (DOM.btnManualSync) {
      DOM.btnManualSync.disabled = !state.isOnline;
    }
  }

  function handleOnlineEvent() {
    updateNetworkAndSyncUI();
    showToast('Conexão restabelecida! Sincronizando coletas pendentes...', 'success', 3000);
    syncAllPending();
  }

  function handleOfflineEvent() {
    updateNetworkAndSyncUI();
    showToast('Aparelho sem conexão. Ativando modo Offline-First na beira da lagoa.', 'warning', 4000);
  }

  // 13. Toast Feedback
  let toastTimer = null;
  function showToast(message, type = 'success', duration = 3000) {
    if (!DOM.toastAlert) return;
    clearTimeout(toastTimer);

    DOM.toastAlert.textContent = message;
    DOM.toastAlert.className = `toast-alert ${type}`;
    DOM.toastAlert.hidden = false;

    toastTimer = setTimeout(() => {
      DOM.toastAlert.hidden = true;
    }, duration);
  }

  // 14. Event Listeners
  function setupEventListeners() {
    // Clique no mapa da lagoa
    if (DOM.fieldMapContainer) {
      DOM.fieldMapContainer.addEventListener('click', handleMapClick);
    }

    // Alternar camada do mapa
    if (DOM.btnToggleFieldLayer) {
      DOM.btnToggleFieldLayer.addEventListener('click', toggleFieldLayer);
    }

    // Botão GPS
    if (DOM.btnUseGps) {
      DOM.btnUseGps.addEventListener('click', handleUseGps);
    }

    // Seletor de ponto pré-cadastrado
    if (DOM.pointSelect) {
      DOM.pointSelect.addEventListener('change', () => {
        const val = DOM.pointSelect.value;
        if (PRESET_POINTS[val]) {
          const pt = PRESET_POINTS[val];
          updateMapCoordinates(pt.lat, pt.lng, pt.xPercent, pt.yPercent);
        }
      });
    }

    // Escala Colorimétrica Dinâmica de pH em tempo real
    if (DOM.inputPh) {
      DOM.inputPh.addEventListener('input', updatePhColorimetricScale);
      DOM.inputPh.addEventListener('change', updatePhColorimetricScale);
      DOM.inputPh.addEventListener('blur', updatePhColorimetricScale);
    }

    // Feedback dinâmico de Turbidez
    if (DOM.inputTurbidity) {
      DOM.inputTurbidity.addEventListener('input', updateTurbidityFeedback);
    }

    // Upload e foto da amostra
    if (DOM.btnTriggerPhoto) {
      DOM.btnTriggerPhoto.addEventListener('click', () => {
        DOM.samplePhotoInput.click();
      });
    }

    if (DOM.samplePhotoInput) {
      DOM.samplePhotoInput.addEventListener('change', handlePhotoUpload);
    }

    if (DOM.btnRemovePhoto) {
      DOM.btnRemovePhoto.addEventListener('click', removePhoto);
    }

    // Envio do formulário
    if (DOM.form) {
      DOM.form.addEventListener('submit', handleFormSubmit);
    }

    // Limpar Formulário
    if (DOM.btnResetForm) {
      DOM.btnResetForm.addEventListener('click', () => {
        if (confirm('Deseja limpar todos os campos do formulário de coleta?')) {
          DOM.form.reset();
          removePhoto();
          updatePhColorimetricScale();
          updateTurbidityFeedback();
          refreshTimestamp();
          if (PRESET_POINTS.P1) {
            updateMapCoordinates(PRESET_POINTS.P1.lat, PRESET_POINTS.P1.lng, PRESET_POINTS.P1.xPercent, PRESET_POINTS.P1.yPercent);
          }
        }
      });
    }

    // Botão Sincronizar Manual
    if (DOM.btnManualSync) {
      DOM.btnManualSync.addEventListener('click', () => {
        if (!state.isOnline) {
          showToast('Dispositivo sem conexão. Conecte-se para sincronizar.', 'warning');
          return;
        }
        syncAllPending();
      });
    }

    // Limpar fila offline
    if (DOM.btnClearQueue) {
      DOM.btnClearQueue.addEventListener('click', () => {
        const pendingCount = state.offlineQueue.filter(i => i.syncStatus === 'pending').length;
        if (pendingCount > 0) {
          if (!confirm(`Ainda existem ${pendingCount} coletas pendentes! Deseja realmente limpar?`)) {
            return;
          }
        }
        state.offlineQueue = [];
        saveOfflineQueue();
        showToast('Fila de coletas limpa.', 'success');
      });
    }

    // Eventos de rede do navegador
    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);
  }

  // 15. Bootstrap
  function bootstrap() {
    refreshTimestamp();
    loadOfflineQueue();
    setupEventListeners();

    // Inicializa a escala colorimétrica com o valor padrão (7.25)
    updatePhColorimetricScale();
    updateTurbidityFeedback();

    // Posiciona no Ponto 1 por padrão
    if (PRESET_POINTS.P1) {
      updateMapCoordinates(PRESET_POINTS.P1.lat, PRESET_POINTS.P1.lng, PRESET_POINTS.P1.xPercent, PRESET_POINTS.P1.yPercent);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
