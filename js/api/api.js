// ============================================================
// api/api.js - 성능 최적화 버전 (인메모리 캐시 + 중복 요청 방지)
// ============================================================

const API = {

  // ── 인메모리 캐시 (읽기 전용 API 대상) ──────────────────
  _cache: {},
  _pending: {}, // 진행 중인 요청 (중복 방지)

  _CACHE_TTL: {
    getInitialData:      60000, // 60초 — 대시보드/평가관리 공유
    getClients:          60000, // 60초
    getClientDetail:     20000, // 20초
    getClientMasterList: 20000, // 20초
    getAssessOverview:   60000, // 60초
    getStandards:       300000  // 5분
  },

  /** 캐시 키 생성 */
  _key: function(params) {
    return params.action + '_' + (params.clientId||'') + '_' + (params.round||'');
  },

  /** 캐시 즉시 확인 (만료 포함 — 만료 여부도 ts로 판단 가능) */
  _getCached: function(action, params) {
    const key = this._key(params || {action});
    const ttl = this._CACHE_TTL[action];
    if (!ttl || !this._cache[key]) return null;
    const { data, ts } = this._cache[key];
    if (Date.now() - ts >= ttl) return null; // 만료됨
    return { data: data.data, ts }; // data.data = 서버 응답의 data 필드
  },

  /** 캐시 무효화 (쓰기 후 관련 캐시 삭제) */
  _bust: function(...actions) {
    actions.forEach(a => {
      Object.keys(this._cache).forEach(k => {
        if (k.startsWith(a)) delete this._cache[k];
      });
    });
  },

  /** 핵심 fetch (중복 요청 dedup 포함) */
  call: async function(params) {
    const ttl   = this._CACHE_TTL[params.action];
    const key   = this._key(params);
    const now   = Date.now();

    // 읽기 캐시 확인
    if (ttl && this._cache[key]) {
      const { data, ts } = this._cache[key];
      if (now - ts < ttl) return data;
    }

    // 동일 요청이 진행 중이면 같은 Promise 공유 (dedup)
    if (this._pending[key]) return this._pending[key];

    const promise = fetch(AppConfig.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(params),
      redirect: 'follow'
    })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => {
      delete this._pending[key];
      if (ttl && data.status === 'success') {
        this._cache[key] = { data, ts: Date.now() };
      }
      return data;
    })
    .catch(err => {
      delete this._pending[key];
      throw err;
    });

    this._pending[key] = promise;
    return promise;
  },

  // ── 사용자 ──────────────────────────────────────────────
  login: async (id, pw) => {
    // 로그인은 캐시·dedup 없이 항상 직접 요청
    const r = await fetch(AppConfig.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({action:'login', loginId:id, password:pw}),
      redirect: 'follow'
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  getUsers:       ()           => API.call({action:'getUsers',       requesterId:Auth.getUser().userId}),
  createUser:     (d)          => API.call({action:'createUser',     requesterId:Auth.getUser().userId,...d}),
  updateUser:     (tid,fields) => API.call({action:'updateUser',     requesterId:Auth.getUser().userId,targetUserId:tid,...fields}),
  deleteUser:     (tid)        => API.call({action:'deleteUser',     requesterId:Auth.getUser().userId,targetUserId:tid}),
  changePassword: (cur,nw)     => API.call({action:'changePassword', userId:Auth.getUser().userId,currentPassword:cur,newPassword:nw}),
  resetPassword:  (tid)        => API.call({action:'resetPassword',  requesterId:Auth.getUser().userId,targetUserId:tid}),

  // ── 고객 ────────────────────────────────────────────────
  getClients:     ()    => API.call({action:'getClients',      requesterId:Auth.getUser().userId}),
  getClientDetail:(cid) => API.call({action:'getClientDetail', requesterId:Auth.getUser().userId,clientId:cid}),

  createClient: async (d) => {
    const r = await API.call({action:'createClient', requesterId:Auth.getUser().userId,...d});
    if (r.status==='success') API._bust('getClients','getClientDetail','getInitialData');
    return r;
  },
  updateClient: async (d) => {
    const r = await API.call({action:'updateClient', requesterId:Auth.getUser().userId,...d});
    if (r.status==='success') API._bust('getClients','getClientDetail','getInitialData');
    return r;
  },
  deleteClient: async (cid) => {
    const r = await API.call({action:'deleteClient', requesterId:Auth.getUser().userId,clientId:cid});
    if (r.status==='success') API._bust('getClients','getClientDetail','getClientMasterList','getInitialData');
    return r;
  },
  updateClientStatus: () => API.call({action:'updateClientStatus',requesterId:Auth.getUser().userId}),

  // ── 평가 ────────────────────────────────────────────────
  // getClients + getAssessOverview 단일 요청 통합 (초기 로딩 최적화)
  getInitialData: async () => {
    const r = await API.call({action:'getInitialData', requesterId:Auth.getUser().userId});
    if (r.status === 'success') {
      // 결과를 getClients / getAssessOverview 캐시에도 저장 → 이후 호출은 즉시 반환
      const now = Date.now();
      API._cache['getClients_'] = {
        data: {status:'success', data:{clients: r.data.clients}},
        ts: now
      };
      API._cache['getAssessOverview_'] = {
        data: {status:'success', data:{overview: r.data.overview}},
        ts: now
      };
    }
    return r;
  },
  getRoundData:    (cid,round) => API.call({action:'getRoundData', requesterId:Auth.getUser().userId,clientId:cid,round}),

  saveCognitive: async (cid,round,d) => {
    const r = await API.call({action:'saveCognitive',requesterId:Auth.getUser().userId,clientId:cid,round,...d});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getAssessOverview','getInitialData');
    return r;
  },
  saveErgo: async (cid,round,d) => {
    const r = await API.call({action:'saveErgo',requesterId:Auth.getUser().userId,clientId:cid,round,...d});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getAssessOverview','getInitialData');
    return r;
  },
  saveEverex: async (cid,round,d) => {
    const r = await API.call({action:'saveEverex',requesterId:Auth.getUser().userId,clientId:cid,round,...d});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getAssessOverview','getInitialData');
    return r;
  },
  saveFra: async (cid,round,d) => {
    const r = await API.call({action:'saveFra',requesterId:Auth.getUser().userId,clientId:cid,round,...d});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getAssessOverview','getInitialData');
    return r;
  },
  saveInbody: async (cid,round,d) => {
    const r = await API.call({action:'saveInbody',requesterId:Auth.getUser().userId,clientId:cid,round,...d});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getAssessOverview','getInitialData');
    return r;
  },
  saveStress: async (cid,round,d) => {
    const r = await API.call({action:'saveStress',requesterId:Auth.getUser().userId,clientId:cid,round,...d});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getAssessOverview','getInitialData');
    return r;
  },
  saveComment: async (cid,round,d) => {
    const r = await API.call({action:'saveComment',requesterId:Auth.getUser().userId,clientId:cid,round,...d});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getAssessOverview','getInitialData');
    return r;
  },
  deleteSheetRow: async (cid,round,type) => {
    const r = await API.call({action:'deleteSheetRow',requesterId:Auth.getUser().userId,clientId:cid,round,sheetType:type});
    if (r.status==='success') API._bust('getRoundData','getClientMasterList','getClients','getAssessOverview','getInitialData');
    return r;
  },
  generateReport: async (cid,round,force) => {
    const r = await API.call({action:'generateReport',requesterId:Auth.getUser().userId,clientId:cid,round,forceRegenerate:!!force});
    if (r.status==='success') API._bust('getClientMasterList','getClients','getClientDetail','getInitialData');
    return r;
  },
  invalidateReport: async (cid,round) => {
    const r = await API.call({action:'invalidateReport',requesterId:Auth.getUser().userId,clientId:cid,round});
    if (r.status==='success') API._bust('getClientMasterList','getClients','getInitialData');
    return r;
  },
  getClientMasterList: (cid) => API.call({action:'getClientMasterList',requesterId:Auth.getUser().userId,clientId:cid}),
  // getAssessOverview: getInitialData 캐시 히트 또는 단독 호출
  getAssessOverview: () => API.call({action:'getAssessOverview', requesterId:Auth.getUser().userId}),

  // ── 기준값 ──────────────────────────────────────────────
  getStandards:  ()           => API.call({action:'getStandards',  requesterId:Auth.getUser().userId}),
  saveStandards: async (cat,items) => {
    const r = await API.call({action:'saveStandards',requesterId:Auth.getUser().userId,category:cat,items});
    if (r.status==='success') API._bust('getStandards');
    return r;
  }
};
