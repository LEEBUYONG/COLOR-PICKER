/* ════════════════════════════════════════
   data_improved.js  —  개선된 데이터 구조
   개선 포인트:
     1. PCCS 톤에 hue 범위 추가
     2. 각 타입에 undertone 수치 + 가중치 추가
     3. 색상에 warmScore 메타데이터 추가
     4. 시즌별 진단 우선순위(weights) 분리
     5. 경계 색상(borderline) 처리용 tolerance 추가
════════════════════════════════════════ */


/* ──────────────────────────────────────
   [개선 1] PCCS_TONES — hue 범위 추가
   기존: sat/lig 범위만 존재
   개선: hue 범위(PCCS 24색상환 기반) 추가
         warmBias: 양수=웜, 음수=쿨 (-1 ~ +1)
────────────────────────────────────── */
const PCCS_TONES = [
  {
    key: 'p',   label: '페일',
    hue: [0, 360],          // 페일은 모든 색상 포함 (무채색에 가까움)
    sat: [5,  25],  lig: [75, 92],
    warmBias: 0,            // 중립
    color: '#f4c2c2', pos: { x: 14, y: 12 }
  },
  {
    key: 'lt',  label: '라이트',
    hue: [0, 360],
    sat: [28, 60],  lig: [65, 85],
    warmBias: 0,
    color: '#87ceeb', pos: { x: 36, y: 18 }
  },
  {
    key: 'b',   label: '브라이트',
    hue: [0, 360],
    sat: [68, 100], lig: [44, 70],
    warmBias: 0,
    color: '#ff6b6b', pos: { x: 76, y: 34 }
  },
  {
    key: 'sf',  label: '소프트',
    hue: [0, 360],
    sat: [18, 50],  lig: [53, 72],
    warmBias: 0,
    color: '#98d8c8', pos: { x: 28, y: 30 }
  },
  {
    key: 's',   label: '스트롱',
    hue: [0, 360],
    sat: [63, 95],  lig: [33, 55],
    warmBias: 0,
    color: '#e07b39', pos: { x: 74, y: 52 }
  },
  {
    key: 'v',   label: '비비드',
    hue: [0, 360],
    sat: [83, 100], lig: [38, 65],
    warmBias: 0,
    color: '#ff1493', pos: { x: 88, y: 42 }
  },
  {
    key: 'ltg', label: '라이트그레이시',
    hue: [0, 360],
    sat: [4,  22],  lig: [60, 80],
    warmBias: 0,
    color: '#c8c8d8', pos: { x: 12, y: 30 }
  },
  {
    key: 'g',   label: '그레이시',
    hue: [0, 360],
    sat: [7,  28],  lig: [43, 65],
    warmBias: 0,
    color: '#9b9bab', pos: { x: 14, y: 50 }
  },
  {
    key: 'd',   label: '덜',
    hue: [0, 360],
    sat: [16, 45],  lig: [36, 58],
    warmBias: 0,
    color: '#8b7355', pos: { x: 30, y: 54 }
  },
  {
    key: 'dp',  label: '딥',
    hue: [0, 360],
    sat: [53, 90],  lig: [18, 42],
    warmBias: 0,
    color: '#8b1a1a', pos: { x: 68, y: 72 }
  },
  {
    key: 'dkg', label: '다크그레이시',
    hue: [0, 360],
    sat: [4,  20],  lig: [23, 45],
    warmBias: 0,
    color: '#555566', pos: { x: 12, y: 70 }
  },
  {
    key: 'dk',  label: '다크',
    hue: [0, 360],
    sat: [28, 70],  lig: [13, 35],
    warmBias: 0,
    color: '#2d4a22', pos: { x: 42, y: 80 }
  },
];


/* ──────────────────────────────────────
   [개선 2] 언더톤 판별 유틸
   RGB → 웜/쿨 수치 계산
   warmScore: +100(완전 웜) ~ -100(완전 쿨)
   원리: 웜 = R·Y 성분 강함, 쿨 = B 성분 강함
         + Hue 기반 보정 (오렌지/옐로우=웜, 블루/퍼플=쿨)
────────────────────────────────────── */
function calcUndertone(h, s, l, r, g, b) {
  // 1) RGB 기반 웜/쿨 원시 점수
  const rgbWarm = (r - b) / 255 * 50;          // R>B 이면 웜

  // 2) Hue 기반 보정
  //    0~60(레드~옐로우), 300~360(마젠타~레드) → 웜
  //    180~270(시안~블루) → 쿨
  let hueBonus = 0;
  if      (h >= 0   && h <= 60 ) hueBonus =  (1 - h / 60)  * 30 + 20;  // 레드~옐로우: 강한 웜
  else if (h > 60   && h <= 90 ) hueBonus =  (90 - h) / 30 * 20;        // 옐로우~옐로우그린: 약한 웜
  else if (h > 90   && h <= 150) hueBonus =  0;                          // 그린: 중립
  else if (h > 150  && h <= 210) hueBonus = -(h - 150) / 60 * 25;       // 그린~시안: 약한 쿨
  else if (h > 210  && h <= 270) hueBonus = -25 - (h - 210) / 60 * 25;  // 시안~블루: 강한 쿨
  else if (h > 270  && h <= 300) hueBonus = -(300 - h) / 30 * 20;       // 블루~마젠타: 약한 쿨
  else if (h > 300  && h <= 360) hueBonus =  (h - 300) / 60 * 30;       // 마젠타~레드: 웜

  // 3) 채도 가중 (채도 낮으면 언더톤 판별 신뢰도 낮음)
  const satWeight = s / 100;

  const raw = rgbWarm + hueBonus * satWeight;
  return Math.max(-100, Math.min(100, Math.round(raw)));
}


/* ──────────────────────────────────────
   [개선 3] SEASONS — 개선된 데이터 구조

   추가 필드 설명
   ──────────────
   undertoneRange : [min, max]  어울리는 언더톤 범위
                    양수=웜, 음수=쿨
   weights        : { hue, sat, lig, undertone }
                    각 축의 점수 가중치 (합=100)
   tolerance      : 경계 색상 허용 오차 (0~20)
                    높을수록 경계선 색상도 어울림으로 판정
   contrastLevel  : 'high'|'medium'|'low'
                    어울리는 명도 대비 수준
   chromaLevel    : 'vivid'|'muted'|'neutral'
                    어울리는 채도 수준
────────────────────────────────────── */
const SEASONS = [

  /* ════ 🌸 봄 웜톤 ════ */
  {
    season: '봄 웜톤', icon: '🌸', tone: '웜',
    types: [

      /* ── 봄 브라이트 ── */
      {
        name: '봄 브라이트', keyword: '선명하고 밝은 웜톤',

        // [개선] 기존 범위 유지 + undertoneRange 추가
        hueRange      : [[0, 80], [330, 360]],
        satMin: 65, satMax: 100,
        ligMin: 42, ligMax: 72,
        undertoneRange: [20, 100],   // 확실한 웜톤만 어울림

        // [개선] 시즌별 가중치 분리
        // 봄 브라이트: 색상(Hue)과 언더톤이 가장 중요
        weights: { hue: 35, sat: 20, lig: 20, undertone: 25 },

        // [개선] 경계 허용 오차 (봄 브라이트는 엄격)
        tolerance: 5,

        // [개선] 채도/대비 레벨 메타
        contrastLevel: 'medium',
        chromaLevel  : 'vivid',

        pccs   : ['b', 'lt', 'v', 'sf'],
        colors : ['#FF6B6B','#FF8C42','#FFD166','#F72585','#FFBE0B','#FB5607','#FF4D6D','#FF6392'],
        hair   : ['#C8763A','#D4954A','#E8A855','#F5C060'],
        makeup : ['#FF6B6B','#FF8C42','#FFD166','#F72585','#FF4D6D'],
        outfit : ['#FF6B6B','#FFD166','#FF8C42','#FFBE0B','#FB5607','#FF6392'],
        hairTip    : '밝은 오렌지 브라운 · 골든 브라운 · 허니 블론드',
        makeupTip  : '코랄 립 · 오렌지 블러셔 · 골드 아이섀도우',
        outfitTip  : '코랄 · 오렌지 · 선명한 옐로우 · 밝은 핑크',
        avoidHair  : '쿨 애쉬 · 블루 블랙 · 회색빛 염색',
        avoidMakeup: '쿨 핑크 · 라벤더 · 블루 계열',
        avoidOutfit: '쿨 그레이 · 블루 계열 · 차가운 화이트',
      },

      /* ── 봄 트루 ── */
      {
        name: '봄 트루', keyword: '자연스럽고 따뜻한 웜톤',
        hueRange      : [[10, 90]],
        satMin: 45, satMax: 90,
        ligMin: 35, ligMax: 68,
        undertoneRange: [10, 100],   // 웜톤

        weights  : { hue: 30, sat: 25, lig: 20, undertone: 25 },
        tolerance: 8,
        contrastLevel: 'medium',
        chromaLevel  : 'vivid',

        pccs   : ['b', 's', 'lt', 'v'],
        colors : ['#FF9F1C','#FFBF69','#E76F51','#F4A261','#80B918','#2EC4B6','#E71D36','#FFB347'],
        hair   : ['#8B4513','#A0522D','#CD853F','#D2691E'],
        makeup : ['#FF9F1C','#E76F51','#F4A261','#FF7F50','#E71D36'],
        outfit : ['#FF9F1C','#FFBF69','#E76F51','#80B918','#2EC4B6','#E71D36'],
        hairTip    : '따뜻한 브라운 · 오렌지 브라운 · 캐러멜',
        makeupTip  : '오렌지 립 · 피치 블러셔 · 브론즈 아이',
        outfitTip  : '오렌지 · 피치 · 옐로우그린 · 따뜻한 레드',
        avoidHair  : '쿨 애쉬 · 플래티넘 · 차가운 블론드',
        avoidMakeup: '쿨 로즈 · 퍼플 · 실버 계열',
        avoidOutfit: '차가운 화이트 · 아이시 블루 · 라벤더',
      },

      /* ── 봄 라이트 ── */
      {
        name: '봄 라이트', keyword: '밝고 연한 파스텔 웜톤',
        hueRange      : [[0, 80], [330, 360]],
        satMin: 22, satMax: 65,
        ligMin: 68, ligMax: 95,
        undertoneRange: [5, 100],    // 약한 웜도 OK

        weights  : { hue: 25, sat: 25, lig: 30, undertone: 20 },
        tolerance: 12,               // 파스텔은 경계가 넓음
        contrastLevel: 'low',
        chromaLevel  : 'muted',

        pccs   : ['p', 'lt', 'sf', 'ltg'],
        colors : ['#FFD6E0','#FFEFB5','#FFC8DD','#FFAFCC','#FFDDD2','#FFE4E1','#FFEAA7','#FFCBA4'],
        hair   : ['#E8C49A','#F0D0A0','#F5DEB3','#FAEBD7'],
        makeup : ['#FFD6E0','#FFC8DD','#FFAFCC','#FFB347','#FFDDD2'],
        outfit : ['#FFD6E0','#FFEFB5','#FFC8DD','#FFDDD2','#FFE4E1','#FFEAA7'],
        hairTip    : '밝은 베이지 브라운 · 애쉬 골드 · 밀크티 브라운',
        makeupTip  : '연한 피치 립 · 핑크 블러셔 · 샴페인 아이',
        outfitTip  : '파스텔 핑크 · 연한 옐로우 · 아이보리 · 피치',
        avoidHair  : '다크 블랙 · 강한 레드 · 쿨 애쉬',
        avoidMakeup: '다크 브라운 · 강한 스모키 · 쿨 퍼플',
        avoidOutfit: '블랙 · 다크 네이비 · 강렬한 원색',
      },
    ],
  },

  /* ════ 🌊 여름 쿨톤 ════ */
  {
    season: '여름 쿨톤', icon: '🌊', tone: '쿨',
    types: [

      /* ── 여름 라이트 ── */
      {
        name: '여름 라이트', keyword: '밝고 연한 쿨톤 파스텔',
        hueRange      : [[160, 320]],
        satMin: 18, satMax: 62,
        ligMin: 63, ligMax: 92,
        undertoneRange: [-100, -5],  // 쿨톤

        weights  : { hue: 25, sat: 20, lig: 30, undertone: 25 },
        tolerance: 12,
        contrastLevel: 'low',
        chromaLevel  : 'muted',

        pccs   : ['p', 'lt', 'sf', 'ltg'],
        colors : ['#B5EAD7','#C7CEEA','#FFB7B2','#FF9AA2','#A8DADC','#9DC3C1','#BDE0FE','#C9B1D9'],
        hair   : ['#A89080','#B8A090','#C8B0A0','#D4C0B0'],
        makeup : ['#B5EAD7','#C7CEEA','#FFB7B2','#FF9AA2','#BDE0FE'],
        outfit : ['#B5EAD7','#C7CEEA','#FFB7B2','#A8DADC','#BDE0FE','#C9B1D9'],
        hairTip    : '애쉬 브라운 · 쿨 베이지 · 로즈 브라운',
        makeupTip  : '라벤더 아이 · 로즈 립 · 쿨 핑크 블러셔',
        outfitTip  : '파스텔 블루 · 라벤더 · 민트 · 연한 핑크',
        avoidHair  : '오렌지 브라운 · 골든 · 구리빛 염색',
        avoidMakeup: '오렌지 · 코랄 · 브론즈 계열',
        avoidOutfit: '오렌지 · 카멜 · 머스타드 · 따뜻한 베이지',
      },

      /* ── 여름 트루 ── */
      {
        name: '여름 트루', keyword: '차분하고 선명한 쿨톤',
        hueRange      : [[150, 280]],
        satMin: 28, satMax: 70,
        ligMin: 30, ligMax: 65,
        undertoneRange: [-100, -10],

        weights  : { hue: 30, sat: 25, lig: 20, undertone: 25 },
        tolerance: 8,
        contrastLevel: 'medium',
        chromaLevel  : 'neutral',

        pccs   : ['sf', 'lt', 'd', 'g'],
        colors : ['#6B9080','#A4C3B2','#84A98C','#52796F','#457B9D','#6D6875','#B4838D','#9B8EA5'],
        hair   : ['#5C4033','#6B4C3B','#7B5C4B','#8B6C5B'],
        makeup : ['#6B9080','#457B9D','#6D6875','#B4838D','#84A98C'],
        outfit : ['#6B9080','#A4C3B2','#52796F','#457B9D','#6D6875','#B4838D'],
        hairTip    : '쿨 다크 브라운 · 애쉬 다크 · 블루 블랙',
        makeupTip  : '모브 립 · 스모키 블루 아이 · 쿨 로즈 블러셔',
        outfitTip  : '스틸 블루 · 쿨 그린 · 모브 · 슬레이트',
        avoidHair  : '웜 오렌지 · 골든 브라운 · 구리빛',
        avoidMakeup: '오렌지 립 · 브론즈 아이 · 피치 블러셔',
        avoidOutfit: '오렌지 · 카멜 · 올리브 · 머스타드',
      },

      /* ── 여름 뮤트 ── */
      {
        name: '여름 뮤트', keyword: '부드럽고 흐린 쿨톤',
        hueRange      : [[160, 300]],
        satMin: 8,  satMax: 42,
        ligMin: 36, ligMax: 70,
        undertoneRange: [-100, 5],   // 약한 웜도 경계선 허용

        // [개선] 뮤트는 채도 판별이 가장 중요
        weights  : { hue: 20, sat: 35, lig: 25, undertone: 20 },
        tolerance: 15,               // 뮤트는 경계가 넓음
        contrastLevel: 'low',
        chromaLevel  : 'muted',

        pccs   : ['sf', 'g', 'ltg', 'd'],
        colors : ['#B5B9C4','#9BA8AB','#8D99AE','#9C89B8','#C9ADA7','#A8DADC','#6D6875','#A0A0B0'],
        hair   : ['#7B7B8B','#8B8B9B','#9B9BAB','#ABABBB'],
        makeup : ['#B5B9C4','#9C89B8','#C9ADA7','#8D99AE','#6D6875'],
        outfit : ['#B5B9C4','#9BA8AB','#8D99AE','#9C89B8','#C9ADA7','#A8DADC'],
        hairTip    : '애쉬 그레이 · 쿨 뮤트 브라운 · 스모키 그레이',
        makeupTip  : '뮤트 핑크 립 · 그레이시 블러셔 · 스모키 아이',
        outfitTip  : '그레이 블루 · 뮤트 라벤더 · 스모키 핑크 · 실버',
        avoidHair  : '선명한 오렌지 · 밝은 골드 · 강한 레드',
        avoidMakeup: '비비드 오렌지 · 강한 코랄 · 골드 글리터',
        avoidOutfit: '선명한 원색 · 오렌지 · 밝은 옐로우',
      },
    ],
  },

  /* ════ 🍂 가을 웜톤 ════ */
  {
    season: '가을 웜톤', icon: '🍂', tone: '웜',
    types: [

      /* ── 가을 뮤트 ── */
      {
        name: '가을 뮤트', keyword: '흐리고 차분한 웜톤',
        hueRange      : [[15, 75]],
        satMin: 10, satMax: 50,
        ligMin: 33, ligMax: 65,
        undertoneRange: [0, 100],    // 웜톤

        // [개선] 가을 뮤트: 채도 낮음이 핵심
        weights  : { hue: 25, sat: 35, lig: 20, undertone: 20 },
        tolerance: 15,
        contrastLevel: 'low',
        chromaLevel  : 'muted',

        pccs   : ['d', 'g', 'sf', 'dkg'],
        colors : ['#8B7355','#A0785A','#C4A882','#D4B896','#9B8B7A','#B5A99A','#C8B8A8','#A69080'],
        hair   : ['#5C3D2E','#6B4C3B','#7B5C4B','#8B6C5B'],
        makeup : ['#8B7355','#A0785A','#C4A882','#D4B896','#9B8B7A'],
        outfit : ['#8B7355','#A0785A','#C4A882','#D4B896','#B5A99A','#C8B8A8'],
        hairTip    : '따뜻한 다크 브라운 · 초콜릿 · 카카오 브라운',
        makeupTip  : '테라코타 립 · 브라운 블러셔 · 어스톤 아이',
        outfitTip  : '카멜 · 베이지 · 테라코타 · 머스타드 · 카키',
        avoidHair  : '쿨 애쉬 · 블루 블랙 · 플래티넘',
        avoidMakeup: '쿨 핑크 · 라벤더 · 실버 계열',
        avoidOutfit: '쿨 그레이 · 아이시 블루 · 블랙',
      },

      /* ── 가을 트루 ── */
      {
        name: '가을 트루', keyword: '깊고 따뜻한 어스톤',
        hueRange      : [[10, 75]],
        satMin: 40, satMax: 85,
        ligMin: 22, ligMax: 58,
        undertoneRange: [15, 100],

        weights  : { hue: 30, sat: 25, lig: 20, undertone: 25 },
        tolerance: 8,
        contrastLevel: 'medium',
        chromaLevel  : 'neutral',

        pccs   : ['d', 'dp', 's', 'dk'],
        colors : ['#C84B31','#E07B39','#D4A017','#6B8E23','#8B4513','#A0522D','#CD853F','#D2691E'],
        hair   : ['#3D1C02','#4A2508','#5C3010','#6B3A1A'],
        makeup : ['#C84B31','#E07B39','#D4A017','#8B4513','#A0522D'],
        outfit : ['#C84B31','#E07B39','#D4A017','#6B8E23','#8B4513','#CD853F'],
        hairTip    : '딥 브라운 · 다크 초콜릿 · 버건디 브라운',
        makeupTip  : '벽돌 립 · 브론즈 아이 · 오렌지 브라운 블러셔',
        outfitTip  : '버건디 · 올리브 · 오렌지 브라운 · 머스타드 옐로우',
        avoidHair  : '쿨 애쉬 · 블루 블랙 · 밝은 블론드',
        avoidMakeup: '쿨 핑크 · 라벤더 · 블루 계열',
        avoidOutfit: '아이시 블루 · 쿨 라벤더 · 차가운 화이트',
      },

      /* ── 가을 딥 ── */
      {
        name: '가을 딥', keyword: '깊고 어두운 딥 웜톤',
        hueRange      : [[10, 65]],
        satMin: 22, satMax: 70,
        ligMin: 8,  ligMax: 42,
        undertoneRange: [5, 100],

        // [개선] 가을 딥: 명도(어두움)가 핵심
        weights  : { hue: 25, sat: 20, lig: 35, undertone: 20 },
        tolerance: 8,
        contrastLevel: 'high',
        chromaLevel  : 'neutral',

        pccs   : ['dp', 'dk', 'd', 'dkg'],
        colors : ['#6B2737','#8B1A1A','#4A3728','#2D4A22','#5C2D0E','#3D2B1F','#722F37','#5B3A29'],
        hair   : ['#1A0A00','#2A1000','#3A1800','#4A2000'],
        makeup : ['#6B2737','#8B1A1A','#5C2D0E','#722F37','#4A3728'],
        outfit : ['#6B2737','#8B1A1A','#4A3728','#2D4A22','#5C2D0E','#722F37'],
        hairTip    : '블랙 브라운 · 다크 버건디 · 딥 초콜릿',
        makeupTip  : '다크 버건디 립 · 딥 브론즈 아이 · 테라코타 블러셔',
        outfitTip  : '딥 버건디 · 다크 올리브 · 다크 브라운 · 블랙 브라운',
        avoidHair  : '밝은 블론드 · 파스텔 컬러 · 쿨 애쉬',
        avoidMakeup: '파스텔 핑크 · 라이트 코랄 · 쿨 라벤더',
        avoidOutfit: '파스텔 계열 · 아이시 블루 · 밝은 옐로우',
      },
    ],
  },

  /* ════ ❄️ 겨울 쿨톤 ════ */
  {
    season: '겨울 쿨톤', icon: '❄️', tone: '쿨',
    types: [

      /* ── 겨울 브라이트 ── */
      {
        name: '겨울 브라이트', keyword: '선명하고 강렬한 쿨톤',
        hueRange      : [[160, 360], [0, 20]],
        satMin: 68, satMax: 100,
        ligMin: 36, ligMax: 68,
        undertoneRange: [-100, -20], // 확실한 쿨톤

        weights  : { hue: 35, sat: 20, lig: 20, undertone: 25 },
        tolerance: 5,
        contrastLevel: 'high',
        chromaLevel  : 'vivid',

        pccs   : ['b', 'v', 's', 'lt'],
        colors : ['#FF1493','#00CED1','#9400D3','#FF0000','#1E90FF','#FF69B4','#00BFFF','#8A2BE2'],
        hair   : ['#1A1A2E','#0A0A1E','#2A2A3E','#000000'],
        makeup : ['#FF1493','#00CED1','#FF0000','#1E90FF','#FF69B4'],
        outfit : ['#FF1493','#00CED1','#9400D3','#FF0000','#1E90FF','#FF69B4'],
        hairTip    : '블루 블랙 · 제트 블랙 · 쿨 다크 브라운',
        makeupTip  : '비비드 핑크 립 · 전기 블루 아이 · 쿨 레드 블러셔',
        outfitTip  : '로얄 블루 · 쇼킹 핑크 · 퓨어 화이트 · 블랙',
        avoidHair  : '오렌지 브라운 · 골든 · 구리빛',
        avoidMakeup: '오렌지 · 코랄 · 브론즈 · 골드 계열',
        avoidOutfit: '오렌지 · 카멜 · 머스타드 · 따뜻한 베이지',
      },

      /* ── 겨울 트루 ── */
      {
        name: '겨울 트루', keyword: '깊고 선명한 쿨톤',
        hueRange      : [[160, 310]],
        satMin: 45, satMax: 95,
        ligMin: 13, ligMax: 48,
        undertoneRange: [-100, -15],

        weights  : { hue: 30, sat: 25, lig: 20, undertone: 25 },
        tolerance: 8,
        contrastLevel: 'high',
        chromaLevel  : 'vivid',

        pccs   : ['s', 'v', 'dp', 'b'],
        colors : ['#003366','#006400','#800000','#4B0082','#008080','#191970','#8B0000','#00008B'],
        hair   : ['#0A0A0A','#1A1A1A','#0A0A1E','#000000'],
        makeup : ['#003366','#800000','#4B0082','#008080','#8B0000'],
        outfit : ['#003366','#006400','#800000','#4B0082','#008080','#191970'],
        hairTip    : '제트 블랙 · 블루 블랙 · 쿨 블랙',
        makeupTip  : '딥 버건디 립 · 네이비 아이 · 쿨 로즈 블러셔',
        outfitTip  : '네이비 · 딥 그린 · 버건디 · 딥 퍼플 · 블랙',
        avoidHair  : '오렌지 브라운 · 골든 · 따뜻한 브라운',
        avoidMakeup: '오렌지 · 피치 · 브론즈 · 골드',
        avoidOutfit: '오렌지 · 카멜 · 올리브 · 따뜻한 베이지',
      },

      /* ── 겨울 딥 ── */
      {
        name: '겨울 딥', keyword: '매우 어둡고 깊은 쿨톤',
        hueRange      : [[180, 310]],
        satMin: 20, satMax: 72,
        ligMin: 6,  ligMax: 32,
        undertoneRange: [-100, -5],

        // [개선] 겨울 딥: 명도(어두움)가 핵심
        weights  : { hue: 25, sat: 20, lig: 35, undertone: 20 },
        tolerance: 8,
        contrastLevel: 'high',
        chromaLevel  : 'neutral',

        pccs   : ['dp', 'dk', 'dkg', 's'],
        colors : ['#1a1a2e','#16213e','#0f3460','#533483','#2d132c','#162447','#1f4068','#0a3d62'],
        hair   : ['#000000','#0A0A0A','#050510','#0A0510'],
        makeup : ['#1a1a2e','#533483','#2d132c','#0f3460','#16213e'],
        outfit : ['#1a1a2e','#16213e','#0f3460','#533483','#2d132c','#162447'],
        hairTip    : '퓨어 블랙 · 블루 블랙 · 딥 다크 브라운',
        makeupTip  : '딥 플럼 립 · 다크 스모키 아이 · 딥 로즈 블러셔',
        outfitTip  : '딥 네이비 · 차콜 · 딥 퍼플 · 블랙 · 다크 에메랄드',
        avoidHair  : '밝은 블론드 · 오렌지 · 파스텔 컬러',
        avoidMakeup: '파스텔 핑크 · 오렌지 · 밝은 코랄',
        avoidOutfit: '파스텔 계열 · 오렌지 · 밝은 옐로우 · 카멜',
      },
    ],
  },

];


/* ──────────────────────────────────────
   [개선 4] 개선된 점수 계산 함수
   기존: 고정 가중치 (hue40 + sat30 + lig30)
   개선: 타입별 동적 가중치 + 언더톤 축 추가
────────────────────────────────────── */
function scoreTypeImproved(hsl, rgb, type) {
  const { h, s, l } = hsl;
  const { r, g, b } = rgb;
  const W = type.weights;
  const tol = type.tolerance || 0;
  let score = 0;

  /* ① Hue 점수 */
  if (inHueRange(h, type.hueRange)) {
    score += W.hue;
  } else {
    let minDist = Infinity;
    for (const [mn, mx] of type.hueRange) {
      const d = h < mn ? mn - h : h > mx ? h - mx : 0;
      if (d < minDist) minDist = d;
    }
    const adjusted = Math.max(0, minDist - tol);
    score += Math.max(0, W.hue - adjusted * 0.6);
  }

  /* ② 채도 점수 */
  if (s >= type.satMin && s <= type.satMax) {
    score += W.sat;
  } else {
    const d = s < type.satMin ? type.satMin - s : s - type.satMax;
    const adjusted = Math.max(0, d - tol);
    score += Math.max(0, W.sat - adjusted * 0.8);
  }

  /* ③ 명도 점수 */
  if (l >= type.ligMin && l <= type.ligMax) {
    score += W.lig;
  } else {
    const d = l < type.ligMin ? type.ligMin - l : l - type.ligMax;
    const adjusted = Math.max(0, d - tol);
    score += Math.max(0, W.lig - adjusted * 0.8);
  }

  /* ④ 언더톤 점수 (신규) */
  const ut = calcUndertone(h, s, l, r, g, b);
  const [utMin, utMax] = type.undertoneRange;
  if (ut >= utMin && ut <= utMax) {
    score += W.undertone;
  } else {
    const d = ut < utMin ? utMin - ut : ut - utMax;
    score += Math.max(0, W.undertone - d * 0.5);
  }

  return Math.round(Math.min(100, score));
}

function inHueRange(h, ranges) {
  return ranges.some(([mn, mx]) => h >= mn && h <= mx);
}
