// مين الخاين؟ — online "room" on top of Firebase Realtime Database.
// Same interface the game uses: presence(patch), peers(), onPeers(fn,onErr), connected(), onConnection(fn).
//
// Each player owns one node: p/{uid}_{tab}. Values are stored as JSON strings so Realtime Database
// can't alter them (it drops empty arrays/objects and turns arrays into objects). A top-level value
// that is a non-empty object (e.g. the host's game state S) is stored one level deeper — one JSON
// string per child — so only the parts that changed are sent over the network.
(function(){
  'use strict';
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const J = v => JSON.stringify(v === undefined ? null : v);

  function enc(v){
    if(isObj(v)){
      const ks = Object.keys(v).filter(c => v[c] !== undefined);
      if(ks.length){ const o = {}; ks.forEach(c => { o[c] = J(v[c]); }); return o; }
    }
    return J(v);
  }
  function encAll(pres){ const o = {}; for(const k in pres) if(pres[k] !== undefined && pres[k] !== null) o[k] = enc(pres[k]); return o; }
  function parse(s, cache, key){
    if(typeof s !== 'string') return s;
    const c = cache.get(key); if(c && c.s === s) return c.v;
    let v; try{ v = JSON.parse(s); }catch(_){ v = s; }
    cache.set(key, {s, v}); return v;
  }
  function dec(raw, cache){
    const out = {};
    if(!isObj(raw)) return out;
    for(const k in raw){
      const r = raw[k];
      if(isObj(r)){ const o = {}; for(const c in r) o[c] = parse(r[c], cache, k + '/' + c); out[k] = o; }
      else out[k] = parse(r, cache, k);
    }
    return out;
  }

  window.makeRoomWith = async function(api, cfg){
    const app = api.initializeApp(cfg);
    const auth = api.getAuth(app);
    const cred = await api.signInAnonymously(auth);
    const uid = cred.user.uid;
    const db = api.getDatabase(app);
    const me = uid + '_' + Math.random().toString(36).slice(2, 7);
    const root = api.ref(db, 'p');
    const myRef = api.ref(db, 'p/' + me);

    let my = Object.freeze({});
    let myEnc = {};
    const others = new Map();
    let snap = Object.freeze([]);
    const peerLs = new Set(), connLs = new Set();
    let sched = false, connected = false, failed = null;

    function rebuild(){
      const a = [Object.freeze({peer:me, by:null, isMe:true, sameTab:true, kind:'viewer', guest:false, presence:my, updatedAt:Date.now()})];
      for(const [p,o] of others) a.push(Object.freeze({peer:p, by:null, isMe:false, sameTab:false, kind:'viewer', guest:false, presence:o.presence, updatedAt:o.at}));
      snap = Object.freeze(a);
    }
    function notify(){
      if(sched) return; sched = true;
      setTimeout(() => {
        sched = false; rebuild();
        const ch = {peers:snap, joined:[], left:[], updated:[]};
        peerLs.forEach(f => { try{ f.fn(ch); }catch(e){ console.error(e); } });
      }, 16);
    }
    function fail(err){
      if(failed) return; failed = err || {code:'x'};
      const e = {code:'not_granted', fb:(err && (err.code || err.message)) || 'x', message:String((err && err.message) || err)};
      peerLs.forEach(f => { if(f.onErr) try{ f.onErr(e); }catch(_){} });
    }
    const put = s => {
      if(s.key === me) return;
      const v = s.val();
      if(!v){ others.delete(s.key); notify(); return; }
      const prev = others.get(s.key);
      const cache = prev ? prev.cache : new Map();
      others.set(s.key, {presence:Object.freeze(dec(v, cache)), at:Date.now(), cache});
      notify();
    };
    api.onChildAdded(root, put, fail);
    api.onChildChanged(root, put, fail);
    api.onChildRemoved(root, s => { if(s.key === me) return; others.delete(s.key); notify(); }, fail);
    api.onValue(api.ref(db, '.info/connected'), s => {
      const c = !!s.val();
      if(c && !connected){
        api.onDisconnect(myRef).remove().catch(()=>{});
        if(Object.keys(myEnc).length) api.set(myRef, myEnc).catch(fail);
      }
      connected = c;
      connLs.forEach(f => { try{ f(c); }catch(_){} });
    });
    addEventListener('pagehide', () => { try{ api.set(myRef, null); }catch(_){} });

    return {
      presence(patch){
        const np = {...my};
        for(const k in patch){ if(patch[k] === null || patch[k] === undefined) delete np[k]; else np[k] = JSON.parse(J(patch[k])); }
        const upd = {}, ne = {...myEnc};
        for(const k in patch){
          const pe = myEnc[k];
          if(np[k] === undefined){ if(pe !== undefined){ upd[k] = null; delete ne[k]; } continue; }
          const e = enc(np[k]); ne[k] = e;
          if(isObj(pe) && isObj(e)){
            for(const c in pe) if(!(c in e)) upd[k + '/' + c] = null;
            for(const c in e) if(pe[c] !== e[c]) upd[k + '/' + c] = e[c];
          } else if(J(pe) !== J(e)) upd[k] = e;
        }
        my = Object.freeze(np); myEnc = ne; notify();
        if(Object.keys(upd).length){
          return api.update(myRef, upd).catch(e => {
            console.warn('firebase update', e);
            if(e && /permission/i.test(String(e.code || e.message || ''))) fail(e);
          });
        }
        return Promise.resolve();
      },
      peers(){ return snap; },
      onPeers(fn, onErr){
        const o = {fn, onErr}; peerLs.add(o);
        setTimeout(() => { rebuild(); fn({peers:snap, joined:snap, left:[], updated:[]}); if(failed && onErr) onErr({code:'not_granted', fb:failed.code || 'x'}); }, 0);
        return () => peerLs.delete(o);
      },
      connected(){ return connected; },
      onConnection(fn){ connLs.add(fn); setTimeout(() => fn(connected), 0); return () => connLs.delete(fn); },
    };
  };
})();
