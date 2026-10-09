/* DepEd Order No. 14, s. 2026 - Learning Continuity Levels (shared by bulletin + predictor)
   Triggers follow published summaries of the Order. Always verify against the official issuance. */
const DEPED = [
  {n:1, key:"HAYO",  en:"Continue",  cls:"lv1", days:"—", missed:"—",
   desc:"Regular in-person classes continue; learners and teachers are safe and ready."},
  {n:2, key:"HINAY", en:"Ease-in",   cls:"lv2", days:"up to 3 consecutive class days", missed:"half class day",
   desc:"Minor to moderate disruption. Learning continues at a slower pace (online, modules, packets); essential competencies only."},
  {n:3, key:"HINGA", en:"Check-in",  cls:"lv3", days:"up to 4 consecutive class days", missed:"half class day",
   desc:"Heightened stress. Academic demand is heavily reduced; safety, well-being checks and psychosocial support come first."},
  {n:4, key:"HINTO", en:"Stop",      cls:"lv4", days:"up to 5 consecutive class days", missed:"full class day",
   desc:"Safety and basic needs are at risk. Academic learning is halted; crisis protocols are activated with the LGU and SDO."}
];

/* i: {tcws, rain, flood, eq, heat, power, air, other} -> {level, reasons:[[n,text]]} */
function depedLevel(i) {
  const reasons = []; let L = 1;
  const add = (n, t) => { reasons.push([n, t]); if (n > L) L = n; };
  const tc = parseInt(i.tcws) || 0;
  if (tc >= 4) add(4, `TCWS No. ${tc}`); else if (tc === 3) add(3, "TCWS No. 3"); else if (tc >= 1) add(2, `TCWS No. ${tc}`);
  if (i.rain === "red") add(4, "Red rainfall warning"); else if (i.rain === "orange") add(3, "Orange rainfall warning"); else if (i.rain === "yellow") add(2, "Yellow rainfall warning");
  if (i.flood === "critical") add(3, "Critical water level"); else if (i.flood === "alarm") add(2, "Alarm water level");
  const eq = parseInt(i.eq) || 0;
  if (eq >= 6) add(4, `Earthquake Intensity ${eq}`); else if (eq === 5) add(3, "Earthquake Intensity V"); else if (eq >= 1) add(2, `Earthquake Intensity ${eq}`);
  const hi = parseFloat(String(i.heat).replace(/[^\d.]/g, ""));
  if (!isNaN(hi)) { if (hi >= 42) add(4, `Heat index ${hi}°C (Danger / Extreme Danger)`); else if (hi >= 33) add(3, `Heat index ${hi}°C (Extreme Caution)`); else if (hi >= 27) add(2, `Heat index ${hi}°C (Caution)`); }
  const P = {class:[2,"Power outage during class hours"], "2-3":[3,"Power outage of 2–3 days"], "4+":[4,"Power outage of 4 or more days"]};
  if (P[i.power]) add(...P[i.power]);
  const A = {unhealthy:[2,"Air quality: unhealthy"], acute:[3,"Air quality: acutely unhealthy"], emergency:[4,"Air quality: emergency"]};
  if (A[i.air]) add(...A[i.air]);
  const O = {strike:[2,"Transportation strike"], potential:[2,"Potential viral/bacterial outbreak"], bomb:[3,"Bomb threat"], outbreak:[3,"Actual viral/bacterial outbreak"],
             conflict:[4,"Armed conflict"], famine:[4,"Famine"], drought:[4,"Drought"], pandemic:[4,"Pandemic"]};
  if (O[i.other]) add(...O[i.other]);
  return {level: DEPED[L - 1], reasons};
}
