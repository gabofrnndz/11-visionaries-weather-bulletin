/* 11-VISIONARIES Class Suspension Predictor (separate from the bulletin system) */
const F = [
  ["tcws","Tropical Cyclone Wind Signal",[["","None"],["1","TCWS No. 1"],["2","TCWS No. 2"],["3","TCWS No. 3"],["4","TCWS No. 4"],["5","TCWS No. 5"]]],
  ["rain","Rainfall warning (PAGASA)",[["","None"],["yellow","Yellow"],["orange","Orange"],["red","Red"]]],
  ["flood","Flood water level",[["","None"],["alarm","Alarm level"],["critical","Critical level"]]],
  ["eq","Earthquake intensity (PHIVOLCS)",[["","None felt"],["1","Intensity I"],["2","Intensity II"],["3","Intensity III"],["4","Intensity IV"],["5","Intensity V"],["6","Intensity VI"],["7","Intensity VII"],["8","Intensity VIII or higher"]]],
  ["heat","Heat index (°C, number only)","number"],
  ["power","Power outage",[["","None"],["class","During class hours"],["2-3","2–3 days"],["4+","4 or more days"]]],
  ["air","Air quality",[["","Normal"],["unhealthy","Unhealthy"],["acute","Acutely unhealthy"],["emergency","Emergency"]]],
  ["other","Other situation",[["","None"],["strike","Transportation strike"],["potential","Potential viral/bacterial outbreak"],["bomb","Bomb threat"],["outbreak","Actual viral/bacterial outbreak"],["conflict","Armed conflict"],["famine","Famine"],["drought","Drought"],["pandemic","Pandemic"]]]
];
const $ = id => document.getElementById(id);
const get = () => Object.fromEntries(F.map(([k]) => [k, $("f_" + k).value]));

$("fields").innerHTML = F.map(([k, l, o]) => `<label>${l}` + (o === "number"
  ? `<input id="f_${k}" type="number" step="any" placeholder="e.g. 38">`
  : `<select id="f_${k}">${o.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`) + `</label>`).join("");

function show() {
  const i = get(), r = depedLevel(i), L = r.level;
  const auto = (parseInt(i.tcws) >= 3) || i.rain === "orange" || i.rain === "red" || i.flood === "critical";
  const list = r.reasons.sort((a, b) => b[0] - a[0]).map(x => `<li><b>Level ${x[0]}:</b> ${x[1]}</li>`).join("") || "<li>No hazard entered.</li>";
  $("out").innerHTML = `<h2>Predicted Level</h2>
    <span class="big lv${L.n}">LEVEL ${L.n} — ${L.key}</span> <small>(${L.en})</small>
    <p>${L.desc}</p>
    <div class="facts"><div><b>Maximum duration</b>${L.days}</div><div><b>Class day missed</b>${L.missed}</div></div>
    ${auto ? `<div class="auto">Orange/Red rainfall warning, critical water level, or TCWS No. 3 and above: in-person classes are generally suspended automatically in the affected area. Confirm with your Schools Division Office / LGU.</div>` : ""}
    <h3 style="margin:10px 0 2px">Hazards considered</h3><ul>${list}</ul>
    <p class="note-small">This is a planning aid, not an official declaration. Under the Order, school heads decide with the Schools Division Superintendent and local government. Heat-index triggers follow published summaries of the Order (Caution → Level 2, Extreme Caution → Level 3, Danger and above → Level 4) and sources differ on the Danger category; verify against the official DepEd issuance.</p>`;
}
document.addEventListener("input", show);
$("reset").onclick = () => { F.forEach(([k]) => { $("f_" + k).value = ""; }); show(); };
show();
