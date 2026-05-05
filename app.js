        // ── STATE ──
        let esami = JSON.parse(localStorage.getItem('libretto_esami') || '[]');
        let selectedVoto = null;
        let selectedCfu = null;
        let editingId = null;
        let currentTab = 'registro';
        let isPlannedMode = false;

        // ── SETTINGS ──
        const DEFAULT_STAT_CARDS = [
            { id: 'quick-stats', label: 'Analisi voti', visible: true },
            { id: 'chart-voti', label: 'Voti nel tempo', visible: true },
            { id: 'chart-andamento', label: 'Media nel tempo', visible: true },
            { id: 'chart-distribuzione', label: 'Distribuzione voti', visible: true },
            { id: 'trend', label: 'Andamento recente', visible: true },
            { id: 'best-worst', label: 'Migliore e peggiore', visible: true },
            { id: 'cfu-summary', label: 'Riepilogo CFU', visible: true },
            { id: 'completion', label: 'Stima completamento', visible: true }
        ];
        const DEFAULT_SETTINGS = {
            corso: '', universita: '', cfuTotali: 180, anniPrevisti: 3, annoInizio: 2024,
            bonusTesi: 4, bonusLode: 0, bonusInCorso: 0, puntiPerLode: 0.5, votoObiettivo: 105, tema: 'auto', valoreLode: 31,
            statCards: JSON.parse(JSON.stringify(DEFAULT_STAT_CARDS))
        };
        let settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem('libretto_settings') || '{}'));
        // Migration: ensure statCards exists and has all cards
        if (!settings.statCards || !Array.isArray(settings.statCards)) {
            settings.statCards = JSON.parse(JSON.stringify(DEFAULT_STAT_CARDS));
        } else {
            // Add any new cards that might not exist in saved settings
            const existingIds = settings.statCards.map(c => c.id);
            DEFAULT_STAT_CARDS.forEach(dc => {
                if (!existingIds.includes(dc.id)) {
                    settings.statCards.push(JSON.parse(JSON.stringify(dc)));
                }
            });
            // Remove cards that no longer exist in defaults
            const validIds = DEFAULT_STAT_CARDS.map(c => c.id);
            settings.statCards = settings.statCards.filter(c => validIds.includes(c.id));
        }

        function saveSettings() {
            localStorage.setItem('libretto_settings', JSON.stringify(settings));
        }

        // ── VOTO HELPER (valoreLode) ──
        function getVotoNum(e) {
            return e.voto === '30L' ? settings.valoreLode : e.votoNum;
        }

        // ── SIMULATORE STATE ──
        let simVoto = 25;
        let simCfu = 6;

        const VOTI = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, '30L', 'ID'];
        const CFU_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18];

        const TAB_IDS = ['registro', 'statistiche', 'proiezione', 'pianificazione', 'impostazioni'];

        // ── DEMO DATA ──
        // Calcola 3 sessioni future partendo dal mese prossimo,
        // cercando i prossimi mesi universitari tipici: giugno, luglio, settembre, gennaio, febbraio
        function _demoFutureSessions() {
            const today = new Date();
            const sessioni = [];
            const mesiUniv = [6, 7, 9, 1, 2]; // giugno, luglio, settembre, gennaio, febbraio
            let y = today.getFullYear();
            let m = today.getMonth() + 2; // parto dal mese prossimo
            if (m > 12) { m = 1; y++; }
            let checked = 0;
            while (sessioni.length < 3 && checked < 24) {
                if (mesiUniv.includes(m)) {
                    sessioni.push(`${y}-${String(m).padStart(2, '0')}`);
                }
                m++; if (m > 12) { m = 1; y++; }
                checked++;
            }
            return sessioni;
        }
        const _ds = _demoFutureSessions();
        const DEMO_DATA = [
            { id: 1, nome: 'Analisi Matematica I', voto: 28, votoNum: 28, cfu: 9, data: '2022-02-14', planned: false, sessione: '' },
            { id: 2, nome: 'Fondamenti di Informatica', voto: 30, votoNum: 30, cfu: 9, data: '2022-02-25', planned: false, sessione: '' },
            { id: 3, nome: 'Fisica I', voto: 24, votoNum: 24, cfu: 9, data: '2022-07-08', planned: false, sessione: '' },
            { id: 4, nome: 'Algebra Lineare', voto: 27, votoNum: 27, cfu: 6, data: '2022-07-15', planned: false, sessione: '' },
            { id: 5, nome: 'Programmazione I', voto: '30L', votoNum: 31, cfu: 9, data: '2022-09-12', planned: false, sessione: '' },
            { id: 6, nome: 'Analisi Matematica II', voto: 26, votoNum: 26, cfu: 9, data: '2023-01-20', planned: false, sessione: '' },
            { id: 7, nome: 'Architettura degli Elaboratori', voto: 25, votoNum: 25, cfu: 9, data: '2023-02-10', planned: false, sessione: '' },
            { id: 8, nome: 'Sistemi Operativi', voto: 29, votoNum: 29, cfu: 9, data: '2023-06-22', planned: false, sessione: '' },
            { id: 9, nome: 'Basi di Dati', voto: 28, votoNum: 28, cfu: 9, data: '2023-07-07', planned: false, sessione: '' },
            { id: 10, nome: 'Reti di Calcolatori', voto: 27, votoNum: 27, cfu: 9, data: '2023-09-05', planned: false, sessione: '' },
            { id: 11, nome: 'Algoritmi e Strutture Dati', voto: 30, votoNum: 30, cfu: 12, data: '2024-01-18', planned: false, sessione: '' },
            { id: 12, nome: 'Ingegneria del Software', voto: 26, votoNum: 26, cfu: 9, data: '2024-02-09', planned: false, sessione: '' },
            // Sessione 1 — 2 esami
            { id: 13, nome: 'Intelligenza Artificiale', voto: null, votoNum: null, cfu: 9, data: '', planned: true, sessione: _ds[0] || '' },
            { id: 14, nome: 'Sicurezza Informatica', voto: null, votoNum: null, cfu: 6, data: '', planned: true, sessione: _ds[0] || '' },
            // Sessione 2 — 3 esami
            { id: 15, nome: 'Visione Artificiale', voto: null, votoNum: null, cfu: 6, data: '', planned: true, sessione: _ds[1] || '' },
            { id: 16, nome: 'Sistemi Distribuiti', voto: null, votoNum: null, cfu: 9, data: '', planned: true, sessione: _ds[1] || '' },
            { id: 17, nome: 'Calcolo Numerico', voto: null, votoNum: null, cfu: 6, data: '', planned: true, sessione: _ds[1] || '' },
            // Sessione 3 — 2 esami (inclusa tesi)
            { id: 18, nome: 'Elaborazione del Linguaggio', voto: null, votoNum: null, cfu: 6, data: '', planned: true, sessione: _ds[2] || '' },
            { id: 19, nome: 'Tesi di Laurea', voto: null, votoNum: null, cfu: 6, data: '', planned: true, sessione: _ds[2] || '' }
        ];

        // ── INIT ──
        try { buildVotoGrid(); } catch(e) {}
        try { buildCfuGrid(); } catch(e) {}
        try { initSessioneAnnoSelect(); } catch(e) {}
        const _nomeInput = document.getElementById('input-nome');
        if (_nomeInput) _nomeInput.oninput = validateSave;
        applyTheme();
        syncProiezioneSliders();

        // Landing: mostra solo su browser non-installato senza dati
        (function initLanding() {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            const hasData = esami.length > 0;
            const isDemo = localStorage.getItem('libretto_demo') === '1';
            const landing = document.getElementById('landing');
            const app = document.getElementById('app');

            if (isDemo) {
                // Modalità demo: carica dati demo, mostra app con banner
                esami = DEMO_DATA.map(e => Object.assign({}, e));
                if (landing) landing.style.display = 'none';
                if (app) app.style.display = '';
                const banner = document.getElementById('demo-banner');
                if (banner) banner.style.display = 'flex';
                document.body.classList.add('demo-active');
            } else if (isStandalone || hasData) {
                // PWA installata o ha già dati: vai direttamente all'app
                if (landing) landing.style.display = 'none';
                if (app) app.style.display = '';
            } else {
                // Browser senza dati: mostra landing
                if (landing) landing.style.display = '';
                if (app) app.style.display = 'none';
                // Auto-seleziona tab iOS/Android
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                switchInstallTab(isIOS ? 'ios' : 'android');
            }
        })();

        render();

        function save() {
            localStorage.setItem('libretto_esami', JSON.stringify(esami));
        }

        // ── THEME ──
        // Tooltip deviazione standard — unico, attaccato al body
        let _devStdTooltipBtn = null;

        function _closeDevStdTooltip() {
            const t = document.getElementById('devstd-tooltip');
            if (t) t.remove();
            _devStdTooltipBtn = null;
        }

        function toggleDevStdInfo(btn) {
            // Se già aperto sullo stesso bottone, chiudi
            if (_devStdTooltipBtn === btn) { _closeDevStdTooltip(); return; }
            _closeDevStdTooltip();

            const content = btn.closest('.stat-cfu-item').querySelector('.stat-info-box-content');
            if (!content) return;

            const tooltip = document.createElement('div');
            tooltip.id = 'devstd-tooltip';
            tooltip.className = 'stat-info-box';
            tooltip.innerHTML = content.innerHTML;
            document.body.appendChild(tooltip);

            // Posiziona sopra il bottone
            const r = btn.getBoundingClientRect();
            const margin = 12;
            const w = tooltip.offsetWidth;
            const h = tooltip.offsetHeight;
            let left = r.left + r.width / 2 - w / 2;
            if (left < margin) left = margin;
            if (left + w > window.innerWidth - margin) left = window.innerWidth - w - margin;
            tooltip.style.left = left + 'px';
            tooltip.style.top = (r.top - h - 8) + 'px';

            _devStdTooltipBtn = btn;

            // Chiudi su click fuori o scroll
            setTimeout(function() {
                document.addEventListener('click', _devStdOutsideClick, { capture: true, once: true });
                document.getElementById('scroll-area') && document.getElementById('scroll-area').addEventListener('scroll', _closeDevStdTooltip, { once: true });
            }, 0);
        }

        function _devStdOutsideClick(e) {
            if (_devStdTooltipBtn && e.target === _devStdTooltipBtn) return;
            _closeDevStdTooltip();
        }

        function applyTheme() {
            const tema = settings.tema || 'auto';
            if (tema === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
                document.documentElement.setAttribute('data-theme', tema);
            }
            const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', bg);
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (settings.tema === 'auto') applyTheme();
        });

        // ── SLIDER UTILS ──
        function updateSliderFill(slider) {
            // nessun fill — solo il pallino
        }

        // ── VOTO GRID ──
        function buildVotoGrid() {
            const area = document.getElementById('voto-input-area');
            if (!area) return;
            area.innerHTML = '';

            function _setVoto(v) {
                selectedVoto = v;
                _refreshVotoDisplay(v);
                area.querySelectorAll('.voto-grid-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.v === String(v));
                });
                validateSave();
            }

            // display numero grande
            area.insertAdjacentHTML('beforeend',
                '<div class="voto-display" id="voto-display">' +
                '<span class="voto-display-num" id="voto-display-num">—</span></div>');

            // griglia 18–30
            const btns = [];
            for (let i = 18; i <= 30; i++) {
                btns.push(`<button type="button" class="voto-grid-btn" data-v="${i}">${i}</button>`);
            }
            area.insertAdjacentHTML('beforeend',
                `<div class="voto-grid">${btns.join('')}</div>`);

            // 30L e Idoneità in riga flex separata
            area.insertAdjacentHTML('beforeend', `
                <div class="voto-special-row">
                    <button type="button" class="voto-grid-btn pill-lode" id="pill-30l" data-v="30L">30L ✦</button>
                    <button type="button" class="voto-grid-btn pill-id" id="pill-id" data-v="ID">Idoneità</button>
                </div>`);

            area.querySelectorAll('.voto-grid-btn').forEach(b => {
                b.onclick = () => {
                    const raw = b.dataset.v;
                    _setVoto(raw === 'ID' ? 'ID' : raw === '30L' ? '30L' : parseInt(raw, 10));
                };
            });

            selectedVoto = 18;
            _refreshVotoDisplay(18);
        }

        function _refreshVotoDisplay(v) {
            const numEl = document.getElementById('voto-display-num');
            if (!numEl) return;
            if (v === null) {
                numEl.textContent = '—';
                numEl.className = 'voto-display-num neutral';
            } else if (v === '30L') {
                numEl.textContent = '30L';
                numEl.className = 'voto-display-num grade-green';
            } else if (v === 'ID') {
                numEl.textContent = 'ID';
                numEl.className = 'voto-display-num grade-purple';
            } else {
                numEl.textContent = v;
                if (v >= 27) numEl.className = 'voto-display-num grade-green';
                else if (v >= 24) numEl.className = 'voto-display-num grade-yellow';
                else numEl.className = 'voto-display-num grade-red';
            }
        }

        function selectVoto(v) {
            selectedVoto = v;
            _refreshVotoDisplay(v);
            document.querySelectorAll('.voto-grid-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.v === String(v));
            });
            validateSave();
        }

        // ── CFU STEPPER ──
        const CFU_QUICK = [3, 6, 9, 12];

        function buildCfuGrid() {
            const area = document.getElementById('cfu-input-area');
            if (!area) return;
            area.innerHTML = '';

            // riga stepper: [−] [input] [+]
            const stepperRow = document.createElement('div');
            stepperRow.className = 'cfu-stepper-row';

            const btnDec = document.createElement('button');
            btnDec.type = 'button';
            btnDec.className = 'cfu-stepper-btn';
            btnDec.setAttribute('aria-label', 'Diminuisci CFU');
            btnDec.textContent = '−';

            const numInput = document.createElement('input');
            numInput.type = 'number';
            numInput.id = 'cfu-num-input';
            numInput.className = 'cfu-stepper-input';
            numInput.min = 0;
            numInput.max = 30;
            numInput.step = 'any';
            numInput.value = 6;
            numInput.setAttribute('aria-label', 'Valore CFU');
            numInput.setAttribute('inputmode', 'decimal');

            const btnInc = document.createElement('button');
            btnInc.type = 'button';
            btnInc.className = 'cfu-stepper-btn';
            btnInc.setAttribute('aria-label', 'Aumenta CFU');
            btnInc.textContent = '+';

            function _applyCfu(val) {
                val = Math.max(0.5, Math.min(30, val));
                numInput.value = val;
                selectedCfu = val;
                const pills = area.querySelectorAll('.cfu-quick-pill');
                pills.forEach(p => p.classList.toggle('active', parseFloat(p.dataset.val) === val));
                updateCfuProgress();
                validateSave();
            }

            btnDec.onclick = () => {
                const cur = parseFloat(numInput.value) || 1;
                _applyCfu(Math.max(0.5, cur - 1));
            };

            btnInc.onclick = () => {
                const cur = parseFloat(numInput.value) || 0;
                _applyCfu(cur + 1);
            };

            numInput.oninput = () => {
                const val = parseFloat(numInput.value);
                if (isNaN(val)) { selectedCfu = null; updateCfuProgress(); validateSave(); return; }
                selectedCfu = val;
                const pills = area.querySelectorAll('.cfu-quick-pill');
                pills.forEach(p => p.classList.toggle('active', parseFloat(p.dataset.val) === val));
                updateCfuProgress();
                validateSave();
            };

            numInput.onblur = () => {
                const val = parseFloat(numInput.value);
                if (isNaN(val) || val <= 0) { _applyCfu(0.5); return; }
                if (val > 30) _applyCfu(30);
            };

            stepperRow.appendChild(btnDec);
            stepperRow.appendChild(numInput);
            stepperRow.appendChild(btnInc);
            area.appendChild(stepperRow);

            // pill rapide per valori comuni
            const pillsRow = document.createElement('div');
            pillsRow.className = 'cfu-quick-pills';

            CFU_QUICK.forEach(v => {
                const p = document.createElement('button');
                p.type = 'button';
                p.className = 'cfu-quick-pill';
                p.dataset.val = v;
                p.textContent = v;
                p.setAttribute('aria-label', `${v} CFU`);
                p.onclick = () => _applyCfu(v);
                pillsRow.appendChild(p);
            });

            area.appendChild(pillsRow);

            // inizializza con 6 CFU
            _applyCfu(6);
            selectedCfu = 6;
        }

        function selectCfu(c) {
            selectedCfu = c;
            const numInput = document.getElementById('cfu-num-input');
            if (numInput && typeof c === 'number') {
                const val = Math.max(0.5, Math.min(30, c));
                numInput.value = val;
                const area = document.getElementById('cfu-input-area');
                if (area) {
                    area.querySelectorAll('.cfu-quick-pill').forEach(p =>
                        p.classList.toggle('active', parseFloat(p.dataset.val) === val)
                    );
                }
            }
            updateCfuProgress();
            validateSave();
        }

        function updateCfuProgress() {
            const cfuTot = settings.cfuTotali || 180;
            // Conta solo CFU sostenuti (esclusi planned)
            const currentCfu = esami.filter(e => !e.planned).reduce((s, e) => s + e.cfu, 0);
            const addCfu = selectedCfu || 0;
            const perc = Math.min(((currentCfu + addCfu) / cfuTot) * 100, 100);
            document.getElementById('cfu-progress-fill').style.width = perc + '%';
            document.getElementById('cfu-info').textContent = `${currentCfu + addCfu} / ${cfuTot} CFU`;
        }

        function validateSave() {
            const nome = document.getElementById('input-nome').value.trim();
            const cfuOk = selectedCfu !== null && selectedCfu > 0;
            const votoOk = isPlannedMode || selectedVoto !== null;
            const isValid = !!(nome && cfuOk && votoOk);
            const btn = document.getElementById('btn-save');
            if (btn) btn.disabled = !isValid;

            // Hint testuale che spiega cosa manca
            const hint = document.getElementById('save-hint');
            if (!hint) return;
            if (isValid) {
                hint.textContent = '';
                hint.style.display = 'none';
            } else {
                const missing = [];
                if (!nome) missing.push('il nome');
                if (!cfuOk) missing.push('i CFU');
                if (!votoOk) missing.push('il voto');
                hint.textContent = `Inserisci ${missing.join(' e ')} per salvare`;
                hint.style.display = 'block';
            }
        }

        function setPlannedMode(val) {
            isPlannedMode = val;
            const votoField = document.getElementById('voto-field');
            if (votoField) votoField.style.display = val ? 'none' : '';
            const sessioneField = document.getElementById('sessione-field');
            if (sessioneField) sessioneField.style.display = val ? '' : 'none';
            const dataField = document.getElementById('data-field');
            if (dataField) dataField.style.display = val ? 'none' : '';
            const btnSos = document.getElementById('ptog-sostenuto');
            const btnPian = document.getElementById('ptog-pianificato');
            if (btnSos) btnSos.classList.toggle('active', !val);
            if (btnPian) btnPian.classList.toggle('active', val);
            validateSave();
        }

        // ── FASE A: selettore sessione ──
        function initSessioneAnnoSelect() {
            const sel = document.getElementById('sel-sessione-anno');
            if (!sel) return;
            const currentYear = new Date().getFullYear();
            sel.innerHTML = '<option value="">Anno</option>';
            for (let y = currentYear - 1; y <= currentYear + 3; y++) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                sel.appendChild(opt);
            }
        }

        function getSelectedSessione() {
            const m = document.getElementById('sel-sessione-mese').value;
            const y = document.getElementById('sel-sessione-anno').value;
            return (m && y) ? `${y}-${m.padStart(2, '0')}` : null;
        }

        function setSessioneSelect(sessioneStr) {
            const mSel = document.getElementById('sel-sessione-mese');
            const ySel = document.getElementById('sel-sessione-anno');
            if (!mSel || !ySel) return;
            if (sessioneStr && /^\d{4}-\d{2}$/.test(sessioneStr)) {
                const [y, m] = sessioneStr.split('-');
                mSel.value = m;
                ySel.value = y;
            } else {
                mSel.value = '';
                ySel.value = '';
            }
        }

        // ── MODAL ──
        function openModal(id = null) {
            editingId = id;
            selectedVoto = null;
            selectedCfu = null;

            document.getElementById('input-nome').value = '';
            document.getElementById('input-data').value = '';
            setSessioneSelect(null);

            // Reset hint validazione
            const hint = document.getElementById('save-hint');
            if (hint) { hint.textContent = ''; hint.style.display = 'none'; }

            // reset pill voto
            const pill30l = document.getElementById('pill-30l');
            const pillId = document.getElementById('pill-id');
            if (pill30l) pill30l.classList.remove('active');
            if (pillId) pillId.classList.remove('active');

            // reset planned toggle (default: già sostenuto)
            setPlannedMode(false);

            if (id !== null) {
                const e = esami.find(x => x.id === id);
                if (e) {
                    document.getElementById('modal-title').textContent = 'Modifica esame';
                    document.getElementById('input-nome').value = e.nome;
                    if (e.data) document.getElementById('input-data').value = e.data;
                    // se è un esame pianificato con sessione, pre-popola selettore
                    if (e.planned && e.sessione) setSessioneSelect(e.sessione);
                    // se è un esame pianificato, apri in modalità "da sostenere"
                    // per consentire di modificare sessione/CFU; ma solo se non si è già premuto
                    // dal tab Pianificazione per aggiungere il voto — qui lo apriamo come "da sostenere"
                    if (e.planned && e.voto === null) {
                        setPlannedMode(true);
                    } else {
                        setPlannedMode(false);
                        selectVoto(e.voto);
                    }
                    selectCfu(e.cfu);
                }
            } else {
                document.getElementById('modal-title').textContent = 'Nuovo esame';
                // default: voto 18, cursore slider visibile e track colorato
                selectVoto(18);
                // default CFU: stepper già inizializzato a 6, basta aggiornare il progress
                selectCfu(6);
            }

            document.getElementById('modal').style.display = 'flex';
            document.body.classList.add('modal-open');
            setTimeout(() => document.getElementById('input-nome').focus(), 100);
        }

        // apri modal per aggiungere voto a un esame pianificato (dal tap nel tab Pianificazione)
        function openModalAddVoto(id) {
            editingId = id;
            selectedVoto = null;
            selectedCfu = null;

            const e = esami.find(x => x.id === id);
            if (!e) return;

            document.getElementById('input-nome').value = e.nome;
            document.getElementById('input-data').value = e.data || '';
            setSessioneSelect(e.sessione || null);

            // Reset hint validazione
            const hint = document.getElementById('save-hint');
            if (hint) { hint.textContent = ''; hint.style.display = 'none'; }

            const pill30l = document.getElementById('pill-30l');
            const pillId = document.getElementById('pill-id');
            if (pill30l) pill30l.classList.remove('active');
            if (pillId) pillId.classList.remove('active');

            document.getElementById('modal-title').textContent = 'Aggiungi voto';
            // forza modalità "già sostenuto" per inserire il voto
            setPlannedMode(false);
            selectVoto(18);
            selectCfu(e.cfu);

            document.getElementById('modal').style.display = 'flex';
            document.body.classList.add('modal-open');
            setTimeout(() => document.getElementById('input-nome').focus(), 100);
        }

        function closeModal() {
            const modalEl = document.querySelector('.modal');
            if (modalEl) modalEl.style.transform = '';
            document.getElementById('modal').style.display = 'none';
            document.body.classList.remove('modal-open');
        }

        function handleOverlayClick(e) {
            if (e.target === document.getElementById('modal')) closeModal();
        }

        function saveEsame() {
            const nome = document.getElementById('input-nome').value.trim();
            const cfuOk = selectedCfu !== null && selectedCfu > 0;
            const votoOk = isPlannedMode || selectedVoto !== null;
            if (!nome || !cfuOk || !votoOk) return;

            const data = document.getElementById('input-data').value;
            const sessione = isPlannedMode ? getSelectedSessione() : null;

            if (isPlannedMode) {
                // Esame pianificato: nessun voto
                if (editingId !== null) {
                    const idx = esami.findIndex(x => x.id === editingId);
                    if (idx !== -1) {
                        esami[idx] = { ...esami[idx], nome, voto: null, votoNum: null, cfu: selectedCfu, data, sessione, planned: true };
                    }
                } else {
                    esami.push({ id: Date.now(), nome, voto: null, votoNum: null, cfu: selectedCfu, data, sessione, planned: true });
                }
            } else {
                const votoNum = selectedVoto === '30L' ? 30 : selectedVoto === 'ID' ? null : selectedVoto;
                if (editingId !== null) {
                    const idx = esami.findIndex(x => x.id === editingId);
                    if (idx !== -1) {
                        // rimuove il flag planned quando si aggiunge il voto a un esame pianificato
                        esami[idx] = { ...esami[idx], nome, voto: selectedVoto, votoNum, cfu: selectedCfu, data, sessione: null, planned: false };
                    }
                } else {
                    esami.push({ id: Date.now(), nome, voto: selectedVoto, votoNum, cfu: selectedCfu, data, sessione: null, planned: false });
                }
            }

            save();
            render();
            if (navigator.vibrate) navigator.vibrate(40);
            closeModal();
        }

        function deleteEsame(id) {
            const card = document.querySelector(`.esame-card[data-id="${id}"]`);
            if (card) {
                card.classList.add('removing');
                setTimeout(() => {
                    esami = esami.filter(x => x.id !== id);
                    save();
                    render();
                }, 210);
            } else {
                esami = esami.filter(x => x.id !== id);
                save();
                render();
            }
        }

        // ── TABS ──
        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.btab').forEach(b => {
                b.classList.toggle('active', b.dataset.tab === tab);
            });
            const gearBtn = document.getElementById('header-settings-btn');
            if (gearBtn) gearBtn.classList.toggle('active', tab === 'impostazioni');
            TAB_IDS.forEach(id => {
                const el = document.getElementById('tab-' + id);
                if (!el) return;
                const show = id === tab;
                el.style.display = show ? 'block' : 'none';
                if (show) {
                    el.style.animation = 'none';
                    el.offsetHeight;
                    el.style.animation = '';
                }
            });
            if (tab === 'proiezione') { syncProiezioneSliders(); updateProiezione(); renderSimulatore(); }
            if (tab === 'statistiche') renderStatistiche();
            if (tab === 'pianificazione') renderPianificazione();
            if (tab === 'impostazioni') renderImpostazioni();
            document.getElementById('scroll-area').scrollTop = 0;
        }

        // ── RENDER ──
        function render() {
            renderList();
            updateStats();
            updateProiezione();
            updateCfuProgress();
            if (currentTab === 'pianificazione') renderPianificazione();
            if (currentTab === 'proiezione') renderSimulatore();
        }

        function renderList() {
            const list = document.getElementById('esami-list');
            const n = esami.length;

            if (n === 0) {
                list.innerHTML = `
      <div class="empty">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="13" y2="12"/></svg></div>
        <h3>Nessun esame</h3>
        <p>Aggiungi il tuo primo esame per iniziare a tracciare la media</p>
        <button class="btn-empty-cta" onclick="openModal()">Aggiungi esame</button>
      </div>`;
                return;
            }

            // Fase 2 — separazione sostenuti / pianificati
            const byDate = (a, b) => {
                if (a.data && b.data) return b.data.localeCompare(a.data);
                return b.id - a.id;
            };
            const byNome = (a, b) => a.nome.localeCompare(b.nome, 'it');

            const sostenuti = esami.filter(e => !e.planned).sort(byDate);
            const pianificati = esami.filter(e => e.planned).sort(byNome);

            function renderCard(e) {
                const isPlanned = !!e.planned;
                if (isPlanned) {
                    // Card per esame pianificato
                    const dataStr = e.data ? new Date(e.data + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                    return `
      <div class="esame-card planned" data-id="${e.id}">
        <div class="esame-voto idoneita">?</div>
        <div class="esame-info">
          <div class="esame-nome">${escHtml(e.nome)}</div>
          <div class="esame-meta">${e.cfu} CFU${dataStr ? ' \u00b7 ' + dataStr : ''}</div>
          <div class="badge-planned">da sostenere</div>
        </div>
        <div class="esame-actions">
          <button class="btn-icon" onclick="openModal(${e.id})" title="Aggiungi voto"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn-icon danger" onclick="confirmDelete(${e.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
      </div>`;
                }
                // Card per esame sostenuto
                const isLode = e.voto === '30L';
                const isId = e.voto === 'ID';
                const isBasso = !isId && e.votoNum < 24;
                const dataStr = e.data ? new Date(e.data + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                return `
      <div class="esame-card" data-id="${e.id}">
        <div class="esame-voto ${isLode ? 'lode' : isId ? 'idoneita' : isBasso ? 'basso' : ''}">${isLode ? '30L\u2726' : isId ? 'ID' : e.voto}</div>
        <div class="esame-info">
          <div class="esame-nome">${escHtml(e.nome)}</div>
          <div class="esame-meta">${e.cfu} CFU${dataStr ? ' \u00b7 ' + dataStr : ''}</div>
        </div>
        <div class="esame-actions">
          <button class="btn-icon" onclick="openModal(${e.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn-icon danger" onclick="confirmDelete(${e.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
      </div>`;
            }

            let html = sostenuti.map(renderCard).join('');

            // Separatore visivo se ci sono esami pianificati
            if (pianificati.length > 0) {
                html += `<div class="planned-separator">Da sostenere</div>`;
            }

            html += pianificati.map(renderCard).join('');

            list.innerHTML = html;
        }

        function confirmDelete(id) {
            const e = esami.find(x => x.id === id);
            if (confirm(`Eliminare "${e?.nome}"?`)) deleteEsame(id);
        }

        function escHtml(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // ── STATS (hero card) ──
        function updateStats() {
            // Separazione sostenuti / pianificati
            const sostenuti = esami.filter(e => !e.planned);
            const pianificati = esami.filter(e => e.planned);
            const n = sostenuti.length;
            const totCfu = sostenuti.reduce((s, e) => s + e.cfu, 0);
            const cfuTotali = settings.cfuTotali || 180;
            // Solo esami sostenuti con voto numerico (esclusi idoneità e planned)
            const graded = sostenuti.filter(e => e.voto !== 'ID');
            const ng = graded.length;

            // Welcome text — conta solo sostenuti
            const heroWelcome = document.getElementById('hero-welcome');
            const esameLabel = `Hai superato ${n} esam${n === 1 ? 'e' : 'i'}`;
            if (heroWelcome) heroWelcome.textContent = n === 0 && pianificati.length === 0
                ? 'Aggiungi il tuo primo esame'
                : n === 0 ? 'Nessun esame sostenuto'
                : esameLabel;

            // CFU — solo sostenuti
            const heroCfu = document.getElementById('hero-cfu');
            if (heroCfu) heroCfu.textContent = totCfu;

            // Dettaglio CFU espanso (pill CFU)
            const detailCfuNum = document.getElementById('detail-cfu-number');
            const detailCfuSteps = document.getElementById('detail-cfu-steps');
            if (detailCfuNum) detailCfuNum.textContent = `${totCfu} / ${cfuTotali}`;
            if (detailCfuSteps) {
                const percCompl = Math.round((totCfu / cfuTotali) * 100);
                const cfuMancanti = Math.max(cfuTotali - totCfu, 0);
                const cfuPian = pianificati.reduce((s, e) => s + e.cfu, 0);
                const daCop = Math.max(cfuTotali - totCfu - cfuPian, 0);
                let steps = `${percCompl}% completato · ${cfuMancanti} CFU mancanti`;
                if (cfuPian > 0) steps += `\nCon ${cfuPian} pianificati → ${daCop} da pianificare`;
                detailCfuSteps.textContent = steps;
            }

            // Progress bar — segmento sostenuti + segmento pianificati
            const cfuPianificati = pianificati.reduce((s, e) => s + e.cfu, 0);
            const cfuRimanenti = Math.max(cfuTotali - totCfu - cfuPianificati, 0);

            const percDone    = Math.min((totCfu       / cfuTotali) * 100, 100);
            const percPlanned = Math.min((cfuPianificati / cfuTotali) * 100, Math.max(100 - percDone, 0));

            const heroFill = document.getElementById('hero-progress-fill');
            if (heroFill) heroFill.style.width = percDone + '%';

            const heroPlanned = document.getElementById('hero-progress-planned');
            if (heroPlanned) heroPlanned.style.width = percPlanned + '%';

            // Leggenda sotto la barra
            const legendDone = document.getElementById('hero-legend-done');
            if (legendDone) legendDone.textContent = `${totCfu} sostenuti`;

            const legendPlanned = document.getElementById('hero-legend-planned');
            if (legendPlanned) legendPlanned.textContent = `${cfuPianificati} pianificati`;

            const legendRemaining = document.getElementById('hero-legend-remaining');
            if (legendRemaining) {
                legendRemaining.textContent = cfuRimanenti > 0 ? `${cfuRimanenti} da coprire` : 'copertura completa';
            }

            // Header sub
            document.getElementById('header-sub').textContent =
                settings.corso && settings.universita ? `${settings.corso} \u00b7 ${settings.universita}` :
                    n === 0 && pianificati.length === 0 ? 'nessun esame ancora' : `${n} esam${n > 1 ? 'i' : 'e'} \u00b7 ${totCfu} CFU`;

            // Hero badge pianificati — ora la barra gestisce le info, badge nascosto
            const heroPlanEl = document.getElementById('hero-planned');
            if (heroPlanEl) heroPlanEl.style.display = 'none';

            if (ng === 0) {
                ['hero-aritm', 'hero-pond', 'hero-laurea'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = '\u2014';
                });
                return;
            }

            const gradedCfu = graded.reduce((s, e) => s + e.cfu, 0);
            const aritm = graded.reduce((s, e) => s + getVotoNum(e), 0) / ng;
            const pond = graded.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0) / gradedCfu;

            const heroAritm = document.getElementById('hero-aritm');
            if (heroAritm) heroAritm.textContent = aritm.toFixed(2);
            const heroPond = document.getElementById('hero-pond');
            if (heroPond) heroPond.textContent = pond.toFixed(2);

            const bonus = settings.bonusTesi;
            const base = (pond / 30) * 110;
            const proiezione = Math.min(base + bonus, 110);
            const heroLaurea = document.getElementById('hero-laurea');
            if (heroLaurea) heroLaurea.textContent = proiezione.toFixed(1);

            updateProiezione();
        }

        // ── PROIEZIONE ──
        function syncProiezioneSliders() {
            // Il bonus-slider è stato rimosso dalla hero card; aggiorna solo il chip statico
            const bv = document.getElementById('bonus-val');
            if (bv) bv.textContent = settings.bonusTesi;
        }

        function onBonusSliderChange() {
            // Mantenuta per retrocompatibilità — chiamata dal solo slider in Impostazioni
            // (che usa oninput inline in renderImpostazioni, non questa funzione)
            // Non fa nulla se invocata senza slider nella hero
        }

        function updateProiezione() {
            const bonus = settings.bonusTesi;
            const cfuTot = settings.cfuTotali;

            // Escludi planned e idoneità dai calcoli
            const graded = esami.filter(e => !e.planned && e.voto !== 'ID');
            const ng = graded.length;
            const gradedCfu = graded.reduce((s, e) => s + e.cfu, 0);

            const aritmVal = ng === 0 ? '\u2014' : (graded.reduce((s, e) => s + getVotoNum(e), 0) / ng).toFixed(2);
            const pond = ng === 0 ? null : graded.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0) / gradedCfu;
            const pondVal = pond === null ? '\u2014' : pond.toFixed(2);

            if (ng === 0) {
                const projNum = document.getElementById('proj-number');
                if (projNum) { projNum.className = 'big-number na'; projNum.textContent = '\u2014'; }
                const projLabel = document.getElementById('proj-label');
                if (projLabel) projLabel.textContent = 'aggiungi esami per calcolare';
                const fBox = document.getElementById('formula-box');
                if (fBox) fBox.textContent = 'Inserisci esami per vedere la formula';
                const pDetail = document.getElementById('pond-detail');
                if (pDetail) pDetail.style.display = 'none';
                return;
            }

            const base = (pond / 30) * 110;
            const proiezione = Math.min(base + bonus, 110);
            const proiezioneRound = Math.round(proiezione * 10) / 10;

            const projNum = document.getElementById('proj-number');
            if (projNum) { projNum.className = 'big-number'; projNum.textContent = proiezioneRound.toFixed(1); }
            const projLabel = document.getElementById('proj-label');
            if (projLabel) projLabel.textContent = proiezione >= 105 ? '\u2605 zona lode!' : 'con bonus stimato ' + bonus + ' pt';

            // Range min (bonus 0) → max (bonus 12)
            const rangeMin = Math.min(base, 110);
            const rangeMax = Math.min(base + 12, 110);
            const elRangeMin = document.getElementById('proj-range-min');
            const elRangeMax = document.getElementById('proj-range-max');
            if (elRangeMin) elRangeMin.textContent = rangeMin.toFixed(1);
            if (elRangeMax) elRangeMax.textContent = rangeMax.toFixed(1);

            const fBox = document.getElementById('formula-box');
            if (fBox) fBox.innerHTML =
                `(<span class="highlight">${pond.toFixed(3)}</span> / 30) \u00d7 110 = <span class="highlight">${base.toFixed(2)}</span><br>` +
                `+ bonus stimato <span class="highlight">${bonus}</span> = <span class="highlight">${proiezioneRound}</span> / 110`;

            const detail = document.getElementById('pond-detail');
            if (detail) {
                detail.style.display = 'block';
                detail.innerHTML = graded.map(e =>
                    `<span class="highlight">${getVotoNum(e)}</span>\u00d7${e.cfu} + `
                ).join('').replace(/ \+ $/, '') +
                    `<br>\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500<br>` +
                    `${graded.map(e => `${e.cfu}`).join('+')} = ${gradedCfu} CFU<br>` +
                    `= <span class="highlight">${pond.toFixed(4)}</span>`;
            }

            // ── Toggle "Come si calcola?" nel registro ──
            const elAritmReg = document.getElementById('detail-aritm-reg');
            if (elAritmReg) elAritmReg.textContent = aritmVal;

            const elAritmSteps = document.getElementById('detail-aritm-steps');
            if (elAritmSteps) {
                const somma = graded.reduce((s, e) => s + getVotoNum(e), 0);
                elAritmSteps.innerHTML =
                    `(${graded.map(e => `<span class="highlight">${getVotoNum(e)}</span>`).join(' + ')}) ÷ ${ng}<br>` +
                    `= ${somma} ÷ ${ng} = <strong>${aritmVal}</strong>`;
            }

            const elPondReg = document.getElementById('detail-pond-reg');
            if (elPondReg) elPondReg.textContent = pondVal;

            const elPondSteps = document.getElementById('detail-pond-steps');
            if (elPondSteps) {
                const numeratore = graded.map(e => `<span class="highlight">${getVotoNum(e)}</span>×${e.cfu}`).join(' + ');
                const denominatore = graded.map(e => e.cfu).join('+');
                elPondSteps.innerHTML =
                    `(${numeratore}) ÷ (${denominatore})<br>` +
                    `= <strong>${pondVal}</strong>`;
            }

            const elProjReg = document.getElementById('detail-proj-reg');
            if (elProjReg) elProjReg.textContent = proiezioneRound.toFixed(1);

            const projFormulaReg = document.getElementById('detail-proj-formula-reg');
            if (projFormulaReg) projFormulaReg.innerHTML =
                `(${pond.toFixed(2)} ÷ 30) × 110 + ${bonus}<br>` +
                `= ${base.toFixed(2)} + ${bonus} = <strong>${proiezioneRound}</strong> / 110`;
        }

        // ── SIMULATORE ──
        function renderSimulatore() {
            const el = document.getElementById('sim-inline');
            // Escludi planned e idoneità
            const graded = esami.filter(e => !e.planned && e.voto !== 'ID');
            const ng = graded.length;

            if (ng === 0) {
                el.innerHTML = '<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="10" y2="11"/><line x1="13" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="10" y2="15"/><line x1="13" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="10" y2="19"/><line x1="13" y1="19" x2="16" y2="19"/></svg></div><h3>Nessun dato</h3><p>Aggiungi il primo esame per iniziare a simulare</p><button class="btn-empty-cta" onclick="switchTab(\'registro\');openModal()">Aggiungi esame</button></div>';
                return;
            }

            const gradedCfu = graded.reduce((s, e) => s + e.cfu, 0);
            const pond = graded.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0) / gradedCfu;
            const bonus = settings.bonusTesi;
            const base = (pond / 30) * 110;
            const proiezione = Math.min(base + bonus, 110);

            el.innerHTML = `
                <div class="sim-card sim-card--unified">
                    <div class="sim-controls">
                        <div class="field">
                            <label>Voto simulato</label>
                            <div class="sim-voto-display" id="sim-voto-display">${simVoto === 31 ? '30L' : simVoto}</div>
                            <input type="range" class="sim-slider" id="sim-voto-slider" min="18" max="31" value="${simVoto}" step="1" oninput="onSimVotoChange(this.value)">
                            <div class="sim-info-badge" id="sim-lode-info" style="display:${simVoto === 31 ? 'flex' : 'none'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                <span>30 e Lode vale <strong>${settings.valoreLode}</strong> nel calcolo della media. Puoi modificarlo nelle Impostazioni.</span>
                            </div>
                        </div>
                        <div class="field">
                            <label>CFU</label>
                            <div class="cfu-grid" id="sim-cfu-grid"></div>
                        </div>
                    </div>
                    <div class="sim-divider"></div>
                    <div id="sim-result-card"></div>
                </div>`;

            buildSimCfuGrid();
            updateSimResult();
        }

        function buildSimCfuGrid() {
            const g = document.getElementById('sim-cfu-grid');
            if (!g) return;
            g.innerHTML = '';
            CFU_OPTIONS.forEach(c => {
                const b = document.createElement('button');
                b.className = 'cfu-btn' + (c === simCfu ? ' selected' : '');
                b.textContent = c;
                b.onclick = () => { simCfu = c; buildSimCfuGrid(); updateSimResult(); };
                g.appendChild(b);
            });
        }

        function onSimVotoChange(val) {
            simVoto = parseInt(val);
            const d = document.getElementById('sim-voto-display');
            if (d) d.textContent = simVoto === 31 ? '30L' : simVoto;
            const info = document.getElementById('sim-lode-info');
            if (info) info.style.display = simVoto === 31 ? 'flex' : 'none';
            if (navigator.vibrate) navigator.vibrate(10);
            updateSimResult();
        }

        function updateSimResult() {
            const card = document.getElementById('sim-result-card');
            if (!card) return;
            // Escludi planned e idoneità
            const graded = esami.filter(e => !e.planned && e.voto !== 'ID');
            if (graded.length === 0) { card.innerHTML = ''; return; }

            const gradedCfu = graded.reduce((s, e) => s + e.cfu, 0);
            const pond = graded.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0) / gradedCfu;
            const bonus = settings.bonusTesi;
            const oldBase = (pond / 30) * 110;
            const oldProiezione = Math.min(oldBase + bonus, 110);

            const simVotoNum = simVoto === 31 ? settings.valoreLode : simVoto;
            const newPond = (graded.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0) + simVotoNum * simCfu) / (gradedCfu + simCfu);
            const newBase = (newPond / 30) * 110;
            const newProiezione = Math.min(newBase + bonus, 110);

            const deltaPond = newPond - pond;
            const deltaProj = newProiezione - oldProiezione;
            const dc = d => d > 0.005 ? 'positive' : d < -0.005 ? 'negative' : 'zero';
            const dp = d => d > 0.005 ? '\u25b2 +' : d < -0.005 ? '\u25bc ' : '= ';

            card.innerHTML = `<div class="sim-result">
                <div class="sim-result-item">
                    <div class="sim-result-label">Nuova media pond.</div>
                    <div class="sim-result-value" style="color:var(--accent2)">${newPond.toFixed(2)}</div>
                    <div class="sim-delta ${dc(deltaPond)}">${dp(deltaPond)}${Math.abs(deltaPond).toFixed(2)}</div>
                </div>
                <div class="sim-result-divider"></div>
                <div class="sim-result-item">
                    <div class="sim-result-label">Proiezione laurea</div>
                    <div class="sim-result-value" style="color:var(--green)">${newProiezione.toFixed(1)}</div>
                    <div class="sim-delta ${dc(deltaProj)}">${dp(deltaProj)}${Math.abs(deltaProj).toFixed(1)}</div>
                </div>
            </div>`;
        }

        // ── PILL HERO ESPANDIBILI ──
        function toggleHeroStat(key) {
            const keys = ['aritm', 'pond', 'laurea', 'cfu'];
            const panel = document.getElementById('hero-detail-panel');

            // Determina se la pill toccata era già attiva (toggle off)
            const activeStat = document.querySelector('.hero-stat.active-detail');
            const wasActive = activeStat && activeStat.getAttribute('data-key') === key;

            // Aggiorna stato delle pill
            keys.forEach(function(k) {
                const stat = document.querySelector('.hero-stat[data-key=' + k + ']');
                if (!stat) return;
                stat.classList.toggle('active-detail', !wasActive && k === key);
            });

            // Aggiorna visibilità pane
            keys.forEach(function(k) {
                const pane = document.getElementById('hero-pane-' + k);
                if (!pane) return;
                pane.classList.toggle('visible', !wasActive && k === key);
            });

            // Apri/chiudi pannello
            if (panel) {
                panel.classList.toggle('open', !wasActive);
            }

            if (navigator.vibrate) navigator.vibrate(4);
        }

        // ── PIANIFICAZIONE (Fase B + C) ──

        // stato toggle sessioni passate
        let pianificazioneMostraPassate = false;

        // Stato collapsed per ogni sessione: { sessioneKey: bool }
        // true = collassata, false/undefined = espansa
        // Non persiste in localStorage — si resetta ad ogni apertura tab.
        let sessioneCollapsed = {};

        const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                         'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

        function formatSessione(sessioneKey) {
            if (!sessioneKey || !(/^\d{4}-\d{2}$/.test(sessioneKey))) return null;
            const [y, m] = sessioneKey.split('-');
            return `${MESI_IT[parseInt(m, 10) - 1]} ${y}`;
        }

        function isSessionePassata(sessioneKey) {
            if (!sessioneKey) return false;
            const oggi = new Date();
            const oggiKey = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}`;
            return sessioneKey < oggiKey;
        }

        function renderPianificazione() {
            const el = document.getElementById('tab-pianificazione');
            if (!el) return;

            const pianificati = esami.filter(e => e.planned);

            if (pianificati.length === 0) {
                el.innerHTML = `
                  <div class="empty">
                    <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg></div>
                    <h3>Nessun piano</h3>
                    <p>Aggiungi esami da sostenere per pianificare le sessioni future</p>
                    <button class="btn-empty-cta" onclick="openModal();setPlannedMode(true)">Pianifica esame</button>
                  </div>`;
                return;
            }

            // Raggruppa per sessione
            const gruppi = {}; // sessioneKey -> array esami
            pianificati.forEach(e => {
                const key = e.sessione || '__nosessione__';
                if (!gruppi[key]) gruppi[key] = [];
                gruppi[key].push(e);
            });

            // Ordina sessioni: future prima (cronologico), passate dopo, senza sessione in fondo
            const sessioniKeys = Object.keys(gruppi).filter(k => k !== '__nosessione__');
            const oggi = new Date();
            const oggiKey = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}`;

            const sessioniFuture = sessioniKeys.filter(k => k >= oggiKey).sort();
            const sessioniPassate = sessioniKeys.filter(k => k < oggiKey).sort().reverse(); // passate: più recenti prima

            // Conta passate per toggle label
            const nPassate = sessioniPassate.length;

            // Aggiorna la lista ordinata usata da getChainBase
            sessioniFutureOrdinate = [...sessioniFuture];

            // ── Default collapsed state: tutte chiuse ──
            [...sessioniFuture, '__nosessione__', ...sessioniPassate].forEach(key => {
                if (sessioneCollapsed[key] === undefined) {
                    sessioneCollapsed[key] = true;
                }
            });

            let html = '';

            // Sessioni future — con connettori tra una e l'altra
            sessioniFuture.forEach((key, idx) => {
                if (idx > 0) {
                    const prevKey = sessioniFuture[idx - 1];
                    const prevLabel = formatSessione(prevKey) || prevKey;
                    const isLinked = _simState(key).linked;
                    html += _buildConnectorHTML(key, isLinked, prevLabel);
                }
                html += buildSessioneGroupHTML(key, gruppi[key]);
            });

            // Senza sessione (in fondo alle future, prima delle passate)
            if (gruppi['__nosessione__']) {
                html += buildSessioneGroupHTML('__nosessione__', gruppi['__nosessione__']);
            }

            // Toggle sessioni passate
            if (nPassate > 0) {
                const pastToggleChevron = pianificazioneMostraPassate
                    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>`
                    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;
                html += `<button class="piano-session-past-toggle" onclick="togglePianificazionePassate()">
                    ${pastToggleChevron}
                    ${pianificazioneMostraPassate ? 'Nascondi' : 'Mostra'} sessioni passate (${nPassate})
                </button>`;
                if (pianificazioneMostraPassate) {
                    sessioniPassate.forEach(key => {
                        html += buildSessioneGroupHTML(key, gruppi[key]);
                    });
                }
            }

            el.innerHTML = html;
        }

        function buildSessioneGroupHTML(sessioneKey, esamiSessione) {
            const isSenzaSessione = sessioneKey === '__nosessione__';
            const nomeSessione = isSenzaSessione ? 'Senza sessione' : (formatSessione(sessioneKey) || sessioneKey);
            const cfuSessione = esamiSessione.reduce((s, e) => s + e.cfu, 0);
            const isPassata = !isSenzaSessione && isSessionePassata(sessioneKey);
            let caricoLabel, caricoClass, warnIcon;
            if (cfuSessione > 30) {
                caricoLabel = 'carico alto'; caricoClass = 'badge-carico-alto';
                warnIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
            } else if (cfuSessione >= 20) {
                caricoLabel = 'carico medio'; caricoClass = 'badge-carico-medio'; warnIcon = '';
            } else if (cfuSessione >= 10) {
                caricoLabel = 'carico buono'; caricoClass = 'badge-carico-buono'; warnIcon = '';
            } else {
                caricoLabel = 'carico leggero'; caricoClass = 'badge-carico-leggero'; warnIcon = '';
            }

            const badgeHtml = `<span class="piano-session-badge ${caricoClass}">${caricoLabel}</span>`;
            const warnHtml = warnIcon ? `<span class="piano-session-warn" title="Carico elevato (>30 CFU)">${warnIcon}</span>` : '';

            const isCollapsed = !!sessioneCollapsed[sessioneKey];
            const headerCollapseClass = isCollapsed ? ' is-collapsed' : '';
            const chevronCollapseClass = isCollapsed ? ' is-collapsed' : '';
            // Stile inline iniziale per il wrapper collassabile
            const collapseTargetStyle = isCollapsed
                ? 'style="max-height:0;opacity:0;"'
                : 'style="max-height:none;opacity:1;"';

            const chevronSvg = `<svg class="piano-session-chevron${chevronCollapseClass}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

            let rowsHtml = esamiSessione.map(e => `
                <div class="piano-esame-row" onclick="openModalAddVoto(${e.id})">
                    <div class="piano-esame-dot"></div>
                    <div class="piano-esame-nome">${escHtml(e.nome)}</div>
                    <div class="piano-esame-cfu">${e.cfu} CFU</div>
                </div>
            `).join('');

            // Simulatore per sessione (Fase C) — solo per sessioni con esami
            const simHtml = buildSessionSimulatorHTML(sessioneKey, esamiSessione);

            return `
                <div class="piano-session-group" data-sessione="${escHtml(sessioneKey)}">
                    <button class="piano-session-header${headerCollapseClass}" onclick="toggleSessioneCollapsed('${escHtml(sessioneKey)}')" aria-expanded="${!isCollapsed}" type="button">
                        <div class="piano-session-header-left">
                            ${warnHtml}
                            <span class="piano-session-name">${escHtml(nomeSessione)}</span>
                            ${badgeHtml}
                        </div>
                        <div class="piano-session-header-right">
                            <span class="piano-session-cfu">${cfuSessione} CFU</span>
                            ${chevronSvg}
                        </div>
                    </button>
                    <div class="piano-session-collapse-target" ${collapseTargetStyle}>
                        <div class="piano-session-body">
                            ${rowsHtml}
                        </div>
                        ${simHtml}
                    </div>
                </div>
            `;
        }

        function togglePianificazionePassate() {
            pianificazioneMostraPassate = !pianificazioneMostraPassate;
            renderPianificazione();
        }

        // Toggle collasso per una singola sessione, senza re-render completo.
        // Aggiorna direttamente il DOM via classList + max-height per animazione fluida.
        function toggleSessioneCollapsed(sessioneKey) {
            const group = document.querySelector(`.piano-session-group[data-sessione="${sessioneKey}"]`);
            if (!group) return;

            const isNowCollapsed = !sessioneCollapsed[sessioneKey];
            sessioneCollapsed[sessioneKey] = isNowCollapsed;

            const header = group.querySelector('.piano-session-header');
            const collapseTarget = group.querySelector('.piano-session-collapse-target');
            const chevron = group.querySelector('.piano-session-chevron');

            if (header) header.setAttribute('aria-expanded', String(!isNowCollapsed));

            if (isNowCollapsed) {
                header.classList.add('is-collapsed');
                if (chevron) chevron.classList.add('is-collapsed');
                if (collapseTarget) {
                    collapseTarget.style.maxHeight = collapseTarget.scrollHeight + 'px';
                    // Forza il reflow prima di azzerare per triggerare la transizione
                    collapseTarget.getBoundingClientRect();
                    collapseTarget.style.maxHeight = '0';
                    collapseTarget.style.opacity = '0';
                }
            } else {
                header.classList.remove('is-collapsed');
                if (chevron) chevron.classList.remove('is-collapsed');
                if (collapseTarget) {
                    collapseTarget.style.maxHeight = collapseTarget.scrollHeight + 'px';
                    collapseTarget.style.opacity = '1';
                    // Dopo la transizione, rimuovi max-height fisso per permettere resize dinamico
                    collapseTarget.addEventListener('transitionend', function onEnd() {
                        collapseTarget.removeEventListener('transitionend', onEnd);
                        if (!sessioneCollapsed[sessioneKey]) {
                            collapseTarget.style.maxHeight = 'none';
                        }
                    }, { once: true });
                }
            }

            if (navigator.vibrate) navigator.vibrate(4);
        }

        // ── FASE C: Simulatore per sessione ──

        // Stato slider simulatori per sessione: { sessioneKey: { linked: bool, voti: { esameId: sliderVal } } }
        // Nota: per retrocompatibilità, accettiamo anche la vecchia forma piatta { esameId: val }
        let sessioneSimState = {};

        // Lista ordinata delle sessioni future visibili — aggiornata da renderPianificazione
        // Serve a getChainBase per sapere l'ordine cronologico
        let sessioniFutureOrdinate = [];

        function _simState(key) {
            // Restituisce sempre la forma normalizzata { linked, voti }
            const s = sessioneSimState[key];
            if (!s) return { linked: true, voti: {} };
            // Retrocompatibilità: vecchia forma piatta (valori numerici)
            if (typeof s.voti === 'undefined') {
                return { linked: true, voti: s };
            }
            return s;
        }

        function _ensureSimState(key) {
            const s = sessioneSimState[key];
            if (!s || typeof s.voti === 'undefined') {
                // Migra eventuale vecchia forma piatta
                const oldVoti = (s && typeof s === 'object') ? s : {};
                sessioneSimState[key] = { linked: true, voti: oldVoti };
            }
        }

        // Calcola gli esami "extra" da includere nella base della sessione all'indice i
        // nella lista cronologica sessioniFutureOrdinate.
        // Percorre la catena a ritroso finché trova linked:false o arriva a j=0.
        function getChainBase(sessioneKey) {
            const i = sessioniFutureOrdinate.indexOf(sessioneKey);
            if (i <= 0) return []; // prima sessione o non trovata: nessun extra
            let extra = [];
            for (let j = i - 1; j >= 0; j--) {
                const prevKey = sessioniFutureOrdinate[j];
                // Se la sessione CORRENTE (j+1) ha linked:false, la catena si spezza qui
                const targetKey = j + 1 <= i ? sessioniFutureOrdinate[j + 1] : sessioneKey;
                if (!_simState(targetKey).linked) break;
                const esamiPrev = esami.filter(e => e.planned && (e.sessione || '__nosessione__') === prevKey);
                const votiPrev = _simState(prevKey).voti;
                extra = esamiPrev.map(e => ({
                    ...e,
                    voto: votiPrev[e.id] !== undefined ? votiPrev[e.id] : 25,
                    planned: false
                })).concat(extra);
            }
            return extra;
        }

        function buildSessionSimulatorHTML(sessioneKey, esamiSessione) {
            // Inizializza stato per questa sessione se non esiste
            _ensureSimState(sessioneKey);
            esamiSessione.forEach(e => {
                if (sessioneSimState[sessioneKey].voti[e.id] === undefined) {
                    sessioneSimState[sessioneKey].voti[e.id] = 25; // default 25
                }
            });

            // Base sostenuti reali
            const sostenuti = esami.filter(e => !e.planned && e.voto !== 'ID');
            const cfuSostenuti = sostenuti.reduce((s, e) => s + e.cfu, 0);
            const sommaPonderataSostenuti = sostenuti.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0);
            const mediaSostenuti = cfuSostenuti > 0 ? sommaPonderataSostenuti / cfuSostenuti : null;

            // Extra dalla catena (sessioni precedenti collegate)
            const chainExtra = getChainBase(sessioneKey);
            const cfuExtra = chainExtra.reduce((s, e) => s + e.cfu, 0);
            const sommaExtra = chainExtra.reduce((s, e) => {
                const v = typeof e.voto === 'number' ? e.voto : 25;
                const vNum = v === 31 ? settings.valoreLode : v;
                return s + vNum * e.cfu;
            }, 0);

            // Calcola range min/max includendo la catena
            const cfuSessione = esamiSessione.reduce((s, e) => s + e.cfu, 0);
            const cfuBase = cfuSostenuti + cfuExtra;
            const sommaBase = sommaPonderataSostenuti + sommaExtra;
            const cfuTotaleProiettato = cfuBase + cfuSessione;

            let mediaMin = null, mediaMax = null;
            if (cfuTotaleProiettato > 0) {
                const sommaMin = sommaBase + esamiSessione.reduce((s, e) => s + 18 * e.cfu, 0);
                const sommaMax = sommaBase + esamiSessione.reduce((s, e) => s + settings.valoreLode * e.cfu, 0);
                mediaMin = sommaMin / cfuTotaleProiettato;
                mediaMax = sommaMax / cfuTotaleProiettato;
            }

            const voti = sessioneSimState[sessioneKey].voti;
            const slidersHtml = esamiSessione.map(e => {
                const sliderVal = voti[e.id];
                const displayVal = sliderVal === 31 ? '30L' : sliderVal;
                return `
                    <div class="piano-sim-row">
                        <div class="piano-sim-nome">${escHtml(e.nome)}</div>
                        <div class="piano-sim-slider-wrap">
                            <input type="range" class="piano-sim-slider"
                                min="18" max="31" step="1" value="${sliderVal}"
                                oninput="onSessioneSimSliderChange('${escHtml(sessioneKey)}', ${e.id}, this.value)"
                                aria-label="Voto simulato per ${escHtml(e.nome)}">
                            <span class="piano-sim-val" id="piano-sim-val-${e.id}">${displayVal}</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Calcola media corrente con i valori degli slider attuali + catena
            const mediaCorrente = calcSessioneSimMedia(sessioneKey, esamiSessione);
            const mediaCorrenteStr = mediaCorrente !== null ? mediaCorrente.toFixed(2) : '—';
            const mediaMinStr = mediaMin !== null ? mediaMin.toFixed(2) : '—';
            const mediaMaxStr = mediaMax !== null ? mediaMax.toFixed(2) : '—';

            const mediaAttualeStr = mediaSostenuti !== null ? mediaSostenuti.toFixed(2) : 'nessun esame';

            const safeKey = sessioneKey.replace(/[^a-zA-Z0-9]/g, '_');

            // Info catena: se ci sono sessioni precedenti collegate, mostra il dettaglio
            const idx = sessioniFutureOrdinate.indexOf(sessioneKey);
            const prevKey = idx > 0 ? sessioniFutureOrdinate[idx - 1] : null;
            const prevLabel = prevKey ? (formatSessione(prevKey) || prevKey) : '';
            const chainInfoText = chainExtra.length > 0
                ? `Base: include ${escHtml(prevLabel)}${idx > 1 ? ' e sessioni precedenti' : ''}`
                : '';
            const chainInfoStyle = chainExtra.length > 0 ? '' : ' style="display:none"';
            const chainInfoHtml = `<div class="piano-sim-chain-info" id="piano-sim-chaininfo-${safeKey}"${chainInfoStyle}>${chainInfoText}</div>`;
            return `
                <div class="piano-sim-card">
                    <div class="piano-sim-title">Simulazione — ${escHtml(formatSessione(sessioneKey) || (sessioneKey === '__nosessione__' ? 'Senza sessione' : sessioneKey))}</div>
                    ${chainInfoHtml}
                    ${slidersHtml}
                    <div class="piano-sim-results">
                        <div class="piano-sim-current">Media attuale: <strong>${escHtml(mediaAttualeStr)}</strong></div>
                        <div class="piano-sim-range">
                            <div class="piano-sim-range-item">
                                <div class="piano-sim-range-label">Scenario</div>
                                <div class="piano-sim-range-val current" id="piano-sim-corrente-${safeKey}">${mediaCorrenteStr}</div>
                                <div class="piano-sim-range-sub">con questi voti</div>
                            </div>
                            <div class="piano-sim-range-item">
                                <div class="piano-sim-range-label">Peggiore</div>
                                <div class="piano-sim-range-val worst" id="piano-sim-min-${safeKey}">${mediaMinStr}</div>
                                <div class="piano-sim-range-sub">tutti 18</div>
                            </div>
                            <div class="piano-sim-range-item">
                                <div class="piano-sim-range-label">Migliore</div>
                                <div class="piano-sim-range-val best" id="piano-sim-max-${safeKey}">${mediaMaxStr}</div>
                                <div class="piano-sim-range-sub">tutti 30L</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function calcSessioneSimMedia(sessioneKey, esamiSessione) {
            const sostenuti = esami.filter(e => !e.planned && e.voto !== 'ID');
            const cfuSostenuti = sostenuti.reduce((s, e) => s + e.cfu, 0);
            const sommaSostenuti = sostenuti.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0);

            // Extra dalla catena
            const chainExtra = getChainBase(sessioneKey);
            const cfuExtra = chainExtra.reduce((s, e) => s + e.cfu, 0);
            const sommaExtra = chainExtra.reduce((s, e) => {
                const v = typeof e.voto === 'number' ? e.voto : 25;
                const vNum = v === 31 ? settings.valoreLode : v;
                return s + vNum * e.cfu;
            }, 0);

            const cfuSessione = esamiSessione.reduce((s, e) => s + e.cfu, 0);
            const cfuTotale = cfuSostenuti + cfuExtra + cfuSessione;
            if (cfuTotale === 0) return null;

            const voti = _simState(sessioneKey).voti;
            const sommaSim = esamiSessione.reduce((s, e) => {
                const v = voti[e.id] !== undefined ? voti[e.id] : 25;
                const vNum = v === 31 ? settings.valoreLode : v;
                return s + vNum * e.cfu;
            }, 0);

            return (sommaSostenuti + sommaExtra + sommaSim) / cfuTotale;
        }

        function onSessioneSimSliderChange(sessioneKey, esameId, rawVal) {
            const val = parseInt(rawVal, 10);
            _ensureSimState(sessioneKey);
            sessioneSimState[sessioneKey].voti[esameId] = val;

            // Aggiorna display valore slider
            const displayEl = document.getElementById(`piano-sim-val-${esameId}`);
            if (displayEl) displayEl.textContent = val === 31 ? '30L' : val;

            // Ricalcola la sessione corrente e tutte quelle successive nella catena
            _ricalcolaSessioniDa(sessioneKey);

            if (navigator.vibrate) navigator.vibrate(5);
        }

        // Ricalcola il display della media "Scenario" per la sessione indicata
        // e per tutte le sessioni successive in sessioniFutureOrdinate.
        function _ricalcolaSessioniDa(sessioneKey) {
            const startIdx = sessioniFutureOrdinate.indexOf(sessioneKey);
            const keysToUpdate = startIdx >= 0
                ? sessioniFutureOrdinate.slice(startIdx)
                : [sessioneKey];

            keysToUpdate.forEach(key => {
                const esamiK = esami.filter(e => e.planned && (e.sessione || '__nosessione__') === key);
                const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');

                // Media scenario corrente
                const media = calcSessioneSimMedia(key, esamiK);
                const elCorrente = document.getElementById(`piano-sim-corrente-${safeKey}`);
                if (elCorrente) elCorrente.textContent = media !== null ? media.toFixed(2) : '—';

                // Ricalcola peggiore/migliore con la catena aggiornata
                const sostenuti = esami.filter(e => !e.planned && e.voto !== 'ID');
                const cfuSostenuti = sostenuti.reduce((s, e) => s + e.cfu, 0);
                const sommaSostenuti = sostenuti.reduce((s, e) => s + getVotoNum(e) * e.cfu, 0);
                const chainExtra = getChainBase(key);
                const cfuExtra = chainExtra.reduce((s, e) => s + e.cfu, 0);
                const sommaExtra = chainExtra.reduce((s, e) => {
                    const v = typeof e.voto === 'number' ? e.voto : 25;
                    const vNum = v === 31 ? settings.valoreLode : v;
                    return s + vNum * e.cfu;
                }, 0);
                const cfuSessione = esamiK.reduce((s, e) => s + e.cfu, 0);
                const cfuTotale = cfuSostenuti + cfuExtra + cfuSessione;
                const sommaBase = sommaSostenuti + sommaExtra;

                const elMin = document.getElementById(`piano-sim-min-${safeKey}`);
                const elMax = document.getElementById(`piano-sim-max-${safeKey}`);
                if (elMin && elMax && cfuTotale > 0) {
                    const sommaMin = sommaBase + esamiK.reduce((s, e) => s + 18 * e.cfu, 0);
                    const sommaMax = sommaBase + esamiK.reduce((s, e) => s + settings.valoreLode * e.cfu, 0);
                    elMin.textContent = (sommaMin / cfuTotale).toFixed(2);
                    elMax.textContent = (sommaMax / cfuTotale).toFixed(2);
                }
            });
        }

        // Toggle collegamento catena per una sessione
        function toggleSessioneLink(sessioneKey) {
            _ensureSimState(sessioneKey);
            sessioneSimState[sessioneKey].linked = !sessioneSimState[sessioneKey].linked;

            // Aggiorna UI del connettore
            const safeKey = sessioneKey.replace(/[^a-zA-Z0-9]/g, '_');
            const connEl = document.getElementById(`piano-chain-connector-${safeKey}`);
            if (connEl) {
                const isLinked = sessioneSimState[sessioneKey].linked;
                const idx = sessioniFutureOrdinate.indexOf(sessioneKey);
                const prevKey = idx > 0 ? sessioniFutureOrdinate[idx - 1] : null;
                const prevLabel = prevKey ? (formatSessione(prevKey) || prevKey) : '';
                connEl.outerHTML = _buildConnectorHTML(sessioneKey, isLinked, prevLabel);
            }

            // Aggiorna info catena nella sim card della sessione corrente e successive
            _ricalcolaSessioniDa(sessioneKey);

            // Aggiorna il testo chainInfo nella sim card
            // (richiede re-render della sim card solo per aggiornare il testo base)
            const startIdx = sessioniFutureOrdinate.indexOf(sessioneKey);
            const keysToUpdate = startIdx >= 0
                ? sessioniFutureOrdinate.slice(startIdx)
                : [sessioneKey];

            keysToUpdate.forEach(key => {
                const safek = key.replace(/[^a-zA-Z0-9]/g, '_');
                const chainInfoEl = document.getElementById(`piano-sim-chaininfo-${safek}`);
                if (!chainInfoEl) return;
                const chainExtra = getChainBase(key);
                if (chainExtra.length > 0) {
                    const kidx = sessioniFutureOrdinate.indexOf(key);
                    const pk = kidx > 0 ? sessioniFutureOrdinate[kidx - 1] : null;
                    const pl = pk ? (formatSessione(pk) || pk) : '';
                    chainInfoEl.textContent = `Base: include ${pl}${chainExtra.length > 0 && kidx > 1 ? ' e sessioni precedenti' : ''}`;
                    chainInfoEl.style.display = '';
                } else {
                    chainInfoEl.style.display = 'none';
                }
            });

            if (navigator.vibrate) navigator.vibrate(8);
        }

        function _buildConnectorHTML(sessioneKey, isLinked, prevLabel) {
            const safeKey = sessioneKey.replace(/[^a-zA-Z0-9]/g, '_');
            // SVG link: anelli concatenati (Lucide "link")
            const svgLink = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
            // SVG unlink: anelli spezzati (Lucide "unlink")
            const svgUnlink = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/></svg>`;
            const icon = isLinked ? svgLink : svgUnlink;
            const label = isLinked ? `include ${escHtml(prevLabel)}` : 'calcolo indipendente';
            const brokenClass = isLinked ? '' : ' broken';
            return `<div class="piano-chain-connector" id="piano-chain-connector-${safeKey}">
                        <div class="piano-chain-line${brokenClass}"></div>
                        <button class="piano-chain-link${brokenClass}" onclick="toggleSessioneLink('${escHtml(sessioneKey)}')" title="${isLinked ? 'Scollega sessione' : 'Collega alla precedente'}">${icon}</button>
                        <div class="piano-chain-line${brokenClass}"></div>
                        <span class="piano-chain-label${brokenClass}">${label}</span>
                    </div>`;
        }

        // ── STATISTICHE ──
        function renderStatistiche() {
            const el = document.getElementById('tab-statistiche');
            // Escludi planned e idoneità
            const graded = esami.filter(e => !e.planned && e.voto !== 'ID');
            const n = graded.length;
            if (n < 3) {
                el.innerHTML = '<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div><h3>Dati insufficienti</h3><p>Aggiungi almeno 3 esami con voto per vedere le statistiche</p><button class="btn-empty-cta" onclick="switchTab(\'registro\')">Vai al registro</button></div>';
                return;
            }

            // Read CSS colors dynamically (works for both themes)
            const cs = getComputedStyle(document.documentElement);
            const colAccent = cs.getPropertyValue('--accent').trim();
            const colAccent2 = cs.getPropertyValue('--accent2').trim();
            const colGreen = cs.getPropertyValue('--green').trim();
            const colRed = cs.getPropertyValue('--red').trim();
            const colText = cs.getPropertyValue('--text').trim();
            const colText2 = cs.getPropertyValue('--text2').trim();
            const colText3 = cs.getPropertyValue('--text3').trim();
            const colBorder = cs.getPropertyValue('--border').trim();
            const colYellow = '#d4a843';

            // Sort graded exams chronologically (by date, then insertion order)
            const sorted = [...graded].sort((a, b) => {
                if (a.data && b.data) return a.data.localeCompare(b.data);
                if (a.data) return -1;
                if (b.data) return 1;
                return a.id - b.id;
            });

            // Build HTML skeleton based on statCards order and visibility
            const cardTemplates = {
                'quick-stats': '<div class="sim-card" id="stat-quick-stats" data-stat-card="quick-stats"></div>',
                'chart-voti': '<div class="sim-card" data-stat-card="chart-voti"><div class="stat-chart-heading"><span class="stat-chart-pip indigo"></span><h3>voti nel tempo</h3></div><canvas id="chart-voti"></canvas></div>',
                'chart-andamento': '<div class="sim-card" data-stat-card="chart-andamento"><div class="stat-chart-heading"><span class="stat-chart-pip indigo"></span><span class="stat-chart-pip gold"></span><h3>Media nel tempo</h3></div><canvas id="chart-andamento"></canvas></div>',
                'chart-distribuzione': '<div class="sim-card" data-stat-card="chart-distribuzione"><div class="stat-chart-heading"><span class="stat-chart-pip gold"></span><h3>Distribuzione voti</h3></div><canvas id="chart-distribuzione"></canvas></div>',
                'trend': '<div class="sim-card" id="stat-trend" data-stat-card="trend"></div>',
                'best-worst': '<div class="stat-cards-row" data-stat-card="best-worst"><div class="sim-card stat-card-half stat-card-best" id="stat-best"></div><div class="sim-card stat-card-half stat-card-worst" id="stat-worst"></div></div>',
                'cfu-summary': '<div class="sim-card" id="stat-cfu-summary" data-stat-card="cfu-summary"></div>',
                'completion': '<div class="sim-card" id="stat-completion" data-stat-card="completion"></div>'
            };

            const customizeBar = `<div class="stat-customize-bar"><button class="stat-customize-btn" onclick="openStatCustomize()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Personalizza</button></div>`;

            let skeletonHtml = customizeBar;
            settings.statCards.forEach(card => {
                if (card.visible && cardTemplates[card.id]) {
                    skeletonHtml += cardTemplates[card.id];
                }
            });
            el.innerHTML = skeletonHtml;

            // ── Helper: setup retina canvas ──
            function setupCanvas(id, w, h) {
                const canvas = document.getElementById(id);
                const dpr = window.devicePixelRatio || 1;
                canvas.width = w * dpr;
                canvas.height = h * dpr;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);
                return { canvas, ctx, w, h };
            }

            // ── Helper: hex color to rgba with custom alpha ──
            function colorWithAlpha(hex, alpha) {
                const h = hex.replace('#', '');
                if (h.length === 6) {
                    const r = parseInt(h.slice(0, 2), 16);
                    const g = parseInt(h.slice(2, 4), 16);
                    const b = parseInt(h.slice(4, 6), 16);
                    return `rgba(${r},${g},${b},${alpha})`;
                }
                return hex;
            }

            // ── 1. LINE CHART: Media andamento ──
            (function drawLineChart() {
                if (!document.getElementById('chart-andamento')) return;
                const container = document.getElementById('chart-andamento').parentElement;
                const cw = container.clientWidth - 40; // account for sim-card padding
                const ch = 240;
                const { ctx, w } = setupCanvas('chart-andamento', cw, ch);

                const padL = 36, padR = 14, padT = 14, padB = 58;
                const plotW = w - padL - padR;
                const plotH = ch - padT - padB;
                const plotBottom = padT + plotH;

                // Compute progressive averages
                let sumVoti = 0, sumProd = 0, sumCfu = 0;
                const dataPoints = sorted.map((e, i) => {
                    const vn = getVotoNum(e);
                    sumVoti += vn;
                    sumProd += vn * e.cfu;
                    sumCfu += e.cfu;
                    return {
                        nome: e.nome,
                        data: e.data,
                        aritm: sumVoti / (i + 1),
                        pond: sumProd / sumCfu
                    };
                });

                const yMin = 18, yMax = 30;
                const yRange = yMax - yMin;

                function toX(i) { return padL + (dataPoints.length === 1 ? plotW / 2 : (i / (dataPoints.length - 1)) * plotW); }
                function toY(v) { return padT + plotH - ((v - yMin) / yRange) * plotH; }

                // Background: subtle horizontal band for "good" score zone (27-30)
                const goodZoneTop = toY(30);
                const goodZoneBot = toY(27);
                ctx.fillStyle = colorWithAlpha(colAccent, 0.04);
                ctx.fillRect(padL, goodZoneTop, plotW, goodZoneBot - goodZoneTop);

                // Grid lines — alternating intensity
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                for (let yv = 18; yv <= 30; yv += 2) {
                    const y = toY(yv);
                    const isHighlight = (yv === 24 || yv === 28 || yv === 30);
                    ctx.strokeStyle = isHighlight
                        ? colorWithAlpha(colBorder, 0.9)
                        : colorWithAlpha(colBorder, 0.45);
                    ctx.lineWidth = isHighlight ? 0.75 : 0.4;
                    ctx.setLineDash(isHighlight ? [] : [2, 4]);
                    ctx.beginPath();
                    ctx.moveTo(padL, y);
                    ctx.lineTo(w - padR, y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.font = (isHighlight ? '500 ' : '') + '9.5px "DM Mono", monospace';
                    ctx.fillStyle = isHighlight ? colText2 : colText3;
                    ctx.fillText(yv, padL - 6, y);
                }

                // X axis labels
                const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
                function xLabel(dp) {
                    if (dp.data) {
                        const parts = dp.data.split('-');
                        return MESI[parseInt(parts[1]) - 1] + ' ' + parts[0].slice(2);
                    }
                    return dp.nome.length > 8 ? dp.nome.slice(0, 8) + '\u2026' : dp.nome;
                }
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = colText3;
                ctx.font = '9px "DM Mono", monospace';
                const step = Math.max(1, Math.ceil(dataPoints.length / 6));
                for (let i = 0; i < dataPoints.length; i += step) {
                    ctx.save();
                    ctx.translate(toX(i), plotBottom + 7);
                    ctx.rotate(-0.4);
                    ctx.fillText(xLabel(dataPoints[i]), 0, 0);
                    ctx.restore();
                }
                if ((dataPoints.length - 1) % step !== 0) {
                    ctx.save();
                    ctx.translate(toX(dataPoints.length - 1), plotBottom + 7);
                    ctx.rotate(-0.4);
                    ctx.fillText(xLabel(dataPoints[dataPoints.length - 1]), 0, 0);
                    ctx.restore();
                }

                // ── Area fill under ponderata line (gradient fade to transparent) ──
                const pondValues = dataPoints.map(d => d.pond);
                const areaGrad = ctx.createLinearGradient(0, padT, 0, plotBottom);
                areaGrad.addColorStop(0, colorWithAlpha(colAccent2, 0.28));
                areaGrad.addColorStop(0.6, colorWithAlpha(colAccent2, 0.08));
                areaGrad.addColorStop(1, colorWithAlpha(colAccent2, 0.0));
                ctx.fillStyle = areaGrad;
                ctx.beginPath();
                pondValues.forEach((v, i) => {
                    const x = toX(i), y = toY(v);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.lineTo(toX(pondValues.length - 1), plotBottom);
                ctx.lineTo(toX(0), plotBottom);
                ctx.closePath();
                ctx.fill();

                // ── Area fill under aritmetica line (lighter, gold) ──
                const aritmValues = dataPoints.map(d => d.aritm);
                const areaGrad2 = ctx.createLinearGradient(0, padT, 0, plotBottom);
                areaGrad2.addColorStop(0, colorWithAlpha(colAccent, 0.10));
                areaGrad2.addColorStop(1, colorWithAlpha(colAccent, 0.0));
                ctx.fillStyle = areaGrad2;
                ctx.beginPath();
                aritmValues.forEach((v, i) => {
                    const x = toX(i), y = toY(v);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.lineTo(toX(aritmValues.length - 1), plotBottom);
                ctx.lineTo(toX(0), plotBottom);
                ctx.closePath();
                ctx.fill();

                // Draw line helper (smooth where possible)
                function drawLine(values, color, dash, lineW) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineW;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
                    ctx.setLineDash(dash);
                    ctx.beginPath();
                    values.forEach((v, i) => {
                        const x = toX(i), y = toY(v);
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Lines — ponderata solid, aritmetica dashed
                drawLine(aritmValues, colorWithAlpha(colAccent, 0.7), [5, 4], 1.5);
                drawLine(pondValues, colAccent2, [], 2.5);

                // Dots for ponderata — with white/bg inner ring for polish
                pondValues.forEach((v, i) => {
                    const x = toX(i), y = toY(v);
                    // outer glow
                    ctx.fillStyle = colorWithAlpha(colAccent2, 0.25);
                    ctx.beginPath();
                    ctx.arc(x, y, 7, 0, Math.PI * 2);
                    ctx.fill();
                    // filled dot
                    ctx.fillStyle = colAccent2;
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    // inner highlight
                    const bgCol = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
                    ctx.fillStyle = colorWithAlpha(bgCol, 0.6) || 'rgba(19,19,26,0.6)';
                    ctx.beginPath();
                    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Dots for aritmetica — smaller, solid
                aritmValues.forEach((v, i) => {
                    const x = toX(i), y = toY(v);
                    ctx.fillStyle = colAccent;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });

                // ── Legend — positioned in top-right corner of plot area ──
                const legX = w - padR - 2;
                const legY1 = padT + 8;
                const legY2 = legY1 + 18;

                // Ponderata
                ctx.strokeStyle = colAccent2;
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(legX - 80, legY1 - 1);
                ctx.lineTo(legX - 68, legY1 - 1);
                ctx.stroke();
                ctx.font = '9px "DM Mono", monospace';
                ctx.fillStyle = colText2;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('Ponderata', legX - 64, legY1);

                // Aritmetica
                ctx.strokeStyle = colorWithAlpha(colAccent, 0.8);
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.moveTo(legX - 80, legY2 - 1);
                ctx.lineTo(legX - 68, legY2 - 1);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = colText2;
                ctx.fillText('Aritmetica', legX - 64, legY2);
            })();

            // ── 1b. SCATTER/LINE CHART: Voti nel tempo ──
            (function drawVotiChart() {
                if (!document.getElementById('chart-voti')) return;
                const container = document.getElementById('chart-voti').parentElement;
                const cw = container.clientWidth - 40;
                const ch = 200;
                const { ctx, w } = setupCanvas('chart-voti', cw, ch);

                const padL = 36, padR = 12, padT = 16, padB = 44;
                const plotW = w - padL - padR;
                const plotH = ch - padT - padB;
                const yMin = 17, yMax = 31;
                const yRange = yMax - yMin;

                function toX(i) { return padL + (sorted.length === 1 ? plotW / 2 : (i / (sorted.length - 1)) * plotW); }
                function toY(v) { return padT + plotH - ((v - yMin) / yRange) * plotH; }

                // Grid lines
                ctx.font = '10px "DM Mono", monospace';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                for (let yv = 18; yv <= 30; yv += 2) {
                    const y = toY(yv);
                    ctx.strokeStyle = yv === 18 ? colorWithAlpha(colRed, 0.2) : colBorder;
                    ctx.lineWidth = yv === 24 || yv === 28 ? 0.75 : 0.4;
                    ctx.setLineDash(yv === 24 || yv === 28 ? [] : [3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(padL, y);
                    ctx.lineTo(w - padR, y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = colText3;
                    ctx.fillText(yv, padL - 6, y);
                }

                // Good zone 27-30
                ctx.fillStyle = colorWithAlpha(colAccent, 0.04);
                ctx.fillRect(padL, toY(30), plotW, toY(27) - toY(30));

                // Connecting line
                const votiData = sorted.map(e => getVotoNum(e));
                ctx.strokeStyle = colorWithAlpha(colAccent, 0.3);
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                votiData.forEach((v, i) => {
                    const x = toX(i), y = toY(v);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
                ctx.setLineDash([]);

                // Dots with color coding
                sorted.forEach((e, i) => {
                    const v = getVotoNum(e);
                    const x = toX(i), y = toY(v);
                    let col;
                    if (e.voto === '30L') col = colGreen;
                    else if (v >= 27) col = colGreen;
                    else if (v >= 24) col = colAccent;
                    else col = colRed;

                    // Halo
                    ctx.fillStyle = colorWithAlpha(col, 0.2);
                    ctx.beginPath();
                    ctx.arc(x, y, 7, 0, Math.PI * 2);
                    ctx.fill();
                    // Dot
                    ctx.fillStyle = col;
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    // Inner highlight
                    ctx.fillStyle = colorWithAlpha(colText, 0.15);
                    ctx.beginPath();
                    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                });

                // X axis labels (exam name or date, rotated)
                ctx.font = '9px "DM Mono", monospace';
                ctx.fillStyle = colText3;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                const step = Math.max(1, Math.ceil(sorted.length / 7));
                for (let i = 0; i < sorted.length; i += step) {
                    const e = sorted[i];
                    let label = e.data ? new Date(e.data + 'T00:00:00').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }) : e.nome.substring(0, 8);
                    ctx.save();
                    ctx.translate(toX(i), ch - padB + 6);
                    ctx.rotate(-0.4);
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                }
                if (sorted.length > 1 && (sorted.length - 1) % step !== 0) {
                    const e = sorted[sorted.length - 1];
                    let label = e.data ? new Date(e.data + 'T00:00:00').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }) : e.nome.substring(0, 8);
                    ctx.save();
                    ctx.translate(toX(sorted.length - 1), ch - padB + 6);
                    ctx.rotate(-0.4);
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                }
            })();

            // ── 2. HORIZONTAL BAR CHART: Distribuzione voti ──
            (function drawBarChart() {
                if (!document.getElementById('chart-distribuzione')) return;
                // Count votes
                const voteCounts = {};
                graded.forEach(e => {
                    const key = e.voto === '30L' ? '30L' : String(e.votoNum);
                    voteCounts[key] = (voteCounts[key] || 0) + 1;
                });

                // All possible vote keys in order
                const allKeys = [];
                for (let v = 18; v <= 30; v++) allKeys.push(String(v));
                allKeys.push('30L');

                // Filter to only present votes
                const keys = allKeys.filter(k => voteCounts[k]);
                if (keys.length === 0) return;

                const maxCount = Math.max(...keys.map(k => voteCounts[k]));
                const barH = 24, gap = 8;
                const totalH = keys.length * (barH + gap) + 16;

                const container = document.getElementById('chart-distribuzione').parentElement;
                const cw = container.clientWidth - 40;
                const { ctx, w } = setupCanvas('chart-distribuzione', cw, totalH);

                const padL = 34, padR = 34;
                const barArea = w - padL - padR;

                function barColor(key) {
                    const num = key === '30L' ? 31 : parseInt(key);
                    if (num <= 22) return colRed;
                    if (num <= 25) return colYellow;
                    if (num <= 28) return colAccent;
                    return colGreen;
                }

                // Rounded rect helper (polyfill for older Safari)
                function roundedRect(ctx, x, y, bw, bh, r) {
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, y, bw, bh, [r]);
                    } else {
                        ctx.moveTo(x + r, y);
                        ctx.lineTo(x + bw - r, y);
                        ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
                        ctx.lineTo(x + bw, y + bh - r);
                        ctx.quadraticCurveTo(x + bw, y + bh, x + bw - r, y + bh);
                        ctx.lineTo(x + r, y + bh);
                        ctx.quadraticCurveTo(x, y + bh, x, y + bh - r);
                        ctx.lineTo(x, y + r);
                        ctx.quadraticCurveTo(x, y, x + r, y);
                        ctx.closePath();
                    }
                }

                keys.forEach((key, i) => {
                    const y = i * (barH + gap) + 8;
                    const count = voteCounts[key];
                    const bw = Math.max(barH, (count / maxCount) * barArea); // min width = bar height (keeps it readable)
                    const isMax = count === maxCount;
                    const color = barColor(key);

                    // Vote label (left)
                    const isLode = key === '30L';
                    ctx.font = (isLode ? '500 ' : '') + '10.5px "DM Mono", monospace';
                    ctx.fillStyle = isLode ? colGreen : colText2;
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(key, padL - 7, y + barH / 2);

                    // Track bar (full width, very faint)
                    roundedRect(ctx, padL, y, barArea, barH, 5);
                    ctx.fillStyle = colorWithAlpha(color, 0.07);
                    ctx.fill();

                    // Filled bar with gradient
                    const barGrad = ctx.createLinearGradient(padL, 0, padL + bw, 0);
                    barGrad.addColorStop(0, colorWithAlpha(color, isMax ? 1.0 : 0.75));
                    barGrad.addColorStop(1, colorWithAlpha(color, isMax ? 0.72 : 0.5));
                    roundedRect(ctx, padL, y, bw, barH, 5);
                    ctx.fillStyle = barGrad;
                    ctx.fill();

                    // Count label (right of bar)
                    ctx.font = isMax
                        ? '500 10.5px "DM Mono", monospace'
                        : '10px "DM Mono", monospace';
                    ctx.fillStyle = isMax ? colText : colText2;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(count, padL + bw + 7, y + barH / 2);
                });
            })();

            // ── 3. Best / Worst exam cards ──
            if (!document.getElementById('stat-best') || !document.getElementById('stat-worst')) { /* skip if hidden */ } else {
            const best = sorted.reduce((a, b) => {
                if (getVotoNum(b) > getVotoNum(a)) return b;
                if (getVotoNum(b) === getVotoNum(a) && b.voto === '30L') return b;
                return a;
            });
            const worst = sorted.reduce((a, b) => {
                if (getVotoNum(b) < getVotoNum(a)) return b;
                return a;
            });

            document.getElementById('stat-best').innerHTML = `
                <h3>Esame migliore</h3>
                <span class="stat-highlight-label">Voto</span>
                <div class="stat-highlight" style="color:${colGreen}">${best.voto}</div>
                <div class="stat-highlight-name">${escHtml(best.nome)}</div>`;

            document.getElementById('stat-worst').innerHTML = `
                <h3>Esame peggiore</h3>
                <span class="stat-highlight-label">Voto</span>
                <div class="stat-highlight" style="color:${colRed}">${worst.voto}</div>
                <div class="stat-highlight-name">${escHtml(worst.nome)}</div>`;
            }

            // ── 4. CFU summary ── (solo esami sostenuti)
            const sostenuti4cfu = esami.filter(e => !e.planned);
            const totCfu = sostenuti4cfu.reduce((s, e) => s + e.cfu, 0);
            const avgCfu = sostenuti4cfu.length > 0 ? (totCfu / sostenuti4cfu.length).toFixed(1) : '0';
            if (document.getElementById('stat-cfu-summary')) {
            document.getElementById('stat-cfu-summary').innerHTML = `
                <h3>Riepilogo CFU</h3>
                <div class="stat-cfu-row">
                    <div class="stat-cfu-item"><span class="stat-cfu-val">${totCfu}</span><span class="stat-cfu-label">CFU totali</span></div>
                    <div class="stat-cfu-item"><span class="stat-cfu-val">${sostenuti4cfu.length}</span><span class="stat-cfu-label">Esami superati</span></div>
                    <div class="stat-cfu-item"><span class="stat-cfu-val">${avgCfu}</span><span class="stat-cfu-label">CFU/esame</span></div>
                </div>`;
            }

            // ── 5. Quick stats: Mediana, Moda, Deviazione Standard ──
            (function renderQuickStats() {
                if (!document.getElementById('stat-quick-stats')) return;
                const voti = sorted.map(e => getVotoNum(e));
                const ng = voti.length;

                // Mediana
                const sortedVoti = [...voti].sort((a, b) => a - b);
                const mediana = ng % 2 === 1
                    ? sortedVoti[Math.floor(ng / 2)]
                    : ((sortedVoti[ng / 2 - 1] + sortedVoti[ng / 2]) / 2);
                const medianaStr = Number.isInteger(mediana) ? String(mediana) : mediana.toFixed(1);

                // Moda
                const freq = {};
                voti.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
                const maxFreq = Math.max(...Object.values(freq));
                const modaValues = Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number).sort((a, b) => a - b);
                const modaStr = modaValues.map(v => v === settings.valoreLode ? '30L' : String(v)).join(', ');
                const modaCls = modaValues.length > 2 ? ' val-sm' : '';

                // Deviazione standard
                const mean = voti.reduce((s, v) => s + v, 0) / ng;
                const variance = voti.reduce((s, v) => s + (v - mean) ** 2, 0) / ng;
                const devStd = Math.sqrt(variance).toFixed(2);

                document.getElementById('stat-quick-stats').innerHTML = `
                    <h3>Analisi voti</h3>
                    <div class="stat-cfu-row">
                        <div class="stat-cfu-item"><span class="stat-cfu-val">${medianaStr}</span><span class="stat-cfu-label">Mediana</span></div>
                        <div class="stat-cfu-item"><span class="stat-cfu-val${modaCls}">${modaStr}</span><span class="stat-cfu-label">Moda</span></div>
                        <div class="stat-cfu-item">
                            <span class="stat-cfu-val">${devStd}</span>
                            <span class="stat-cfu-label">Dev. Std <button class="stat-info-btn" onclick="toggleDevStdInfo(this)" aria-label="Cos'è la deviazione standard">i</button></span>
                            <span class="stat-info-box-content" style="display:none">
                                <strong>Quanto sei costante?</strong><br>
                                &lt; 1.5 → molto regolare<br>
                                1.5 – 3 → nella norma<br>
                                &gt; 3 → voti molto altalenanti
                            </span>
                        </div>
                    </div>`;
            })();

            // ── 6. Trend indicator: recent vs historical average ──
            (function renderTrend() {
                if (!document.getElementById('stat-trend')) return;
                const voti = sorted.map(e => getVotoNum(e));
                const ng = voti.length;
                if (ng < 3) return;

                const recentCount = ng >= 5 ? 5 : 3;
                const recentVoti = voti.slice(-recentCount);
                const recentAvg = recentVoti.reduce((s, v) => s + v, 0) / recentCount;
                const overallAvg = voti.reduce((s, v) => s + v, 0) / ng;
                const delta = recentAvg - overallAvg;

                let arrowSvg, arrowColor, msg;
                if (delta > 0.3) {
                    arrowColor = colGreen;
                    arrowSvg = `<svg viewBox="0 0 40 40" fill="none"><path d="M20 32V10" stroke="${arrowColor}" stroke-width="3" stroke-linecap="round"/><path d="M10 18L20 8L30 18" stroke="${arrowColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                    msg = `<span style="color:${colGreen}">Stai migliorando!</span>`;
                } else if (delta < -0.3) {
                    arrowColor = colRed;
                    arrowSvg = `<svg viewBox="0 0 40 40" fill="none"><path d="M20 8V30" stroke="${arrowColor}" stroke-width="3" stroke-linecap="round"/><path d="M10 22L20 32L30 22" stroke="${arrowColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                    msg = `<span style="color:${colRed}">Stai calando</span>`;
                } else {
                    arrowColor = colText3;
                    arrowSvg = `<svg viewBox="0 0 40 40" fill="none"><path d="M8 20H32" stroke="${arrowColor}" stroke-width="3" stroke-linecap="round"/><path d="M24 12L32 20L24 28" stroke="${arrowColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                    msg = `<span style="color:${colText3}">Stabile</span>`;
                }

                const deltaSign = delta >= 0 ? '+' : '';
                const deltaColor = delta > 0.3 ? colGreen : (delta < -0.3 ? colRed : colText3);

                document.getElementById('stat-trend').innerHTML = `
                    <h3>Andamento recente</h3>
                    <div class="stat-trend-arrow">${arrowSvg}</div>
                    <div class="stat-trend-details">
                        <div class="stat-trend-recent" style="color:${arrowColor}">${recentAvg.toFixed(2)}</div>
                        <div class="stat-trend-msg">${msg}</div>
                        <div class="stat-trend-compare">
                            <div class="stat-trend-compare-item">
                                <div class="stat-trend-compare-val">${recentAvg.toFixed(2)}</div>
                                <div class="stat-trend-compare-label">Ultimi ${recentCount}</div>
                            </div>
                            <div class="stat-trend-compare-item">
                                <div class="stat-trend-compare-val">${overallAvg.toFixed(2)}</div>
                                <div class="stat-trend-compare-label">Media storica</div>
                            </div>
                        </div>
                        <div class="stat-trend-delta" style="color:${deltaColor}">${deltaSign}${delta.toFixed(2)}</div>
                    </div>`;
            })();

            // ── 7. Estimated completion ──
            (function renderCompletion() {
                if (!document.getElementById('stat-completion')) return;
                const cfuTarget = settings.cfuTotali;
                const cfuDone = totCfu;
                const cfuRemaining = cfuTarget - cfuDone;
                const pct = Math.min(100, Math.round((cfuDone / cfuTarget) * 100));

                // Find date range from sostenuti exams only (excluding planned)
                const datedExams = esami.filter(e => !e.planned && e.data);
                if (datedExams.length < 2) {
                    if (cfuRemaining <= 0) {
                        document.getElementById('stat-completion').innerHTML = `
                            <h3>Completamento</h3>
                            <div class="stat-completion-bar-wrap"><div class="stat-completion-bar-fill" style="width:100%"></div></div>
                            <div class="stat-completion-congrats">
                                <div class="stat-completion-congrats-icon"><svg viewBox="0 0 32 32" width="32" height="32" fill="none"><circle cx="16" cy="16" r="14" stroke="${colGreen}" stroke-width="2"/><path d="M10 16l4 4 8-8" stroke="${colGreen}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                                <div class="stat-completion-congrats-text">Hai completato tutti i CFU!</div>
                            </div>`;
                    } else {
                        document.getElementById('stat-completion').innerHTML = `
                            <h3>Completamento</h3>
                            <div class="stat-completion-pct">${pct}%</div>
                            <div class="stat-completion-subtitle">${cfuDone} / ${cfuTarget} CFU</div>
                            <div class="stat-completion-bar-wrap"><div class="stat-completion-bar-fill" style="width:${pct}%"></div></div>
                            <div class="stat-completion-grid">
                                <div class="stat-completion-item"><span class="stat-completion-val">${cfuDone}</span><span class="stat-completion-label">CFU ottenuti</span></div>
                                <div class="stat-completion-item"><span class="stat-completion-val">${cfuRemaining > 0 ? cfuRemaining : 0}</span><span class="stat-completion-label">CFU mancanti</span></div>
                            </div>
                            <div class="stat-completion-estimate">
                                <div class="stat-completion-estimate-label">Aggiungi date agli esami per vedere la stima</div>
                            </div>`;
                    }
                    return;
                }

                // Sort dated exams by date
                const sortedDated = [...datedExams].sort((a, b) => a.data.localeCompare(b.data));
                const earliest = new Date(sortedDated[0].data);
                const latest = new Date(sortedDated[sortedDated.length - 1].data);

                // Months between earliest and latest exam
                const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
                const monthsElapsed = Math.max(1, (latest - earliest) / msPerMonth);
                const cfuPerMonth = cfuDone / monthsElapsed;
                const cfuPerMonthStr = cfuPerMonth.toFixed(1);

                if (cfuRemaining <= 0) {
                    document.getElementById('stat-completion').innerHTML = `
                        <h3>Completamento</h3>
                        <div class="stat-completion-bar-wrap"><div class="stat-completion-bar-fill" style="width:100%"></div></div>
                        <div class="stat-completion-congrats">
                            <div class="stat-completion-congrats-icon"><svg viewBox="0 0 32 32" width="32" height="32" fill="none"><circle cx="16" cy="16" r="14" stroke="${colGreen}" stroke-width="2"/><path d="M10 16l4 4 8-8" stroke="${colGreen}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                            <div class="stat-completion-congrats-text">Hai completato tutti i CFU!</div>
                        </div>`;
                    return;
                }

                const monthsRemaining = Math.ceil(cfuRemaining / cfuPerMonth);
                let timeStr;
                if (monthsRemaining > 12) {
                    const years = Math.floor(monthsRemaining / 12);
                    const months = monthsRemaining % 12;
                    timeStr = months > 0 ? `~${years} ann${years === 1 ? 'o' : 'i'} e ${months} mes${months === 1 ? 'e' : 'i'}` : `~${years} ann${years === 1 ? 'o' : 'i'}`;
                } else {
                    timeStr = `~${monthsRemaining} mes${monthsRemaining === 1 ? 'e' : 'i'}`;
                }

                // Estimated completion date
                const MESI_FULL = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                const estDate = new Date();
                estDate.setMonth(estDate.getMonth() + monthsRemaining);
                const estStr = `Circa ${MESI_FULL[estDate.getMonth()]} ${estDate.getFullYear()}`;

                document.getElementById('stat-completion').innerHTML = `
                    <h3>Completamento</h3>
                    <div class="stat-completion-pct">${pct}%</div>
                    <div class="stat-completion-subtitle">${cfuDone} / ${cfuTarget} CFU</div>
                    <div class="stat-completion-bar-wrap"><div class="stat-completion-bar-fill" style="width:${pct}%"></div></div>
                    <div class="stat-completion-grid">
                        <div class="stat-completion-item"><span class="stat-completion-val">${cfuDone}</span><span class="stat-completion-label">CFU ottenuti</span></div>
                        <div class="stat-completion-item"><span class="stat-completion-val">${cfuRemaining}</span><span class="stat-completion-label">CFU mancanti</span></div>
                        <div class="stat-completion-item"><span class="stat-completion-val">${cfuPerMonthStr}</span><span class="stat-completion-label">CFU/mese</span></div>
                    </div>
                    <div class="stat-completion-estimate">
                        <div class="stat-completion-estimate-val">${timeStr}</div>
                        <div class="stat-completion-estimate-label">${estStr}</div>
                    </div>`;
            })();
        }

        // ── STAT CARDS CUSTOMIZE ──
        function openStatCustomize() {
            // Remove existing overlay if present
            let overlay = document.getElementById('stat-customize-overlay');
            if (overlay) overlay.remove();

            overlay = document.createElement('div');
            overlay.id = 'stat-customize-overlay';
            overlay.className = 'stat-customize-overlay';

            function buildList() {
                return settings.statCards.map((card, i) => {
                    const isFirst = i === 0;
                    const isLast = i === settings.statCards.length - 1;
                    return `<div class="stat-customize-item${card.visible ? '' : ' disabled'}">
                        <label class="stat-toggle">
                            <input type="checkbox" ${card.visible ? 'checked' : ''} onchange="toggleStatCard('${card.id}', this.checked)">
                            <span class="stat-toggle-track"></span>
                        </label>
                        <span class="stat-customize-item-label">${card.label}</span>
                        <div class="stat-customize-arrows">
                            <button class="stat-customize-arrow" ${isFirst ? 'disabled' : ''} onclick="moveStatCard('${card.id}', -1)" aria-label="Sposta su"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>
                            <button class="stat-customize-arrow" ${isLast ? 'disabled' : ''} onclick="moveStatCard('${card.id}', 1)" aria-label="Sposta giù"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
                        </div>
                    </div>`;
                }).join('');
            }

            overlay.innerHTML = `
                <div class="stat-customize-panel">
                    <div class="stat-customize-drag-handle"></div>
                    <div class="stat-customize-panel-header">
                        <h3>Personalizza</h3>
                        <button class="stat-customize-done" onclick="closeStatCustomize()">Fatto</button>
                    </div>
                    <div class="stat-customize-list" id="stat-customize-list">
                        ${buildList()}
                    </div>
                </div>`;

            document.body.appendChild(overlay);

            // Close on backdrop tap
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeStatCustomize();
            });

            // Animate in
            requestAnimationFrame(() => overlay.classList.add('open'));
        }

        function closeStatCustomize() {
            const overlay = document.getElementById('stat-customize-overlay');
            if (!overlay) return;
            overlay.classList.remove('open');
            setTimeout(() => {
                overlay.remove();
                renderStatistiche();
            }, 280);
        }

        function toggleStatCard(id, visible) {
            const card = settings.statCards.find(c => c.id === id);
            if (card) {
                card.visible = visible;
                saveSettings();
                // Update item styling
                refreshCustomizeList();
            }
        }

        function moveStatCard(id, direction) {
            const idx = settings.statCards.findIndex(c => c.id === id);
            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= settings.statCards.length) return;
            const temp = settings.statCards[idx];
            settings.statCards[idx] = settings.statCards[newIdx];
            settings.statCards[newIdx] = temp;
            saveSettings();
            refreshCustomizeList();
        }

        function refreshCustomizeList() {
            const list = document.getElementById('stat-customize-list');
            if (!list) return;
            list.innerHTML = settings.statCards.map((card, i) => {
                const isFirst = i === 0;
                const isLast = i === settings.statCards.length - 1;
                return `<div class="stat-customize-item${card.visible ? '' : ' disabled'}">
                    <label class="stat-toggle">
                        <input type="checkbox" ${card.visible ? 'checked' : ''} onchange="toggleStatCard('${card.id}', this.checked)">
                        <span class="stat-toggle-track"></span>
                    </label>
                    <span class="stat-customize-item-label">${card.label}</span>
                    <div class="stat-customize-arrows">
                        <button class="stat-customize-arrow" ${isFirst ? 'disabled' : ''} onclick="moveStatCard('${card.id}', -1)" aria-label="Sposta su"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>
                        <button class="stat-customize-arrow" ${isLast ? 'disabled' : ''} onclick="moveStatCard('${card.id}', 1)" aria-label="Sposta giù"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
                    </div>
                </div>`;
            }).join('');
        }

        // ── IMPOSTAZIONI ──
        function renderImpostazioni() {
            const el = document.getElementById('tab-impostazioni');
            const demoOverlay = localStorage.getItem('libretto_demo') === '1'
                ? `<div class="demo-settings-overlay">
                        <div class="demo-settings-msg">
                            <div class="demo-settings-msg-header">
                                <div class="demo-settings-msg-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </div>
                                <span class="demo-settings-msg-title">Impostazioni non disponibili in demo</span>
                            </div>
                            <p class="demo-settings-msg-sub">Stai esplorando l'app con dati di esempio. Inizia da zero per personalizzare il tuo corso e la formula di laurea.</p>
                            <button class="demo-settings-msg-btn" onclick="exitDemo()">
                                Inizia da zero
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </button>
                        </div>
                        <div class="demo-settings-below-blur"></div>
                   </div>`
                : '';
            el.innerHTML = `${demoOverlay}
                <div class="sim-card"><h3>Il tuo corso</h3>
                    <div class="settings-row"><span class="settings-label">Corso di laurea</span>
                        <input type="text" class="settings-input" value="${escHtml(settings.corso)}" placeholder="es. Ing. Informatica" onchange="settings.corso=this.value;saveSettings();updateStats()"></div>
                    <div class="settings-row"><span class="settings-label">Universit\u00e0</span>
                        <input type="text" class="settings-input" value="${escHtml(settings.universita)}" placeholder="es. UNISS" onchange="settings.universita=this.value;saveSettings();updateStats()"></div>
                    <div class="settings-row"><span class="settings-label">CFU totali</span>
                        <input type="number" class="settings-input" value="${settings.cfuTotali}" min="60" max="300" onchange="settings.cfuTotali=parseInt(this.value)||180;saveSettings();render()"></div>
                </div>
                <div class="sim-card"><h3>Formula laurea</h3>
                    <div class="slider-group"><div class="slider-label"><span>Bonus totale stimato (0\u201312)</span><span id="set-bonus-val">${settings.bonusTesi}</span></div>
                        <input type="range" min="0" max="12" value="${settings.bonusTesi}" oninput="settings.bonusTesi=parseInt(this.value);document.getElementById('set-bonus-val').textContent=this.value;saveSettings();updateStats()"></div>
                    <div class="settings-row"><span class="settings-label">Valore 30 e Lode</span>
                        <input type="number" class="settings-input" value="${settings.valoreLode}" min="30" max="33" onchange="settings.valoreLode=parseInt(this.value)||30;saveSettings();render()"></div>
                </div>
                <div class="sim-card"><h3>Aspetto</h3>
                    <div class="theme-toggle">
                        <button class="theme-opt ${settings.tema === 'auto' ? 'active' : ''}" onclick="setTheme('auto')">Auto</button>
                        <button class="theme-opt ${settings.tema === 'light' ? 'active' : ''}" onclick="setTheme('light')">Chiaro</button>
                        <button class="theme-opt ${settings.tema === 'dark' ? 'active' : ''}" onclick="setTheme('dark')">Scuro</button>
                    </div>
                </div>
                <div class="sim-card"><h3>Dati</h3>
                    <div class="settings-export-group">
                        <button class="settings-btn" onclick="exportCSV(false)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Esporta CSV (sostenuti)</button>
                        <button class="settings-btn" onclick="exportCSV(true)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Esporta CSV (con pianificati)</button>
                        <p class="settings-export-warn">Il CSV con pianificati include righe senza voto &mdash; potrebbe non essere compatibile con altri programmi.</p>
                    </div>
                    <button class="settings-btn" onclick="triggerImport()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Importa dati</button>
                    <hr class="settings-danger-divider">
                    <button class="settings-btn danger" onclick="deleteAllData()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg><span class="settings-danger-label"><span>Elimina tutti i dati</span><span class="danger-sublabel">Irreversibile</span></span></button>
                </div>
                <div class="version-footer">
                    TinyLibretto v3.0 BETA<br>
                    <span class="version-credits">\u00a9 2026 Daniele Simula</span>
                </div>`;
        }

        function setTheme(tema) {
            settings.tema = tema;
            saveSettings();
            applyTheme();
            renderImpostazioni();
        }

        // ── MODAL CONFERMA IN-APP ──
        let _confirmCallback = null;

        function showConfirmDialog(onConfirm) {
            _confirmCallback = onConfirm;
            const overlay = document.getElementById('confirm-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                const okBtn = document.getElementById('confirm-btn-ok');
                if (okBtn) {
                    // Rimuove listener precedenti clonando il nodo
                    const fresh = okBtn.cloneNode(true);
                    okBtn.parentNode.replaceChild(fresh, okBtn);
                    fresh.addEventListener('click', function() {
                        hideConfirmDialog();
                        if (typeof _confirmCallback === 'function') _confirmCallback();
                    });
                }
            }
        }

        function hideConfirmDialog() {
            const overlay = document.getElementById('confirm-overlay');
            if (overlay) overlay.style.display = 'none';
            _confirmCallback = null;
        }

        function deleteAllData() {
            showConfirmDialog(function() {
                esami = [];
                save();
                settings = Object.assign({}, DEFAULT_SETTINGS, { statCards: JSON.parse(JSON.stringify(DEFAULT_STAT_CARDS)) });
                saveSettings();
                applyTheme();
                render();
                switchTab('registro');
            });
        }

        // ── EXPORT CSV ──
        function exportCSV(includiPianificati = false) {
            const datiDaEsportare = includiPianificati
                ? esami
                : esami.filter(e => !e.planned);

            if (datiDaEsportare.length === 0) {
                alert(includiPianificati ? 'Nessun esame da esportare.' : 'Nessun esame sostenuto da esportare.');
                return;
            }

            const pad = n => String(n).padStart(2, '0');
            const now = new Date();
            const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

            const sorted = [...datiDaEsportare].sort((a, b) => {
                if (a.data && b.data) return a.data.localeCompare(b.data);
                return a.id - b.id;
            });

            const lines = ['Esame,Voto,CFU,Data,Sessione,Stato'];
            sorted.forEach(e => {
                const nome = '"' + e.nome.replace(/"/g, '""') + '"';
                const stato = e.planned ? 'pianificato' : 'sostenuto';
                const cfu = e.cfu.toFixed(1);

                if (e.planned) {
                    // Pianificati: nessun voto, nessuna data, solo sessione (YYYY-MM)
                    const sessione = e.sessione || '';
                    lines.push([nome, '', cfu, '', sessione, stato].join(','));
                } else {
                    const voto = e.voto === '30L' ? '30L' : e.voto === 'ID' ? 'ID' : e.votoNum;
                    const data = e.data
                        ? '"' + e.data.split('-').reverse().join('/') + '"'
                        : '""';
                    lines.push([nome, voto, cfu, data, '', stato].join(','));
                }
            });

            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tinylibretto_${ts}${includiPianificati ? '_completo' : ''}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }

        // ── IMPORT CSV ──
        function triggerImport() {
            document.getElementById('import-input').click();
        }

        function importCSV(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const lines = ev.target.result.trim().split('\n');
                const imported = [];
                let skipped = 0;

                // Rileva formato: header con 6 colonne = formato completo (con pianificati)
                const headerCols = lines[0].toLowerCase().split(',').map(c => c.trim());
                const hasSessione = headerCols.includes('sessione');
                const hasSeiColonne = headerCols.length >= 6;
                // Indici colonne: Esame,Voto,CFU,Data,Sessione,Stato (nuovo formato)
                //                 Esame,Voto,CFU,Data,Stato          (vecchio formato)
                const iSessione = hasSeiColonne ? 4 : -1;
                const iStato    = hasSeiColonne ? 5 : (headerCols.includes('stato') ? 4 : -1);

                lines.slice(1).forEach(line => {
                    if (!line.trim()) return;
                    const f = parseCSVLine(line);
                    if (f.length < 3) return;

                    const nome = f[0].trim();
                    const votoRaw = (f[1] || '').trim();
                    const cfuRaw = parseFloat(f[2]);
                    const dataRaw = (f[3] || '').trim();
                    const sessioneRaw = (iSessione >= 0 && f[iSessione] ? f[iSessione].trim() : '');
                    const statoRaw = (iStato >= 0 && f[iStato] ? f[iStato].trim().toLowerCase() : '');

                    if (!nome) return;

                    const isPianned = statoRaw === 'pianificato' || (!statoRaw && votoRaw === '');

                    if (isPianned) {
                        const cfu = isNaN(cfuRaw) ? 0 : cfuRaw;
                        if (cfu <= 0) { skipped++; return; }
                        // sessione: accetta YYYY-MM oppure MM/YYYY
                        let sessione = null;
                        if (sessioneRaw) {
                            if (/^\d{4}-\d{2}$/.test(sessioneRaw)) {
                                sessione = sessioneRaw;
                            } else {
                                const p = sessioneRaw.split('/');
                                if (p.length === 2) sessione = `${p[1]}-${p[0].padStart(2,'0')}`;
                            }
                        }
                        imported.push({ id: Date.now() + imported.length, nome, voto: null, votoNum: null, cfu, sessione, planned: true });
                        return;
                    }

                    let voto, votoNum;
                    if (votoRaw === '30L') {
                        voto = '30L'; votoNum = 30;
                    } else if (votoRaw === 'ID') {
                        voto = 'ID'; votoNum = null;
                    } else {
                        const n = parseInt(votoRaw);
                        if (isNaN(n) || n < 18 || n > 30) { skipped++; return; }
                        voto = n; votoNum = n;
                    }

                    const cfu = isNaN(cfuRaw) ? 0 : cfuRaw;
                    if (cfu <= 0) { skipped++; return; }

                    let data = '';
                    if (dataRaw) {
                        const p = dataRaw.split('/');
                        if (p.length === 3) data = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
                    }

                    imported.push({ id: Date.now() + imported.length, nome, voto, votoNum, cfu, data });
                });

                event.target.value = '';

                if (imported.length === 0) {
                    alert('Nessun esame valido trovato nel file.');
                    return;
                }

                const skipMsg = skipped > 0 ? `\n(${skipped} riga${skipped > 1 ? 'he' : ''} non valida ignorata)` : '';
                const msg = `Importare ${imported.length} esame${imported.length > 1 ? 'i' : ''}?${skipMsg}\n\nAttenzione: i dati attuali verranno sostituiti.`;
                if (confirm(msg)) {
                    esami = imported;
                    save();
                    render();
                }
            };
            reader.readAsText(file, 'UTF-8');
        }

        function parseCSVLine(line) {
            const fields = [];
            let cur = '', inQ = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
                    else inQ = !inQ;
                } else if (ch === ',' && !inQ) {
                    fields.push(cur); cur = '';
                } else {
                    cur += ch;
                }
            }
            fields.push(cur);
            return fields;
        }

        // input live validation
        document.getElementById('input-nome').addEventListener('input', validateSave);

        // ── LANDING ──
        function showApp() {
            const landing = document.getElementById('landing');
            const app = document.getElementById('app');
            if (landing) landing.style.display = 'none';
            if (app) app.style.display = '';
        }

        function switchInstallTab(tab) {
            document.getElementById('litab-ios').style.display = tab === 'ios' ? '' : 'none';
            document.getElementById('litab-android').style.display = tab === 'android' ? '' : 'none';
            document.getElementById('litab-btn-ios').classList.toggle('active', tab === 'ios');
            document.getElementById('litab-btn-android').classList.toggle('active', tab === 'android');
        }

        // ── DEMO MODE ──
        function startDemo() {
            localStorage.setItem('libretto_demo', '1');
            esami = DEMO_DATA.map(e => Object.assign({}, e));
            showApp();
            const banner = document.getElementById('demo-banner');
            if (banner) banner.style.display = 'flex';
            document.body.classList.add('demo-active');
            render();
        }

        function exitDemo() {
            localStorage.removeItem('libretto_demo');
            esami = [];
            save();
            location.reload();
        }
