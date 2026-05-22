/* ════════════════════════════════════════
   app.js  —  퍼스널 컬러 분석기 (개선판)
   의존: data.js (PCCS_TONES, SEASONS, calcUndertone, inHueRange, scoreTypeImproved)
   변경점:
     - scoreTypeImproved() 사용 (4축 채점)
     - 언더톤 수치 프리뷰에 표시
     - PCCS 맵에 언더톤 방향 표시
     - 결과 카드에 언더톤 뱃지 추가
     - 시즌 테이블에 언더톤 열 추가
════════════════════════════════════════ */


/* ──────────────────────────────────────
   1. 색상 변환 유틸
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
  const m = raw.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
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
   2. PCCS 톤 매칭 (개선: sat+lig+hue 3축)
────────────────────────────────────── */
function matchPccsTone({ h, s, l }) {
  let best = null, bestScore = Infinity;
  for (const tone of PCCS_TONES) {
    const sc = Math.max(0, tone.sat[0] - s, s - tone.sat[1]);
    const lc = Math.max(0, tone.lig[0] - l, l - tone.lig[1]);
    // [개선] hue 축도 반영 (PCCS_TONES에 hue 범위 추가됨)
    let hc = 0;
    if (tone.hue && tone.hue[0] !== 0 && tone.hue[1] !== 360) {
      hc = Math.max(0, tone.hue[0] - h, h - tone.hue[1]) * 0.3;
    }
    const score = sc + lc + hc;
    if (score < bestScore) { bestScore = score; best = tone; }
  }
  return best;
}


/* ──────────────────────────────────────
   3. 전체 분석 실행
   [개선] scoreTypeImproved() 사용 (data.js 에 정의)
────────────────────────────────────── */
function analyzeAll(hsl, rgb) {
  const results = [];
  for (const season of SEASONS) {
    for (const type of season.types) {
      results.push({
        season : season.season,
        icon   : season.icon,
        tone   : season.tone,
        type,
        score  : scoreTypeImproved(hsl, rgb, type),
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}


/* ──────────────────────────────────────
   4. 점수 → 등급
────────────────────────────────────── */
function gradeOf(score) {
  if (score >= 85) return { cls: 'best', label: '최고 어울림' };
  if (score >= 65) return { cls: 'good', label: '잘 어울림'  };
  if (score >= 40) return { cls: 'ok',   label: '보통'       };
  return                  { cls: 'no',   label: '안 어울림'  };
}


/* ──────────────────────────────────────
   5. 언더톤 뱃지 생성 헬퍼
   [신규] 언더톤 수치 → 텍스트 + 색상
────────────────────────────────────── */
function undertoneLabel(ut) {
  if (ut >=  40) return { text: '🔥 웜톤',    color: '#e07b39' };
  if (ut >=  10) return { text: '🌤 약한 웜',  color: '#f0a060' };
  if (ut >=  -9) return { text: '⚖️ 중립',    color: '#888888' };
  if (ut >= -39) return { text: '❄️ 약한 쿨',  color: '#6aaccc' };
  return               { text: '🌊 쿨톤',    color: '#457b9d' };
}


/* ──────────────────────────────────────
   6. PCCS 그리드 렌더링
────────────────────────────────────── */
function renderPccsGrid(activeTone) {
  document.getElementById('pccsGrid').innerHTML = PCCS_TONES.map(t => `
    <div class="pccs-cell ${activeTone && activeTone.key === t.key ? 'active' : ''}"
         style="background:${t.color}">
      <div class="tone-key">${t.key.toUpperCase()}</div>
      <div class="tone-label">${t.label}</div>
    </div>`).join('');
}


/* ──────────────────────────────────────
   7. PCCS 맵 렌더링
   [개선] 언더톤 방향 화살표 추가
────────────────────────────────────── */
function renderPccsMap(hsl, rgb, activeTone) {
  const wrap = document.getElementById('pccsMap');
  wrap.innerHTML = `<div class="pccs-map-inner" id="pccsMapInner"></div>`;
  const inner = document.getElementById('pccsMapInner');

  inner.innerHTML = `
    <div class="axis-v"></div>
    <div class="axis-h"></div>
    <div class="axis-label" style="top:2%;left:50%;transform:translateX(-50%)">고명도</div>
    <div class="axis-label" style="bottom:2%;left:50%;transform:translateX(-50%)">저명도</div>
    <div class="axis-label" style="top:50%;left:1%;transform:translateY(-50%)">저채도</div>
    <div class="axis-label" style="top:50%;right:1%;transform:translateY(-50%)">고채도</div>`;

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

  // [개선] 언더톤 방향 레이블
  const ut = calcUndertone(hsl.h, hsl.s, hsl.l, rgb.r, rgb.g, rgb.b);
  const utInfo = undertoneLabel(ut);
  const utEl = document.createElement('div');
  utEl.style.cssText = `
    position:absolute; bottom:6px; right:8px;
    font-size:.65rem; font-weight:800;
    background:${utInfo.color}22; color:${utInfo.color};
    border:1px solid ${utInfo.color}66;
    padding:3px 8px; border-radius:10px;`;
  utEl.textContent = `${utInfo.text} (${ut > 0 ? '+' : ''}${ut})`;
  inner.appendChild(utEl);

  // 설명
  document.getElementById('pccsMapDesc').textContent =
    activeTone
      ? `입력 색상은 PCCS "${activeTone.label}(${activeTone.key.toUpperCase()})" 톤 영역에 가장 가깝습니다.`
      : '';
}


/* ──────────────────────────────────────
   8. 베스트 / 워스트 카드
   [개선] 언더톤 뱃지 추가
────────────────────────────────────── */
function renderRank(results, ut) {
  const medals = ['🥇', '🥈', '🥉'];
  const scoreCls = (_, i) => i === 0 ? 'best' : i === 1 ? 'good' : 'ok';

  document.getElementById('bestList').innerHTML = results.slice(0, 3).map((r, i) => {
    const utMatch = ut >= r.type.undertoneRange[0] && ut <= r.type.undertoneRange[1];
    return `
      <li class="rank-item">
        <span class="rank-medal">${medals[i]}</span>
        <div class="rank-info">
          <div class="rank-name">${r.icon} ${r.type.name}</div>
          <div class="rank-sub">${r.season} · ${r.type.keyword}</div>
          <div class="rank-meta">
            ${utMatch
              ? `<span class="ut-badge match">✅ 언더톤 일치</span>`
              : `<span class="ut-badge nomatch">⚠️ 언더톤 불일치</span>`}
            <span class="ut-badge tol">허용오차 ±${r.type.tolerance}</span>
          </div>
        </div>
        <span class="rank-score ${scoreCls(r.score, i)}">${r.score}점</span>
      </li>`;
  }).join('');

  document.getElementById('worstList').innerHTML = results.slice(-3).reverse().map(r => `
    <li class="rank-item worst">
      <span class="rank-medal">💔</span>
      <div class="rank-info">
        <div class="rank-name">${r.icon} ${r.type.name}</div>
        <div class="rank-sub">${r.season} · ${r.type.keyword}</div>
      </div>
      <span class="rank-score worst-score">${r.score}점</span>
    </li>`).join('');
}


/* ──────────────────────────────────────
   9. 스타일 추천 탭
────────────────────────────────────── */
function renderStyleRec(best) {
  const t = best.type;
  document.getElementById('styleRecSub').textContent =
    `${best.icon} ${t.name} 기준 추천 (점수: ${best.score}점)`;

  const dotRow = colors => colors.map(c =>
    `<div class="si-dot" style="background:${c}" title="${c}"></div>`
  ).join('');

  ['hair', 'makeup', 'outfit'].forEach(tab => {
    const tip   = tab === 'hair' ? t.hairTip   : tab === 'makeup' ? t.makeupTip   : t.outfitTip;
    const avoid = tab === 'hair' ? t.avoidHair : tab === 'makeup' ? t.avoidMakeup : t.avoidOutfit;
    const cols  = t[tab];
    const label = tab === 'hair' ? '추천 헤어 컬러' : tab === 'makeup' ? '추천 메이크업' : '추천 의상 컬러';
    const avoidLabel = tab === 'hair' ? '헤어' : tab === 'makeup' ? '메이크업' : '의상';
    document.getElementById('tab-' + tab).innerHTML = `
      <div class="style-grid">
        <div class="style-item full">
          <div class="si-label">${label}</div>
          <div class="si-val">${tip}</div>
          <div class="si-colors">${dotRow(cols)}</div>
        </div>
        <div class="style-item full">
          <div class="si-label">⚠️ 피해야 할 ${avoidLabel}</div>
          <div class="si-tip">${avoid}</div>
        </div>
      </div>`;
  });
}


/* ──────────────────────────────────────
   10. 시즌별 상세 테이블
   [개선] 언더톤 열 + 가중치 열 추가
────────────────────────────────────── */
function renderSeasonSections(results, hsl, rgb) {
  const wrap = document.getElementById('seasonSections');
  const ut   = calcUndertone(hsl.h, hsl.s, hsl.l, rgb.r, rgb.g, rgb.b);
  const matched = matchPccsTone(hsl);

  // 시즌별 그룹핑
  const map = {};
  for (const r of results) {
    if (!map[r.season]) map[r.season] = { icon: r.icon, tone: r.tone, rows: [] };
    map[r.season].rows.push(r);
  }

  wrap.innerHTML = Object.entries(map).map(([season, { icon, tone, rows }]) => {
    const tc = tone === '웜' ? 'warm' : 'cool';

    const tableRows = rows.map(r => {
      const { cls, label } = gradeOf(r.score);

      // PCCS 태그
      const pccsTags = r.type.pccs.map(k =>
        `<span class="pccs-tag ${matched && matched.key === k ? 'match' : ''}">${k.toUpperCase()}</span>`
      ).join('');

      // 스와치
      const swatches = r.type.colors.slice(0, 6).map(c =>
        `<div class="swatch" style="background:${c}" title="${c}"></div>`
      ).join('');

      // [개선] 언더톤 범위 일치 여부
      const utInRange = ut >= r.type.undertoneRange[0] && ut <= r.type.undertoneRange[1];
      const utCls     = utInRange ? 'ut-ok' : 'ut-ng';
      const utText    = utInRange ? '✅ 일치' : '❌ 불일치';

      // [개선] 가중치 표시
      const W = r.type.weights;
      const weightStr = `H${W.hue}/S${W.sat}/L${W.lig}/U${W.undertone}`;

      return `
        <tr>
          <td>
            <div class="type-name">${r.type.name}</div>
            <div class="type-key">${r.type.keyword}</div>
          </td>
          <td>
            <div>${hsl.h}°</div>
            <div class="bar-wrap"><div class="bar-fill bar-h" style="width:${(hsl.h/360*100).toFixed(0)}%"></div></div>
            <div class="bar-meta">H</div>
          </td>
          <td>
            <div>${hsl.s}%</div>
            <div class="bar-wrap"><div class="bar-fill bar-s" style="width:${hsl.s}%"></div></div>
            <div class="bar-meta">S</div>
          </td>
          <td>
            <div>${hsl.l}%</div>
            <div class="bar-wrap"><div class="bar-fill bar-l" style="width:${hsl.l}%"></div></div>
            <div class="bar-meta">L</div>
          </td>
          <td>
            <div class="${utCls}" style="font-size:.72rem;font-weight:700">${utText}</div>
            <div style="font-size:.65rem;color:#aaa;margin-top:2px">범위: ${r.type.undertoneRange[0]}~${r.type.undertoneRange[1]}</div>
          </td>
          <td><div class="pccs-tags">${pccsTags}</div></td>
          <td><div class="swatch-row">${swatches}</div></td>
          <td>
            <div class="match-badge ${cls}">${label}</div>
            <div style="font-size:.6rem;color:#aaa;margin-top:3px">${weightStr}</div>
          </td>
          <td><span class="score ${cls}">${r.score}</span></td>
        </tr>`;
    }).join('');

    return `
      <div class="season-section">
        <div class="season-header" onclick="toggleTable('tbl-${season.replace(/\s/g,'_')}', this)">
          <span class="season-icon">${icon}</span>
          <span class="season-name">${season}</span>
          <span class="tone-badge ${tc}">${tone}톤</span>
          <button class="toggle-btn">▼ 펼치기</button>
        </div>
        <div class="season-table-wrap" id="tbl-${season.replace(/\s/g,'_')}" style="display:none">
          <table>
            <thead>
              <tr>
                <th>유형</th><th>색상(H)</th><th>채도(S)</th><th>명도(L)</th>
                <th>언더톤</th><th>PCCS</th><th>대표색</th><th>어울림</th><th>점수</th>
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
   11. 탭 이벤트
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
   12. 프리뷰 업데이트
   [개선] 언더톤 수치 + 레이블 표시
────────────────────────────────────── */
function updatePreview(hex, hsl, rgb, tone) {
  const strip = document.getElementById('previewStrip');
  strip.hidden = false;
  document.getElementById('previewCircle').style.background = hex;
  document.getElementById('previewHex').textContent = hex.toUpperCase();

  const ut     = calcUndertone(hsl.h, hsl.s, hsl.l, rgb.r, rgb.g, rgb.b);
  const utInfo = undertoneLabel(ut);

  document.getElementById('previewPills').innerHTML = `
    <span class="pill pill-h">H ${hsl.h}°</span>
    <span class="pill pill-s">S ${hsl.s}%</span>
    <span class="pill pill-l">L ${hsl.l}%</span>
    ${tone ? `<span class="pill pill-pccs">${tone.key.toUpperCase()} · ${tone.label}</span>` : ''}
    <span class="pill" style="background:${utInfo.color}">${utInfo.text} ${ut > 0 ? '+' : ''}${ut}</span>`;

  renderPccsGrid(tone);
}


/* ──────────────────────────────────────
   13. 메인 분석 실행
────────────────────────────────────── */
let currentHex = '#FF6B6B';

function runAnalysis() {
  const rgb  = hexToRgb(currentHex);
  const hsl  = rgbToHsl(rgb);
  const tone = matchPccsTone(hsl);
  const ut   = calcUndertone(hsl.h, hsl.s, hsl.l, rgb.r, rgb.g, rgb.b);

  // [개선] rgb도 함께 전달
  const results = analyzeAll(hsl, rgb);
  const best    = results[0];

  document.getElementById('emptyState').hidden    = true;
  document.getElementById('resultContent').hidden = false;

  renderPccsMap(hsl, rgb, tone);
  renderRank(results, ut);
  renderStyleRec(best);
  renderSeasonSections(results, hsl, rgb);

  document.getElementById('resultContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ──────────────────────────────────────
   14. 입력 동기화 & 초기화
────────────────────────────────────── */
function init() {
  const picker = document.getElementById('colorPicker');
  const hexIn  = document.getElementById('hexInput');

  picker.addEventListener('input', () => {
    currentHex = picker.value;
    hexIn.value = currentHex;
    const rgb  = hexToRgb(currentHex);
    const hsl  = rgbToHsl(rgb);
    updatePreview(currentHex, hsl, rgb, matchPccsTone(hsl));
  });

  hexIn.addEventListener('input', () => {
    const rgb = parseInput(hexIn.value);
    if (!rgb) return;
    currentHex = rgbToHex(rgb);
    picker.value = currentHex;
    const hsl = rgbToHsl(rgb);
    updatePreview(currentHex, hsl, rgb, matchPccsTone(hsl));
  });

  document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);
  initTabs();

  // 초기 프리뷰
  const rgb  = hexToRgb(currentHex);
  const hsl  = rgbToHsl(rgb);
  updatePreview(currentHex, hsl, rgb, matchPccsTone(hsl));
}

document.addEventListener('DOMContentLoaded', init);
