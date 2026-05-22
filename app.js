/* ════════════════════════════════════════
   app.js  —  퍼스널 컬러 분석기 메인 로직
   의존: data.js (PCCS_TONES, SEASONS)
════════════════════════════════════════ */

/* ──────────────────────────────────────
   1. 유틸 — 색상 변환
────────────────────────────────────── */
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function parseInput(raw) {
  raw = raw.trim();
  // rgb(r,g,b)
  const m = raw.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  // hex
  const hex = raw.startsWith('#') ? raw : '#' + raw;
  if (/^#[0-9a-f]{3,6}$/i.test(hex)) return hexToRgb(hex);
  return null;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}


/* ──────────────────────────────────────
   2. PCCS 톤 매칭
────────────────────────────────────── */
function matchPccsTone({ s, l }) {
  let best = null, bestScore = Infinity;
  for (const tone of PCCS_TONES) {
    const sc = Math.max(0, tone.sat[0] - s, s - tone.sat[1]);
    const lc = Math.max(0, tone.lig[0] - l, l - tone.lig[1]);
    const score = sc + lc;
    if (score < bestScore) { bestScore = score; best = tone; }
  }
  return best;
}


/* ──────────────────────────────────────
   3. 퍼스널 컬러 점수 계산
────────────────────────────────────── */
function inHueRange(h, ranges) {
  return ranges.some(([mn, mx]) => h >= mn && h <= mx);
}

function scoreType(hsl, type) {
  const { h, s, l } = hsl;
  let score = 0;

  // 색상 범위 (40점)
  if (inHueRange(h, type.hueRange)) score += 40;
  else {
    // 가장 가까운 범위까지 거리 계산 → 부분 점수
    let minDist = Infinity;
    for (const [mn, mx] of type.hueRange) {
      const d = h < mn ? mn - h : h > mx ? h - mx : 0;
      if (d < minDist) minDist = d;
    }
    score += Math.max(0, 40 - minDist * 0.6);
  }

  // 채도 (30점)
  if (s >= type.satMin && s <= type.satMax) score += 30;
  else {
    const d = s < type.satMin ? type.satMin - s : s - type.satMax;
    score += Math.max(0, 30 - d * 0.8);
  }

  // 명도 (30점)
  if (l >= type.ligMin && l <= type.ligMax) score += 30;
  else {
    const d = l < type.ligMin ? type.ligMin - l : l - type.ligMax;
    score += Math.max(0, 30 - d * 0.8);
  }

  return Math.round(score);
}

function analyzeAll(hsl) {
  const results = [];
  for (const season of SEASONS) {
    for (const type of season.types) {
      results.push({
        season: season.season,
        icon  : season.icon,
        tone  : season.tone,
        type,
        score : scoreType(hsl, type),
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}


/* ──────────────────────────────────────
   4. 점수 → 등급 / 뱃지
────────────────────────────────────── */
function gradeOf(score) {
  if (score >= 85) return { cls: 'best',  label: '최고 어울림' };
  if (score >= 65) return { cls: 'good',  label: '잘 어울림'  };
  if (score >= 40) return { cls: 'ok',    label: '보통'       };
  return                  { cls: 'no',    label: '안 어울림'  };
}

function rankScoreCls(score, idx) {
  if (idx === 0) return 'best';
  if (idx === 1) return 'good';
  return 'ok';
}


/* ──────────────────────────────────────
   5. PCCS 그리드 렌더링 (입력 영역)
────────────────────────────────────── */
function renderPccsGrid(activeTone) {
  const grid = document.getElementById('pccsGrid');
  grid.innerHTML = PCCS_TONES.map(t => `
    <div class="pccs-cell ${activeTone && activeTone.key === t.key ? 'active' : ''}"
         style="background:${t.color}">
      <div class="tone-key">${t.key.toUpperCase()}</div>
      <div class="tone-label">${t.label}</div>
    </div>
  `).join('');
}


/* ──────────────────────────────────────
   6. PCCS 맵 렌더링 (결과 영역)
────────────────────────────────────── */
function renderPccsMap(hsl, activeTone) {
  const wrap = document.getElementById('pccsMap');
  wrap.innerHTML = `<div class="pccs-map-inner" id="pccsMapInner"></div>`;
  const inner = document.getElementById('pccsMapInner');

  // 축 선 + 라벨
  inner.innerHTML = `
    <div class="axis-v"></div>
    <div class="axis-h"></div>
    <div class="axis-label" style="top:2%;left:50%;transform:translateX(-50%)">고명도</div>
    <div class="axis-label" style="bottom:2%;left:50%;transform:translateX(-50%)">저명도</div>
    <div class="axis-label" style="top:50%;left:1%;transform:translateY(-50%)">저채도</div>
    <div class="axis-label" style="top:50%;right:1%;transform:translateY(-50%)">고채도</div>
  `;

  // 톤 점
  for (const t of PCCS_TONES) {
    const dot = document.createElement('div');
    dot.className = 'tone-dot' + (activeTone && activeTone.key === t.key ? ' highlight' : '');
    dot.style.cssText = `left:${t.pos.x}%;top:${t.pos.y}%;background:${t.color}`;
    dot.textContent = t.key.toUpperCase();
    dot.title = t.label;
    inner.appendChild(dot);
  }

  // 입력 색상 점
  const ix = Math.min(95, Math.max(5, hsl.s));
  const iy = Math.min(95, Math.max(5, 100 - hsl.l));
  const inputDot = document.createElement('div');
  inputDot.className = 'input-dot';
  inputDot.style.cssText = `left:${ix}%;top:${iy}%;background:${currentHex}`;
  inputDot.title = '입력 색상';
  inner.appendChild(inputDot);

  // 설명
  document.getElementById('pccsMapDesc').textContent =
    activeTone
      ? `입력 색상은 PCCS "${activeTone.label}(${activeTone.key.toUpperCase()})" 톤 영역에 가장 가깝습니다.`
      : '';
}


/* ──────────────────────────────────────
   7. 베스트 / 워스트 카드
────────────────────────────────────── */
function renderRank(results) {
  const medals = ['🥇','🥈','🥉'];

  // 베스트 3
  document.getElementById('bestList').innerHTML = results.slice(0, 3).map((r, i) => `
    <li class="rank-item">
      <span class="rank-medal">${medals[i]}</span>
      <div class="rank-info">
        <div class="rank-name">${r.icon} ${r.type.name}</div>
        <div class="rank-sub">${r.season} · ${r.type.keyword}</div>
      </div>
      <span class="rank-score ${rankScoreCls(r.score, i)}">${r.score}점</span>
    </li>
  `).join('');

  // 워스트 3
  document.getElementById('worstList').innerHTML = results.slice(-3).reverse().map((r, i) => `
    <li class="rank-item worst">
      <span class="rank-medal">💔</span>
      <div class="rank-info">
        <div class="rank-name">${r.icon} ${r.type.name}</div>
        <div class="rank-sub">${r.season} · ${r.type.keyword}</div>
      </div>
      <span class="rank-score worst-score">${r.score}점</span>
    </li>
  `).join('');
}


/* ──────────────────────────────────────
   8. 스타일 추천 탭
────────────────────────────────────── */
function renderStyleRec(best) {
  const t = best.type;
  document.getElementById('styleRecSub').textContent =
    `${best.icon} ${best.type.name} 기준 추천 (점수: ${best.score}점)`;

  const dotRow = colors => colors.map(c =>
    `<div class="si-dot" style="background:${c}" title="${c}"></div>`
  ).join('');

  // 헤어
  document.getElementById('tab-hair').innerHTML = `
    <div class="style-grid">
      <div class="style-item full">
        <div class="si-label">추천 헤어 컬러</div>
        <div class="si-val">${t.hairTip}</div>
        <div class="si-colors">${dotRow(t.hair)}</div>
      </div>
      <div class="style-item full">
        <div class="si-label">⚠️ 피해야 할 헤어</div>
        <div class="si-tip">${t.avoidHair}</div>
      </div>
    </div>`;

  // 메이크업
  document.getElementById('tab-makeup').innerHTML = `
    <div class="style-grid">
      <div class="style-item full">
        <div class="si-label">추천 메이크업</div>
        <div class="si-val">${t.makeupTip}</div>
        <div class="si-colors">${dotRow(t.makeup)}</div>
      </div>
      <div class="style-item full">
        <div class="si-label">⚠️ 피해야 할 메이크업</div>
        <div class="si-tip">${t.avoidMakeup}</div>
      </div>
    </div>`;

  // 의상
  document.getElementById('tab-outfit').innerHTML = `
    <div class="style-grid">
      <div class="style-item full">
        <div class="si-label">추천 의상 컬러</div>
        <div class="si-val">${t.outfitTip}</div>
        <div class="si-colors">${dotRow(t.outfit)}</div>
      </div>
      <div class="style-item full">
        <div class="si-label">⚠️ 피해야 할 의상</div>
        <div class="si-tip">${t.avoidOutfit}</div>
      </div>
    </div>`;
}


/* ──────────────────────────────────────
   9. 시즌별 상세 테이블
────────────────────────────────────── */
function renderSeasonSections(results) {
  const wrap = document.getElementById('seasonSections');
  const bySeasonMap = {};
  for (const r of results) {
    if (!bySeasonMap[r.season]) bySeasonMap[r.season] = { icon: r.icon, tone: r.tone, rows: [] };
    bySeasonMap[r.season].rows.push(r);
  }

  wrap.innerHTML = Object.entries(bySeasonMap).map(([season, { icon, tone, rows }]) => {
    const toneClass = tone === '웜' ? 'warm' : 'cool';
    const tableRows = rows.map(r => {
      const { cls, label } = gradeOf(r.score);
      const pccsTags = r.type.pccs.map(k => {
        const matched = matchPccsTone(rgbToHsl(hexToRgb(currentHex)));
        const isMatch = matched && matched.key === k;
        return `<span class="pccs-tag ${isMatch ? 'match' : ''}">${k.toUpperCase()}</span>`;
      }).join('');

      const swatches = r.type.colors.slice(0, 6).map(c =>
        `<div class="swatch" style="background:${c}" title="${c}"></div>`
      ).join('');

      const hsl = rgbToHsl(hexToRgb(currentHex));
      const hPct = (hsl.h / 360 * 100).toFixed(0);
      const sPct = hsl.s;
      const lPct = hsl.l;

      return `
        <tr>
          <td>
            <div class="type-name">${r.type.name}</div>
            <div class="type-key">${r.type.keyword}</div>
          </td>
          <td>
            <div>${hsl.h}°</div>
            <div class="bar-wrap"><div class="bar-fill bar-h" style="width:${hPct}%"></div></div>
            <div class="bar-meta">H</div>
          </td>
          <td>
            <div>${sPct}%</div>
            <div class="bar-wrap"><div class="bar-fill bar-s" style="width:${sPct}%"></div></div>
            <div class="bar-meta">S</div>
          </td>
          <td>
            <div>${lPct}%</div>
            <div class="bar-wrap"><div class="bar-fill bar-l" style="width:${lPct}%"></div></div>
            <div class="bar-meta">L</div>
          </td>
          <td><div class="pccs-tags">${pccsTags}</div></td>
          <td><div class="swatch-row">${swatches}</div></td>
          <td>
            <span class="match-badge ${cls}">${label}</span>
          </td>
          <td><span class="score ${cls}">${r.score}</span></td>
        </tr>`;
    }).join('');

    return `
      <div class="season-section">
        <div class="season-header" onclick="toggleTable('tbl-${season}', this)">
          <span class="season-icon">${icon}</span>
          <span class="season-name">${season}</span>
          <span class="tone-badge ${toneClass}">${tone}톤</span>
          <button class="toggle-btn">▼ 펼치기</button>
        </div>
        <div class="season-table-wrap" id="tbl-${season}" style="display:none">
          <table>
            <thead>
              <tr>
                <th>유형</th><th>색상(H)</th><th>채도(S)</th>
                <th>명도(L)</th><th>PCCS</th><th>대표색</th>
                <th>어울림</th><th>점수</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}

function toggleTable(id, header) {
  const el  = document.getElementById(id);
  const btn = header.querySelector('.toggle-btn');
  const open = el.style.display === 'none';
  el.style.display = open ? 'block' : 'none';
  btn.textContent  = open ? '▲ 접기' : '▼ 펼치기';
}


/* ──────────────────────────────────────
   10. 탭 이벤트
────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}


/* ──────────────────────────────────────
   11. 프리뷰 업데이트
────────────────────────────────────── */
function updatePreview(hex, hsl, tone) {
  const strip  = document.getElementById('previewStrip');
  const circle = document.getElementById('previewCircle');
  const hexEl  = document.getElementById('previewHex');
  const pills  = document.getElementById('previewPills');

  strip.hidden = false;
  circle.style.background = hex;
  hexEl.textContent = hex.toUpperCase();
  pills.innerHTML = `
    <span class="pill pill-h">H ${hsl.h}°</span>
    <span class="pill pill-s">S ${hsl.s}%</span>
    <span class="pill pill-l">L ${hsl.l}%</span>
    ${tone ? `<span class="pill pill-pccs">${tone.key.toUpperCase()} · ${tone.label}</span>` : ''}
  `;
  renderPccsGrid(tone);
}


/* ──────────────────────────────────────
   12. 메인 분석 실행
────────────────────────────────────── */
let currentHex = '#FF6B6B';

function runAnalysis() {
  const rgb  = hexToRgb(currentHex);
  const hsl  = rgbToHsl(rgb);
  const tone = matchPccsTone(hsl);

  const results = analyzeAll(hsl);
  const best    = results[0];

  // 결과 영역 표시
  document.getElementById('emptyState').hidden   = true;
  document.getElementById('resultContent').hidden = false;

  renderPccsMap(hsl, tone);
  renderRank(results);
  renderStyleRec(best);
  renderSeasonSections(results);

  // 결과로 스크롤
  document.getElementById('resultContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ──────────────────────────────────────
   13. 입력 동기화 & 초기화
────────────────────────────────────── */
function init() {
  const picker = document.getElementById('colorPicker');
  const hexIn  = document.getElementById('hexInput');

  // 피커 → 텍스트 동기화
  picker.addEventListener('input', () => {
    currentHex = picker.value;
    hexIn.value = currentHex;
    const hsl  = rgbToHsl(hexToRgb(currentHex));
    const tone = matchPccsTone(hsl);
    updatePreview(currentHex, hsl, tone);
  });

  // 텍스트 → 피커 동기화
  hexIn.addEventListener('input', () => {
    const rgb = parseInput(hexIn.value);
    if (!rgb) return;
    currentHex = rgbToHex(rgb);
    picker.value = currentHex;
    const hsl  = rgbToHsl(rgb);
    const tone = matchPccsTone(hsl);
    updatePreview(currentHex, hsl, tone);
  });

  // 분석 버튼
  document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);

  // 탭 초기화
  initTabs();

  // 초기 프리뷰
  const hsl  = rgbToHsl(hexToRgb(currentHex));
  const tone = matchPccsTone(hsl);
  updatePreview(currentHex, hsl, tone);
  renderPccsGrid(tone);
}

document.addEventListener('DOMContentLoaded', init);