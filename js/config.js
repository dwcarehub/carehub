// ============================================================
// config.js - v9
// ============================================================
//
// ★ API URL 설정
//   아래 두 줄만 실제 URL로 교체하세요.
//   DEV URL  → Apps Script DEV 웹앱 배포 후 복사
//   PROD URL → Apps Script PROD 웹앱 배포 후 복사
//
//   배포 후에는 이 파일을 다시 건드릴 필요 없습니다.
//   localhost / carehub-dev.netlify.app → DEV API 자동 연결
//   carehub.netlify.app (실제 도메인)   → PROD API 자동 연결
//
// ============================================================
const _API_URLS = {
  dev:  'https://script.google.com/macros/s/18h-uPlYDYHBIXi7SIqeQKvS2XciD3LLR6cFNrFO9VGo/exec',
  prod: 'https://script.google.com/macros/s/18I2sxKf8TKaiRvUoBsq-nM6KEZJrJ3oKVgXAFKjgFAo/exec',
};

const _isProd = (() => {
  const host = window.location.hostname;
  // localhost, 127.0.0.1, carehub-dev.netlify.app → DEV
  // 그 외 모든 도메인 → PROD
  return !['localhost', '127.0.0.1'].includes(host) && !host.includes('carehub-dev');
})();

const AppConfig = {
  ENV:     _isProd ? 'prod' : 'dev',
  API_URL: _isProd ? _API_URLS.prod : _API_URLS.dev,

  ROLES: {
    ADMIN:'전체 관리자', CARE_MANAGER:'케어 매니저',
    COGNITIVE_SPECIALIST:'인지 전문가', EXERCISE_SPECIALIST:'운동 전문가'
  },
  STATUS: { ACTIVE:'사용', INACTIVE:'미사용' },
  CLIENT_STATUS: { SCHEDULED:'입소예정', ADMITTED:'입소중', DISCHARGED:'퇴소' },
  PERIOD_ROUNDS: { '2주':1,'1개월':2,'2개월':3,'3개월':4,'4개월':5,'5개월':6,'6개월':7 },
  PERIOD_DAYS:   { '2주':14,'1개월':28,'2개월':56,'3개월':84,'4개월':112,'5개월':140,'6개월':168 },
  STORAGE_KEY: 'carehub_user',

  ASSESS_CATEGORIES: [
    { id:'cognitive', label:'인지평가', icon:'🧠' },
    { id:'movement',  label:'움직임평가', icon:'🏃' },
    { id:'metabolism',label:'대사평가', icon:'💊' },
    { id:'comment',   label:'코멘트', icon:'💬' }
  ],
  ASSESS_WRITE_ROLES: {
    cognitive:  ['ADMIN','CARE_MANAGER','COGNITIVE_SPECIALIST'],
    movement:   ['ADMIN','CARE_MANAGER','EXERCISE_SPECIALIST'],
    metabolism: ['ADMIN','CARE_MANAGER'],
    comment:    ['ADMIN','CARE_MANAGER','COGNITIVE_SPECIALIST','EXERCISE_SPECIALIST']
  },
  VO2PEAK_MALE: {
    '60-65': [
      { label:'최우수 (Superior)',  min:40.0, max:Infinity },
      { label:'우수 (Excellent)',   min:36.0, max:39.9 },
      { label:'평균 이상 (Good)',   min:32.0, max:35.9 },
      { label:'평균 (Fair)',        min:29.0, max:31.9 },
      { label:'평균 이하 (Poor)',   min:25.0, max:28.9 },
      { label:'최하위 (Very Poor)', min:-Infinity, max:24.9 }
    ],
    '66+': [
      { label:'최우수 (Superior)',  min:37.0, max:Infinity },
      { label:'우수 (Excellent)',   min:33.0, max:37.0 },
      { label:'평균 이상 (Good)',   min:29.0, max:32.9 },
      { label:'평균 (Fair)',        min:26.0, max:28.9 },
      { label:'평균 이하 (Poor)',   min:22.0, max:25.9 },
      { label:'최하위 (Very Poor)', min:-Infinity, max:21.9 }
    ]
  },
  VO2PEAK_FEMALE: {
    '60-65': [
      { label:'최우수 (Superior)',  min:33.0, max:Infinity },
      { label:'우수 (Excellent)',   min:29.0, max:32.9 },
      { label:'평균 이상 (Good)',   min:25.0, max:28.9 },
      { label:'평균 (Fair)',        min:22.0, max:24.9 },
      { label:'평균 이하 (Poor)',   min:19.0, max:21.9 },
      { label:'최하위 (Very Poor)', min:-Infinity, max:18.9 }
    ],
    '66+': [
      { label:'최우수 (Superior)',  min:32.0, max:Infinity },
      { label:'우수 (Excellent)',   min:28.0, max:32.0 },
      { label:'평균 이상 (Good)',   min:25.0, max:27.9 },
      { label:'평균 (Fair)',        min:22.0, max:24.9 },
      { label:'평균 이하 (Poor)',   min:19.0, max:21.9 },
      { label:'최하위 (Very Poor)', min:-Infinity, max:18.9 }
    ]
  },
  COGNITIVE_GRADE: [
    { label:'최적', min:90,  max:Infinity, color:'#1B5E20' },
    { label:'양호', min:80,  max:89.9,     color:'#2E7D32' },
    { label:'개선', min:65,  max:79.9,     color:'#F57F17' },
    { label:'주의', min:-Infinity, max:64.9, color:'#C62828' }
  ],
  STRESS_GRADE: [
    { label:'정상', min:-Infinity, max:34.9, color:'#2E7D32', bg:'#E8F5E9' },
    { label:'초기', min:35, max:44.9, color:'#F57F17', bg:'#FFF8E1' },
    { label:'진행', min:45, max:59.9, color:'#E65100', bg:'#FBE9E7' },
    { label:'만성', min:60, max:Infinity, color:'#C62828', bg:'#FFEBEE' }
  ],

  // ─────────────────────────────────────────────────────────
  // 메뉴 구조 (새 순서: 대시보드 > 고객관리 > 평가관리 > 리포트관리 > 관리자 > 마이페이지)
  // type: 'group' 은 접을 수 있는 그룹 헤더
  // ─────────────────────────────────────────────────────────
  MENUS: [
    {
      id:'dashboard', label:'대시보드',
      icon:`<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
      roles:['ADMIN','CARE_MANAGER','COGNITIVE_SPECIALIST','EXERCISE_SPECIALIST']
    },
    {
      id:'clients', label:'고객 관리',
      icon:`<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      roles:['ADMIN','CARE_MANAGER','COGNITIVE_SPECIALIST','EXERCISE_SPECIALIST']
    },
    {
      id:'reports', label:'리포트 관리',
      icon:`<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
      roles:['ADMIN','CARE_MANAGER','COGNITIVE_SPECIALIST','EXERCISE_SPECIALIST']
    },
    {
      id:'assessments', label:'평가 관리',
      icon:`<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
      roles:['ADMIN','CARE_MANAGER','COGNITIVE_SPECIALIST','EXERCISE_SPECIALIST']
    },
    {
      id:'admin-group', label:'관리자', type:'group',
      icon:`<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      roles:['ADMIN']
    },
    {
      id:'admin-users', label:'사용자 관리', parent:'admin-group',
      icon:`<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      roles:['ADMIN']
    },
    {
      id:'admin-standards', label:'기준값 관리', parent:'admin-group',
      icon:`<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
      roles:['ADMIN']
    }
  ]
};
