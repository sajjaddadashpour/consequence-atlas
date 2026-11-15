// src/engine.ts
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function logSamples(T, k) {
  const s = /* @__PURE__ */ new Set();
  for (let i = 0; i < k; i++) s.add(Math.max(1, Math.round(Math.pow(T, i / (k - 1)))));
  s.add(T);
  return Array.from(s).sort((a, b) => a - b);
}
function slope(ts, ys, lo, hi) {
  const xs = [], zs = [];
  for (let i = 0; i < ts.length; i++) if (ts[i] >= lo && ts[i] <= hi) {
    if (!(ys[i] > 0)) return null;
    xs.push(Math.log(ts[i]));
    zs.push(Math.log(ys[i]));
  }
  if (xs.length < 4) return null;
  const mx = xs.reduce((p, c) => p + c, 0) / xs.length, mz = zs.reduce((p, c) => p + c, 0) / zs.length;
  let a = 0, b = 0;
  for (let i = 0; i < xs.length; i++) {
    a += (xs[i] - mx) * (zs[i] - mz);
    b += (xs[i] - mx) ** 2;
  }
  return b > 0 ? -a / b : null;
}
var LF = [0];
function lnFact(n) {
  while (LF.length <= n) {
    const k = LF.length;
    LF.push(LF[k - 1] + Math.log(k));
  }
  return LF[n];
}
function lnC(V, n) {
  return lnFact(V) - lnFact(n) - lnFact(V - n);
}
var TWO = 2 * Math.PI;
var wrap = (x) => x - TWO * Math.round(x / TWO);
function arrow(dS) {
  return dS > 0.05 ? "rises" : dS < -0.05 ? "falls" : "is flat";
}
var S3P = [[0, 1, 2], [1, 0, 2], [2, 1, 0], [0, 2, 1], [1, 2, 0], [2, 0, 1]];
var s3find = (p) => S3P.findIndex((x) => x[0] === p[0] && x[1] === p[1] && x[2] === p[2]);
var S3MUL = S3P.map((a) => S3P.map((b) => s3find([a[b[0]], a[b[1]], a[b[2]]])));
var S3INV = S3P.map((_, i) => S3MUL[i].indexOf(0));
var S3CLASS = [0, 1, 1, 1, 2, 2];
function makeP(c) {
  const rng = mulberry32(c.seed);
  const d = Math.max(1, Math.min(3, Math.round(c.dim)));
  const L0 = d === 1 ? Math.max(16, Math.round(c.size)) : d === 2 ? Math.max(8, Math.round(c.size)) : Math.max(6, Math.round(c.size));
  let Ls = Array.from({ length: d }, () => L0);
  let st = [], N = 0;
  const shape = () => {
    st = [];
    let s = 1;
    for (let a = 0; a < d; a++) {
      st.push(s);
      s *= Ls[a];
    }
    N = s;
  };
  shape();
  const T = Math.max(1, Math.round(c.steps));
  const s3 = c.alphabet === "s3" && d === 1;
  const zn = c.alphabet === "zn";
  const nv = Math.max(3, Math.min(6, Math.round(c.nval)));
  const pm = c.alphabet === "pm" || c.alphabet === "s3" && d !== 1;
  const K = c.rcode >= 5 ? 5 : c.rcode >= 3 ? 3 : 1;
  const rsp = Math.max(1, Math.min(4, Math.round(c.rsp)));
  const lightOn = c.light || c.start === "light";
  const hasHoles = c.holes > 0;
  let q = new Int8Array(N), rec = new Int8Array(N), tag = new Uint8Array(N), hop = new Uint8Array(N), rd = new Uint8Array(N), err = new Int8Array(N), blk = new Uint8Array(N);
  let stalls = 0, cccDrops = 0, cccLight = 0, edgeLost = 0, holeLost = 0, converted = 0;
  let cap = 4 * N;
  let lp = new Int32Array(cap), lax = new Int8Array(cap), ldir = new Int8Array(cap), lrec = new Int8Array(cap), ltag = new Uint8Array(cap);
  let nl = 0;
  let drops = 0;
  const coord = (i, a) => Math.floor(i / st[a]) % Ls[a];
  const nb = (i, a, s) => {
    const x = coord(i, a);
    const y = (x + s + Ls[a]) % Ls[a];
    return i + (y - x) * st[a];
  };
  const rs = () => rng() < 0.5 ? 1 : -1;
  const rho = c.start === "hot" ? 0.9 : Math.max(1e-3, Math.min(0.95, c.rho));
  let np = 0;
  const put = (i, v) => {
    if (q[i] === 0 && !blk[i]) {
      q[i] = v;
      rec[i] = rs();
      np++;
    }
  };
  const pairVals = () => {
    if (s3) {
      const g = 1 + Math.floor(rng() * 5);
      return [g, S3INV[g]];
    }
    if (zn) {
      const k = 1 + Math.floor(rng() * (nv - 1));
      return [k, nv - k];
    }
    if (pm) {
      const s = rs();
      return [s, -s];
    }
    return [1, 1];
  };
  const annOK = (a, b) => pm ? a === -b : zn ? (a + b) % nv === 0 : true;
  if (hasHoles) {
    const nh = Math.floor(Math.min(0.9, c.holes) * N);
    const idx = Array.from({ length: N }, (_, i) => i);
    for (let m = 0; m < nh; m++) {
      const r = m + Math.floor(rng() * (N - m));
      const t2 = idx[m];
      idx[m] = idx[r];
      idx[r] = t2;
      blk[idx[m]] = 1;
    }
  }
  if (c.start === "light") {
  } else if (c.start === "line" && d > 1) {
    const mid = Math.floor(L0 / 2);
    const want = Math.floor(rho * L0 / 2);
    const cand = [];
    for (let i = 0; i < N; i++) {
      let ok = coord(i, 0) % 2 === 0 && coord(i, 0) + 1 < Ls[0];
      for (let a = 1; a < d; a++) if (coord(i, a) !== mid) ok = false;
      if (ok && !blk[i] && !blk[nb(i, 0, 1)]) cand.push(i);
    }
    for (let k = 0; k < Math.min(want, cand.length); k++) {
      const r = k + Math.floor(rng() * (cand.length - k));
      const t2 = cand[k];
      cand[k] = cand[r];
      cand[r] = t2;
      const pv = pairVals();
      put(cand[k], pv[0]);
      put(nb(cand[k], 0, 1), pv[1]);
    }
  } else if (c.start === "paired" || c.start === "line") {
    const want = Math.floor(rho * N / 2);
    const cand = [];
    for (let i = 0; i < N; i++) if (coord(i, 0) % 2 === 0 && coord(i, 0) + 1 < Ls[0] && !blk[i] && !blk[nb(i, 0, 1)]) cand.push(i);
    for (let k = 0; k < Math.min(want, cand.length); k++) {
      const r = k + Math.floor(rng() * (cand.length - k));
      const t2 = cand[k];
      cand[k] = cand[r];
      cand[r] = t2;
      if (zn || s3) {
        const pv = pairVals();
        put(cand[k], pv[0]);
        put(nb(cand[k], 0, 1), pv[1]);
      } else {
        const s = rs();
        put(cand[k], pm ? s : 1);
        put(nb(cand[k], 0, 1), pm ? -s : 1);
      }
    }
  } else {
    let k = Math.floor(rho * N);
    k -= k % 2;
    let pool = [];
    if (c.start === "blob") {
      const side = Math.min(L0, Math.ceil(Math.pow(k, 1 / d)));
      const o = Math.floor((L0 - side) / 2);
      for (let i = 0; i < N; i++) {
        let ok = true;
        for (let a = 0; a < d; a++) {
          const x = coord(i, a) - o;
          if (x < 0 || x >= side) ok = false;
        }
        if (ok) pool.push(i);
      }
      k = Math.min(k, pool.length - pool.length % 2);
    } else {
      pool = Array.from({ length: N }, (_, i) => i);
    }
    if (hasHoles) {
      pool = pool.filter((i) => !blk[i]);
      k = Math.min(k, pool.length - pool.length % 2);
    }
    for (let m = 0; m < k; m++) {
      const r = m + Math.floor(rng() * (pool.length - m));
      const t2 = pool[m];
      pool[m] = pool[r];
      pool[r] = t2;
    }
    if (zn || s3) {
      for (let m = 0; m + 1 < k; m += 2) {
        const pv = pairVals();
        put(pool[m], pv[0]);
        put(pool[m + 1], pv[1]);
      }
    } else {
      const kp = c.bias > 0 ? Math.round(k * (1 + Math.min(1, c.bias)) / 2) : k / 2;
      const sg = [];
      for (let m = 0; m < k; m++) sg.push(m < kp ? 1 : -1);
      for (let m = k - 1; m > 0; m--) {
        const r = Math.floor(rng() * (m + 1));
        const t2 = sg[m];
        sg[m] = sg[r];
        sg[r] = t2;
      }
      for (let m = 0; m < k; m++) put(pool[m], pm ? sg[m] : 1);
    }
  }
  const centre = Array.from({ length: d }, () => Math.floor(L0 / 2));
  let tag0 = -1;
  {
    let bd = 1e18;
    for (let i = 0; i < N; i++) if (q[i] !== 0) {
      let dd = 0;
      for (let a = 0; a < d; a++) dd += (coord(i, a) - centre[a]) ** 2;
      if (dd < bd) {
        bd = dd;
        tag0 = i;
      }
    }
  }
  let origin = tag0 >= 0 ? Array.from({ length: d }, (_, a) => coord(tag0, a)) : centre.slice();
  if (c.records && tag0 >= 0) tag[tag0] = 1;
  const lightStart = [];
  const inAtt = (i) => {
    if (!c.attention) return false;
    for (let a = 0; a < d; a++) {
      const x = coord(i, a), L = Ls[a];
      const w = Math.max(1, Math.floor(L / 5));
      const o = Math.floor((L - w) / 2);
      if (x < o || x >= o + w) return false;
    }
    return true;
  };
  const charge = () => {
    let s = 0;
    for (let i = 0; i < N; i++) s += q[i];
    return s;
  };
  const s3class = () => {
    let g = 0;
    for (let i = 0; i < N; i++) if (q[i] !== 0) g = S3MUL[g][q[i]];
    return S3CLASS[g];
  };
  const Q0 = charge(), np0 = np;
  const C0 = s3 ? s3class() : 0;
  const modn = (x) => (x % nv + nv) % nv;
  let consOK = true, consMsg = "";
  let nbk = [], G = 0;
  let mass = new Float64Array(1), phi = new Float64Array(1);
  let bco = new Int32Array(1);
  const setupBlocks = () => {
    const per = Math.max(1, Math.floor(Math.pow(512, 1 / d) + 1e-9));
    nbk = Ls.map((L) => Math.min(L, per));
    G = nbk.reduce((p, x) => p * x, 1);
    mass = new Float64Array(G);
    phi = new Float64Array(G);
    bco = new Int32Array(G * d);
    for (let b = 0; b < G; b++) {
      let r = b;
      for (let a = 0; a < d; a++) {
        bco[b * d + a] = r % nbk[a];
        r = Math.floor(r / nbk[a]);
      }
    }
  };
  if (c.attract === "long") setupBlocks();
  const blockOf = (i) => {
    let b = 0, s = 1;
    for (let a = 0; a < d; a++) {
      b += Math.floor(coord(i, a) * nbk[a] / Ls[a]) * s;
      s *= nbk[a];
    }
    return b;
  };
  const computePhi = () => {
    mass.fill(0);
    for (let i = 0; i < N; i++) if (q[i] !== 0) mass[blockOf(i)] += 1;
    const occ = [];
    for (let k = 0; k < G; k++) if (mass[k] > 0) occ.push(k);
    for (let b = 0; b < G; b++) {
      let p = 0;
      for (const k of occ) {
        let r2 = 0;
        for (let a = 0; a < d; a++) {
          let dx = Math.abs(bco[b * d + a] - bco[k * d + a]);
          dx = Math.min(dx, nbk[a] - dx);
          r2 += dx * dx;
        }
        p += mass[k] / (Math.sqrt(r2) + 1);
      }
      phi[b] = -c.gs * p;
    }
  };
  const occN = (i) => {
    let s = 0;
    for (let a = 0; a < d; a++) {
      if (q[nb(i, a, 1)] !== 0) s++;
      if (q[nb(i, a, -1)] !== 0) s++;
    }
    return s;
  };
  const sameN = (i, r) => {
    let s = 0;
    for (let a = 0; a < d; a++) {
      const u = nb(i, a, 1), v = nb(i, a, -1);
      if (q[u] !== 0 && rec[u] === r) s++;
      if (q[v] !== 0 && rec[v] === r) s++;
    }
    return s;
  };
  const addLight = (pos, a, s, r, tg) => {
    if (nl >= cap) {
      drops++;
      return;
    }
    lp[nl] = pos;
    lax[nl] = a;
    ldir[nl] = s;
    lrec[nl] = r;
    ltag[nl] = tg;
    nl++;
  };
  let bq = new Int8Array(N), brec = new Int8Array(N), btag = new Uint8Array(N);
  let bnp = 0;
  if (c.start === "light") {
    const nL = Math.max(1, Math.min(N, Math.round(c.nlight)));
    let best = -1, bd = 1e18;
    for (let k = 0; k < nL; k++) {
      let pos = Math.floor(rng() * N);
      let g = 0;
      while (blk[pos] && g < 100) {
        pos = Math.floor(rng() * N);
        g++;
      }
      const ax = Math.floor(rng() * d);
      addLight(pos, ax, rs(), rs(), 0);
      let dd = 0;
      for (let a = 0; a < d; a++) dd += (coord(pos, a) - centre[a]) ** 2;
      if (dd < bd) {
        bd = dd;
        best = nl - 1;
      }
    }
    if (c.records && best >= 0) {
      ltag[best] = 1;
      origin = Array.from({ length: d }, (_, a) => coord(lp[best], a));
    }
    lightStart.push(nl);
  }
  let vetoes = 0, events = 0, lastEvent = 0;
  let sideMin = L0, sideMax = L0;
  let axisTurn = 0;
  const insertPlane = (a, p) => {
    const oldLs = Ls.slice(), oldSt = st.slice(), oldN = N;
    Ls[a] += 1;
    shape();
    const nq = new Int8Array(N), nr = new Int8Array(N), ntg = new Uint8Array(N), ne = new Int8Array(N), nbk2 = new Uint8Array(N);
    const mapI = (i) => {
      let j = 0;
      for (let k = 0; k < d; k++) {
        let x = Math.floor(i / oldSt[k]) % oldLs[k];
        if (k === a && x >= p) x++;
        j += x * st[k];
      }
      return j;
    };
    for (let i = 0; i < oldN; i++) if (q[i] !== 0 || blk[i]) {
      const j = mapI(i);
      nq[j] = q[i];
      nr[j] = rec[i];
      ntg[j] = tag[i];
      ne[j] = err[i];
      nbk2[j] = blk[i];
    }
    for (let k = 0; k < nl; k++) lp[k] = mapI(lp[k]);
    if (origin[a] >= p) origin[a]++;
    q = nq;
    rec = nr;
    tag = ntg;
    err = ne;
    blk = nbk2;
    hop = new Uint8Array(N);
    rd = new Uint8Array(N);
    if (4 * N > cap) {
      const nc = 4 * N;
      const g = (o, n) => {
        n.set(o.subarray(0, nl));
      };
      const a1 = new Int32Array(nc), a2 = new Int8Array(nc), a3 = new Int8Array(nc), a4 = new Int8Array(nc), a5 = new Uint8Array(nc);
      g(lp, a1);
      g(lax, a2);
      g(ldir, a3);
      g(lrec, a4);
      g(ltag, a5);
      lp = a1;
      lax = a2;
      ldir = a3;
      lrec = a4;
      ltag = a5;
      cap = nc;
    }
    bq = new Int8Array(N);
    brec = new Int8Array(N);
    btag = new Uint8Array(N);
    if (c.attract === "long") setupBlocks();
  };
  const removePlane = (a) => {
    const used = new Uint8Array(Ls[a]);
    for (let i = 0; i < N; i++) if (q[i] !== 0 || blk[i]) used[coord(i, a)] = 1;
    for (let k = 0; k < nl; k++) used[coord(lp[k], a)] = 1;
    const free = [];
    for (let x = 0; x < Ls[a]; x++) if (!used[x]) free.push(x);
    if (!free.length) {
      stalls++;
      return false;
    }
    const p = free[Math.floor(rng() * free.length)];
    const oldLs = Ls.slice(), oldSt = st.slice(), oldN = N;
    Ls[a] -= 1;
    shape();
    const nq = new Int8Array(N), nr = new Int8Array(N), ntg = new Uint8Array(N), ne = new Int8Array(N), nbk2 = new Uint8Array(N);
    const mapI = (i) => {
      let j = 0;
      for (let k = 0; k < d; k++) {
        let x = Math.floor(i / oldSt[k]) % oldLs[k];
        if (k === a && x > p) x--;
        j += x * st[k];
      }
      return j;
    };
    for (let i = 0; i < oldN; i++) if (q[i] !== 0 || blk[i]) {
      const j = mapI(i);
      nq[j] = q[i];
      nr[j] = rec[i];
      ntg[j] = tag[i];
      ne[j] = err[i];
      nbk2[j] = blk[i];
    }
    for (let k = 0; k < nl; k++) lp[k] = mapI(lp[k]);
    if (origin[a] > p) origin[a]--;
    if (origin[a] >= Ls[a]) origin[a] = Ls[a] - 1;
    q = nq;
    rec = nr;
    tag = ntg;
    err = ne;
    blk = nbk2;
    hop = new Uint8Array(N);
    rd = new Uint8Array(N);
    bq = new Int8Array(N);
    brec = new Int8Array(N);
    btag = new Uint8Array(N);
    if (c.attract === "long") setupBlocks();
    return true;
  };
  const cccRescale = () => {
    const oldLs = Ls.slice(), oldSt = st.slice(), oldN = N;
    const oq = q, orc = rec, otg = tag, oblk = blk;
    Ls = oldLs.map((x) => Math.max(L0, Math.floor(x / 2)));
    shape();
    q = new Int8Array(N);
    rec = new Int8Array(N);
    tag = new Uint8Array(N);
    err = new Int8Array(N);
    blk = new Uint8Array(N);
    hop = new Uint8Array(N);
    rd = new Uint8Array(N);
    bq = new Int8Array(N);
    brec = new Int8Array(N);
    btag = new Uint8Array(N);
    const tgt = (i) => Array.from({ length: d }, (_, k) => Math.min(Ls[k] - 1, Math.floor(Math.floor(i / oldSt[k]) % oldLs[k] / 2)));
    const idxOf = (x) => {
      let j = 0;
      for (let k = 0; k < d; k++) j += (x[k] % Ls[k] + Ls[k]) % Ls[k] * st[k];
      return j;
    };
    for (let i = 0; i < oldN; i++) if (oblk[i]) blk[idxOf(tgt(i))] = 1;
    const parts = [];
    for (let i = 0; i < oldN; i++) if (oq[i] !== 0) parts.push(i);
    for (let m = parts.length - 1; m > 0; m--) {
      const r = Math.floor(rng() * (m + 1));
      const t2 = parts[m];
      parts[m] = parts[r];
      parts[r] = t2;
    }
    np = 0;
    for (const i of parts) {
      const x = tgt(i);
      const j = idxOf(x);
      const v = oq[i];
      if (q[j] === 0) {
        q[j] = v;
        rec[j] = orc[i];
        tag[j] = otg[i];
        blk[j] = 0;
        np++;
        continue;
      }
      if (!c.ncons && (s3 || annOK(v, q[j]))) {
        if (s3) {
          const g = S3MUL[q[j]][v];
          if (g === 0) {
            q[j] = 0;
            rec[j] = 0;
            tag[j] = 0;
            np--;
          } else {
            q[j] = g;
            tag[j] |= otg[i];
          }
        } else {
          q[j] = 0;
          rec[j] = 0;
          tag[j] = 0;
          np--;
        }
        continue;
      }
      let placed = false;
      for (let r = 1; r <= 3 && !placed; r++) {
        const offs = [];
        const rec2 = (k, cur) => {
          if (k === d) {
            if (Math.max(...cur.map(Math.abs)) === r) offs.push(cur.slice());
            return;
          }
          for (let o = -r; o <= r; o++) {
            cur.push(o);
            rec2(k + 1, cur);
            cur.pop();
          }
        };
        rec2(0, []);
        for (const o of offs) {
          const jj = idxOf(x.map((xx, k) => xx + o[k]));
          if (q[jj] === 0 && !blk[jj]) {
            q[jj] = v;
            rec[jj] = orc[i];
            tag[jj] = otg[i];
            np++;
            placed = true;
            break;
          }
        }
      }
      if (!placed) cccDrops++;
    }
    cccLight += nl;
    nl = 0;
    origin = origin.map((o, k) => Math.min(Ls[k] - 1, Math.floor(o / 2)));
    if (c.attract === "long") setupBlocks();
  };
  const samples = logSamples(T, 60);
  let si = 0;
  const ts = [], ns = [], ss = [], cs = [];
  let copiesPeak = 0, reach = 0, reachViol = 0;
  const cheb = (i) => {
    let m = 0;
    for (let a = 0; a < d; a++) {
      let dx = Math.abs(coord(i, a) - origin[a]);
      dx = Math.min(dx, Ls[a] - dx);
      if (dx > m) m = dx;
    }
    return m;
  };
  const Scg = () => {
    if (np === 0) return 0;
    const b = Ls.map((L) => d === 1 ? Math.max(4, Math.floor(L / 16)) : Math.max(2, Math.floor(L / 16)));
    const nbx = Ls.map((L, a) => Math.ceil(L / b[a]));
    const tot = nbx.reduce((p, x) => p * x, 1);
    const cnt = new Int32Array(tot), vol = new Int32Array(tot);
    for (let i = 0; i < N; i++) {
      let k = 0, s = 1;
      for (let a = 0; a < d; a++) {
        k += Math.floor(coord(i, a) / b[a]) * s;
        s *= nbx[a];
      }
      vol[k]++;
      if (q[i] !== 0) cnt[k]++;
    }
    let S = 0;
    for (let k = 0; k < tot; k++) S += lnC(vol[k], cnt[k]);
    return S / np;
  };
  const clus = () => {
    if (np < 2) return 0;
    let s = 0;
    for (let i = 0; i < N; i++) if (q[i] !== 0) s += occN(i);
    const rhoN = np / N;
    return s / np / (2 * d * rhoN);
  };
  const copies = () => {
    let k = 0;
    for (let i = 0; i < N; i++) if (tag[i] && q[i] !== 0) {
      k++;
      const r = cheb(i);
      if (r > reach) reach = r;
    }
    for (let m = 0; m < nl; m++) if (ltag[m]) {
      k++;
      const r = cheb(lp[m]);
      if (r > reach) reach = r;
    }
    return k;
  };
  const W = 1e3;
  const nrows = Math.min(T + 1, 300);
  const strip = d === 1 ? new Uint8Array(W * nrows) : null;
  let rowsDone = 0;
  const frames = [];
  const fEvery = Math.max(1, Math.floor(T / 40));
  const cellCat = (i) => q[i] !== 0 ? tag[i] && c.records ? 4 : zn || s3 ? q[i] % 2 ? 1 : 2 : q[i] > 0 ? 1 : 2 : 0;
  const snapRow = () => {
    if (!strip || rowsDone >= nrows) return;
    const L = Ls[0];
    const rank = (k) => k === 4 ? 4 : k === 1 || k === 2 ? 3 : k === 3 ? 2 : 0;
    const lightAt = new Uint8Array(L);
    for (let m = 0; m < nl; m++) lightAt[lp[m]] = 1;
    const ww = Math.min(W, L);
    for (let x = 0; x < ww; x++) {
      const s0 = Math.floor(x * L / ww), s1 = Math.max(s0 + 1, Math.floor((x + 1) * L / ww));
      let k = 0;
      for (let s = s0; s < s1; s++) {
        let v = cellCat(s);
        if (v === 0 && lightAt[s]) v = 3;
        if (rank(v) > rank(k)) k = v;
      }
      strip[rowsDone * W + x] = k;
    }
    for (let x = ww; x < W; x++) strip[rowsDone * W + x] = 255;
    rowsDone++;
  };
  const snapFrame = () => {
    if (d === 1) return;
    const w = Ls[0], h = Ls[1];
    const z = d === 3 ? Math.floor(Ls[2] / 2) : 0;
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = cellCat(x + y * st[1] + z * (d === 3 ? st[2] : 0));
    for (let m = 0; m < nl; m++) {
      const i = lp[m];
      if (d === 3 && coord(i, 2) !== z) continue;
      const o = coord(i, 1) * w + coord(i, 0);
      if (out[o] === 0) out[o] = 3;
    }
    frames.push({ w, h, kind: "cat", data: out });
  };
  const vmax = 2 * rsp + (lightOn ? Math.max(c.c, c.c2) : 0);
  const recSs = [];
  let holeViol = 0;
  const recS = () => {
    let a = 0, b = 0;
    for (let i = 0; i < N; i++) if (q[i] !== 0 && rec[i] !== 0) {
      if (rec[i] > 0) a++;
      else b++;
    }
    const n2 = a + b;
    if (!n2 || !a || !b) return 0;
    const f = a / n2;
    return -(f * Math.log(f) + (1 - f) * Math.log(1 - f));
  };
  const measure = (t2) => {
    ts.push(t2);
    ns.push(np / N);
    ss.push(Scg());
    const k = c.records ? copies() : 0;
    cs.push(k);
    if (k > copiesPeak) copiesPeak = k;
    const bound = vmax * t2;
    if (c.records && reach > bound) reachViol++;
    if (c.records) recSs.push(recS());
    if (hasHoles) {
      for (let i = 0; i < N; i++) if (q[i] !== 0 && blk[i]) holeViol++;
    }
  };
  snapRow();
  snapFrame();
  const S0 = Scg();
  let t = 0;
  const readPair = (i, j) => {
    const p = c.pr + (inAtt(i) ? c.satt : 0);
    if (rng() < p) {
      let s = i, u = j;
      if (tag[j] && !tag[i]) {
        s = j;
        u = i;
      } else if (!(tag[i] && !tag[j]) && rng() < 0.5) {
        s = j;
        u = i;
      }
      if (rec[u] !== rec[s] || tag[s] && !tag[u]) events++;
      rec[u] = rec[s];
      tag[u] |= tag[s];
      rd[u] = 1;
      err[u] = 0;
    }
  };
  const makePair = (i, j) => {
    const pv = pairVals();
    const r = rs();
    q[i] = pv[0];
    q[j] = pv[1];
    rec[i] = r;
    rec[j] = -r;
    tag[i] = 0;
    tag[j] = 0;
    err[i] = 0;
    err[j] = 0;
    np += 2;
    events++;
  };
  const sweep = () => {
    t++;
    const doBackup = c.a2 && nl === 0;
    if (doBackup) {
      bq.set(q);
      brec.set(rec);
      btag.set(tag);
      bnp = np;
    }
    hop.fill(0);
    rd.fill(0);
    if (c.attract === "long") computePhi();
    for (let a = 0; a < d; a++) for (let o = 0; o < 2; o++) {
      const L = Ls[a];
      for (let i = 0; i < N; i++) {
        const x = coord(i, a);
        if ((x & 1) !== o) continue;
        if (x === L - 1 && (L & 1) === 1) continue;
        if (c.open && a === 0 && x === L - 1) continue;
        if (rng() >= 0.5) continue;
        const j = nb(i, a, 1);
        const qi = q[i], qj = q[j];
        if (qi === 0 && qj === 0) {
          if (c.ncons || c.pc <= 0) continue;
          if (hasHoles && (blk[i] || blk[j])) continue;
          if (c.d2) {
            if (rng() < c.pc) {
              if (zn || s3) makePair(i, j);
              else {
                const s = rs(), r = rs();
                q[i] = pm ? s : 1;
                q[j] = pm ? -s : 1;
                rec[i] = r;
                rec[j] = -r;
                tag[i] = 0;
                tag[j] = 0;
                np += 2;
                events++;
              }
            }
          } else if (rng() < c.pc / 2) {
            q[i] = zn ? 1 + Math.floor(rng() * (nv - 1)) : s3 ? 1 + Math.floor(rng() * 5) : pm ? rs() : 1;
            rec[i] = rs();
            tag[i] = 0;
            err[i] = 0;
            np++;
            events++;
          }
        } else if (qi !== 0 && qj !== 0) {
          const ann = !c.ncons && (pm ? qi === -qj : zn ? (qi + qj) % nv === 0 : true) && (c.feedback !== "gate" || rec[i] !== 0 && rec[i] === rec[j]);
          if (ann && rng() < c.pa) {
            if (s3 && S3MUL[qi][qj] !== 0) {
              q[i] = S3MUL[qi][qj];
              tag[i] |= tag[j];
              q[j] = 0;
              tag[j] = 0;
              rec[j] = 0;
              err[j] = 0;
              np -= 1;
              events++;
              continue;
            }
            if (c.light) {
              addLight(i, a, -1, rec[i], c.records ? tag[i] : 0);
              addLight(j, a, 1, rec[j], c.records ? tag[j] : 0);
            }
            q[i] = 0;
            q[j] = 0;
            tag[i] = 0;
            tag[j] = 0;
            rec[i] = 0;
            rec[j] = 0;
            err[i] = 0;
            err[j] = 0;
            np -= 2;
            events++;
          } else if (c.records) readPair(i, j);
        } else if (c.ph > 0 && rng() < c.ph) {
          const s = qi !== 0 ? i : j, u = qi !== 0 ? j : i;
          if (hasHoles && blk[u]) continue;
          let dU = 0;
          if (c.attract === "short" && c.J !== 0) dU += -c.J * (occN(u) - 1 - occN(s));
          if (c.attract === "long") dU += phi[blockOf(u)] - phi[blockOf(s)];
          if (c.feedback === "bind" && c.records && rec[s] !== 0 && c.jr !== 0) dU += -c.jr * (sameN(u, rec[s]) - 1 - sameN(s, rec[s]));
          const ok = dU <= 0 || c.temp > 0 && rng() < Math.exp(-dU / c.temp);
          if (ok) {
            q[u] = q[s];
            rec[u] = rec[s];
            tag[u] = tag[s];
            err[u] = err[s];
            q[s] = 0;
            rec[s] = 0;
            tag[s] = 0;
            err[s] = 0;
            hop[u] = 1;
            events++;
          }
        }
      }
    }
    if (c.records && rsp > 1) for (let pass = 1; pass < rsp; pass++) for (let a = 0; a < d; a++) for (let o = 0; o < 2; o++) {
      const L = Ls[a];
      for (let i = 0; i < N; i++) {
        const x = coord(i, a);
        if ((x & 1) !== o) continue;
        if (x === L - 1 && (L & 1) === 1) continue;
        if (c.open && a === 0 && x === L - 1) continue;
        if (rng() >= 0.5) continue;
        const j = nb(i, a, 1);
        if (q[i] !== 0 && q[j] !== 0) readPair(i, j);
      }
    }
    if (c.pedge > 0 && !c.ncons) for (let i = 0; i < N; i++) {
      if (coord(i, 0) !== 0) continue;
      const j = nb(i, 0, 1);
      if (q[i] === 0 && q[j] === 0 && !blk[i] && !blk[j] && rng() < c.pedge) makePair(i, j);
    }
    if (lightOn && nl > 0) {
      let k = 0;
      while (k < nl) {
        let pos = lp[k], absorbed = false;
        if (c.start === "light" && c.lpair > 0 && rng() < c.lpair) {
          const p2 = nb(pos, lax[k], ldir[k]);
          if (q[pos] === 0 && q[p2] === 0 && !blk[pos] && !blk[p2] && !(c.open && lax[k] === 0 && (ldir[k] > 0 && coord(pos, 0) === Ls[0] - 1 || ldir[k] < 0 && coord(pos, 0) === 0))) {
            const pv = pairVals();
            q[pos] = pv[0];
            q[p2] = pv[1];
            rec[pos] = lrec[k];
            rec[p2] = lrec[k];
            tag[pos] = c.records ? ltag[k] : 0;
            tag[p2] = 0;
            err[pos] = 0;
            err[p2] = 0;
            np += 2;
            converted++;
            events++;
            nl--;
            lp[k] = lp[nl];
            lax[k] = lax[nl];
            ldir[k] = ldir[nl];
            lrec[k] = lrec[nl];
            ltag[k] = ltag[nl];
            continue;
          }
        }
        let lost = false;
        const sp = ldir[k] < 0 && c.c2 > 0 ? c.c2 : c.c;
        for (let m = 0; m < sp; m++) {
          if (c.open && lax[k] === 0 && (ldir[k] > 0 && coord(pos, 0) === Ls[0] - 1 || ldir[k] < 0 && coord(pos, 0) === 0)) {
            lost = true;
            edgeLost++;
            break;
          }
          pos = nb(pos, lax[k], ldir[k]);
          if (hasHoles && blk[pos]) {
            lost = true;
            holeLost++;
            break;
          }
          if (q[pos] !== 0) {
            if (c.records) {
              if (!(tag[pos] && !ltag[k])) rec[pos] = lrec[k];
              tag[pos] |= ltag[k];
              rd[pos] = 1;
              err[pos] = 0;
            }
            absorbed = true;
            break;
          }
        }
        if (lost) absorbed = true;
        events++;
        if (absorbed) {
          nl--;
          lp[k] = lp[nl];
          lax[k] = lax[nl];
          ldir[k] = ldir[nl];
          lrec[k] = lrec[nl];
          ltag[k] = ltag[nl];
        } else {
          lp[k] = pos;
          k++;
        }
      }
    }
    if (c.records) {
      if (c.leak !== "off" && c.gamma > 0) {
        for (let i = 0; i < N; i++) if (q[i] !== 0 && (c.leak === "uniform" || !hop[i]) && rng() < c.gamma) {
          if (K > 1) {
            const before = err[i] > K / 2;
            err[i] += rng() < (K - err[i]) / K ? 1 : -1;
            const after = err[i] > K / 2;
            if (before !== after) {
              rec[i] = -rec[i];
              if (after) {
                if (tag[i]) events++;
                tag[i] = 0;
              }
            }
          } else {
            rec[i] = -rec[i];
            if (tag[i]) events++;
            tag[i] = 0;
          }
        }
        if (c.leak === "uniform") {
          for (let m = 0; m < nl; m++) if (rng() < c.gamma) {
            lrec[m] = -lrec[m];
            ltag[m] = 0;
          }
        }
      }
      if (c.d3 && c.forget > 0) {
        for (let i = 0; i < N; i++) if (q[i] !== 0 && rec[i] !== 0 && !rd[i]) {
          const f = c.forget * (inAtt(i) ? Math.max(0, 1 - c.satt) : 1);
          if (rng() < f) {
            rec[i] = 0;
            tag[i] = 0;
            events++;
          }
        }
      }
    }
    if (np === 0 && nl === 0 && c.a2 && doBackup) {
      q.set(bq);
      rec.set(brec);
      tag.set(btag);
      np = bnp;
      vetoes++;
    }
    if (s3 && !c.ncons) {
      if (s3class() !== C0) {
        if (consOK) consMsg = `S3 class of the ordered product changed at step ${t}`;
        consOK = false;
      }
    } else if (c.d2 && !c.ncons) {
      if (pm ? charge() !== Q0 : zn ? modn(charge()) !== modn(Q0) : np % 2 !== np0 % 2) {
        if (consOK) consMsg = `charge changed at step ${t}`;
        consOK = false;
      }
    }
    if (c.ncons && np !== np0) {
      if (consOK) consMsg = `particle count changed at step ${t}`;
      consOK = false;
    }
    if (events > 0) lastEvent = t;
    events = 0;
    if (hasHoles && c.hfill > 0) {
      for (let i = 0; i < N; i++) if (blk[i] && rng() < c.hfill) blk[i] = 0;
    }
    if (c.expand && (c.sched === "exp" || !c.sched) && c.H > 0) {
      const Lt = Math.floor(Math.min(L0 * Math.exp(c.H * t), c.grow * L0));
      let guard = 0;
      while (Ls.some((L) => L < Lt) && guard < 64) {
        const a = axisTurn % d;
        axisTurn++;
        if (Ls[a] < Lt) insertPlane(a, Math.floor(rng() * (Ls[a] + 1)));
        guard++;
      }
    } else if (c.expand && c.sched && c.sched !== "exp") {
      let aF = 1;
      const amin = Math.max(0.1, Math.min(1, c.amin));
      const nc = Math.max(1, Math.round(c.ncyc));
      if (c.sched === "bounce") aF = amin + (1 - amin) * Math.abs(2 * t / T - 1);
      else if (c.sched === "breathe") aF = 1 + (c.grow - 1) * 0.5 * (1 - Math.cos(TWO * nc * t / T));
      else {
        const A = Math.max(1, Math.floor(T / nc));
        const tau = t % A;
        if (tau === 0 && t < T) {
          cccRescale();
          aF = 1;
        } else aF = 1 + (c.grow - 1) * (tau === 0 ? A : tau) / A;
      }
      const Lt = Math.max(4, Math.round(L0 * aF));
      let guard = 0;
      for (let pass = 0; pass < 64 && guard < 64; pass++) {
        const a = axisTurn % d;
        axisTurn++;
        guard++;
        if (Ls[a] < Lt) insertPlane(a, Math.floor(rng() * (Ls[a] + 1)));
        else if (Ls[a] > Lt) {
          if (!removePlane(a)) {
            if (Ls.every((L) => L >= Lt)) break;
          }
        } else if (Ls.every((L) => L === Lt)) break;
      }
      if (Ls[0] < sideMin) sideMin = Ls[0];
      if (Ls[0] > sideMax) sideMax = Ls[0];
    }
    if (si < samples.length && t === samples[si]) {
      measure(t);
      si++;
    }
    if (strip && t >= Math.round(rowsDone * T / (nrows - 1))) snapRow();
    if (t % fEvery === 0) snapFrame();
  };
  const finish = () => {
    const sl = slope(ts, ns, T / 4, T);
    const C = clus();
    const win = Math.max(50, Math.floor(T / 20));
    const frozen = np + nl > 0 && T - lastEvent >= win;
    const verdict = !consOK ? "FAILS" : np === 0 && nl === 0 ? "DIES" : frozen ? "FREEZES" : C >= 2 && np >= 10 ? "CLUMPS" : sl !== null && sl < -0.1 ? "GROWS" : sl !== null && sl > 0.1 ? "DECAYS" : "STEADY";
    const te = verdict === "DECAYS" && sl !== null && np > 0 ? T * Math.pow(np, 1 / sl) : null;
    const S1 = ss.length ? ss[ss.length - 1] : 0;
    const dS = S1 - (ss.length ? ss[0] : S0);
    const cEnd = c.records ? copies() : 0;
    const alpha = c.pc === 0 && !c.expand && !c.ncons ? sl : null;
    const bound = vmax * T;
    const checks = [
      { name: "Conservation", pass: c.d2 && !c.ncons || c.ncons || s3 && !c.ncons ? consOK : null, detail: c.ncons ? consOK ? `particle count stayed ${np0} every step` : consMsg : s3 ? consOK ? `S3 class of the ordered product stayed ${["e", "transposition", "3-cycle"][C0]} every step` : consMsg : c.d2 ? consOK ? pm ? `charge stayed ${Q0} every step` : zn ? `charge mod ${nv} stayed ${modn(Q0)} every step` : "particle-count parity kept every step" : consMsg : "no conservation law declared (pair rule and number conservation off)" },
      { name: "No nothing (A2)", pass: c.a2 ? true : null, detail: c.a2 ? `never empty; vetoes: ${vetoes}${drops ? `; light drops at cap: ${drops}` : ""}` : "off" },
      { name: "Records", pass: c.records ? cEnd > 0 : null, detail: c.records ? `${cEnd} copies of the tracked fact at the end (peak ${copiesPeak}); farthest copy ${reach} sites from the start, locality bound ${bound}` + (reachViol ? ` (bound broken ${reachViol} times!)` : "") : "records off" },
      { name: "Locality", pass: c.records ? reachViol === 0 : null, detail: c.records ? reachViol === 0 ? `the fact never outran the light cone (${vmax} sites per step)` : `broken ${reachViol} times` : "needs records on to track" },
      { name: "Arrow", pass: null, detail: `coarse-grained entropy per particle ${arrow(dS)} (${dS >= 0 ? "+" : ""}${dS.toFixed(2)} nats)` },
      { name: "Structure", pass: null, detail: `clustering index ${C.toFixed(2)} (1 = random, \u2265 2 counts as clumps)` },
      { name: "Trend", pass: null, detail: sl === null ? "slope undefined (density hit zero in the window)" : `density slope ${sl.toFixed(3)} on t \u2208 [${Math.round(T / 4)}, ${T}]` + (alpha !== null ? ` (decay exponent \u03B1)` : "") + (te !== null ? `; at this rate it empties near t \u2248 ${te.toExponential(1)}` : "") }
    ];
    const warn = [];
    if (drops) warn.push(`${drops} light quanta were dropped at the capacity cap.`);
    if (c.alphabet === "s3" && d !== 1) warn.push("The S3 alphabet is 1D only; this run used \xB11 charges.");
    if (stalls) warn.push(`Contraction stalled ${stalls} times (no empty plane to remove).`);
    if (cccDrops) warn.push(`${cccDrops} particles found no room at an aeon rescale and were dropped.`);
    const rS = c.records && recSs.length ? recSs[recSs.length - 1] : null;
    return {
      family: "P",
      verdict,
      checks,
      ts,
      ns,
      ss,
      cs,
      frames,
      strip: strip ? { w: W, h: rowsDone, kind: "cat", data: strip.slice(0, W * rowsDone) } : null,
      warn,
      ylabel: "particle density",
      m: {
        density: np / N,
        particles: np,
        light: nl,
        slope: sl,
        alpha,
        clustering: C,
        copies: c.records ? cEnd : null,
        copiesPeak: c.records ? copiesPeak : null,
        reach: c.records ? reach : null,
        dS,
        S: S1,
        tEmpty: te,
        vetoes,
        side: Ls[0],
        scale: Ls[0] / L0,
        stalls,
        cccDrops,
        cccLight,
        edgeLost,
        holeLost,
        converted,
        blocked: hasHoles ? blk.reduce((p, x) => p + x, 0) : 0,
        sideMin,
        sideMax,
        recS: rS,
        recS0: c.records && recSs.length ? recSs[0] : null,
        charge: charge(),
        np0,
        Q0,
        holeViol
      }
    };
  };
  return { total: T, get done() {
    return t;
  }, stepOnce: sweep, finish };
}
function makeF(c) {
  const rng = mulberry32(c.seed);
  const L = Math.max(8, Math.min(192, Math.round(c.size)));
  const n = L * L, dt = 0.05, T = Math.max(1, Math.round(c.steps));
  const fixed = c.fixed;
  const gauge = c.gauge && fixed;
  const th = new Float64Array(n), re = new Float64Array(n), im = new Float64Array(n), F = new Float64Array(n), prev = new Float64Array(n);
  const Ax = new Float64Array(n), Ay = new Float64Array(n), FAx = new Float64Array(n), FAy = new Float64Array(n);
  const v = new Int8Array(n), mask = new Uint8Array(n);
  let spare = null;
  const gauss = () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    while (u === 0) u = rng();
    const w = rng();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(TWO * w);
    return r * Math.cos(TWO * w);
  };
  const fs = c.fstart || "random";
  if (fs === "random") for (let i = 0; i < n; i++) {
    th[i] = rng() * TWO;
    re[i] = Math.cos(th[i]);
    im[i] = Math.sin(th[i]);
  }
  else {
    const yc = Math.floor(L / 2) + 0.5, x1 = Math.floor(L / 4) + 0.5, x2 = Math.floor(3 * L / 4) + 0.5, wd = Math.round(c.wind);
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const i = y * L + x;
      let v2 = 0;
      if (fs === "glitch") v2 = x === Math.floor(L / 2) && y === Math.floor(L / 2) ? Math.PI - 1e-3 : 0;
      else if (fs === "pair") v2 = Math.atan2(y - yc, x - x1) - Math.atan2(y - yc, x - x2);
      else if (fs === "twist") v2 = TWO * wd * x / L + 0.1 * rng();
      th[i] = v2;
      re[i] = Math.cos(v2);
      im[i] = Math.sin(v2);
    }
  }
  const id = (x, y) => (y + L) % L * L + (x + L) % L;
  const winding = () => {
    let tot = 0;
    for (let y = 0; y < L; y++) {
      let s2 = 0;
      for (let x = 0; x < L; x++) s2 += wrap(th[id(x + 1, y)] - th[id(x, y)]);
      tot += Math.round(s2 / TWO);
    }
    return tot / L;
  };
  const W0 = winding();
  let V0 = -1;
  let netCharge = 0;
  const vort = () => {
    let cnt2 = 0, net = 0;
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const i = id(x, y), r = id(x + 1, y), u = id(x, y + 1), ru = id(x + 1, y + 1);
      if (gauge) {
        const s = wrap(th[r] - th[i] - Ax[i]) + wrap(th[ru] - th[r] - Ay[r]) - wrap(th[ru] - th[u] - Ax[u]) - wrap(th[u] - th[i] - Ay[i]);
        const Fp = Ax[i] + Ay[r] - Ax[u] - Ay[i];
        net += (s + Fp) / TWO;
        const k = Math.round((s + wrap(Fp)) / TWO);
        v[i] = k;
        if (k) cnt2++;
      } else {
        const s = wrap(th[r] - th[i]) + wrap(th[ru] - th[r]) + wrap(th[u] - th[ru]) + wrap(th[i] - th[u]);
        const k = Math.round(s / TWO);
        v[i] = k;
        net += k;
        if (k) cnt2++;
      }
    }
    netCharge = net;
    return cnt2;
  };
  const energy = () => {
    let E = 0;
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const i = id(x, y), r = id(x + 1, y), u = id(x, y + 1);
      E -= Math.cos(th[r] - th[i] - Ax[i]) + Math.cos(th[u] - th[i] - Ay[i]);
      if (gauge) E -= c.beta * Math.cos(Ax[i] + Ay[r] - Ax[u] - Ay[i]);
    }
    return E;
  };
  const xi = () => {
    const C = [1];
    for (let r = 1; r <= Math.floor(L / 2); r++) {
      let s = 0;
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
        let a = 0;
        if (gauge) for (let k = 0; k < r; k++) a += Ax[id(x + k, y)];
        s += Math.cos(th[id(x + r, y)] - th[id(x, y)] - a);
      }
      C.push(s / n);
    }
    for (let r = 1; r < C.length; r++) if (C[r] < 1 / Math.E) {
      const f = (C[r - 1] - 1 / Math.E) / (C[r - 1] - C[r]);
      return r - 1 + f;
    }
    return L / 2;
  };
  const a0 = Math.floor(L / 4), a1 = Math.floor(3 * L / 4);
  let minAmp = 1, lastMove = 0;
  const samples = logSamples(T, 60);
  let si = 0;
  const ts = [], ns = [], ss = [], cs = [];
  let cnt = vort();
  V0 = cnt;
  const E0 = energy();
  let chargeOK = Math.abs(netCharge) < 1e-6;
  const frames = [];
  const fEvery = Math.max(1, Math.floor(T / 30));
  const snap = () => {
    const f = new Float32Array(n);
    for (let i = 0; i < n; i++) f[i] = th[i];
    frames.push({ w: L, h: L, kind: "phase", data: f, vort: new Int8Array(v) });
  };
  snap();
  let t = 0;
  const step = () => {
    t++;
    if (!fixed) for (let i = 0; i < n; i++) th[i] = Math.atan2(im[i], re[i]);
    if (c.noise === "cores") {
      vort();
      mask.fill(0);
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) if (v[id(x, y)] !== 0) {
        mask[id(x, y)] = 1;
        mask[id(x + 1, y)] = 1;
        mask[id(x, y + 1)] = 1;
        mask[id(x + 1, y + 1)] = 1;
      }
    }
    const nz = (i, x, y) => {
      let s = 0;
      if (c.temp > 0 && (c.noise === "uniform" || c.noise === "cores" && mask[i])) s += 2 * c.temp;
      if (c.attention && x >= a0 && x < a1 && y >= a0 && y < a1) s += 2 * c.satt;
      return s;
    };
    prev.set(th);
    if (fixed) {
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
        const i = id(x, y), r = id(x + 1, y), l = id(x - 1, y), u = id(x, y + 1), dn = id(x, y - 1);
        F[i] = Math.sin(th[r] - th[i] - Ax[i]) - Math.sin(th[i] - th[l] - Ax[l]) + Math.sin(th[u] - th[i] - Ay[i]) - Math.sin(th[i] - th[dn] - Ay[dn]);
        if (gauge) {
          const pl = (xx, yy) => {
            const k = id(xx, yy);
            return Math.sin(Ax[k] + Ay[id(xx + 1, yy)] - Ax[id(xx, yy + 1)] - Ay[k]);
          };
          FAx[i] = Math.sin(th[r] - th[i] - Ax[i]) - c.beta * (pl(x, y) - pl(x, y - 1));
          FAy[i] = Math.sin(th[u] - th[i] - Ay[i]) - c.beta * (-pl(x, y) + pl(x - 1, y));
        }
      }
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
        const i = id(x, y);
        const s = nz(i, x, y);
        th[i] += F[i] * dt + (s > 0 ? Math.sqrt(s * dt) * gauss() : 0);
        if (gauge) {
          Ax[i] += FAx[i] * dt + (s > 0 ? Math.sqrt(s * dt) * gauss() : 0);
          Ay[i] += FAy[i] * dt + (s > 0 ? Math.sqrt(s * dt) * gauss() : 0);
        }
      }
    } else {
      const nr = new Float64Array(n), ni = new Float64Array(n);
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
        const i = id(x, y);
        const r = re[i], qq = im[i];
        const a2 = r * r + qq * qq;
        const lr = re[id(x + 1, y)] + re[id(x - 1, y)] + re[id(x, y + 1)] + re[id(x, y - 1)] - 4 * r;
        const li = im[id(x + 1, y)] + im[id(x - 1, y)] + im[id(x, y + 1)] + im[id(x, y - 1)] - 4 * qq;
        const s = nz(i, x, y) / 2;
        nr[i] = r + (lr + (1 - a2) * r) * dt + (s > 0 ? Math.sqrt(s * dt) * gauss() : 0);
        ni[i] = qq + (li + (1 - a2) * qq) * dt + (s > 0 ? Math.sqrt(s * dt) * gauss() : 0);
      }
      re.set(nr);
      im.set(ni);
      for (let i = 0; i < n; i++) {
        const a = Math.hypot(re[i], im[i]);
        if (a < minAmp) minAmp = a;
        th[i] = Math.atan2(im[i], re[i]);
      }
    }
    let md = 0;
    for (let i = 0; i < n; i++) {
      const dd = Math.abs(wrap(th[i] - prev[i]));
      if (dd > md) md = dd;
    }
    if (md >= 1e-6) lastMove = t;
    if (si < samples.length && t === samples[si]) {
      cnt = vort();
      if (Math.abs(netCharge) > 1e-6) chargeOK = false;
      ts.push(t * dt);
      ns.push(cnt / n);
      ss.push(energy() / n);
      cs.push(0);
      si++;
    }
    if (t % fEvery === 0) {
      vort();
      snap();
    }
  };
  const finish = () => {
    cnt = vort();
    if (Math.abs(netCharge) > 1e-6) chargeOK = false;
    const sl = slope(ts, ns, T * dt / 4, T * dt);
    const auditFail = !fixed && c.audit && minAmp < 0.05;
    const frozen = cnt > 0 && T - lastMove >= 200;
    const verdict = auditFail || !chargeOK ? "FAILS" : cnt === 0 ? "ORDERED" : frozen ? "FREEZES" : sl !== null && sl > 0.1 ? "COARSENING" : "DISORDERED";
    const X = xi();
    const E1 = energy();
    const checks = [
      { name: "Conservation", pass: chargeOK, detail: `net vortex charge ${gauge ? netCharge.toExponential(1) : netCharge} (must be 0 on a closed torus)` },
      { name: "No nothing (A2)", pass: fixed ? true : c.audit ? !auditFail : null, detail: fixed ? "arrow size fixed at 1, never zero" : `size free; smallest size ${minAmp.toFixed(3)}` + (c.audit ? " (audit fails below 0.05)" : " (audit off)") },
      { name: "Structure", pass: null, detail: `correlation length \u03BE ${X >= L / 2 ? "\u2265 " + L / 2 : X.toFixed(1)} sites; ${cnt} vortices` },
      { name: "Arrow", pass: null, detail: `energy per site ${(E0 / n).toFixed(3)} \u2192 ${(E1 / n).toFixed(3)}; overdamped dynamics is irreversible by construction` },
      { name: "Trend", pass: null, detail: sl === null ? "slope undefined (no vortices left)" : `vortex-density slope ${sl.toFixed(3)} (effective, not universal)` }
    ];
    const warn = [];
    if (c.gauge && !fixed) warn.push("Gauge links need the fixed-size field; gauge was not applied.");
    return { family: "F", verdict, checks, ts, ns, ss, cs, frames, strip: null, warn, ylabel: "vortex density", m: { vortices: cnt, density: cnt / n, slope: sl, xi: X, energy: E1 / n, minAmp: fixed ? 1 : minAmp, netCharge, vort0: V0, wind0: W0, wind1: winding() } };
  };
  return { total: T, get done() {
    return t;
  }, stepOnce: step, finish };
}
function makeQ(c) {
  const rng = mulberry32(c.seed);
  const d = c.dim >= 2 ? 2 : 1;
  const T = Math.max(1, Math.round(c.steps));
  const L = d === 1 ? 2 * T + 1 : Math.min(301, 2 * T + 1);
  const n = d === 1 ? L : L * L;
  const x0 = Math.floor(L / 2);
  const ar = new Float64Array(n), ai = new Float64Array(n), br = new Float64Array(n), bi = new Float64Array(n);
  const tr = new Float64Array(n), ti = new Float64Array(n);
  const dis = new Float64Array(n);
  if (c.disorder > 0) for (let i = 0; i < n; i++) dis[i] = c.disorder * rng() * TWO;
  const i0 = d === 1 ? x0 : x0 * L + x0;
  ar[i0] = Math.SQRT1_2;
  bi[i0] = Math.SQRT1_2;
  const psi0 = { ar: new Float64Array(ar), ai: new Float64Array(ai), br: new Float64Array(br), bi: new Float64Array(bi) };
  const S2 = Math.SQRT1_2;
  const coin = () => {
    for (let i = 0; i < n; i++) {
      const a = ar[i], b = ai[i], cc = br[i], e = bi[i];
      ar[i] = (a + cc) * S2;
      ai[i] = (b + e) * S2;
      br[i] = (a - cc) * S2;
      bi[i] = (b - e) * S2;
    }
  };
  const shift = (s, sign) => {
    const mv = (re, imm, dir) => {
      for (let i = 0; i < n; i++) {
        const x = Math.floor(i / s) % L;
        const y = (x + dir + L) % L;
        const j = i + (y - x) * s;
        tr[j] = re[i];
        ti[j] = imm[i];
      }
      re.set(tr);
      imm.set(ti);
    };
    mv(ar, ai, -sign);
    mv(br, bi, sign);
  };
  const phase = (sgn) => {
    if (c.disorder > 0) for (let i = 0; i < n; i++) {
      const cs2 = Math.cos(sgn * dis[i]), sn = Math.sin(sgn * dis[i]);
      let a = ar[i], b = ai[i];
      ar[i] = a * cs2 - b * sn;
      ai[i] = a * sn + b * cs2;
      a = br[i];
      b = bi[i];
      br[i] = a * cs2 - b * sn;
      bi[i] = a * sn + b * cs2;
    }
  };
  const kick = () => {
    if (c.deph > 0 && c.bath <= 0 && t > (c.dephT > 0 ? c.dephT : 0)) {
      for (let i = 0; i < n; i++) if (rng() < c.deph) {
        const p = rng() * TWO, cs2 = Math.cos(p), sn = Math.sin(p);
        let a = ar[i], b = ai[i];
        ar[i] = a * cs2 - b * sn;
        ai[i] = a * sn + b * cs2;
        a = br[i];
        b = bi[i];
        br[i] = a * cs2 - b * sn;
        bi[i] = a * sn + b * cs2;
      }
    }
  };
  const nb = c.bath > 0 ? Math.max(1, Math.round(Math.min(0.5, c.bath) * L)) : 0;
  const bw = [];
  for (let k = 0; k < nb; k++) bw.push(d === 1 ? Math.floor(rng() * n) : Math.floor(rng() * n));
  let bathKicks = 0;
  const bathStep = () => {
    for (let k = 0; k < nb; k++) {
      let i = bw[k];
      const r = rng();
      if (d === 1) i = (i + (r < 0.5 ? 1 : -1) + n) % n;
      else {
        const x = i % L, y = Math.floor(i / L);
        const dir = Math.floor(r * 4);
        const nx = (x + (dir === 0 ? 1 : dir === 1 ? -1 : 0) + L) % L, ny = (y + (dir === 2 ? 1 : dir === 3 ? -1 : 0) + L) % L;
        i = ny * L + nx;
      }
      bw[k] = i;
      const p = rng() * TWO, cs2 = Math.cos(p), sn = Math.sin(p);
      let a = ar[i], b = ai[i];
      ar[i] = a * cs2 - b * sn;
      ai[i] = a * sn + b * cs2;
      a = br[i];
      b = bi[i];
      br[i] = a * cs2 - b * sn;
      bi[i] = a * sn + b * cs2;
      bathKicks++;
    }
  };
  const fwd = () => {
    coin();
    shift(1, 1);
    if (d === 2) {
      coin();
      shift(L, 1);
    }
    phase(1);
    kick();
    if (nb) bathStep();
  };
  const bwd = () => {
    if (nb) bathStep();
    kick();
    phase(-1);
    if (d === 2) {
      shift(L, -1);
      coin();
    }
    shift(1, -1);
    coin();
  };
  const prob = (i) => ar[i] * ar[i] + ai[i] * ai[i] + br[i] * br[i] + bi[i] * bi[i];
  const samples = logSamples(T, 60);
  let si = 0;
  const ts = [], ns = [], ss = [], cs = [];
  let outside = 0, normErr = 0, hitEdge = false;
  const stats = (t2) => {
    let m2 = 0, H = 0, norm = 0, out = 0;
    for (let i = 0; i < n; i++) {
      const p = prob(i);
      if (p === 0) continue;
      norm += p;
      const x = i % L - x0, y = d === 2 ? Math.floor(i / L) - x0 : 0;
      m2 += p * (x * x + y * y);
      if (p > 1e-300) H -= p * Math.log(p);
      if (Math.max(Math.abs(x), Math.abs(y)) > t2) out += p;
      if (Math.max(Math.abs(x), Math.abs(y)) >= x0) hitEdge = true;
    }
    return { sig: Math.sqrt(m2 / norm), H, norm, out };
  };
  const W = 1e3;
  const nrows = Math.min(T + 1, 300);
  const strip = d === 1 ? new Float32Array(W * nrows) : null;
  let rows = 0;
  const frames = [];
  const fEvery = Math.max(1, Math.floor(T / 40));
  const snapRow = () => {
    if (!strip || rows >= nrows) return;
    const ww = Math.min(W, L);
    let mx = 0;
    const tmp = new Float32Array(ww);
    for (let x = 0; x < ww; x++) {
      const s0 = Math.floor(x * L / ww), s1 = Math.max(s0 + 1, Math.floor((x + 1) * L / ww));
      let v = 0;
      for (let s = s0; s < s1; s++) v = Math.max(v, prob(s));
      tmp[x] = v;
      if (v > mx) mx = v;
    }
    for (let x = 0; x < W; x++) strip[rows * W + x] = x < ww && mx > 0 ? Math.sqrt(tmp[x] / mx) : 0;
    rows++;
  };
  const snapFrame = () => {
    if (d !== 2) return;
    let mx = 0;
    const f = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      f[i] = prob(i);
      if (f[i] > mx) mx = f[i];
    }
    for (let i = 0; i < n; i++) f[i] = mx > 0 ? Math.sqrt(f[i] / mx) : 0;
    const ph = new Uint8Array(n);
    for (let i = 0; i < n; i++) ph[i] = Math.round((Math.atan2(ai[i], ar[i]) / TWO + 1) % 1 * 255);
    frames.push({ w: L, h: L, kind: "scalar", data: f, aux: ph });
  };
  snapRow();
  snapFrame();
  const total = c.echo ? 2 * T : T;
  let t = 0;
  let fid = null;
  let lastSig = 0, lastH = 0;
  let sigPre = null, sigPost = null, measAt = -1;
  const step = () => {
    t++;
    if (t <= T) {
      fwd();
      if (c.measT > 0 && t === Math.round(c.measT)) {
        const pre = stats(t);
        sigPre = pre.sig;
        let r = rng() * pre.norm, pick = n - 1;
        for (let i = 0; i < n; i++) {
          r -= prob(i);
          if (r <= 0) {
            pick = i;
            break;
          }
        }
        const p = prob(pick);
        const f = p > 0 ? 1 / Math.sqrt(p) : 0;
        for (let i = 0; i < n; i++) if (i !== pick) {
          ar[i] = 0;
          ai[i] = 0;
          br[i] = 0;
          bi[i] = 0;
        } else {
          ar[i] *= f;
          ai[i] *= f;
          br[i] *= f;
          bi[i] *= f;
        }
        measAt = pick;
        const post = stats(t);
        sigPost = post.sig;
      }
      if (si < samples.length && t === samples[si]) {
        const s = stats(t);
        ts.push(t);
        ns.push(s.sig);
        ss.push(s.H);
        cs.push(0);
        outside = Math.max(outside, s.out);
        normErr = Math.max(normErr, Math.abs(1 - s.norm));
        lastSig = s.sig;
        lastH = s.H;
        si++;
      }
      if (strip && t >= Math.round(rows * T / (nrows - 1))) snapRow();
      if (t % fEvery === 0) snapFrame();
    } else {
      bwd();
      if (t === total) {
        let re = 0, imv = 0;
        for (let i = 0; i < n; i++) {
          re += psi0.ar[i] * ar[i] + psi0.ai[i] * ai[i] + psi0.br[i] * br[i] + psi0.bi[i] * bi[i];
          imv += psi0.ar[i] * ai[i] - psi0.ai[i] * ar[i] + psi0.br[i] * bi[i] - psi0.bi[i] * br[i];
        }
        fid = re * re + imv * imv;
      }
    }
  };
  const finish = () => {
    const mt = c.measT > 0 && c.measT <= T ? Math.round(c.measT) : 0;
    const beta = slope(ts, ns.map((v) => v > 0 ? 1 / v : 0), Math.max(T / 4, mt + 1), T);
    const betaEarly = c.dephT > 0 ? slope(ts, ns.map((v) => v > 0 ? 1 / v : 0), T / 8, Math.min(T, c.dephT)) : null;
    const betaLate = c.dephT > 0 ? slope(ts, ns.map((v) => v > 0 ? 1 / v : 0), Math.max(c.dephT, T / 4), T) : null;
    const fail = normErr > 1e-9 || outside > 0;
    const verdict = fail ? "FAILS" : beta === null ? "LOCALIZED" : beta < 0.25 ? "LOCALIZED" : beta > 0.8 ? "BALLISTIC" : "DIFFUSIVE";
    const checks = [
      { name: "Conservation", pass: normErr <= 1e-9, detail: `total probability stays 1 (largest error ${normErr.toExponential(1)})` },
      { name: "No nothing (A2)", pass: true, detail: "automatic: total probability is always 1" },
      { name: "Locality", pass: outside === 0, detail: outside === 0 ? "no amplitude ever outside the light cone |x| \u2264 t" : `weight ${outside.toExponential(1)} outside the light cone` },
      { name: "Spread", pass: null, detail: beta === null ? "undefined" : `\u03C3 grows as t^${beta.toFixed(2)} (1 = ballistic wave, 0.5 = diffusion, 0 = localized); \u03C3(T) = ${lastSig.toFixed(1)}` },
      { name: "Arrow", pass: null, detail: fid === null ? `position entropy ${lastH.toFixed(2)} nats; turn on the echo test to check reversibility` : `run backwards: returns to the start with fidelity ${fid.toFixed(6)}` + (fid > 1 - 1e-9 ? " (fully reversible)" : " (dephasing made it irreversible)") }
    ];
    const warn = [];
    if (hitEdge) warn.push("The walk reached the lattice edge (2D side is capped at 301); wrapped amplitude may interfere.");
    return { family: "Q", verdict, checks, ts, ns, ss, cs, frames, strip: strip ? { w: W, h: rows, kind: "scalar", data: strip.slice(0, W * rows) } : null, warn, ylabel: "spread \u03C3", m: { beta, sigma: lastSig, entropy: lastH, echo: fid, normErr, betaEarly, betaLate, sigPre, sigPost, measAt: measAt >= 0 ? measAt % L - x0 : null, bathKicks } };
  };
  return { total, get done() {
    return t;
  }, stepOnce: step, finish };
}
function makeQ2(c) {
  const T = Math.max(1, Math.min(120, Math.round(c.steps)));
  const L = 2 * T + 1, x0 = T, D = 2 * L, M = D * D;
  let re = new Float64Array(M), im = new Float64Array(M), tr = new Float64Array(M), ti = new Float64Array(M);
  const ix = (xa, ca, xb, cb) => (2 * xa + ca) * D + 2 * xb + cb;
  if (c.qent === "entangled") {
    re[ix(x0, 0, x0, 1)] = Math.SQRT1_2;
    re[ix(x0, 1, x0, 0)] = -Math.SQRT1_2;
  } else {
    re[ix(x0, 0, x0, 0)] = 0.5;
    im[ix(x0, 0, x0, 1)] = 0.5;
    im[ix(x0, 1, x0, 0)] = 0.5;
    re[ix(x0, 1, x0, 1)] = -0.5;
  }
  const S = Math.SQRT1_2;
  let t = 0;
  const lo = () => Math.max(0, x0 - t - 1), hi = () => Math.min(L - 1, x0 + t + 1);
  const coinA = () => {
    for (let xa = lo(); xa <= hi(); xa++) {
      const r0 = 2 * xa * D, r1 = r0 + D;
      for (let B = 2 * lo(); B < 2 * hi() + 2; B++) {
        const a = re[r0 + B], b = im[r0 + B], cc = re[r1 + B], e = im[r1 + B];
        re[r0 + B] = (a + cc) * S;
        im[r0 + B] = (b + e) * S;
        re[r1 + B] = (a - cc) * S;
        im[r1 + B] = (b - e) * S;
      }
    }
  };
  const coinB = () => {
    for (let A = 2 * lo(); A < 2 * hi() + 2; A++) {
      const base = A * D;
      for (let xb = lo(); xb <= hi(); xb++) {
        const j0 = base + 2 * xb, j1 = j0 + 1;
        const a = re[j0], b = im[j0], cc = re[j1], e = im[j1];
        re[j0] = (a + cc) * S;
        im[j0] = (b + e) * S;
        re[j1] = (a - cc) * S;
        im[j1] = (b - e) * S;
      }
    }
  };
  const shift = () => {
    tr.fill(0);
    ti.fill(0);
    for (let A = 2 * lo(); A < 2 * hi() + 2; A++) {
      const xa = A >> 1, ca = A & 1;
      const nxa = (xa + (ca === 0 ? -1 : 1) + L) % L;
      for (let B = 2 * lo(); B < 2 * hi() + 2; B++) {
        const i = A * D + B;
        if (re[i] === 0 && im[i] === 0) continue;
        const xb = B >> 1, cb = B & 1;
        const nxb = (xb + (cb === 0 ? -1 : 1) + L) % L;
        const j = (2 * nxa + ca) * D + 2 * nxb + cb;
        tr[j] = re[i];
        ti[j] = im[i];
      }
    }
    let a = re;
    re = tr;
    tr = a;
    a = im;
    im = ti;
    ti = a;
  };
  const margA = () => {
    const p = new Float64Array(L);
    for (let A = 0; A < D; A++) {
      let s = 0;
      const base = A * D;
      for (let B = 2 * lo(); B < 2 * hi() + 2; B++) s += re[base + B] * re[base + B] + im[base + B] * im[base + B];
      p[A >> 1] += s;
    }
    return p;
  };
  const S2of = () => {
    const w = Math.min(t, x0);
    const a0 = 2 * (x0 - w), a1 = 2 * (x0 + w) + 2;
    const m = a1 - a0;
    let pur = 0, norm = 0;
    for (let A = 0; A < m; A++) {
      const ra = (a0 + A) * D;
      for (let A2 = A; A2 < m; A2++) {
        const rb = (a0 + A2) * D;
        let sr = 0, si2 = 0;
        for (let B = a0; B < a1; B++) {
          const x1 = re[ra + B], y1 = im[ra + B], x2 = re[rb + B], y2 = im[rb + B];
          sr += x1 * x2 + y1 * y2;
          si2 += y1 * x2 - x1 * y2;
        }
        const v = sr * sr + si2 * si2;
        pur += A2 === A ? v : 2 * v;
        if (A2 === A) norm += sr;
      }
    }
    return -Math.log(pur / (norm * norm));
  };
  const samples = logSamples(T, 30);
  let si = 0;
  const ts = [], ns = [], ss = [], cs = [];
  let normErr = 0, outside = 0;
  const S2_0 = S2of();
  let lastSig = 0, lastS2 = S2_0;
  const nrows = T + 1;
  const strip = new Float32Array(L * nrows);
  let rows = 0;
  const snapRow = () => {
    const p = margA();
    let mx = 0;
    for (let x = 0; x < L; x++) if (p[x] > mx) mx = p[x];
    for (let x = 0; x < L; x++) strip[rows * L + x] = mx > 0 ? Math.sqrt(p[x] / mx) : 0;
    rows++;
  };
  snapRow();
  const step = () => {
    coinA();
    coinB();
    shift();
    t++;
    snapRow();
    if (si < samples.length && t === samples[si]) {
      const p = margA();
      let nrm = 0, m2 = 0, out = 0;
      for (let x = 0; x < L; x++) {
        nrm += p[x];
        m2 += p[x] * (x - x0) ** 2;
        if (Math.abs(x - x0) > t) out += p[x];
      }
      normErr = Math.max(normErr, Math.abs(1 - nrm));
      outside = Math.max(outside, out);
      lastSig = Math.sqrt(m2 / nrm);
      lastS2 = S2of();
      ts.push(t);
      ns.push(lastSig);
      ss.push(lastS2);
      cs.push(0);
      si++;
    }
  };
  const finish = () => {
    const beta = slope(ts, ns.map((v) => v > 0 ? 1 / v : 0), T / 4, T);
    const fail = normErr > 1e-9 || outside > 0;
    const verdict = fail ? "FAILS" : beta === null ? "LOCALIZED" : beta < 0.25 ? "LOCALIZED" : beta > 0.8 ? "BALLISTIC" : "DIFFUSIVE";
    const checks = [
      { name: "Conservation", pass: normErr <= 1e-9, detail: `total probability stays 1 (largest error ${normErr.toExponential(1)})` },
      { name: "Locality", pass: outside === 0, detail: outside === 0 ? "walker A never outside |x| \u2264 t" : `weight ${outside.toExponential(1)} outside the light cone` },
      { name: "Entanglement", pass: null, detail: `R\xE9nyi-2 entropy between the walkers ${S2_0.toFixed(4)} \u2192 ${lastS2.toFixed(4)} nats (ln 2 = 0.6931); the walkers never interact, so it cannot change` },
      { name: "Spread", pass: null, detail: beta === null ? "undefined" : `walker A: \u03C3 grows as t^${beta.toFixed(2)}; \u03C3(T) = ${lastSig.toFixed(1)}` }
    ];
    const warn = [];
    if (c.steps > 120) warn.push("Two walkers are capped at 120 steps.");
    return { family: "Q", verdict, checks, ts, ns, ss, cs, frames: [], strip: { w: L, h: rows, kind: "scalar", data: strip.slice(0, L * rows) }, warn, ylabel: "spread \u03C3 (walker A)", m: { beta, sigma: lastSig, entropy: lastS2, S2: lastS2, S2_0, echo: null, normErr } };
  };
  return { total: T, get done() {
    return t;
  }, stepOnce: step, finish };
}
function makePotts(c) {
  const rng = mulberry32(c.seed);
  const L = Math.max(8, Math.min(256, Math.round(c.size)));
  const n = L * L;
  const T = Math.max(1, Math.round(c.steps));
  const q = Math.max(2, Math.min(6, Math.round(c.qs)));
  const temp = Math.max(0.01, c.temp);
  const dh = c.dh;
  const s = new Uint8Array(n);
  for (let i = 0; i < n; i++) s[i] = Math.floor(rng() * q);
  const nbr = (i, k) => {
    const x = i % L, y = Math.floor(i / L);
    return k === 0 ? y * L + (x + 1) % L : k === 1 ? y * L + (x - 1 + L) % L : k === 2 ? (y + 1) % L * L + x : (y - 1 + L) % L * L + x;
  };
  const walls = () => {
    let w = 0;
    for (let i = 0; i < n; i++) {
      if (s[i] !== s[nbr(i, 0)]) w++;
      if (s[i] !== s[nbr(i, 2)]) w++;
    }
    return w / (2 * n);
  };
  const fracs = () => {
    const f = Array(q).fill(0);
    for (let i = 0; i < n; i++) f[s[i]]++;
    return f.map((v) => v / n);
  };
  const samples = logSamples(T, 60);
  let si = 0;
  const ts = [], ns = [], ss = [], cs = [];
  const frames = [];
  const fEvery = Math.max(1, Math.floor(T / 40));
  const snap = () => {
    const f = new Uint8Array(n);
    for (let i = 0; i < n; i++) f[i] = s[i] % 4 + 1;
    frames.push({ w: L, h: L, kind: "cat", data: f });
  };
  snap();
  const W0 = walls();
  let t = 0;
  const step = () => {
    t++;
    for (let k = 0; k < n; k++) {
      const i = Math.floor(rng() * n);
      const old = s[i];
      const nw = (old + 1 + Math.floor(rng() * (q - 1))) % q;
      let dSame = 0;
      for (let m = 0; m < 4; m++) {
        const v = s[nbr(i, m)];
        if (v === nw) dSame++;
        if (v === old) dSame--;
      }
      const dE = -dSame + dh * (nw - old);
      if (dE <= 0 || rng() < Math.exp(-dE / temp)) s[i] = nw;
    }
    if (si < samples.length && t === samples[si]) {
      const f = fracs();
      ts.push(t);
      ns.push(walls());
      ss.push(Math.max(...f));
      cs.push(f[0]);
      si++;
    }
    if (t % fEvery === 0) snap();
  };
  const finish = () => {
    const f = fracs();
    const dom = f.indexOf(Math.max(...f));
    const w1 = walls();
    const wq = ns.length ? ns[Math.max(0, ns.findIndex((_, k) => ts[k] >= T / 4))] : W0;
    const verdict = f[dom] >= 0.9 ? "ORDERED" : w1 < 0.8 * wq ? "COARSENING" : "DISORDERED";
    const checks = [
      { name: "Conservation", pass: null, detail: "no conservation law (Metropolis flips change the vacuum freely)" },
      { name: "Structure", pass: null, detail: `vacuum fractions ${f.map((v) => v.toFixed(3)).join(" / ")}; dominant vacuum ${dom}; domain-wall fraction ${W0.toFixed(3)} \u2192 ${w1.toFixed(3)}` },
      { name: "Arrow", pass: null, detail: "Metropolis at fixed temperature relaxes towards equilibrium (IMPORTED Potts model with a field)" }
    ];
    return { family: "C", verdict, checks, ts, ns, ss, cs, frames, strip: null, warn: [], ylabel: "domain-wall fraction", m: { density: f[dom], activity: w1, period: 0, echoMismatch: null, dS: 0, dominant: dom, domFrac: f[dom], frac0: f[0], walls: w1, walls0: W0 } };
  };
  return { total: T, get done() {
    return t;
  }, stepOnce: step, finish };
}
function parseLife(s) {
  const B = Array(9).fill(false), S = Array(9).fill(false);
  const m = /B(\d*)\/?S(\d*)/i.exec(s.replace(/\s/g, ""));
  if (m) {
    for (const ch of m[1]) B[+ch] = true;
    for (const ch of m[2]) S[+ch] = true;
  } else {
    B[3] = true;
    S[2] = true;
    S[3] = true;
  }
  return { B, S };
}
function makeC(c) {
  if (c.cmode === "potts") return makePotts(c);
  const rng = mulberry32(c.seed);
  const d = c.dim >= 2 ? 2 : 1;
  const L = Math.max(8, Math.round(c.size));
  const n = d === 1 ? L : L * L;
  const T = Math.max(1, Math.round(c.steps));
  let cur = new Uint8Array(n), prv = new Uint8Array(n), nxt = new Uint8Array(n);
  const rho = Math.max(0.01, Math.min(0.99, c.rho));
  if (c.cstart === "seed") cur[d === 1 ? Math.floor(L / 2) : Math.floor(L / 2) * L + Math.floor(L / 2)] = 1;
  else if (c.cstart === "blob") {
    const w = Math.max(2, Math.floor(L / 4));
    const o = Math.floor((L - w) / 2);
    for (let i = 0; i < n; i++) {
      const x = i % L, y = d === 2 ? Math.floor(i / L) : o;
      if (x >= o && x < o + w && y >= o && y < o + w && rng() < 0.5) cur[i] = 1;
    }
  } else for (let i = 0; i < n; i++) cur[i] = rng() < rho ? 1 : 0;
  const rev = d === 1 && c.rev;
  const s0 = new Uint8Array(cur), sm1 = new Uint8Array(prv);
  let rule = Math.max(0, Math.min(255, Math.round(c.rule)));
  const life = parseLife(c.life);
  const visited = /* @__PURE__ */ new Set([rule]);
  let flips = 0;
  const f1 = (src, i) => {
    const l = src[(i - 1 + L) % L], m = src[i], r = src[(i + 1) % L];
    return rule >> (l << 2 | m << 1 | r) & 1;
  };
  const step1 = () => {
    if (d === 1) {
      for (let i = 0; i < n; i++) nxt[i] = rev ? f1(cur, i) ^ prv[i] : f1(cur, i);
    } else for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) k += cur[(y + dy + L) % L * L + (x + dx + L) % L];
      const i = y * L + x;
      nxt[i] = cur[i] ? life.S[k] ? 1 : 0 : life.B[k] ? 1 : 0;
    }
    const t3 = prv;
    prv = cur;
    cur = nxt;
    nxt = t3;
  };
  const hashes = /* @__PURE__ */ new Map();
  let period = 0;
  const hash = () => {
    let h1 = 2166136261, h2 = 5381;
    for (let i = 0; i < n; i++) {
      h1 = Math.imul(h1 ^ cur[i], 16777619);
      h2 = Math.imul(h2, 33) + cur[i] + (rev ? 2 * prv[i] : 0) | 0;
    }
    return `${h1 >>> 0}:${h2 >>> 0}`;
  };
  const Scg = () => {
    const b = d === 1 ? Math.max(4, Math.floor(L / 16)) : Math.max(2, Math.floor(L / 16));
    const nbx = Math.ceil(L / b);
    const tot = d === 1 ? nbx : nbx * nbx;
    const cnt = new Int32Array(tot), vol = new Int32Array(tot);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const x = i % L, y = d === 2 ? Math.floor(i / L) : 0;
      const bb = Math.floor(x / b) + (d === 2 ? Math.floor(y / b) * nbx : 0);
      vol[bb]++;
      if (cur[i]) {
        cnt[bb]++;
        k++;
      }
    }
    if (!k) return 0;
    let S = 0;
    for (let j = 0; j < tot; j++) S += lnC(vol[j], cnt[j]);
    return S / k;
  };
  const samples = logSamples(T, 60);
  let si = 0;
  const ts = [], ns = [], ss = [], cs = [];
  const W = 1e3;
  const nrows = Math.min(T + 1, 300);
  const strip = d === 1 ? new Uint8Array(W * nrows) : null;
  let rows = 0;
  const frames = [];
  const fEvery = Math.max(1, Math.floor(T / 40));
  const snapRow = () => {
    if (!strip || rows >= nrows) return;
    const ww = Math.min(W, L);
    for (let x = 0; x < W; x++) {
      if (x >= ww) {
        strip[rows * W + x] = 255;
        continue;
      }
      const a = Math.floor(x * L / ww), b = Math.max(a + 1, Math.floor((x + 1) * L / ww));
      let v = 0;
      for (let s = a; s < b; s++) if (cur[s]) v = 1;
      strip[rows * W + x] = v;
    }
    rows++;
  };
  const snapFrame = () => {
    if (d === 2) frames.push({ w: L, h: L, kind: "cat", data: new Uint8Array(cur) });
  };
  snapRow();
  snapFrame();
  const S0 = Scg();
  let activity = 0, lastAct = 0, quietRun = 0;
  let t = 0;
  const total = rev && c.echo ? 2 * T : T;
  let mismatch = null;
  const step = () => {
    t++;
    if (t <= T) {
      if (d === 1 && c.mutate > 0 && rng() < c.mutate) {
        rule ^= 1 << Math.floor(rng() * 8);
        visited.add(rule);
        flips++;
      }
      const before = cur;
      step1();
      let ch = 0;
      for (let i = 0; i < n; i++) if (cur[i] !== before[i]) ch++;
      activity = ch / n;
      quietRun = ch === 0 ? quietRun + 1 : 0;
      if (ch) lastAct = t;
      const h = hash();
      const seen = hashes.get(h);
      if (seen !== void 0 && t - seen <= 128 && t === T) period = t - seen;
      hashes.set(h, t);
      if (hashes.size > 4096) hashes.clear();
      if (si < samples.length && t === samples[si]) {
        let k = 0;
        for (let i = 0; i < n; i++) k += cur[i];
        ts.push(t);
        ns.push(k / n);
        ss.push(Scg());
        cs.push(activity);
        si++;
      }
      if (strip && t >= Math.round(rows * T / (nrows - 1))) snapRow();
      if (t % fEvery === 0) snapFrame();
      if (t === T && rev && c.echo) {
        const a = cur;
        cur = prv;
        prv = a;
      }
    } else {
      step1();
      if (t === total) {
        let mm = 0;
        for (let i = 0; i < n; i++) {
          if (prv[i] !== s0[i]) mm++;
          if (cur[i] !== sm1[i]) mm++;
        }
        mismatch = mm / (2 * n);
      }
    }
  };
  const finish = () => {
    const last = ns.length ? ns[ns.length - 1] : 0;
    const S1 = ss.length ? ss[ss.length - 1] : 0;
    const verdict = last === 0 ? "DIES" : quietRun >= 10 ? "FREEZES" : period > 0 ? "CYCLES" : "ACTIVE";
    const dS = S1 - (ss.length ? ss[0] : S0);
    const checks = [
      { name: "Conservation", pass: null, detail: "no conservation law (cells are created and destroyed freely)" },
      { name: "Structure", pass: null, detail: `live fraction ${last.toFixed(3)}; activity ${activity.toFixed(3)} of cells changing per step` + (period ? `; repeats with period ${period}` : "") },
      { name: "Arrow", pass: null, detail: mismatch !== null ? `run backwards: ${mismatch === 0 ? "returns exactly to the start (reversible)" : `${(mismatch * 100).toFixed(2)}% of cells differ`}` : `coarse-grained entropy per live cell ${arrow(dS)} (${dS.toFixed(2)} nats)` + (d === 1 && !rev ? "; rules that merge states are irreversible" : "") }
    ];
    return { family: "C", verdict, checks, ts, ns, ss, cs, frames, strip: strip ? { w: W, h: rows, kind: "cat", data: strip.slice(0, W * rows) } : null, warn: [], ylabel: "live fraction", m: { density: last, activity, period, echoMismatch: mismatch, dS, lastActive: lastAct, rulesVisited: visited.size, ruleFlips: flips, finalRule: rule } };
  };
  return { total, get done() {
    return t;
  }, stepOnce: step, finish };
}
function makeG(c) {
  const rng = mulberry32(c.seed);
  const L = Math.max(8, Math.round(c.size));
  const n = L * L;
  const T = Math.max(1, Math.round(c.steps));
  let s = new Uint8Array(n), tmp = new Uint8Array(n);
  if (c.gstart === "blob") {
    const w = Math.max(2, Math.floor(L / 4));
    const o = Math.floor((L - w) / 2);
    for (let y = o; y < o + w; y++) for (let x = o; x < o + w; x++) for (let b2 = 0; b2 < 4; b2++) if (rng() < 0.7) s[y * L + x] |= 1 << b2;
  } else for (let i = 0; i < n; i++) for (let b2 = 0; b2 < 4; b2++) if (rng() < 0.3) s[i] |= 1 << b2;
  const s0 = new Uint8Array(s);
  let tg = new Uint8Array(n), tgt = new Uint8Array(n);
  let tx0 = -1, ty0 = -1;
  if (c.grec) {
    let bd = 1e18, bi2 = -1;
    const cx = Math.floor(L / 2);
    for (let i = 0; i < n; i++) if (s[i]) {
      const dd = (i % L - cx) ** 2 + (Math.floor(i / L) - cx) ** 2;
      if (dd < bd) {
        bd = dd;
        bi2 = i;
      }
    }
    if (bi2 >= 0) {
      const v = s[bi2];
      tg[bi2] = v & -v;
      tx0 = bi2 % L;
      ty0 = Math.floor(bi2 / L);
    }
  }
  let tagViol = 0, tagReach = 0, dipMin = Infinity;
  const tagStats = (tt) => {
    if (!c.grec || tx0 < 0) return;
    let r = 0;
    for (let i = 0; i < n; i++) if (tg[i]) {
      const dx = Math.abs(i % L - tx0), dy = Math.abs(Math.floor(i / L) - ty0);
      const dd = Math.max(Math.min(dx, L - dx), Math.min(dy, L - dy));
      if (dd > r) r = dd;
    }
    tagReach = r;
    if (r > tt && r < L / 2) tagViol++;
  };
  const pc = (v) => (v & 1) + (v >> 1 & 1) + (v >> 2 & 1) + (v >> 3 & 1);
  const totals = () => {
    let N = 0, px = 0, py = 0;
    for (let i = 0; i < n; i++) {
      const v = s[i];
      N += pc(v);
      px += (v & 1) - (v >> 2 & 1);
      py += (v >> 1 & 1) - (v >> 3 & 1);
    }
    return [N, px, py];
  };
  const [N0, px0, py0] = totals();
  const collide = () => {
    for (let i = 0; i < n; i++) {
      let v = s[i];
      let g = tg[i];
      if (v === 5) {
        v = 10;
        if (g) g = 10;
      } else if (v === 10) {
        v = 5;
        if (g) g = 5;
      }
      if (c.gnoise > 0 && v && rng() < c.gnoise) {
        if (rng() < 0.5) {
          v = (v << 1 | v >> 3) & 15;
          g = (g << 1 | g >> 3) & 15;
        } else {
          v = (v >> 1 | v << 3) & 15;
          g = (g >> 1 | g << 3) & 15;
        }
      }
      s[i] = v;
      tg[i] = g & v;
    }
  };
  const stream = () => {
    tmp.fill(0);
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const v = s[y * L + x];
      if (!v) continue;
      if (v & 1) tmp[y * L + (x + 1) % L] |= 1;
      if (v & 2) tmp[(y + 1) % L * L + x] |= 2;
      if (v & 4) tmp[y * L + (x - 1 + L) % L] |= 4;
      if (v & 8) tmp[(y - 1 + L) % L * L + x] |= 8;
    }
    const t2 = s;
    s = tmp;
    tmp = t2;
    if (c.grec) {
      tgt.fill(0);
      for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
        const v = tg[y * L + x];
        if (!v) continue;
        if (v & 1) tgt[y * L + (x + 1) % L] |= 1;
        if (v & 2) tgt[(y + 1) % L * L + x] |= 2;
        if (v & 4) tgt[y * L + (x - 1 + L) % L] |= 4;
        if (v & 8) tgt[(y - 1 + L) % L * L + x] |= 8;
      }
      const t3 = tg;
      tg = tgt;
      tgt = t3;
    }
  };
  const reverse = () => {
    for (let i = 0; i < n; i++) {
      s[i] = (s[i] << 2 | s[i] >> 2) & 15;
      tg[i] = (tg[i] << 2 | tg[i] >> 2) & 15;
    }
  };
  const b = Math.max(2, Math.floor(L / 16));
  const nbx = Math.ceil(L / b);
  const ScgOf = (arr) => {
    const cnt = new Int32Array(nbx * nbx), vol = new Int32Array(nbx * nbx);
    let k = 0;
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const bb = Math.floor(y / b) * nbx + Math.floor(x / b);
      vol[bb] += 4;
      const p = pc(arr[y * L + x]);
      cnt[bb] += p;
      k += p;
    }
    if (!k) return 0;
    let S = 0;
    for (let j = 0; j < nbx * nbx; j++) S += lnC(vol[j], cnt[j]);
    return S / k;
  };
  const ref = (() => {
    const r2 = mulberry32(c.seed + 1);
    const a = new Uint8Array(n);
    let placed = 0;
    while (placed < N0) {
      const i = Math.floor(r2() * n), bb = Math.floor(r2() * 4);
      if (!(a[i] & 1 << bb)) {
        a[i] |= 1 << bb;
        placed++;
      }
    }
    return ScgOf(a);
  })();
  const S0 = ScgOf(s);
  const samples = logSamples(T, 60);
  let si = 0;
  const ts = [], ns = [], ss = [], cs = [];
  const frames = [];
  const fEvery = Math.max(1, Math.floor(T / 40));
  const snap = () => {
    const f = new Float32Array(n);
    for (let i = 0; i < n; i++) f[i] = pc(s[i]) / 4;
    frames.push({ w: L, h: L, kind: "scalar", data: f, aux: new Uint8Array(s) });
  };
  snap();
  let consOK = true, consMsg = "";
  let t = 0;
  const total = c.echo ? 2 * T : T;
  let mismatch = null;
  const step = () => {
    t++;
    if (t <= T) {
      collide();
      stream();
      const [N1, x1, y1] = totals();
      if (N1 !== N0 || c.gnoise === 0 && (x1 !== px0 || y1 !== py0)) {
        if (consOK) consMsg = `changed at step ${t}: N ${N1}, P (${x1}, ${y1})`;
        consOK = false;
      }
      if (si < samples.length && t === samples[si]) {
        ts.push(t);
        ns.push(N1 / (4 * n));
        ss.push(ScgOf(s));
        cs.push(c.grec ? tg.reduce((p, x) => p + (x ? 1 : 0), 0) / n : 0);
        tagStats(t);
        si++;
      }
      if (t >= T / 2 && t % 5 === 0) {
        const Sd = ScgOf(s);
        if (Sd < dipMin) dipMin = Sd;
      }
      if (t % fEvery === 0) snap();
      if (t === T && c.echo) reverse();
    } else {
      stream();
      collide();
      if (t === total) {
        reverse();
        let mm = 0;
        for (let i = 0; i < n; i++) if (s[i] !== s0[i]) mm++;
        mismatch = mm / n;
      }
    }
  };
  const finish = () => {
    const S1 = ss.length ? ss[ss.length - 1] : S0;
    const verdict = !consOK ? "FAILS" : S1 >= 0.95 * ref ? "EQUILIBRATED" : "SPREADING";
    const checks = [
      { name: "Conservation", pass: consOK, detail: consOK ? `particle number ${N0}` + (c.gnoise === 0 ? ` and momentum (${px0}, ${py0}) exact every step` : " exact every step (noise breaks momentum conservation by design)") : consMsg },
      { name: "Arrow", pass: null, detail: `coarse-grained entropy per particle ${S0.toFixed(2)} \u2192 ${S1.toFixed(2)} nats (fully mixed: ${ref.toFixed(2)})` + (mismatch !== null ? `; run backwards: ${mismatch === 0 ? "returns exactly to the start" : `${(mismatch * 100).toFixed(2)}% of sites differ`}` : "") }
    ];
    return { family: "G", verdict, checks, ts, ns, ss, cs, frames, strip: null, warn: [], ylabel: "fill fraction", m: { S0, S: S1, Sref: ref, echoMismatch: mismatch, N: N0, dip: Number.isFinite(dipMin) ? dipMin : null, dipRel: Number.isFinite(dipMin) ? (ref - dipMin) / ref : null, tagFrac: c.grec ? cs[cs.length - 1] ?? 0 : null, tagReach: c.grec ? tagReach : null, tagViol: c.grec ? tagViol : null } };
  };
  return { total, get done() {
    return t;
  }, stepOnce: step, finish };
}
function ecaReduced(r) {
  const refl = (x) => {
    let o = 0;
    for (let k = 0; k < 8; k++) if (x >> k & 1) {
      const l = k >> 2 & 1, m = k >> 1 & 1, rr = k & 1;
      o |= 1 << (rr << 2 | m << 1 | l);
    }
    return o;
  };
  const comp = (x) => {
    let o = 0;
    for (let k = 0; k < 8; k++) if (!(x >> 7 - k & 1)) o |= 1 << k;
    return o;
  };
  const vs = [r, refl(r), comp(r), comp(refl(r))];
  let best = vs[0], bb = 9;
  for (const v of vs) {
    let b = 0;
    for (let k = 0; k < 8; k++) b += v >> k & 1;
    if (b < bb || b === bb && v < best) {
      bb = b;
      best = v;
    }
  }
  return { canon: best, bits: bb };
}
function ecaClassify(rule, T) {
  const L = 2 * T + 1;
  let cur = new Uint8Array(L), nxt = new Uint8Array(L);
  cur[T] = 1;
  const seen = /* @__PURE__ */ new Map();
  let quiet = 0;
  const out = [];
  const t4 = Math.max(1, Math.floor(T / 4));
  for (let t = 1; t <= T; t++) {
    let ch = 0, live = 0;
    for (let i = 0; i < L; i++) {
      const v = rule >> (cur[(i - 1 + L) % L] << 2 | cur[i] << 1 | cur[(i + 1) % L]) & 1;
      nxt[i] = v;
      if (v !== cur[i]) ch++;
      live += v;
    }
    const a = cur;
    cur = nxt;
    nxt = a;
    quiet = ch === 0 ? quiet + 1 : 0;
    let h1 = 2166136261, h2 = 5381;
    for (let i = 0; i < L; i++) {
      h1 = Math.imul(h1 ^ cur[i], 16777619);
      h2 = Math.imul(h2, 33) + cur[i] | 0;
    }
    const h = `${h1 >>> 0}:${h2 >>> 0}`;
    const prev = seen.get(h);
    seen.set(h, t);
    if (t === t4 || t === T) out.push(live === 0 ? "DIES" : quiet >= 10 ? "FREEZES" : prev !== void 0 && t - prev <= 128 ? "CYCLES" : "ACTIVE");
  }
  if (out.length === 1) out.push(out[0]);
  return [out[0], out[1]];
}
function makeM(c) {
  const rng = mulberry32(c.seed);
  const mode = c.meta || "enum";
  const ts = [], ns = [], ss = [], cs = [];
  if (mode === "enum") {
    const T = Math.max(8, Math.min(300, Math.round(c.steps)));
    let k2 = 0;
    const v4 = [], vT = [];
    const step2 = () => {
      const [a, b] = ecaClassify(k2, T);
      v4.push(a);
      vT.push(b);
      k2++;
      if (k2 % 8 === 0) {
        ts.push(k2);
        ns.push(vT.filter((v) => v === "ACTIVE").length / k2);
        ss.push(0);
        cs.push(0);
      }
    };
    const finish2 = () => {
      const cnt = (arr, v) => arr.filter((x) => x === v).length;
      const counts = { dies: cnt(vT, "DIES"), freezes: cnt(vT, "FREEZES"), cycles: cnt(vT, "CYCLES"), active: cnt(vT, "ACTIVE") };
      const undecided = vT.filter((v, i) => v === "ACTIVE" && v4[i] === "ACTIVE").length;
      const changed = vT.filter((v, i) => v !== v4[i]).length;
      let first = -1, fb = 9, fc = 999;
      for (let r = 0; r < 256; r++) if (vT[r] === "ACTIVE") {
        const red = ecaReduced(r);
        if (red.bits < fb || red.bits === fb && r < fc) {
          fb = red.bits;
          fc = r;
          first = r;
        }
      }
      const checks = [
        { name: "Count", pass: counts.dies + counts.freezes + counts.cycles + counts.active === 256, detail: `all 256 rules from one live cell for ${T} steps: ${counts.dies} die, ${counts.freezes} freeze, ${counts.cycles} cycle, ${counts.active} stay active` },
        { name: "Undecided", pass: null, detail: `${undecided} rules are still ACTIVE at both T/4 and T; ${changed} changed verdict between T/4 and T` },
        { name: "Shortest endless program", pass: null, detail: first >= 0 ? `rule ${first} (${fb} bits in its reduced table) is the first ACTIVE rule by description length (PROXY)` : "no rule stayed active" }
      ];
      return { family: "M", verdict: "DONE", checks, ts, ns, ss, cs, frames: [], strip: null, warn: [], ylabel: "fraction ACTIVE so far", m: { ...counts, undecided, undecidedFrac: undecided / 256, changedFrac: changed / 256, shortest: first, shortestBits: first >= 0 ? fb : null } };
    };
    return { total: 256, get done() {
      return k2;
    }, stepOnce: step2, finish: finish2 };
  }
  if (mode === "consist") {
    const T = Math.max(1, Math.min(1024, Math.round(c.steps)));
    const n = 10, NS = 1 << n;
    let k2 = 0;
    let rulesWith = 0, total = 0;
    const perRule = [];
    let best = 0, bestRule = -1;
    const step2 = () => {
      const r = k2;
      const nx = new Int32Array(NS);
      for (let s = 0; s < NS; s++) {
        let o = 0;
        for (let i = 0; i < n; i++) {
          const l = s >> (i + 1) % n & 1, m = s >> i & 1, rr = s >> (i - 1 + n) % n & 1;
          o |= (r >> (l << 2 | m << 1 | rr) & 1) << i;
        }
        nx[s] = o;
      }
      let cnt = 0;
      for (let s = 0; s < NS; s++) {
        let x = s;
        for (let t = 1; t <= T; t++) {
          x = nx[x];
          if (x === s) {
            cnt++;
            break;
          }
        }
      }
      perRule.push(cnt);
      total += cnt;
      if (cnt > 0) rulesWith++;
      if (cnt > best) {
        best = cnt;
        bestRule = r;
      }
      k2++;
      if (k2 % 8 === 0) {
        ts.push(k2);
        ns.push(rulesWith / k2);
        ss.push(total);
        cs.push(0);
      }
    };
    const finish2 = () => {
      const unique = total === 1;
      const checks = [
        { name: "Consistent histories", pass: null, detail: `${rulesWith} of 256 rules have at least one state that returns to itself within ${T} steps on a ring of 10; ${total} (rule, history) loops in total; exactly one? ${unique ? "yes" : "no"}` },
        { name: "Most loops", pass: null, detail: `rule ${bestRule} has ${best} of 1024 states on closed loops` }
      ];
      return { family: "M", verdict: "DONE", checks, ts, ns, ss, cs, frames: [], strip: null, warn: [], ylabel: "fraction of rules with a closed history", m: { rulesWith, totalLoops: total, unique: unique ? 1 : 0, loopFrac: total / (256 * NS), bestRule, best } };
    };
    return { total: 256, get done() {
      return k2;
    }, stepOnce: step2, finish: finish2 };
  }
  const P = Math.max(4, Math.min(24, Math.round(c.popN) - Math.round(c.popN) % 2));
  const G = Math.max(1, Math.min(12, Math.round(c.gens)));
  const mut = Math.max(0, c.mut);
  let spare = null;
  const gauss = () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    while (u === 0) u = rng();
    const w = rng();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(TWO * w);
    return r * Math.cos(TWO * w);
  };
  const clampG = (g) => [Math.max(0.01, Math.min(1, g[0])), Math.max(0.01, Math.min(1, g[1])), Math.max(0, Math.min(0.05, g[2])), Math.max(0, Math.min(1, g[3]))];
  const mutG = (g) => clampG(g.map((v) => v * Math.exp(mut * gauss())));
  let pop = [];
  for (let i = 0; i < P; i++) pop.push(mutG([0.5, 0.3, 1e-3, 0.5]));
  let fit = [];
  let k = 0;
  const genMean = [];
  const step = () => {
    const g = Math.floor(k / P), i = k % P;
    const gn = pop[i];
    const cu = { ...DEF, family: "P", dim: 1, size: 256, steps: 256, seed: c.seed * 1e3 + g * 100 + i, start: "scattered", rho: 0.3, d2: true, records: true, light: true, leak: "off", pa: gn[0], ph: gn[1], pc: gn[2], pr: gn[3] };
    const sim = makeP(cu);
    while (sim.done < sim.total) sim.stepOnce();
    const m = sim.finish().m;
    const f = c.fitness === "particles" ? Number(m.particles ?? 0) : c.fitness === "records" ? Number(m.copies ?? 0) : Number(m.clustering ?? 0);
    fit.push(Number.isFinite(f) ? f : 0);
    k++;
    if (i === P - 1) {
      const mean = fit.reduce((a, b) => a + b, 0) / P;
      genMean.push(mean);
      ts.push(g + 1);
      ns.push(mean);
      ss.push(Math.max(...fit));
      cs.push(0);
      if (g < G - 1) {
        const order = fit.map((v, j) => j);
        if (c.select) order.sort((a, b) => fit[b] - fit[a] || a - b);
        else for (let m2 = order.length - 1; m2 > 0; m2--) {
          const r = Math.floor(rng() * (m2 + 1));
          const t2 = order[m2];
          order[m2] = order[r];
          order[r] = t2;
        }
        const next = [];
        for (let j = 0; j < P / 2; j++) {
          next.push(mutG(pop[order[j]]));
          next.push(mutG(pop[order[j]]));
        }
        pop = next;
      }
      fit = [];
    }
  };
  const finish = () => {
    const gs = genMean.map((_, j) => j + 1);
    const gm = gs.length ? gs.reduce((a, b) => a + b, 0) / gs.length : 0;
    const fm = genMean.length ? genMean.reduce((a, b) => a + b, 0) / genMean.length : 0;
    const sxx = gs.reduce((a, g) => a + (g - gm) ** 2, 0);
    const sl = gs.length >= 2 && sxx > 0 ? gs.reduce((a, g, j) => a + (g - gm) * (genMean[j] - fm), 0) / sxx : null;
    const meanG = [0, 1, 2, 3].map((j) => pop.reduce((a, g) => a + g[j], 0) / pop.length);
    const checks = [
      { name: "Evolution", pass: null, detail: `${G} generations of ${P} universes; mean ${c.fitness} ${genMean[0]?.toFixed(3)} \u2192 ${genMean[genMean.length - 1]?.toFixed(3)}; slope per generation ${sl === null ? "n/a" : sl.toFixed(4)}; selection ${c.select ? "on" : "off (control)"}` },
      { name: "Final genome", pass: null, detail: `pa ${meanG[0].toFixed(3)}, ph ${meanG[1].toFixed(3)}, pc ${meanG[2].toFixed(4)}, pr ${meanG[3].toFixed(3)}` }
    ];
    return { family: "M", verdict: "DONE", checks, ts, ns, ss, cs, frames: [], strip: null, warn: [], ylabel: `mean ${c.fitness} per generation`, m: { fit0: genMean[0] ?? null, fitEnd: genMean[genMean.length - 1] ?? null, fitSlope: sl, gens: genMean.length, pa: meanG[0], ph: meanG[1], pc: meanG[2], pr: meanG[3] } };
  };
  return { total: P * G, get done() {
    return k;
  }, stepOnce: step, finish };
}
function makeSim(c) {
  return c.family === "P" ? makeP(c) : c.family === "F" ? makeF(c) : c.family === "Q" ? c.qn >= 2 ? makeQ2(c) : makeQ(c) : c.family === "C" ? makeC(c) : c.family === "M" ? makeM(c) : makeG(c);
}
var DEF = {
  family: "P",
  dim: 1,
  size: 4096,
  steps: 4096,
  seed: 1,
  alphabet: "pm",
  start: "paired",
  rho: 0.5,
  d2: true,
  ncons: false,
  a2: true,
  pc: 0,
  pa: 0.5,
  ph: 0.3,
  records: true,
  pr: 0.5,
  light: true,
  c: 1,
  leak: "massive",
  gamma: 0.05,
  d3: false,
  forget: 0.02,
  feedback: "off",
  jr: 1,
  attract: "off",
  J: 1,
  gs: 1,
  temp: 0.5,
  expand: false,
  H: 2e-3,
  grow: 3,
  attention: false,
  satt: 0.3,
  fixed: true,
  audit: false,
  noise: "cores",
  gauge: false,
  beta: 1,
  deph: 0,
  disorder: 0,
  echo: true,
  rule: 30,
  rev: false,
  life: "B3/S23",
  cstart: "random",
  gnoise: 0,
  gstart: "blob",
  nval: 3,
  bias: 0,
  sched: "exp",
  amin: 0.5,
  ncyc: 2,
  c2: 0,
  rsp: 1,
  rcode: 1,
  open: false,
  pedge: 0,
  holes: 0,
  hfill: 0,
  nlight: 200,
  lpair: 0.05,
  fstart: "random",
  wind: 1,
  qn: 1,
  qent: "product",
  measT: 0,
  dephT: 0,
  bath: 0,
  mutate: 0,
  cmode: "ca",
  qs: 3,
  dh: 0.1,
  grec: false,
  meta: "enum",
  popN: 16,
  gens: 8,
  fitness: "clumps",
  mut: 0.2,
  select: true
};
function baselineOf(c) {
  if (c.family === "P") return { ...c, records: false, light: false, leak: "off", d3: false, feedback: "off", attention: false, attract: "off", expand: false, a2: false };
  if (c.family === "F") return { ...c, gauge: false, attention: false };
  if (c.family === "Q") return { ...c, deph: 0, disorder: 0, bath: 0, measT: 0 };
  return null;
}
var LIFE = ["B3/S23", "B36/S23", "B2/S", "B3678/S34678", "B1357/S1357", "B3/S012345678"];
function sampleCfg(fam, r, seed) {
  const U = (a, b) => a + r() * (b - a);
  const LU = (a, b) => Math.exp(Math.log(a) + r() * (Math.log(b) - Math.log(a)));
  const pick = (xs) => xs[Math.floor(r() * xs.length)];
  const B = () => r() < 0.5;
  const c = { ...DEF, family: fam, seed };
  if (fam === "P") {
    c.dim = pick([1, 2, 3]);
    c.size = Math.round(c.dim === 1 ? LU(256, 4096) : c.dim === 2 ? LU(32, 96) : LU(12, 24));
    c.steps = Math.round(LU(200, 2e3));
    c.alphabet = pick(["pm", "bin"]);
    c.start = pick(["paired", "scattered", "blob", "hot"]);
    c.rho = U(0.05, 0.6);
    c.d2 = B();
    c.ncons = B();
    c.a2 = B();
    c.pc = B() ? 0 : LU(1e-4, 0.01);
    c.pa = U(0.1, 1);
    c.ph = U(0.05, 0.8);
    c.records = B();
    c.pr = U(0, 1);
    c.light = B();
    c.c = pick([1, 2, 3, 4]);
    c.leak = pick(["off", "massive", "uniform"]);
    c.gamma = LU(1e-3, 0.2);
    c.d3 = B();
    c.forget = LU(1e-3, 0.1);
    c.feedback = pick(["off", "gate", "bind"]);
    c.jr = U(0, 2);
    c.attract = pick(["off", "short", "long"]);
    c.J = U(0, 2);
    c.gs = U(0, 2);
    c.temp = U(0.1, 2);
    c.expand = B();
    c.H = LU(1e-4, 0.01);
    c.grow = U(1.5, 3);
    c.attention = B();
    c.satt = U(0, 1);
  } else if (fam === "F") {
    c.size = pick([32, 48, 64]);
    c.steps = Math.round(LU(1e3, 6e3));
    c.fixed = B();
    c.audit = B();
    c.noise = pick(["off", "uniform", "cores"]);
    c.temp = U(0.1, 2);
    c.gauge = B();
    c.beta = U(0, 2);
    c.attention = B();
    c.satt = U(0, 1);
  } else if (fam === "Q") {
    c.dim = pick([1, 2]);
    c.steps = Math.round(c.dim === 1 ? LU(100, 800) : LU(50, 150));
    c.deph = B() ? 0 : U(0, 1);
    c.disorder = B() ? 0 : U(0, 2);
    c.echo = B();
  } else if (fam === "C") {
    c.dim = pick([1, 2]);
    c.rule = Math.floor(r() * 256);
    c.rev = B();
    c.life = pick(LIFE);
    c.size = Math.round(c.dim === 1 ? LU(256, 1024) : LU(48, 128));
    c.steps = Math.round(LU(100, 1e3));
    c.cstart = pick(["random", "blob", "seed"]);
    c.rho = U(0.1, 0.6);
    c.echo = B();
  } else {
    c.size = Math.round(LU(48, 128));
    c.steps = Math.round(LU(100, 1e3));
    c.gnoise = B() ? 0 : LU(1e-3, 0.1);
    c.gstart = pick(["blob", "random"]);
    c.echo = B();
  }
  return c;
}
export {
  DEF,
  baselineOf,
  makeSim,
  mulberry32,
  sampleCfg
};
