/* 11-VISIONARIES Multi-Hazard Bulletin Generator v3 */
"use strict";
const NS = "Not specified", W = 1080, H = 1350, QUAKE_RADIUS_KM = 300;

const HAZARDS = ["Thunderstorm","Heavy Rainfall","Flood","Flash Flood","Landslide","Strong Winds","Tropical Cyclone","Storm Surge","Extreme Heat","Other"];
const LEVELS = ["INFORMATION","ADVISORY","WATCH","WARNING","SEVERE WARNING"];
const LEVEL_CLASS = {"INFORMATION":"a-info","ADVISORY":"a-adv","WATCH":"a-watch","WARNING":"a-warn","SEVERE WARNING":"a-sev"};
const ENSO = ["","ENSO-Neutral","El Niño Watch","El Niño Alert","El Niño Advisory","La Niña Watch","La Niña Alert","La Niña Advisory"];
const TC_LEVELS = ["","None","Low","Moderate","High","Active"];
const TCWS = ["","1","2","3","4","5"];
const DEPED_OPTS = [["auto","Auto (from heat index and TCWS)"],["HAYO","Level 1 — Hayo"],["HINAY","Level 2 — Hinay"],["HINGA","Level 3 — Hinga"],["HINTO","Level 4 — Hinto"]];

/* [key, label, type, options] */
const SECTIONS = [
  ["Bulletin Information", [["number","Bulletin Number"],["date","Date","date"],["time","Time","time"],["area","Area / Location"],["by","Prepared By"]]],
  ["Weather Forecast", [["synopsis","Synopsis","ta"],["condition","Weather Condition","ta"],["temp","Temperature"],["rain","Rainfall"],["wind","Wind"],["humidity","Humidity"]]],
  ["Heat Index", [["heatValue","Heat Index Value (number only)","number"]]],
  ["El Niño / La Niña Status", [["ensoStatus","Status","sel",ENSO],["ensoIndex","Index value (ONI, −2 to +2)","number"]]],
  ["Tropical Cyclone Threat Potential (leave empty to hide)", [
    ["tcName","Cyclone Name"],["tcLoc","Distance / Location"],["tcWind","Maximum Wind"],["tcGust","Gustiness"],["tcMove","Movement"],
    ["tcws","Wind Signal (TCWS No.)","sel",TCWS],["tcLevel","Threat Level","sel",TC_LEVELS],["tcEffects","Expected Effects","ta"]]],
  ["DepEd Learning Continuity Level (DO 14, s. 2026)", [["depedMode","Level","sel",DEPED_OPTS]]],
  ["Severe Weather Bulletin (leave empty for none)", [["sevSituation","Situation","ta"],["sevHazards","Expected Hazards","ta"],["sevImpacts","Possible Impacts","ta"],["sevSafety","Safety Reminders","ta"]]],
  ["Footnote", [["footnote","Bulletin footnote","ta"]]]
];
const QUAKE_FIELDS = [["quakeLabel","Reference point name"],["quakeLat","Latitude","number"],["quakeLon","Longitude","number"],
  ["quakeText","Top 3 earthquakes — one per line: Magnitude | Distance km | Location | Date-Time","ta"]];

const DEFAULT_FOOT = "For educational and school information use.\nAlways verify official warnings with authorized government weather and disaster agencies.\nUser-entered information. Verify official weather and hazard bulletins before making safety decisions.";

function demoState() {
  return {
    demo: true, auto: false, number: "01", date: "2026-10-02", time: "18:00", area: "Quezon City, Metro Manila", by: "11-VISIONARIES Weather Team",
    synopsis: "DEMO: Sample synopsis text. Replace it with your own information.",
    condition: "DEMO: Partly cloudy to cloudy skies with isolated rainshowers or thunderstorms.",
    temp: "25°C – 33°C", rain: "Light to moderate", wind: "Light to moderate, E to NE", humidity: "78%",
    heatValue: "39", ensoStatus: "ENSO-Neutral", ensoIndex: "0.1",
    tcName: "Sample Storm", tcLoc: "Sample: 755 km east of the area", tcWind: "85 km/h", tcGust: "up to 105 km/h", tcMove: "WNW at 20 km/h",
    tcws: "", tcLevel: "Active", tcEffects: "Sample: rough seas over the eastern seaboard.",
    depedMode: "auto", quakeLabel: "Quezon City", quakeLat: "14.676", quakeLon: "121.044", quakeChecked: false,
    quakeText: "5.2 | 187 | DEMO sample location A | DEMO\n4.6 | 242 | DEMO sample location B | DEMO\n4.1 | 120 | DEMO sample location C | DEMO",
    sevSituation: "DEMO: No severe weather situation entered.", sevHazards: "DEMO: Thunderstorms, gusty winds.",
    sevImpacts: "DEMO: Possible localized flooding.", sevSafety: "Stay indoors during lightning.\nPrepare an emergency kit.",
    footnote: DEFAULT_FOOT, image: "",
    alerts: [
      {hazard:"Thunderstorm", level:"ADVISORY", area:"Metro Manila", issued:"06:00 PM", valid:"09:00 PM", desc:"DEMO: Sample advisory text."},
      {hazard:"Extreme Heat", level:"WATCH", area:"Quezon City", issued:"06:00 PM", valid:"4:00 PM tomorrow", desc:"DEMO: Sample watch text. Not an official warning."}
    ]
  };
}
let state = demoState();

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const has = k => String(state[k] ?? "").trim() !== "";
const val = k => String(state[k] ?? "").trim() || NS;

function fmtDate(d) { if (!d) return ""; const [y,m,dd] = d.split("-").map(Number); return y ? new Date(y, m-1, dd).toLocaleDateString("en-PH", {day:"2-digit", month:"long", year:"numeric"}) : ""; }
function fmtTime(t) { if (!t) return ""; const [h,m] = t.split(":").map(Number); return `${((h+11)%12)+1}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; }

/* ---------- Form ---------- */
function fieldHTML([key, label, type, opts]) {
  let input;
  if (type === "ta") input = `<textarea data-k="${key}"></textarea>`;
  else if (type === "sel") input = `<select data-k="${key}">${opts.map(o => { const [v,l] = Array.isArray(o) ? o : [o, o || "— Not specified —"]; return `<option value="${v}">${l}</option>`; }).join("")}</select>`;
  else input = `<input data-k="${key}" type="${type || "text"}" ${type === "number" ? 'step="any"' : ""}>`;
  return `<label>${label}${input}</label>`;
}
function buildForm() {
  $("formSections").innerHTML = SECTIONS.map(([t, f], i) => `<details class="panel" ${i < 2 ? "open" : ""}><summary>${t}</summary><div class="panel-body">${f.map(fieldHTML).join("")}</div></details>`).join("");
  $("quakeFields").innerHTML = QUAKE_FIELDS.map(fieldHTML).join("");
}
function syncForm() { document.querySelectorAll("[data-k]").forEach(el => { el.value = state[el.dataset.k] ?? ""; }); renderAlertForm(); }

function renderAlertForm() {
  $("alertList").innerHTML = state.alerts.map((a, i) => `
    <div class="alert-item" data-i="${i}">
      <h5>ALERT ${i+1}<button class="btn danger" data-rm="${i}">Remove Alert</button></h5>
      <label>Hazard Type<select data-a="hazard">${HAZARDS.map(h => `<option ${h===a.hazard?"selected":""}>${h}</option>`).join("")}</select></label>
      <label>Alert Level<select data-a="level">${LEVELS.map(l => `<option ${l===a.level?"selected":""}>${l}</option>`).join("")}</select></label>
      <label>Affected Area<input data-a="area" value="${esc(a.area)}"></label>
      <label>Issued Time<input data-a="issued" value="${esc(a.issued)}"></label>
      <label>Valid Until<input data-a="valid" value="${esc(a.valid)}"></label>
      <label>Description<textarea data-a="desc">${esc(a.desc)}</textarea></label>
    </div>`).join("") || `<p class="note-small">No alerts added.</p>`;
}

/* ---------- Heat index (PAGASA) ---------- */
function classifyHeat(raw) {
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ""));
  if (!String(raw).trim() || isNaN(n)) return {n: NaN, cat: NS, desc: "", cls: ""};
  if (n >= 52) return {n, cat: "Extreme Danger", cls: "heat-extdanger", desc: "Heat stroke is imminent."};
  if (n >= 42) return {n, cat: "Danger", cls: "heat-danger", desc: "Heat cramps and heat exhaustion are likely; heat stroke is probable with continued activity."};
  if (n >= 33) return {n, cat: "Extreme Caution", cls: "heat-extcaution", desc: "Heat cramps and heat exhaustion are possible. Continuing activity could result in heat stroke."};
  if (n >= 27) return {n, cat: "Caution", cls: "heat-caution", desc: "Fatigue is possible with prolonged exposure and activity. Continuing activity could result in heat cramps."};
  return {n, cat: "Not classified", cls: "", desc: "Below the PAGASA Caution range (27°C)."};
}

/* ---------- Issuance: valid 24 h; next issuance Thursday -> Sunday, otherwise next day ---------- */
function issuance() {
  if (!state.date) return null;
  const [y, m, d] = state.date.split("-").map(Number);
  const [hh, mm] = (state.time || "00:00").split(":").map(Number);
  const start = new Date(y, m-1, d, hh || 0, mm || 0), end = new Date(start.getTime() + 864e5);
  const next = new Date(y, m-1, d + (start.getDay() === 4 ? 3 : 1));
  const f = {day:"2-digit", month:"long", year:"numeric"};
  return {valid: `${fmtTime(String(end.getHours()).padStart(2,"0") + ":" + String(end.getMinutes()).padStart(2,"0"))}, ${end.toLocaleDateString("en-PH", f)}`,
          next: next.toLocaleDateString("en-PH", {weekday:"long", ...f})};
}

/* ---------- ENSO gauge (SVG) ---------- */
function gaugeSVG(v) {
  const cx = 100, cy = 92, r = 74, ang = x => Math.PI * (1 - (x + 2) / 4), pt = (a, rr = r) => [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
  const arc = (a, b, col) => { const [x1,y1] = pt(ang(a)), [x2,y2] = pt(ang(b)); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${col}" stroke-width="16" fill="none"/>`; };
  let needle = "";
  if (!isNaN(v)) { const c = Math.max(-2, Math.min(2, v)), [nx, ny] = pt(ang(c), 62);
    needle = `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#1e0a4a" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="#1e0a4a"/>`; }
  return `<svg viewBox="0 0 200 116" xmlns="http://www.w3.org/2000/svg" font-family="Poppins,Arial,sans-serif" font-weight="700">
    ${arc(-2,-0.5,"#3b82f6")}${arc(-0.5,0.5,"#94a3b8")}${arc(0.5,2,"#f97316")}${needle}
    <text x="22" y="110" font-size="11" fill="#1d4ed8" text-anchor="middle">LA NIÑA</text>
    <text x="100" y="22" font-size="10" fill="#64748b" text-anchor="middle">NEUTRAL</text>
    <text x="178" y="110" font-size="11" fill="#c2410c" text-anchor="middle">EL NIÑO</text></svg>`;
}

/* ---------- Earthquakes ---------- */
function parseQuakes() {
  return String(state.quakeText || "").split("\n").map(l => l.split("|").map(s => s.trim())).filter(p => p[0]).slice(0, 3)
    .map(p => ({mag: p[0], dist: p[1], loc: p[2], time: p[3]}));
}

/* ---------- Render ---------- */
function setOut(key, text) { document.querySelectorAll(`[data-out="${key}"]`).forEach(el => { el.textContent = text; }); }

function render() {
  ["number","area","by","synopsis","condition","temp","rain","wind","humidity","tcName","tcLoc","tcMove","tcEffects","ensoStatus","sevSituation","sevHazards","sevImpacts","sevSafety"]
    .forEach(k => setOut(k, val(k)));
  setOut("footnote", String(state.footnote || "").trim());
  setOut("dateTime", [fmtDate(state.date), fmtTime(state.time)].filter(Boolean).join(" • ") || NS);
  const iss = issuance();
  setOut("valid", iss ? iss.valid : NS); setOut("sevNext", iss ? iss.next : NS);

  const bn = $("demoBanner");
  if (state.demo) { bn.style.display = "block"; bn.style.background = ""; bn.textContent = "DEMO BULLETIN — NOT AN OFFICIAL WARNING"; }
  else if (state.auto) { bn.style.display = "block"; bn.style.background = "#f57c00"; bn.textContent = "AUTO-FETCHED FROM PAGASA PUBLIC PAGES — VERIFY OFFICIAL BULLETINS"; }
  else bn.style.display = "none";

  /* heat */
  const hc = classifyHeat(state.heatValue);
  $("heatVal").textContent = isNaN(hc.n) ? NS : hc.n + "°C";
  $("heatVal").style.fontSize = isNaN(hc.n) ? "26px" : "";
  $("heatCatBox").textContent = hc.cat; $("heatCatBox").className = "heat-cat " + hc.cls;
  $("heatDesc").textContent = hc.desc;

  /* ENSO */
  const idx = parseFloat(state.ensoIndex);
  $("gauge").innerHTML = gaugeSVG(idx);
  $("ensoIdx").textContent = isNaN(idx) ? "Index: " + NS : "Index: " + (idx > 0 ? "+" : "") + idx;

  /* tropical cyclone: whole block disappears when nothing is entered */
  const tcKeys = ["tcName","tcLoc","tcWind","tcGust","tcMove","tcws","tcLevel","tcEffects"];
  $("tcBlock").style.display = tcKeys.some(has) ? "" : "none";
  $("tcWinds").textContent = [state.tcWind, state.tcGust].map(s => String(s).trim()).filter(Boolean).join(" / ") || NS;
  const lv = String(state.tcLevel || "").toLowerCase(), sig = has("tcws") ? "Signal No. " + state.tcws : "";
  const tl = $("tcLevelBox");
  tl.textContent = [state.tcLevel, sig].filter(Boolean).join(" • ") || NS;
  tl.className = lv === "active" || lv === "high" || +state.tcws >= 3 ? "tc-active" : lv === "moderate" || +state.tcws === 2 ? "tc-mod" : lv === "low" || +state.tcws === 1 ? "tc-low" : "";

  /* earthquakes */
  const qs = parseQuakes();
  $("quakeHead").textContent = `Within ${QUAKE_RADIUS_KM} km of ${String(state.quakeLabel).trim() || NS}`;
  $("quakeOut").innerHTML = qs.length ? qs.map(q => {
    const m = parseFloat(q.mag), c = m >= 5 ? "" : m >= 4 ? "mid" : "lo";
    return `<div class="q"><span class="m ${c}">M ${esc(q.mag)}</span><span>${esc(q.dist || "?")} km • ${esc(q.loc || NS)}${q.time ? " • " + esc(q.time) : ""}</span></div>`; }).join("")
    : `<div class="msg">${state.quakeChecked ? "NO EARTHQUAKES RECORDED WITHIN 300 KM" : "NO EARTHQUAKE DATA ENTERED"}</div>`;

  /* DepEd level */
  let L, basis;
  if (state.depedMode && state.depedMode !== "auto") { L = DEPED.find(d => d.key === state.depedMode); basis = "Set manually by the bulletin preparer."; }
  else { const r = depedLevel({tcws: state.tcws, heat: state.heatValue}); L = r.level;
    basis = r.reasons.length ? "Basis: " + r.reasons.filter(x => x[0] === L.n).map(x => x[1]).join("; ") : "No trigger entered in this bulletin."; }
  $("depedOut").innerHTML = `<span class="lv ${L.cls}">LEVEL ${L.n} — ${L.key} (${L.en})</span><p>${L.desc}</p><small>${esc(basis)} • DepEd Order No. 14, s. 2026</small>`;

  /* satellite */
  const box = $("satBox");
  if (state.image) { box.style.backgroundImage = `url("${state.image}")`; box.textContent = ""; }
  else { box.style.backgroundImage = "none"; box.textContent = "No image uploaded"; }

  /* alerts */
  $("alertOut").innerHTML = state.alerts.length ? state.alerts.map(a => `
    <div class="a-card ${LEVEL_CLASS[a.level] || "a-info"}">
      <div class="a-top"><span>${esc(a.hazard)}</span><span class="a-badge">${esc(a.level)}</span></div>
      <div><b>Area:</b> ${esc(a.area.trim() || NS)} &nbsp; <b>Issued:</b> ${esc(a.issued.trim() || NS)} &nbsp; <b>Until:</b> ${esc(a.valid.trim() || NS)}</div>
      <div>${esc(a.desc.trim() || NS)}</div></div>`).join("") : `<div class="a-none">NO WARNINGS AND ALERTS ISSUED</div>`;

  /* severe weather bulletin */
  const hasSev = ["sevSituation","sevHazards","sevImpacts","sevSafety"].some(has);
  $("sevGrid").style.display = hasSev ? "" : "none";
  $("sevNone").style.display = hasSev ? "none" : "flex";
}

function fitPreview() {
  const wrap = $("previewWrap"), wide = window.innerWidth > 1100;
  const avail = wrap.parentElement.clientWidth - (wide ? $("controls").offsetWidth + 20 : 0);
  const s = Math.min(1, Math.max(0.2, avail / W));
  $("scaler").style.transform = `scale(${s})`;
  wrap.style.height = Math.round(H * s) + "px";
  wrap.style.width = wide ? Math.round(W * s) + "px" : "100%";
  wrap.style.flex = wide ? "none" : "";
}

/* ---------- Fetching (PAGASA / PHIVOLCS) through public CORS proxies; best effort ---------- */
async function proxied(url) {
  for (const p of [u => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u), u => "https://corsproxy.io/?" + encodeURIComponent(u)]) {
    try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(p(url), {signal: ctl.signal}); clearTimeout(t);
      if (r.ok) { const html = await r.text(); if (html.length > 500) return html; } } catch (e) { /* next proxy */ }
  }
  return null;
}
const htmlToText = html => { const d = new DOMParser().parseFromString(html, "text/html"); d.querySelectorAll("script,style,noscript").forEach(n => n.remove()); return (d.body.textContent || "").replace(/\s+/g, " ").trim(); };

async function fetchPAGASA() {
  const btn = $("btnPagasa"); btn.disabled = true; setStatus("Fetching PAGASA public pages…");
  const got = [];
  try {
    const wx = await proxied("https://www.pagasa.dost.gov.ph/weather");
    if (wx) {
      const t = htmlToText(wx);
      const iss = t.match(/Issued at:?\s*(\d{1,2}):(\d{2})\s*(AM|PM),?\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i), mo = iss ? new Date(`${iss[5]} 1, 2000`).getMonth() : NaN;
      if (iss && !isNaN(mo)) { state.date = `${iss[6]}-${String(mo+1).padStart(2,"0")}-${iss[4].padStart(2,"0")}`; state.time = `${String((+iss[1] % 12) + (iss[3].toUpperCase()==="PM"?12:0)).padStart(2,"0")}:${iss[2]}`; got.push("issuance time"); }
      const syn = t.match(/SYNOPSIS:?\s*(.+?)\s*Forecast Weather Condition/i); if (syn) { state.synopsis = syn[1]; got.push("synopsis"); }
      const fc = t.match(/Forecast Weather Conditions?\s*(?:Place Weather Condition Caused By Impacts)?\s*(.+?)\s*Forecast Wind/i);
      if (fc) { state.condition = fc[1].slice(0, 300); got.push("weather condition"); }
      const tp = t.match(/Temperature\s+([\d.]+)\s*°C[\s\S]*?([\d.]+)\s*°C/); if (tp) state.temp = `${tp[2]}°C – ${tp[1]}°C (Diliman, QC)`;
    }
    const tc = await proxied("https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin");
    if (tc) { const t = htmlToText(tc), m = t.match(/(Tropical Depression|Tropical Storm|Severe Tropical Storm|Typhoon|Super Typhoon)\s+[“"']?([A-Za-z]+)/);
      if (m) { state.tcName = `${m[1]} ${m[2]}`; state.sevSituation = t.slice(m.index, m.index + 420); got.push("tropical cyclone bulletin"); } }
    if (got.length) { state.auto = true; state.demo = false; syncForm(); render(); setStatus("Fetched from PAGASA: " + got.join(", ") + ". Check every field against the official bulletin.", "ok"); }
    else setStatus("Could not read PAGASA pages (blocked or changed format). Enter information manually.", "err");
  } catch (e) { setStatus("PAGASA fetch failed: " + e.message, "err"); } finally { btn.disabled = false; }
}

const rad = d => d * Math.PI / 180;
const haversine = (a, b, c, d) => { const x = Math.sin(rad(c-a)/2)**2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d-b)/2)**2; return 12742 * Math.asin(Math.sqrt(x)); };

async function fetchQuakes() {
  const lat = parseFloat(state.quakeLat), lon = parseFloat(state.quakeLon);
  if (isNaN(lat) || isNaN(lon)) return setStatus("Enter the reference point's latitude and longitude first.", "err");
  const btn = $("btnQuake"); btn.disabled = true; setStatus("Fetching PHIVOLCS earthquake list…");
  try {
    const html = await proxied("https://earthquake.phivolcs.dost.gov.ph/");
    if (!html) return setStatus("Could not reach PHIVOLCS (blocked or offline). Enter earthquakes manually.", "err");
    const doc = new DOMParser().parseFromString(html, "text/html"), rows = [];
    doc.querySelectorAll("tr").forEach(tr => {
      const c = [...tr.querySelectorAll("td")].map(td => td.textContent.replace(/\s+/g, " ").trim());
      if (c.length < 6) return;
      const la = parseFloat(c[1]), lo = parseFloat(c[2]), mg = parseFloat(c[4]);
      if ([la, lo, mg].some(isNaN)) return;
      rows.push({time: c[0], mag: mg, loc: c[5], dist: haversine(lat, lon, la, lo)});
    });
    if (!rows.length) return setStatus("PHIVOLCS page read, but no earthquake table was found. Enter manually.", "err");
    const near = rows.filter(r => r.dist <= QUAKE_RADIUS_KM).sort((a, b) => b.mag - a.mag).slice(0, 3);
    state.quakeText = near.map(r => [r.mag.toFixed(1), Math.round(r.dist), r.loc, r.time].join(" | ")).join("\n");
    state.quakeChecked = true; state.demo = false; syncForm(); render();
    setStatus(`PHIVOLCS: ${rows.length} recent events read, ${near.length} within ${QUAKE_RADIUS_KM} km. Verify on the official site.`, "ok");
  } catch (e) { setStatus("PHIVOLCS fetch failed: " + e.message, "err"); } finally { btn.disabled = false; }
}

/* ---------- Events ---------- */
function bind() {
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.k) { state[t.dataset.k] = t.value; state.demo = false; render(); }
    else if (t.dataset.a) { state.alerts[+t.closest(".alert-item").dataset.i][t.dataset.a] = t.value; state.demo = false; render(); }
  });
  document.addEventListener("click", e => { const rm = e.target.dataset.rm; if (rm !== undefined) { state.alerts.splice(+rm, 1); state.demo = false; renderAlertForm(); render(); } });
  $("btnAddAlert").onclick = () => { state.alerts.push({hazard:HAZARDS[0], level:LEVELS[0], area:"", issued:"", valid:"", desc:""}); state.demo = false; renderAlertForm(); render(); };
  $("satFile").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { state.image = r.result; state.demo = false; render(); }; r.readAsDataURL(f); };
  $("btnClearImg").onclick = () => { state.image = ""; $("satFile").value = ""; render(); };
  $("btnReset").onclick = () => { if (!confirm("Reset everything to the demo bulletin?")) return; state = demoState(); $("satFile").value = ""; syncForm(); render(); setStatus(""); };
  $("btnPrint").onclick = () => window.print();
  $("btnPng").onclick = generatePNG;
  $("btnPagasa").onclick = fetchPAGASA;
  $("btnQuake").onclick = fetchQuakes;
  window.addEventListener("resize", fitPreview);
}

/* ---------- PNG export ---------- */
function setStatus(msg, cls) { const s = $("status"); s.textContent = msg; s.className = "status " + (cls || ""); }
const preloadImage = src => new Promise(res => { if (!src) return res(); const i = new Image(); i.onload = () => (i.decode ? i.decode().catch(() => {}).then(res) : res()); i.onerror = res; i.src = src; });

async function generatePNG() {
  const btn = $("btnPng"); btn.disabled = true; setStatus("Generating PNG…");
  try {
    if (typeof html2canvas === "undefined" && !window.htmlToImage) throw new Error("Export library not loaded. Check your internet connection.");
    render();
    if (document.fonts) { await Promise.all(["900 40px Montserrat","800 20px Montserrat","400 14px Poppins","700 14px Poppins"].map(f => document.fonts.load(f))).catch(() => {}); await document.fonts.ready; }
    await preloadImage(state.image);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    let blob;
    if (window.htmlToImage) {
      /* Primary: browser-native rendering (SVG foreignObject) - matches the live preview far more closely */
      const opts = {width: W, height: H, pixelRatio: 1, cacheBust: true, backgroundColor: "#ffffff", style: {transform: "none", margin: "0"}};
      await window.htmlToImage.toPng($("bulletin"), opts).catch(() => {});   // warm-up pass so fonts/images are embedded
      const dataUrl = await window.htmlToImage.toPng($("bulletin"), opts);
      blob = await (await fetch(dataUrl)).blob();
    } else {
      /* Fallback: html2canvas */
      const canvas = await html2canvas($("bulletin"), {
      width: W, height: H, scale: 1, backgroundColor: "#ffffff", useCORS: true, logging: false, scrollX: 0, scrollY: 0,
      windowWidth: Math.max(W, document.documentElement.clientWidth),
      onclone: doc => { doc.getElementById("scaler").style.transform = "none"; doc.getElementById("previewWrap").style.cssText = `position:static;width:${W}px;height:${H}px;overflow:visible;`; doc.getElementById("bulletin").style.margin = "0"; }
    });
    blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    }
    if (!blob) throw new Error("Could not create the PNG file.");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `11-VISIONARIES_Multi-Hazard_Bulletin_${state.date || new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setStatus("PNG successfully generated.", "ok");
  } catch (err) { console.error(err); setStatus("PNG export failed: " + err.message, "err"); } finally { btn.disabled = false; }
}

buildForm(); syncForm(); bind(); render(); fitPreview();
