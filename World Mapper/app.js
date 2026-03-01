/*
Quick README:
- Parse bundled Place/Shop + Travel/Realm tables (from local sample file) with schema checks.
- Use seeded RNG + dice roller for deterministic generation.
- Build region districts with place selection, POIs, NPC contacts, quest hooks, follow-ups.
- Render map/detail/filter/log UI and support JSON export + localStorage notes/persistence.
*/

const PLACE_COLUMNS = ["ID", "Category", "Label", "DistrictRange", "DistrictType", "D6Roll", "TypesPOI", "MechanicalEffect", "Tags", "FollowUps", "Persistence"];
const TRAVEL_COLUMNS = ["ID", "Category", "Label", "TriggerRange", "MechanicalEffect", "FictionText", "Tags", "FollowUps", "Persistence"];

const TOKEN_ALIASES = {
  vilage: "village", distrects: "districts", distrect: "district", distrecttype: "districttype",
  militaristic: "militaristic", milteristic: "militaristic", religios: "religious", anchint: "ancient",
  industrual: "industrial", universty: "university", warhouse: "warehouse", luxery: "luxury",
  theves: "thieves", merchents: "merchants", explores: "explorers", knowlage: "knowledge",
  relec: "relic", "seat of power": "seat of power", seatofpower: "seat of power"
};

const state = {
  placeRows: [], travelRows: [], followUpIndex: new Map(),
  region: null, selectedDistrictId: null, selectedTags: new Set(), logs: [],
  notes: {}, persistentOverrides: {}
};

const els = {
  seedInput: document.getElementById("seedInput"),
  sizeInput: document.getElementById("sizeInput"),
  generateBtn: document.getElementById("generateBtn"),
  randomSeedBtn: document.getElementById("randomSeedBtn"),
  mapCanvas: document.getElementById("mapCanvas"),
  detailContent: document.getElementById("detailContent"),
  tagFilters: document.getElementById("tagFilters"),
  logList: document.getElementById("logList"),
  exportBtn: document.getElementById("exportBtn"),
  exportModal: document.getElementById("exportModal"),
  exportText: document.getElementById("exportText"),
  copyExportBtn: document.getElementById("copyExportBtn"),
  downloadExportBtn: document.getElementById("downloadExportBtn"),
};

const log = (msg) => { state.logs.push(`${new Date().toLocaleTimeString()} — ${msg}`); renderLogs(); };
const nTok = (s) => {
  const t = String(s || "").trim().toLowerCase();
  return TOKEN_ALIASES[t] || t;
};
const listField = (v) => String(v || "").split(/[;,]/).map((x) => nTok(x)).filter(Boolean);

function parseRange(s) {
  const m = String(s || "").trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
  if (!m) return null;
  const min = Number(m[1]);
  const max = Number(m[2] || m[1]);
  return { min, max };
}

function hashSeed(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
function mulberry32(a) { return () => { let t = (a += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function createRng(seed) {
  const rand = mulberry32(hashSeed(seed));
  return { int: (min, max) => Math.floor(rand() * (max - min + 1)) + min, pick: (arr) => arr[Math.floor(rand() * arr.length)] };
}
function rollDice(notation, rng) {
  const m = String(notation).toLowerCase().trim().match(/^(\d*)d(\d+)$/);
  if (!m) throw new Error(`Invalid dice notation: ${notation}`);
  const count = Number(m[1] || 1), sides = Number(m[2]);
  let total = 0;
  for (let i = 0; i < count; i++) total += rng.int(1, sides);
  return total;
}

function parseCSV(text) {
  const rows = [];
  let i = 0, inQuotes = false, field = "", row = [];
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) { row.push(field); field = ""; }
    else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
    i++;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (!rows.length) throw new Error("CSV is empty.");
  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((r) => {
    const obj = {}; headers.forEach((h, idx) => { obj[h] = (r[idx] || "").trim(); }); return obj;
  });
  return { headers, data };
}

function requireColumns(headers, required, label) {
  const missing = required.filter((c) => !headers.includes(c));
  if (missing.length) throw new Error(`${label} CSV missing columns: ${missing.join(", ")}`);
}

function setRows(placeRows, travelRows) {
  state.placeRows = placeRows;
  state.travelRows = travelRows;
  if (!state.placeRows.length) throw new Error("No Place/Shop rows loaded.");
  state.followUpIndex = new Map();
  [...state.placeRows, ...state.travelRows].forEach((r) => state.followUpIndex.set(r.ID, r));
  log(`Loaded ${state.placeRows.length} place/shop rows and ${state.travelRows.length} travel/realm rows.`);
}

function parseMixedSampleRows(rows) {
  const placeRows = rows.filter((r) => /meetingplace|shop/i.test(r.Category || ""));
  const travelRows = rows
    .filter((r) => /travelevent|realmtrait/i.test(r.Category || ""))
    .map((r) => ({
      ID: r.ID, Category: r.Category, Label: r.Label,
      TriggerRange: r.DistrictRange,
      MechanicalEffect: r.DistrictType,
      FictionText: r.D6Roll,
      Tags: r.TypesPOI,
      FollowUps: r.MechanicalEffect,
      Persistence: r.Tags || "no"
    }));
  return { placeRows, travelRows };
}

function districtMatch(place, idx) {
  const r = parseRange(place.DistrictRange);
  return !!r && idx >= r.min && idx <= r.max;
}


function rollD100(rng) { return rollDice("d100", rng); }

function pickFromRangeTable(roll, table, fallback = "Unknown") {
  const hit = table.find((entry) => roll >= entry.min && roll <= entry.max);
  return hit ? hit.value : fallback;
}

const NPC_RACE_TABLE = {
  rarity: [
    { min: 1, max: 50, value: "Common" },
    { min: 51, max: 80, value: "Uncommon" },
    { min: 81, max: 100, value: "Rare" },
  ],
  common: [
    { min: 1, max: 30, value: "Human" },
    { min: 31, max: 50, value: "Elf" },
    { min: 51, max: 70, value: "Dwarf" },
    { min: 71, max: 80, value: "Half-Orc" },
    { min: 81, max: 90, value: "Halfling" },
    { min: 91, max: 100, value: "Dragonborn" },
  ],
  uncommon: [
    { min: 1, max: 20, value: "Gnome" },
    { min: 21, max: 40, value: "Tiefling" },
    { min: 41, max: 60, value: "Half-Elf" },
    { min: 61, max: 65, value: "Fairy Folk" },
    { min: 66, max: 75, value: "Goblin" },
    { min: 76, max: 90, value: "Tabaxi" },
    { min: 91, max: 100, value: "Triton" },
  ],
  rare: [
    { min: 1, max: 20, value: "Tortle" },
    { min: 21, max: 40, value: "Warforged" },
    { min: 41, max: 60, value: "Centaur" },
    { min: 61, max: 80, value: "Minotaur" },
    { min: 81, max: 100, value: "Changeling" },
  ],
};

const NPC_CLASS_TABLE = [
  { min: 1, max: 10, value: "Fighter" },
  { min: 11, max: 20, value: "Ranger" },
  { min: 21, max: 30, value: "Rogue" },
  { min: 31, max: 40, value: "Wizard" },
  { min: 41, max: 50, value: "Cleric" },
  { min: 51, max: 55, value: "Barbarian" },
  { min: 56, max: 60, value: "Bard" },
  { min: 61, max: 70, value: "Monk" },
  { min: 71, max: 80, value: "Druid" },
  { min: 81, max: 85, value: "Warlock" },
  { min: 86, max: 90, value: "Sorcerer" },
  { min: 91, max: 95, value: "Artificer" },
  { min: 96, max: 100, value: "Gunslinger" },
];

const NPC_MOTIVATION_TABLE = [
  { min: 1, max: 9, value: "Wealth" },
  { min: 10, max: 18, value: "Fame" },
  { min: 19, max: 27, value: "Glory" },
  { min: 28, max: 38, value: "Adventure" },
  { min: 39, max: 46, value: "Truth" },
  { min: 47, max: 54, value: "Knowledge" },
  { min: 55, max: 60, value: "Revenge" },
  { min: 61, max: 65, value: "Romance" },
  { min: 66, max: 75, value: "Power" },
  { min: 76, max: 84, value: "Freedom" },
  { min: 85, max: 92, value: "Order" },
  { min: 93, max: 100, value: "Escape" },
];

function generateNpcRace(rng) {
  const rarityRoll = rollD100(rng);
  const rarity = pickFromRangeTable(rarityRoll, NPC_RACE_TABLE.rarity, "Common");
  const raceRoll = rollD100(rng);
  const racePool = rarity.toLowerCase() === "common" ? NPC_RACE_TABLE.common
    : (rarity.toLowerCase() === "uncommon" ? NPC_RACE_TABLE.uncommon : NPC_RACE_TABLE.rare);
  const race = pickFromRangeTable(raceRoll, racePool, "Human");
  return { rarity, rarityRoll, raceRoll, race };
}

function attitude(roll) {
  const table = {
    1: ["Hostile", "Demands payment before cooperation."], 2: ["Wary", "Needs proof before helping."],
    3: ["Neutral", "Shares only basic info."], 4: ["Open", "Will trade a favor for a favor."],
    5: ["Helpful", "Offers useful lead or resource."], 6: ["Friendly", "Offers direct help and advocacy."]
  };
  return { label: table[roll][0], effect: table[roll][1] };
}

function makeNPC(dId, place, rng) {
  const names = ["Ari", "Thorne", "Mara", "Brigg", "Sel", "Jun", "Kest", "Rook"];
  const quirks = ["speaks in proverbs", "never removes gloves", "collects broken keys", "keeps coded notes"];

  const raceMeta = generateNpcRace(rng);
  const classRoll = rollD100(rng);
  const npcClass = pickFromRangeTable(classRoll, NPC_CLASS_TABLE, "Fighter");
  const motivationRoll = rollD100(rng);
  const motivation = pickFromRangeTable(motivationRoll, NPC_MOTIVATION_TABLE, "Adventure");

  const attitudeRoll = rollDice("d6", rng);
  return {
    id: `NPC-${dId}-${rng.int(100, 999)}`,
    name: rng.pick(names),
    role: `${raceMeta.race} ${npcClass}`,
    race: raceMeta.race,
    raceRarity: raceMeta.rarity,
    raceRolls: { rarityRoll: raceMeta.rarityRoll, raceRoll: raceMeta.raceRoll },
    class: npcClass,
    classRoll,
    motivation,
    motivationRoll,
    attitudeRoll,
    attitude: attitude(attitudeRoll),
    goal: `${motivation.toLowerCase()}-driven objective near ${place.Label}`,
    quirk: rng.pick(quirks),
    contactTag: rng.pick(place.tags.length ? place.tags : ["local"])
  };
}

function makeHook(place, npc, rng) {
  const tag = rng.pick(place.tags.length ? place.tags : ["frontier"]);
  const objective = rng.pick([
    `Investigate escalating trouble around ${place.Label}`,
    `Escort a team through the ${place.Label} district`,
    `Retrieve evidence hidden near ${place.Label}`
  ]);
  const complication = rng.pick([
    `${tag} hazards worsen every dusk`,
    `a rival faction shadows ${npc.name}`,
    `a local pact tied to ${place.Label} is collapsing`
  ]);
  const rewardHint = rng.pick(["favor with local powers", "access to restricted records", "payment plus a relic lead"]);
  const urgency = Math.min(5, Math.ceil(rollDice("d6", rng) / 1.2));
  return { objective, complication, rewardHint, urgency };
}

function enqueueFollowUps(entity, queue, rng) {
  listField(entity.FollowUps).forEach((f) => queue.push({ name: f, source: entity.ID, roll: rollDice("d6", rng) }));
}
function resolveFollowUps(queue) {
  while (queue.length) {
    const item = queue.shift();
    const found = [...state.followUpIndex.values()].find((r) => nTok(r.ID) === item.name || nTok(r.Label) === item.name);
    if (found) log(`Resolved follow-up "${item.name}" from ${item.source} -> ${found.ID}.`);
    else log(`Skipped follow-up "${item.name}" from ${item.source}: missing table row.`);
  }
}

function buildRegion(seed, size) {
  const rng = createRng(seed);
  const queue = [];
  const districts = [];

  for (let i = 1; i <= size; i++) {
    const matches = state.placeRows.filter((p) => districtMatch(p, i));
    const place = matches.length ? rng.pick(matches) : rng.pick(state.placeRows);
    if (!matches.length) log(`District ${i}: no DistrictRange match, fallback random place used.`);

    const placeTags = listField(place.Tags);
    const poiBase = listField(place.TypesPOI);
    const poiCount = rng.int(1, 3);
    const pois = Array.from({ length: poiCount }, (_, pIdx) => ({
      id: `POI-${i}-${pIdx + 1}`,
      type: poiBase.length ? rng.pick(poiBase) : "unknown",
      summary: `${place.Label} point ${pIdx + 1}`,
      tags: placeTags
    }));

    const npc = makeNPC(i, { ...place, tags: placeTags }, rng);
    const questHook = makeHook({ ...place, tags: placeTags }, npc, rng);
    const persistent = state.persistentOverrides[place.ID] ?? (nTok(place.Persistence) === "yes");

    districts.push({
      districtId: i,
      place: { ...place, tags: placeTags, persistent },
      pois,
      npcs: [npc],
      questHook,
      note: state.notes[`district-${i}`] || ""
    });

    enqueueFollowUps(place, queue, rng);
  }

  const travel = state.travelRows.length ? rng.pick(state.travelRows) : null;
  if (travel) enqueueFollowUps(travel, queue, rng);
  resolveFollowUps(queue);

  return {
    seed,
    settings: { regionSize: size },
    travelHint: travel ? {
      ...travel,
      tags: listField(travel.Tags),
      suggestions: districts.filter((d) => d.place.tags.some((t) => listField(travel.Tags).includes(t))).map((d) => ({ districtId: d.districtId, placeId: d.place.ID, label: d.place.Label }))
    } : null,
    districts
  };
}

function renderLogs() { els.logList.innerHTML = state.logs.map((x) => `<li>${x}</li>`).join(""); }

function renderMap() {
  els.mapCanvas.innerHTML = "";
  if (!state.region) return;

  state.region.districts.forEach((d) => {
    const b = document.createElement("button");
    b.className = "tile";
    if (d.districtId === state.selectedDistrictId) b.classList.add("selected");
    if (d.place.persistent) b.classList.add("persistent");

    const tagHit = state.selectedTags.size && [...state.selectedTags].some((t) => d.place.tags.includes(t) || d.pois.some((p) => p.tags.includes(t) || p.type.includes(t)) || d.npcs.some((n) => n.contactTag === t));
    if (tagHit) b.classList.add("highlight");

    b.innerHTML = `<span class="idx">District ${d.districtId}</span>${d.place.Label}${d.place.persistent ? ' <span class="persistent-badge">★</span>' : ''}`;
    b.addEventListener("click", () => { state.selectedDistrictId = d.districtId; renderMap(); renderDetail(); });
    els.mapCanvas.appendChild(b);
  });
}

function renderDetail() {
  const d = state.region?.districts.find((x) => x.districtId === state.selectedDistrictId);
  if (!d) { els.detailContent.innerHTML = "<p>Select a district to view details.</p>"; return; }

  const visiblePois = d.pois.filter((p) => !state.selectedTags.size || [...state.selectedTags].some((t) => p.tags.includes(t) || p.type.includes(t)));
  const hint = state.region.travelHint
    ? `<p class="suggestion">Travel/Realm hint <strong>${state.region.travelHint.Label}</strong>: matching districts ${state.region.travelHint.suggestions.map((s) => s.districtId).join(", ") || "none"}.</p>`
    : "";

  els.detailContent.innerHTML = `
    <div class="card">
      <h3>${d.place.Label} ${d.place.persistent ? '<span class="persistent-badge">★ persistent</span>' : ''}</h3>
      <p>${d.place.MechanicalEffect}</p>
      <p><strong>Tags:</strong> ${d.place.tags.join(", ") || "none"}</p>
      ${hint}
    </div>
    <div class="card"><h4>POIs (${visiblePois.length}/${d.pois.length})</h4><ul>${visiblePois.map((p) => `<li class="poi-item">${p.type} — ${p.summary}</li>`).join("")}</ul></div>
    <div class="card"><h4>NPC Contact</h4>${d.npcs.map((n) => `<p><strong>${n.name}</strong> (${n.role}) | d6 ${n.attitudeRoll} ${n.attitude.label}: ${n.attitude.effect}<br/>Goal: ${n.goal}. Quirk: ${n.quirk}. Tag: ${n.contactTag}<br/>Race: ${n.race} (${n.raceRarity}, rolls ${n.raceRolls.rarityRoll}/${n.raceRolls.raceRoll}) | Class: ${n.class} (d100 ${n.classRoll}) | Motivation: ${n.motivation} (d100 ${n.motivationRoll})</p>`).join("")}</div>
    <div class="card"><h4>Quest Hook</h4><p>${d.questHook.objective}; complication: ${d.questHook.complication}; reward: ${d.questHook.rewardHint}. <strong>Urgency:</strong> ${d.questHook.urgency}/5.</p></div>
    <div class="card">
      <div class="button-row"><button id="followUpBtn">Roll Follow-up</button><button id="persistentBtn">Mark Persistent</button></div>
      <label for="noteInput">Add Note</label>
      <textarea id="noteInput" rows="3" placeholder="Session note">${d.note || ""}</textarea>
    </div>
  `;

  document.getElementById("followUpBtn").addEventListener("click", () => {
    const rng = createRng(`${state.region.seed}-followup-${d.districtId}-${state.logs.length}`);
    const q = []; enqueueFollowUps(d.place, q, rng); resolveFollowUps(q);
  });
  document.getElementById("persistentBtn").addEventListener("click", () => {
    d.place.persistent = !d.place.persistent;
    state.persistentOverrides[d.place.ID] = d.place.persistent;
    persistLocal(); renderMap(); renderDetail();
  });
  document.getElementById("noteInput").addEventListener("input", (e) => {
    d.note = e.target.value; state.notes[`district-${d.districtId}`] = d.note; persistLocal();
  });
}

function renderTagFilters() {
  const tags = new Set();
  state.region?.districts.forEach((d) => {
    d.place.tags.forEach((t) => tags.add(t));
    d.pois.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    d.npcs.forEach((n) => tags.add(n.contactTag));
  });
  els.tagFilters.innerHTML = "";
  [...tags].sort().forEach((tag) => {
    const b = document.createElement("button");
    b.className = `tag-chip${state.selectedTags.has(tag) ? " active" : ""}`;
    b.textContent = tag;
    b.addEventListener("click", () => {
      if (state.selectedTags.has(tag)) state.selectedTags.delete(tag); else state.selectedTags.add(tag);
      renderTagFilters(); renderMap(); renderDetail();
    });
    els.tagFilters.appendChild(b);
  });
}

function persistLocal() {
  localStorage.setItem("rpg-region-notes", JSON.stringify(state.notes));
  localStorage.setItem("rpg-region-persistent", JSON.stringify(state.persistentOverrides));
}
function loadLocal() {
  state.notes = JSON.parse(localStorage.getItem("rpg-region-notes") || "{}");
  state.persistentOverrides = JSON.parse(localStorage.getItem("rpg-region-persistent") || "{}");
}

function exportRegion() {
  if (!state.region) return;
  els.exportText.value = JSON.stringify(state.region, null, 2);
  els.exportModal.showModal();
}


els.generateBtn.addEventListener("click", () => {
  try {
    if (!state.placeRows.length) throw new Error("Bundled tables are not loaded yet.");

    state.logs = [];
    const seed = els.seedInput.value.trim() || "default-seed";
    const size = Math.min(8, Math.max(1, Number(els.sizeInput.value || 6)));
    state.region = buildRegion(seed, size);
    state.selectedDistrictId = 1;
    renderTagFilters(); renderMap(); renderDetail();
    log(`Generated region with seed="${seed}" and size=${size}.`);
  } catch (e) {
    log(`Generation error: ${e.message}`);
  }
});

els.randomSeedBtn.addEventListener("click", () => { els.seedInput.value = `seed-${Math.random().toString(36).slice(2, 10)}`; });
els.exportBtn.addEventListener("click", exportRegion);
els.copyExportBtn.addEventListener("click", async () => { await navigator.clipboard.writeText(els.exportText.value); log("Copied exported JSON to clipboard."); });
els.downloadExportBtn.addEventListener("click", () => {
  const blob = new Blob([els.exportText.value], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `region-${state.region.seed}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

async function bootstrapTables() {
  try {
    const sampleText = await (await fetch("sample-data.csv")).text();
    const parsed = parseCSV(sampleText);
    requireColumns(parsed.headers, PLACE_COLUMNS, "Sample");
    const mixed = parseMixedSampleRows(parsed.data);
    setRows(mixed.placeRows, mixed.travelRows);
    log("Bundled tables loaded. Ready to generate.");
  } catch (e) {
    log(`Bootstrap error: ${e.message}`);
  }
}

loadLocal();
bootstrapTables();
