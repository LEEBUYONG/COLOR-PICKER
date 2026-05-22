/* ════════════════════════════════════════
   data.js
   PCCS 톤 체계 + 12가지 퍼스널 컬러 데이터
════════════════════════════════════════ */

/* ──────────────────────────────────────
   1. PCCS 톤 데이터
   sat / lig : [min, max] %
   pos       : PCCS 맵 위치 (채도 x축, 명도 y축) 0~100%
────────────────────────────────────── */
const PCCS_TONES = [
  { key:'p',   label:'페일',         sat:[5,  25],  lig:[75, 92], color:'#f4c2c2', pos:{x:14, y:12} },
  { key:'lt',  label:'라이트',       sat:[28, 60],  lig:[65, 85], color:'#87ceeb', pos:{x:36, y:18} },
  { key:'b',   label:'브라이트',     sat:[68, 100], lig:[44, 70], color:'#ff6b6b', pos:{x:76, y:34} },
  { key:'sf',  label:'소프트',       sat:[18, 50],  lig:[53, 72], color:'#98d8c8', pos:{x:28, y:30} },
  { key:'s',   label:'스트롱',       sat:[63, 95],  lig:[33, 55], color:'#e07b39', pos:{x:74, y:52} },
  { key:'v',   label:'비비드',       sat:[83, 100], lig:[38, 65], color:'#ff1493', pos:{x:88, y:42} },
  { key:'ltg', label:'라이트그레이시', sat:[4,  22],  lig:[60, 80], color:'#c8c8d8', pos:{x:12, y:30} },
  { key:'g',   label:'그레이시',     sat:[7,  28],  lig:[43, 65], color:'#9b9bab', pos:{x:14, y:50} },
  { key:'d',   label:'덜',           sat:[16, 45],  lig:[36, 58], color:'#8b7355', pos:{x:30, y:54} },
  { key:'dp',  label:'딥',           sat:[53, 90],  lig:[18, 42], color:'#8b1a1a', pos:{x:68, y:72} },
  { key:'dkg', label:'다크그레이시', sat:[4,  20],  lig:[23, 45], color:'#555566', pos:{x:12, y:70} },
  { key:'dk',  label:'다크',         sat:[28, 70],  lig:[13, 35], color:'#2d4a22', pos:{x:42, y:80} },
];


/* ──────────────────────────────────────
   2. 퍼스널 컬러 시즌 데이터

   각 type 필드 설명
   ─────────────────
   name       : 유형명
   keyword    : 한 줄 설명
   hueRange   : 어울리는 색상 범위 [[min,max], ...]
   satMin/Max : 어울리는 채도 범위 %
   ligMin/Max : 어울리는 명도 범위 %
   pccs       : 어울리는 PCCS 톤 key 배열
   colors     : 대표 색상 (스와치용 HEX)
   hair       : 추천 헤어 컬러 HEX
   makeup     : 추천 메이크업 컬러 HEX
   outfit     : 추천 의상 컬러 HEX
   hairTip    : 헤어 추천 텍스트
   makeupTip  : 메이크업 추천 텍스트
   outfitTip  : 의상 추천 텍스트
   avoidHair  : 피해야 할 헤어
   avoidMakeup: 피해야 할 메이크업
   avoidOutfit: 피해야 할 의상
────────────────────────────────────── */
const SEASONS = [

  /* ── 🌸 봄 웜톤 ───────────────────────── */
  {
    season : '봄 웜톤',
    icon   : '🌸',
    tone   : '웜',
    types  : [
      {
        name    : '봄 브라이트',
        keyword : '선명하고 밝은 웜톤',
        hueRange: [[0, 80], [330, 360]],
        satMin  : 65, satMax: 100,
        ligMin  : 42, ligMax: 72,
        pccs    : ['b', 'lt', 'v', 'sf'],
        colors  : ['#FF6B6B','#FF8C42','#FFD166','#F72585','#FFBE0B','#FB5607','#FF4D6D','#FF6392'],
        hair    : ['#C8763A','#D4954A','#E8A855','#F5C060'],
        makeup  : ['#FF6B6B','#FF8C42','#FFD166','#F72585','#FF4D6D'],
        outfit  : ['#FF6B6B','#FFD166','#FF8C42','#FFBE0B','#FB5607','#FF6392'],
        hairTip    : '밝은 오렌지 브라운 · 골든 브라운 · 허니 블론드',
        makeupTip  : '코랄 립 · 오렌지 블러셔 · 골드 아이섀도우',
        outfitTip  : '코랄 · 오렌지 · 선명한 옐로우 · 밝은 핑크',
        avoidHair  : '쿨 애쉬 · 블루 블랙 · 회색빛 염색',
        avoidMakeup: '쿨 핑크 · 라벤더 · 블루 계열',
        avoidOutfit: '쿨 그레이 · 블루 계열 · 차가운 화이트',
      },
      {
        name    : '봄 트루',
        keyword : '자연스럽고 따뜻한 웜톤',
        hueRange: [[10, 90]],
        satMin  : 45, satMax: 90,
        ligMin  : 35, ligMax: 68,
        pccs    : ['b', 's', 'lt', 'v'],
        colors  : ['#FF9F1C','#FFBF69','#E76F51','#F4A261','#80B918','#2EC4B6','#E71D36','#FFB347'],
        hair    : ['#8B4513','#A0522D','#CD853F','#D2691E'],
        makeup  : ['#FF9F1C','#E76F51','#F4A261','#FF7F50','#E71D36'],
        outfit  : ['#FF9F1C','#FFBF69','#E76F51','#80B918','#2EC4B6','#E71D36'],
        hairTip    : '따뜻한 브라운 · 오렌지 브라운 · 캐러멜',
        makeupTip  : '오렌지 립 · 피치 블러셔 · 브론즈 아이',
        outfitTip  : '오렌지 · 피치 · 옐로우그린 · 따뜻한 레드',
        avoidHair  : '쿨 애쉬 · 플래티넘 · 차가운 블론드',
        avoidMakeup: '쿨 로즈 · 퍼플 · 실버 계열',
        avoidOutfit: '차가운 화이트 · 아이시 블루 · 라벤더',
      },
      {
        name    : '봄 라이트',
        keyword : '밝고 연한 파스텔 웜톤',
        hueRange: [[0, 80], [330, 360]],
        satMin  : 22, satMax: 65,
        ligMin  : 68, ligMax: 95,
        pccs    : ['p', 'lt', 'sf', 'ltg'],
        colors  : ['#FFD6E0','#FFEFB5','#FFC8DD','#FFAFCC','#FFDDD2','#FFE4E1','#FFEAA7','#FFCBA4'],
        hair    : ['#E8C49A','#F0D0A0','#F5DEB3','#FAEBD7'],
        makeup  : ['#FFD6E0','#FFC8DD','#FFAFCC','#FFB347','#FFDDD2'],
        outfit  : ['#FFD6E0','#FFEFB5','#FFC8DD','#FFDDD2','#FFE4E1','#FFEAA7'],
        hairTip    : '밝은 베이지 브라운 · 애쉬 골드 · 밀크티 브라운',
        makeupTip  : '연한 피치 립 · 핑크 블러셔 · 샴페인 아이',
        outfitTip  : '파스텔 핑크 · 연한 옐로우 · 아이보리 · 피치',
        avoidHair  : '다크 블랙 · 강한 레드 · 쿨 애쉬',
        avoidMakeup: '다크 브라운 · 강한 스모키 · 쿨 퍼플',
        avoidOutfit: '블랙 · 다크 네이비 · 강렬한 원색',
      },
    ],
  },

  /* ── 🌊 여름 쿨톤 ───────────────────────── */
  {
    season : '여름 쿨톤',
    icon   : '🌊',
    tone   : '쿨',
    types  : [
      {
        name    : '여름 라이트',
        keyword : '밝고 연한 쿨톤 파스텔',
        hueRange: [[160, 320]],
        satMin  : 18, satMax: 62,
        ligMin  : 63, ligMax: 92,
        pccs    : ['p', 'lt', 'sf', 'ltg'],
        colors  : ['#B5EAD7','#C7CEEA','#FFB7B2','#FF9AA2','#A8DADC','#9DC3C1','#BDE0FE','#C9B1D9'],
        hair    : ['#A89080','#B8A090','#C8B0A0','#D4C0B0'],
        makeup  : ['#B5EAD7','#C7CEEA','#FFB7B2','#FF9AA2','#BDE0FE'],
        outfit  : ['#B5EAD7','#C7CEEA','#FFB7B2','#A8DADC','#BDE0FE','#C9B1D9'],
        hairTip    : '애쉬 브라운 · 쿨 베이지 · 로즈 브라운',
        makeupTip  : '라벤더 아이 · 로즈 립 · 쿨 핑크 블러셔',
        outfitTip  : '파스텔 블루 · 라벤더 · 민트 · 연한 핑크',
        avoidHair  : '오렌지 브라운 · 골든 · 구리빛 염색',
        avoidMakeup: '오렌지 · 코랄 · 브론즈 계열',
        avoidOutfit: '오렌지 · 카멜 · 머스타드 · 따뜻한 베이지',
      },
      {
        name    : '여름 트루',
        keyword : '차분하고 선명한 쿨톤',
        hueRange: [[150, 280]],
        satMin  : 28, satMax: 70,
        ligMin  : 30, ligMax: 65,
        pccs    : ['sf', 'lt', 'd', 'g'],
        colors  : ['#6B9080','#A4C3B2','#84A98C','#52796F','#457B9D','#6D6875','#B4838D','#9B8EA5'],
        hair    : ['#5C4033','#6B4C3B','#7B5C4B','#8B6C5B'],
        makeup  : ['#6B9080','#457B9D','#6D6875','#B4838D','#84A98C'],
        outfit  : ['#6B9080','#A4C3B2','#52796F','#457B9D','#6D6875','#B4838D'],
        hairTip    : '쿨 다크 브라운 · 애쉬 다크 · 블루 블랙',
        makeupTip  : '모브 립 · 스모키 블루 아이 · 쿨 로즈 블러셔',
        outfitTip  : '스틸 블루 · 쿨 그린 · 모브 · 슬레이트',
        avoidHair  : '웜 오렌지 · 골든 브라운 · 구리빛',
        avoidMakeup: '오렌지 립 · 브론즈 아이 · 피치 블러셔',
        avoidOutfit: '오렌지 · 카멜 · 올리브 · 머스타드',
      },
      {
        name    : '여름 뮤트',
        keyword : '부드럽고 흐린 쿨톤',
        hueRange: [[160, 300]],
        satMin  : 8,  satMax: 42,
        ligMin  : 36, ligMax: 70,
        pccs    : ['sf', 'g', 'ltg', 'd'],
        colors  : ['#B5B9C4','#9BA8AB','#8D99AE','#9C89B8','#C9ADA7','#A8DADC','#6D6875','#A0A0B0'],
        hair    : ['#7B7B8B','#8B8B9B','#9B9BAB','#ABABBB'],
        makeup  : ['#B5B9C4','#9C89B8','#C9ADA7','#8D99AE','#6D6875'],
        outfit  : ['#B5B9C4','#9BA8AB','#8D99AE','#9C89B8','#C9ADA7','#A8DADC'],
        hairTip    : '애쉬 그레이 · 쿨 뮤트 브라운 · 스모키 그레이',
        makeupTip  : '뮤트 핑크 립 · 그레이시 블러셔 · 스모키 아이',
        outfitTip  : '그레이 블루 · 뮤트 라벤더 · 스모키 핑크 · 실버',
        avoidHair  : '선명한 오렌지 · 밝은 골드 · 강한 레드',
        avoidMakeup: '비비드 오렌지 · 강한 코랄 · 골드 글리터',
        avoidOutfit: '선명한 원색 · 오렌지 · 밝은 옐로우',
      },
    ],
  },

  /* ── 🍂 가을 웜톤 ───────────────────────── */
  {
    season : '가을 웜톤',
    icon   : '🍂',
    tone   : '웜',
    types  : [
      {
        name    : '가을 뮤트',
        keyword : '흐리고 차분한 웜톤',
        hueRange: [[15, 75]],
        satMin  : 10, satMax: 50,
        ligMin  : 33, ligMax: 65,
        pccs    : ['d', 'g', 'sf', 'dkg'],
        colors  : ['#8B7355','#A0785A','#C4A882','#D4B896','#9B8B7A','#B5A99A','#C8B8A8','#A69080'],
        hair    : ['#5C3D2E','#6B4C3B','#7B5C4B','#8B6C5B'],
        makeup  : ['#8B7355','#A0785A','#C4A882','#D4B896','#9B8B7A'],
        outfit  : ['#8B7355','#A0785A','#C4A882','#D4B896','#B5A99A','#C8B8A8'],
        hairTip    : '따뜻한 다크 브라운 · 초콜릿 · 카카오 브라운',
        makeupTip  : '테라코타 립 · 브라운 블러셔 · 어스톤 아이',
        outfitTip  : '카멜 · 베이지 · 테라코타 · 머스타드 · 카키',
        avoidHair  : '쿨 애쉬 · 블루 블랙 · 플래티넘',
        avoidMakeup: '쿨 핑크 · 라벤더 · 실버 계열',
        avoidOutfit: '쿨 그레이 · 아이시 블루 · 블랙',
      },
      {
        name    : '가을 트루',
        keyword : '깊고 따뜻한 어스톤',
        hueRange: [[10, 75]],
        satMin  : 40, satMax: 85,
        ligMin  : 22, ligMax: 58,
        pccs    : ['d', 'dp', 's', 'dk'],
        colors  : ['#C84B31','#E07B39','#D4A017','#6B8E23','#8B4513','#A0522D','#CD853F','#D2691E'],
        hair    : ['#3D1C02','#4A2508','#5C3010','#6B3A1A'],
        makeup  : ['#C84B31','#E07B39','#D4A017','#8B4513','#A0522D'],
        outfit  : ['#C84B31','#E07B39','#D4A017','#6B8E23','#8B4513','#CD853F'],
        hairTip    : '딥 브라운 · 다크 초콜릿 · 버건디 브라운',
        makeupTip  : '벽돌 립 · 브론즈 아이 · 오렌지 브라운 블러셔',
        outfitTip  : '버건디 · 올리브 · 오렌지 브라운 · 머스타드 옐로우',
        avoidHair  : '쿨 애쉬 · 블루 블랙 · 밝은 블론드',
        avoidMakeup: '쿨 핑크 · 라벤더 · 블루 계열',
        avoidOutfit: '아이시 블루 · 쿨 라벤더 · 차가운 화이트',
      },
      {
        name    : '가을 딥',
        keyword : '깊고 어두운 딥 웜톤',
        hueRange: [[10, 65]],
        satMin  : 22, satMax: 70,
        ligMin  : 8,  ligMax: 42,
        pccs    : ['dp', 'dk', 'd', 'dkg'],
        colors  : ['#6B2737','#8B1A1A','#4A3728','#2D4A22','#5C2D0E','#3D2B1F','#722F37','#5B3A29'],
        hair    : ['#1A0A00','#2A1000','#3A1800','#4A2000'],
        makeup  : ['#6B2737','#8B1A1A','#5C2D0E','#722F37','#4A3728'],
        outfit  : ['#6B2737','#8B1A1A','#4A3728','#2D4A22','#5C2D0E','#722F37'],
        hairTip    : '블랙 브라운 · 다크 버건디 · 딥 초콜릿',
        makeupTip  : '다크 버건디 립 · 딥 브론즈 아이 · 테라코타 블러셔',
        outfitTip  : '딥 버건디 · 다크 올리브 · 다크 브라운 · 블랙 브라운',
        avoidHair  : '밝은 블론드 · 파스텔 컬러 · 쿨 애쉬',
        avoidMakeup: '파스텔 핑크 · 라이트 코랄 · 쿨 라벤더',
        avoidOutfit: '파스텔 계열 · 아이시 블루 · 밝은 옐로우',
      },
    ],
  },

  /* ── ❄️ 겨울 쿨톤 ───────────────────────── */
  {
    season : '겨울 쿨톤',
    icon   : '❄️',
    tone   : '쿨',
    types  : [
      {
        name    : '겨울 브라이트',
        keyword : '선명하고 강렬한 쿨톤',
        hueRange: [[160, 360], [0, 20]],
        satMin  : 68, satMax: 100,
        ligMin  : 36, ligMax: 68,
        pccs    : ['b', 'v', 's', 'lt'],
        colors  : ['#FF1493','#00CED1','#9400D3','#FF0000','#1E90FF','#FF69B4','#00BFFF','#8A2BE2'],
        hair    : ['#1A1A2E','#0A0A1E','#2A2A3E','#000000'],
        makeup  : ['#FF1493','#00CED1','#FF0000','#1E90FF','#FF69B4'],
        outfit  : ['#FF1493','#00CED1','#9400D3','#FF0000','#1E90FF','#FF69B4'],
        hairTip    : '블루 블랙 · 제트 블랙 · 쿨 다크 브라운',
        makeupTip  : '비비드 핑크 립 · 전기 블루 아이 · 쿨 레드 블러셔',
        outfitTip  : '로얄 블루 · 쇼킹 핑크 · 퓨어 화이트 · 블랙',
        avoidHair  : '오렌지 브라운 · 골든 · 구리빛',
        avoidMakeup: '오렌지 · 코랄 · 브론즈 · 골드 계열',
        avoidOutfit: '오렌지 · 카멜 · 머스타드 · 따뜻한 베이지',
      },
      {
        name    : '겨울 트루',
        keyword : '깊고 선명한 쿨톤',
        hueRange: [[160, 310]],
        satMin  : 45, satMax: 95,
        ligMin  : 13, ligMax: 48,
        pccs    : ['s', 'v', 'dp', 'b'],
        colors  : ['#003366','#006400','#800000','#4B0082','#008080','#191970','#8B0000','#00008B'],
        hair    : ['#0A0A0A','#1A1A1A','#0A0A1E','#000000'],
        makeup  : ['#003366','#800000','#4B0082','#008080','#8B0000'],
        outfit  : ['#003366','#006400','#800000','#4B0082','#008080','#191970'],
        hairTip    : '제트 블랙 · 블루 블랙 · 쿨 블랙',
        makeupTip  : '딥 버건디 립 · 네이비 아이 · 쿨 로즈 블러셔',
        outfitTip  : '네이비 · 딥 그린 · 버건디 · 딥 퍼플 · 블랙',
        avoidHair  : '오렌지 브라운 · 골든 · 따뜻한 브라운',
        avoidMakeup: '오렌지 · 피치 · 브론즈 · 골드',
        avoidOutfit: '오렌지 · 카멜 · 올리브 · 따뜻한 베이지',
      },
      {
        name    : '겨울 딥',
        keyword : '매우 어둡고 깊은 쿨톤',
        hueRange: [[180, 310]],
        satMin  : 20, satMax: 72,
        ligMin  : 6,  ligMax: 32,
        pccs    : ['dp', 'dk', 'dkg', 's'],
        colors  : ['#1a1a2e','#16213e','#0f3460','#533483','#2d132c','#162447','#1f4068','#0a3d62'],
        hair    : ['#000000','#0A0A0A','#050510','#0A0510'],
        makeup  : ['#1a1a2e','#533483','#2d132c','#0f3460','#16213e'],
        outfit  : ['#1a1a2e','#16213e','#0f3460','#533483','#2d132c','#162447'],
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