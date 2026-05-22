const STORAGE_KEY = "candlelight-delve-state-v2";

const TABLES = {
  roomSizes: ["Cramped niche", "Broad hall", "Collapsed vault", "Sunken gallery", "Split-level rotunda", "Long crypt chamber", "Pillar-filled sanctuary"],
  roomShapes: ["oval", "rectangular", "hexagonal", "irregular cavern", "circular with side alcoves"],
  exits: ["1 hidden exit", "2 archways", "3 uneven tunnels", "a stair descending further", "a flooded breach and a narrow door"],
  terrainFeatures: ["broken idol and candle wax", "chasm crossed by cracked planks", "root-tangled pillars", "knee-deep black water", "bones arranged as warning marks"],
  sensoryDetails: ["air tastes of copper and wet stone", "faint choir hum behind the walls", "dripping echoes count like a clock", "flickering light with no source", "smell of old incense and mildew"],
  dangerRatings: ["Still", "Wary", "Threatening", "Perilous", "Dire"],
  happenings: ["Two unseen groups recently crossed paths here", "A ritual was interrupted moments before your arrival", "Something scavenges in the dark, avoiding direct contact", "The room itself shifts and erases tracks", "A survivor hides nearby, too frightened to call out"],
  envStory: ["old graffiti maps a route that no longer exists", "fresh claw marks score over ancient carvings", "charred packs and snapped tools lie abandoned", "the noble crest on the wall is deliberately defaced", "chalk tally marks show someone counting down"],
  tensions: ["time pressure from dwindling light", "risk of alerting a greater presence", "mistrust between potential allies", "unstable footing during any conflict", "an omen that suggests betrayal ahead"],
  conflicts: ["parley with desperate scavengers", "avoid a territorial guardian", "disable a trap under duress", "choose between stealth and speed", "secure a route before a rival faction does"],
  discoveries: ["a half-burned expedition journal", "a sealed bronze coffer with unknown sigil", "an old prayer that doubles as a passphrase", "a route to a lower level marked in blood", "evidence that your active threat serves someone else"],
  hazards: [
    "Pressure plate linked to a slamming stone door",
    "Concealed dart launcher in carved masonry",
    "Unstable ledge crumbling into a lower shaft",
    "Runic ward that flashes and scorches intruders",
    "Quicksand-like subsidence in slick silt"
  ],
  cover: ["half-collapsed pews", "heavy stone sarcophagus lids", "pillar shadows", "waist-high rubble", "broken statuary"],
  lootHints: ["a tarnished holy symbol", "wax-sealed satchel", "fungus-wrapped lockbox", "coin trail ending at a crack", "map fragment stitched into cloth"]
};

const oracleOutcomes = ["No, and…", "No", "No, but…", "Yes, but…", "Yes", "Yes, and…"];

const state = {
  party: [],
  dungeon: { depth: "", dangerMeter: "", lightResources: "", activeThreat: "", factionPressure: "" },
  outputs: {
    room: "No chamber sketched yet.",
    situation: "No situation recorded yet.",
    oracle: "The oracle waits in silence.",
    roomVisual: null
  },
  log: []
};

const randomOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
const timestamp = () => new Date().toLocaleString();

function hydrateState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state.party = [buildCharacter(), buildCharacter(), buildCharacter()];
    return;
  }
  try { Object.assign(state, JSON.parse(saved)); }
  catch { state.party = [buildCharacter(), buildCharacter(), buildCharacter()]; }
  if (!state.party?.length) state.party = [buildCharacter(), buildCharacter(), buildCharacter()];
}

function persistState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function buildCharacter() { return { name: "", class: "", level: "1", hp: "", maxHp: "", notes: "" }; }
function addLog(type, text) { state.log.unshift({ type, text, at: timestamp() }); persistState(); renderLog(); }

function renderParty() {
  const list = document.getElementById("partyList");
  list.innerHTML = "";
  state.party.forEach((character, index) => {
    const card = document.createElement("article");
    card.className = "character-card";
    card.innerHTML = `<div class="character-grid">
      <label>Name <input data-field="name" data-index="${index}" value="${character.name}" /></label>
      <label>Class <input data-field="class" data-index="${index}" value="${character.class}" /></label>
      <label>Level <input data-field="level" data-index="${index}" value="${character.level}" /></label>
      <label>HP <input data-field="hp" data-index="${index}" value="${character.hp}" /></label>
      <label>Max HP <input data-field="maxHp" data-index="${index}" value="${character.maxHp}" /></label>
      <label>Status Notes <input data-field="notes" data-index="${index}" value="${character.notes}" /></label>
    </div>`;
    list.append(card);
  });
}

function syncDungeonState() {
  ["depth", "dangerMeter", "lightResources", "activeThreat", "factionPressure"].forEach((key) => { state.dungeon[key] = document.getElementById(key).value; });
  persistState();
}

function renderDungeonState() { Object.entries(state.dungeon).forEach(([key, value]) => { document.getElementById(key).value = value; }); }

function renderOutputs() {
  document.getElementById("roomOutput").textContent = state.outputs.room;
  document.getElementById("situationOutput").textContent = state.outputs.situation;
  document.getElementById("oracleAnswer").textContent = state.outputs.oracle;
  renderRoomVisualization();
}

function renderLog() {
  const log = document.getElementById("campaignLog");
  if (!state.log.length) { log.innerHTML = "<em>The journal is empty.</em>"; return; }
  log.innerHTML = state.log.map((entry) => `<div class="log-entry"><strong>[${entry.type}]</strong> <small>${entry.at}</small><p>${entry.text}</p></div>`).join("");
}

function buildRoomVisual() {
  return {
    shape: randomOf(TABLES.roomShapes),
    exits: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({ side: randomOf(["north", "east", "south", "west"]), kind: randomOf(["door", "arch", "stairs", "breach"]) })),
    hazards: [randomOf(TABLES.hazards), randomOf(TABLES.hazards)],
    cover: [randomOf(TABLES.cover), randomOf(TABLES.cover)],
    loot: randomOf(TABLES.lootHints),
    terrain: randomOf(TABLES.terrainFeatures)
  };
}

function generateRoom() {
  const visual = buildRoomVisual();
  const text = `${randomOf(TABLES.roomSizes)} ${visual.shape} with ${randomOf(TABLES.exits)}. Feature: ${visual.terrain}. Sensory detail: ${randomOf(TABLES.sensoryDetails)}. Danger: ${randomOf(TABLES.dangerRatings)}. Hazards: ${visual.hazards[0]}; ${visual.hazards[1]}. Cover: ${visual.cover[0]}.`;
  state.outputs.room = text;
  state.outputs.roomVisual = visual;
  persistState();
  renderOutputs();
  addLog("Room", `${text} Loot clue: ${visual.loot}.`);
}

function generateSituation() {
  const text = `${randomOf(TABLES.happenings)}; ${randomOf(TABLES.envStory)}. Tension: ${randomOf(TABLES.tensions)}. Possible conflict: ${randomOf(TABLES.conflicts)}. Discovery: ${randomOf(TABLES.discoveries)}.`;
  state.outputs.situation = text;
  persistState();
  renderOutputs();
  addLog("Situation", text);
}

function askOracle() {
  const question = document.getElementById("oracleQuestion").value.trim();
  if (!question) return;
  const result = `${randomOf(oracleOutcomes)} ${question}`;
  state.outputs.oracle = result;
  persistState();
  renderOutputs();
  addLog("Oracle", result);
  document.getElementById("oracleQuestion").value = "";
}

function renderRoomVisualization() {
  const target = document.getElementById("roomSketch");
  const details = document.getElementById("roomDetails");
  const visual = state.outputs.roomVisual;
  if (!visual) {
    target.innerHTML = "<p class='placeholder'>Generate a room to sketch its map and tactical notes.</p>";
    details.textContent = "No room details to annotate.";
    return;
  }
  const shapeSvg = {
    oval: "<ellipse cx='220' cy='130' rx='160' ry='95' />",
    rectangular: "<rect x='55' y='40' width='330' height='180' rx='10' />",
    hexagonal: "<polygon points='125,35 315,35 390,130 315,225 125,225 50,130' />",
    "irregular cavern": "<path d='M72,72 C120,24 280,22 342,68 C396,112 389,191 326,218 C250,249 146,238 94,200 C35,157 26,106 72,72 Z' />",
    "circular with side alcoves": "<path d='M220,40 a90,90 0 1,0 0.1,0 Z M130,125 a24,24 0 1,0 0.1,0 Z M310,125 a24,24 0 1,0 0.1,0 Z' />"
  };
  const exitMarks = visual.exits.map((e) => {
    const map = { north: [220, 38], east: [385, 130], south: [220, 222], west: [55, 130] }[e.side];
    return `<g><circle cx='${map[0]}' cy='${map[1]}' r='7'></circle><text x='${map[0] + 10}' y='${map[1] + 4}'>${e.kind}</text></g>`;
  }).join("");

  target.innerHTML = `<svg viewBox='0 0 440 260' class='room-svg' aria-label='Generated dungeon room sketch'>
    <g class='room-outline'>${shapeSvg[visual.shape] || shapeSvg.rectangular}</g>
    <g class='room-exits'>${exitMarks}</g>
    <g class='room-notes'>
      <text x='64' y='246'>Terrain: ${visual.terrain}</text>
      <text x='64' y='20'>Loot clue: ${visual.loot}</text>
    </g>
  </svg>`;

  details.innerHTML = `<strong>Hazards</strong>: ${visual.hazards.join("; ")}<br><strong>Cover</strong>: ${visual.cover.join("; ")}<br><strong>Exits</strong>: ${visual.exits.map((e) => `${e.side} ${e.kind}`).join(", ")}`;
}

function addManualNote() {
  const noteInput = document.getElementById("manualNote");
  const note = noteInput.value.trim();
  if (!note) return;
  addLog("Note", note);
  noteInput.value = "";
}

function wireEvents() {
  document.getElementById("addCharacterBtn").addEventListener("click", () => {
    if (state.party.length >= 4) return;
    state.party.push(buildCharacter()); persistState(); renderParty();
  });
  document.getElementById("partyList").addEventListener("input", (event) => {
    const t = event.target; const i = Number(t.dataset.index); const f = t.dataset.field;
    if (Number.isNaN(i) || !f) return; state.party[i][f] = t.value; persistState();
  });
  ["depth", "dangerMeter", "lightResources", "activeThreat", "factionPressure"].forEach((id) => document.getElementById(id).addEventListener("input", syncDungeonState));
  document.getElementById("generateRoomBtn").addEventListener("click", generateRoom);
  document.getElementById("generateSituationBtn").addEventListener("click", generateSituation);
  document.getElementById("askOracleBtn").addEventListener("click", askOracle);
  document.getElementById("addNoteBtn").addEventListener("click", addManualNote);
  document.getElementById("clearLogBtn").addEventListener("click", () => { state.log = []; persistState(); renderLog(); });

  // Future extension hooks:
  // - Faction relationship engine and faction clocks.
  // - Dungeon theme packs and biome-aware room tables.
  // - Procedural quest hooks and milestone tracking.
  // - Treasure and relic generation tables.
  // - NPC motivations, names, and rumor generators.
  // - Overland/travel systems tied to resource pressure.
  // - Campaign clocks that trigger major world shifts.
}

function init() { hydrateState(); renderParty(); renderDungeonState(); renderOutputs(); renderLog(); wireEvents(); }
init();
