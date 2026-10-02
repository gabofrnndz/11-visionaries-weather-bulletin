/* 11-VISIONARIES Multi-Hazard Bulletin Generator */
"use strict";

const NS = "Not specified";
const W = 1080, H = 1350;

const HAZARDS = ["Thunderstorm","Heavy Rainfall","Flood","Flash Flood","Landslide","Strong Winds","Tropical Cyclone","Storm Surge","Extreme Heat","Other"];
const LEVELS = ["INFORMATION","ADVISORY","WATCH","WARNING","SEVERE WARNING"];
const LEVEL_CLASS = {"INFORMATION":"a-info","ADVISORY":"a-adv","WATCH":"a-watch","WARNING":"a-warn","SEVERE WARNING":"a-sev"};
const HEAT_CATS = ["","Caution","Extreme Caution","Danger","Extreme Danger"];
const TC_LEVELS = ["","None","Low","Moderate","High","Active"];

/* ---------- Form schema: [key, label, type, options] ---------- */
const SECTIONS = [
  ["Bulletin Information", [
    ["number","Bulletin Number"],["date","Date","date"],["time","Time","time"],
    ["valid","Valid Until"],["area","Area / Location"],["by","Prepared By"]]],
  ["Weather Forecast", [
    ["synopsis","Synopsis","ta"],["forecast","General Forecast","ta"],["temp","Temperature"],
    ["rain","Rainfall"],["wind","Wind"],["humidity","Humidity"],["condition","Weather Condition"]]],
  ["Heat Index", [
    ["heatValue","Heat Index Value"],["heatCat","Heat Index Category","sel",HEAT_CATS],
    ["heatPeak","Time of Peak Heat"],["heatAreas","Affected Areas"]]],
  ["Tropical Cyclone Threat Potential", [
    ["tcName","Cyclone Name"],["tcLoc","Distance / Location"],["tcWind","Maximum Wind"],
    ["tcGust","Gustiness"],["tcMove","Movement"],["tcLevel","Threat Level","sel",TC_LEVELS],
    ["tcEffects","Expected Effects","ta"]]],
  ["Severe Weather Bulletin", [
    ["sevSituation","Situation","ta"],["sevHazards","Expected Hazards","ta"],
    ["sevImpacts","Possible Impacts","ta"],["sevSafety","Safety Reminders","ta"],["sevNext","Next Update"]]]
];
const SAT_FIELDS = [["satCaption","Image Caption"],["satSource","Image Source"]];

/* ---------- DEMO DATA ---------- */
function demoState() {
  return {
    demo: true,
    number: "01", date: "2026-10-02", time: "18:00", valid: "06:00 PM, 03 October 2026",
    area: "Quezon City, Metro Manila", by: "11-VISIONARIES Weather Team",
    synopsis: "DEMO: A low-pressure area and the shear line are sample entries used to show how this bulletin looks. Replace this text with your own information.",
    forecast: "DEMO: Partly cloudy to cloudy skies with isolated rainshowers or thunderstorms, especially in the afternoon.",
    temp: "25°C – 33°C", rain: "Light to moderate", wind: "Light to moderate, E to NE", humidity: "78%",
    condition: "Partly cloudy to cloudy",
    heatValue: "39°C", heatCat: "Extreme Caution", heatPeak: "1:00 PM – 3:00 PM", heatAreas: "Sample: Metro Manila",
    tcName: "Sample Storm", tcLoc: "Sample: 755 km east of the area", tcWind: "85 km/h", tcGust: "up to 105 km/h",
    tcMove: "West-northwest at 20 km/h", tcLevel: "Active",
    tcEffects: "Sample: rough seas over eastern seaboard.",
    satCaption: "Sample satellite view (upload your own)", satSource: "",
    sevSituation: "DEMO: No severe weather situation entered.",
    sevHazards: "DEMO: Thunderstorms, gusty winds.",
    sevImpacts: "DEMO: Possible localized flooding in low-lying areas.",
    sevSafety: "Stay indoors during lightning.\nPrepare an emergency kit.\nFollow official advisories.",
    sevNext: "06:00 AM, 03 October 2026",
    image: "",
    alerts: [
      {hazard:"Thunderstorm", level:"ADVISORY", area:"Metro Manila", issued:"06:00 PM", valid:"09:00 PM", desc:"DEMO: Sample advisory text showing the alert card layout."},
      {hazard:"Extreme Heat", level:"WATCH", area:"Quezon City", issued:"06:00 PM", valid:"03 Oct, 4:00 PM", desc:"DEMO: Sample watch text. Not an official warning."}
    ]
  };
}
let state = demoState();

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const val = k => String(state[k] ?? "").trim() || NS;

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  if (!y) return "";
  return new Date(y, m - 1, day).toLocaleDateString("en-PH", {day:"2-digit", month:"long", year:"numeric"});
}
function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/* ---------- Build the form ---------- */
function fieldHTML([key, label, type, opts]) {
  let input;
  if (type === "ta") input = `<textarea data-k="${key}"></textarea>`;
  else if (type === "sel") input = `<select data-k="${key}">${opts.map(o => `<option value="${o}">${o || "— Not specified —"}</option>`).join("")}</select>`;
  else input = `<input data-k="${key}" type="${type || "text"}">`;
  return `<label>${label}${input}</label>`;
}
function buildForm() {
  $("formSections").innerHTML = SECTIONS.map(([title, fields], i) =>
    `<details class="panel" ${i < 2 ? "open" : ""}><summary>${title}</summary><div class="panel-body">${fields.map(fieldHTML).join("")}</div></details>`).join("");
  $("satFields").innerHTML = SAT_FIELDS.map(fieldHTML).join("");
}
function syncFormFromState() {
  document.querySelectorAll("[data-k]").forEach(el => { el.value = state[el.dataset.k] ?? ""; });
  renderAlertForm();
}

/* ---------- Alerts form ---------- */
function renderAlertForm() {
  $("alertList").innerHTML = state.alerts.map((a, i) => `
    <div class="alert-item" data-i="${i}">
      <h5>ALERT ${i + 1}<button class="btn danger" data-rm="${i}">Remove Alert</button></h5>
      <label>Hazard Type<select data-a="hazard">${HAZARDS.map(h => `<option ${h === a.hazard ? "selected" : ""}>${h}</option>`).join("")}</select></label>
      <label>Alert Level<select data-a="level">${LEVELS.map(l => `<option ${l === a.level ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>Affected Area<input data-a="area" value="${esc(a.area)}"></label>
      <label>Issued Time<input data-a="issued" value="${esc(a.issued)}"></label>
      <label>Valid Until<input data-a="valid" value="${esc(a.valid)}"></label>
      <label>Description<textarea data-a="desc">${esc(a.desc)}</textarea></label>
    </div>`).join("") || `<p class="note-small">No alerts added.</p>`;
}

/* ---------- Render preview ---------- */
function setOut(key, text) {
  document.querySelectorAll(`[data-out="${key}"]`).forEach(el => { el.textContent = text; });
}
function heatClass() {
  const n = parseFloat(String(state.heatValue).replace(/[^\d.]/g, ""));
  const c = String(state.heatCat).toLowerCase();
  if (c.includes("extreme danger") || n >= 52) return "heat-extdanger";
  if (c.includes("danger") || n >= 42) return "heat-danger";
  if (c.includes("extreme caution") || n >= 33) return "heat-extcaution";
  if (c.includes("caution") || n >= 27) return "heat-caution";
  return "";
}
function render() {
  const keys = ["number","valid","area","by","synopsis","forecast","condition","temp","rain","wind","humidity",
    "heatValue","heatCat","heatPeak","heatAreas","tcName","tcLoc","tcWind","tcGust","tcMove","tcLevel","tcEffects",
    "satCaption","satSource","sevSituation","sevHazards","sevImpacts","sevSafety","sevNext"];
  keys.forEach(k => setOut(k, val(k)));
  const dt = [fmtDate(state.date), fmtTime(state.time)].filter(Boolean).join(" • ");
  setOut("dateTime", dt || NS);

  $("demoBanner").style.display = state.demo ? "block" : "none";
  $("heatCatBox").className = "heat-cat " + heatClass();
  const tl = String(state.tcLevel).toLowerCase();
  $("tcLevelBox").className = tl === "active" || tl === "high" ? "tc-active" : tl === "moderate" ? "tc-mod" : tl === "low" ? "tc-low" : "";

  $("alertOut").innerHTML = state.alerts.length ? state.alerts.map(a => `
    <div class="a-card ${LEVEL_CLASS[a.level] || "a-info"}">
      <div class="a-top"><span>${esc(a.hazard)}</span><span class="a-badge">${esc(a.level)}</span></div>
      <div><b>Area:</b> ${esc(a.area.trim() || NS)} &nbsp; <b>Issued:</b> ${esc(a.issued.trim() || NS)} &nbsp; <b>Until:</b> ${esc(a.valid.trim() || NS)}</div>
      <div>${esc(a.desc.trim() || NS)}</div>
    </div>`).join("") : `<div class="a-none">NO WARNINGS OR ALERTS ENTERED</div>`;

  const box = $("satBox");
  if (state.image) { box.style.backgroundImage = `url("${state.image}")`; box.innerHTML = ""; }
  else { box.style.backgroundImage = "none"; box.innerHTML = `<span id="satEmpty">No image uploaded</span>`; }
}

/* ---------- Scale preview to fit screen (display only) ---------- */
function fitPreview() {
  const wrap = $("previewWrap");
  const avail = wrap.parentElement.clientWidth - (window.innerWidth > 1100 ? $("controls").offsetWidth + 20 : 0);
  const s = Math.min(1, Math.max(0.2, avail / W));
  $("scaler").style.transform = `scale(${s})`;
  wrap.style.height = Math.round(H * s) + "px";
  wrap.style.width = window.innerWidth > 1100 ? Math.round(W * s) + "px" : "100%";
  wrap.style.flex = window.innerWidth > 1100 ? "none" : "";
}

/* ---------- Events ---------- */
function bind() {
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.k) { state[t.dataset.k] = t.value; state.demo = false; render(); }
    else if (t.dataset.a) {
      const i = +t.closest(".alert-item").dataset.i;
      state.alerts[i][t.dataset.a] = t.value; state.demo = false; render();
    }
  });
  document.addEventListener("click", e => {
    const rm = e.target.dataset.rm;
    if (rm !== undefined) { state.alerts.splice(+rm, 1); state.demo = false; renderAlertForm(); render(); }
  });
  $("btnAddAlert").onclick = () => {
    state.alerts.push({hazard:HAZARDS[0], level:LEVELS[0], area:"", issued:"", valid:"", desc:""});
    state.demo = false; renderAlertForm(); render();
  };
  $("satFile").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { state.image = r.result; state.demo = false; render(); };
    r.readAsDataURL(f);
  };
  $("btnClearImg").onclick = () => { state.image = ""; $("satFile").value = ""; render(); };
  $("btnReset").onclick = () => {
    if (!confirm("Reset everything to the demo bulletin?")) return;
    state = demoState(); $("satFile").value = ""; syncFormFromState(); render(); setStatus("");
  };
  $("btnPrint").onclick = () => window.print();
  $("btnPng").onclick = generatePNG;
  window.addEventListener("resize", fitPreview);
}

/* ---------- PNG export ---------- */
function setStatus(msg, cls) { const s = $("status"); s.textContent = msg; s.className = "status " + (cls || ""); }

function preloadImage(src) {
  return new Promise(res => {
    if (!src) return res();
    const img = new Image();
    img.onload = () => (img.decode ? img.decode().catch(() => {}).then(res) : res());
    img.onerror = res;
    img.src = src;
  });
}

async function generatePNG() {
  const btn = $("btnPng");
  btn.disabled = true;
  setStatus("Generating PNG…");
  try {
    if (typeof html2canvas === "undefined") throw new Error("Export library not loaded. Check your internet connection.");
    render();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await preloadImage(state.image);          // make sure uploaded image is fully loaded
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas($("bulletin"), {
      width: W, height: H, scale: 1,
      backgroundColor: "#ffffff",
      useCORS: true, allowTaint: false, logging: false,
      scrollX: 0, scrollY: 0, windowWidth: Math.max(W, document.documentElement.clientWidth),
      onclone: doc => {
        // Remove the on-screen scaling so the clone renders at the true 1080 x 1350 size
        const sc = doc.getElementById("scaler");
        sc.style.transform = "none";
        const wrap = doc.getElementById("previewWrap");
        wrap.style.cssText = `position:static;width:${W}px;height:${H}px;overflow:visible;`;
        const b = doc.getElementById("bulletin");
        b.style.margin = "0";
      }
    });

    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    if (!blob) throw new Error("Could not create the PNG file.");
    const d = state.date || new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `11-VISIONARIES_Multi-Hazard_Bulletin_${d}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setStatus("PNG successfully generated.", "ok");
  } catch (err) {
    console.error(err);
    setStatus("PNG export failed: " + err.message, "err");
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Init ---------- */
buildForm();
syncFormFromState();
bind();
render();
fitPreview();
