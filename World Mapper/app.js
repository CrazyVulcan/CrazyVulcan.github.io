/*
World Mapper Generator Pipeline
1) Use built-in world tables (Theme -> Population Center -> District Letter -> Location Type -> Specific Site).
2) Create deterministic RNG from seed so same seed/settings reproduces identical output.
3) Build centers and districts with drill-down data.
4) Add NPC + quest placeholders (using race/class/motivation starter tables).
5) Render map/detail/logs and export JSON. Persist notes + persistent flags via localStorage.
*/

const WORLD_TABLES = {
  themes: ["Civilized", "Haunted", "Magical", "Isolated", "Frontier", "Militaristic", "Religious", "Decaying", "Ancient", "Industrial"],
  centerTypes: [
    { name: "Village", districtCount: 1, letters: ["A"] },
    { name: "Town", districtCount: 3, letters: ["A", "A", "B"] },
    { name: "City", districtCount: 5, letters: ["A", "A", "B", "B", "C"] },
    { name: "Huge City", districtCount: 7, letters: ["B", "B", "C", "C", "C", "D", "E"] },
    { name: "Port", districtCount: 2, letters: ["A", "E"] },
  ],
  letters: {
    A: ["Farming", "Trade", "Housing", "Manor", "Tower"],
    B: ["Trade", "Shops", "Factory", "Guilds", "Mansion"],
    C: ["University", "Palace", "Fortress", "Temple", "Historic"],
    D: ["Guild HQ", "Seat of Power"],
    E: ["Docks", "Warehouse", "Trade", "Bank"],
  },
  specifics: {
    Farming: ["Ranch", "Mill", "Farm Land"],
    Trade: ["General Goods", "Luxury Goods", "Magic Goods"],
    Housing: ["Town House", "Complexes", "Patchwork"],
    Manor: ["Vacant", "Old Money", "Lavish", "Library"],
    Tower: ["Guard Post", "Armory", "Magical Point", "Abandoned"],
    Shops: ["Mini Market", "Caravan", "Potions", "Alchemy", "Mage Shop", "Blacksmith", "Black Market", "Guild Hall", "Tailor", "Antiquities"],
    Factory: ["Goods", "Steel", "Weapons", "Magic"],
    Guilds: ["Crafters", "Thieves", "Merchants", "Explorers", "Mages", "Navigators"],
    Mansion: ["Judge", "Merchants", "Old Money", "Cryptic"],
    University: ["Magic", "Arts", "Lore", "Fighting", "Adventuring", "Prep School"],
    Palace: ["Prince/Princess", "Baron", "Duke", "Noble House"],
    Fortress: ["Holy Seat", "Warlord", "Prison", "Stronghold"],
    Temple: ["Arcane", "Knowledge", "Power", "Hope or Healing"],
    Historic: ["Heroes Home", "Battle Site", "Relic"],
    "Guild HQ": ["Crafters", "Thieves", "Merchants", "Explorers", "Mages", "Navigators"],
    "Seat of Power": ["King", "Vassal", "Lord"],
    Docks: ["Cargo Piers", "Fishing Quay", "Naval Berth"],
    Warehouse: ["Grain Stores", "Customs Vault", "Smuggler Lockup"],
    Bank: ["Coin House", "Loan Hall", "Vault Annex"],
  },
};

const NPC_TABLES = {
  rarity: [
    { min: 1, max: 50, value: "Common" },
    { min: 51, max: 80, value: "Uncommon" },
    { min: 81, max: 100, value: "Rare" },
  ],
  races: {
    Common: [[1, 30, "Human"], [31, 50, "Elf"], [51, 70, "Dwarf"], [71, 80, "Half-Orc"], [81, 90, "Halfling"], [91, 100, "Dragonborn"]],
    Uncommon: [[1, 20, "Gnome"], [21, 40, "Tiefling"], [41, 60, "Half-Elf"], [61, 65, "Fairy Folk"], [66, 75, "Goblin"], [76, 90, "Tabaxi"], [91, 100, "Triton"]],
    Rare: [[1, 20, "Tortle"], [21, 40, "Warforged"], [41, 60, "Centaur"], [61, 80, "Minotaur"], [81, 100, "Changeling"]],
  },
  classes: [[1,10,"Fighter"],[11,20,"Ranger"],[21,30,"Rogue"],[31,40,"Wizard"],[41,50,"Cleric"],[51,55,"Barbarian"],[56,60,"Bard"],[61,70,"Monk"],[71,80,"Druid"],[81,85,"Warlock"],[86,90,"Sorcerer"],[91,95,"Artificer"],[96,100,"Gunslinger"]],
  motivations: [[1,9,"Wealth"],[10,18,"Fame"],[19,27,"Glory"],[28,38,"Adventure"],[39,46,"Truth"],[47,54,"Knowledge"],[55,60,"Revenge"],[61,65,"Romance"],[66,75,"Power"],[76,84,"Freedom"],[85,92,"Order"],[93,100,"Escape"]]
};

const state = { region: null, selectedDistrictKey: null, selectedTags: new Set(), logs: [], notes: {}, persistentOverrides: {} };

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
const slug = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function hashSeed(seed) { let h = 1779033703 ^ seed.length; for (let i=0;i<seed.length;i++){ h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19);} h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; }
function mulberry32(a){ return ()=>{ let t=(a+=0x6d2b79f5); t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function createRng(seed){ const rand=mulberry32(hashSeed(seed)); return { int:(min,max)=>Math.floor(rand()*(max-min+1))+min, pick:(arr)=>arr[Math.floor(rand()*arr.length)] }; }
function rollDice(notation, rng){ const m=String(notation).toLowerCase().match(/^(\d*)d(\d+)$/); if(!m) throw new Error(`Invalid notation ${notation}`); const n=Number(m[1]||1),s=Number(m[2]); let total=0; for(let i=0;i<n;i++) total += rng.int(1,s); return total; }

function fromRange(roll, arr, fallback="Unknown") {
  for (const r of arr) {
    const min = r.min ?? r[0];
    const max = r.max ?? r[1];
    const val = r.value ?? r[2];
    if (roll >= min && roll <= max) return val;
  }
  return fallback;
}

function generateNpcPlaceholder(rng, district) {
  const rarityRoll = rollDice("d100", rng);
  const rarity = fromRange(rarityRoll, NPC_TABLES.rarity, "Common");
  const raceRoll = rollDice("d100", rng);
  const race = fromRange(raceRoll, NPC_TABLES.races[rarity], "Human");
  const classRoll = rollDice("d100", rng);
  const npcClass = fromRange(classRoll, NPC_TABLES.classes, "Fighter");
  const motivationRoll = rollDice("d100", rng);
  const motivation = fromRange(motivationRoll, NPC_TABLES.motivations, "Adventure");

  return {
    id: `npc-${district.id}`,
    name: rng.pick(["Ari", "Thorne", "Mara", "Brigg", "Sel", "Jun", "Kest", "Rook"]),
    race,
    raceRarity: rarity,
    npcClass,
    motivation,
    attitudeRoll: rollDice("d6", rng),
    placeholderQuestHook: `Placeholder: ${motivation}-driven objective tied to ${district.specific}.`,
    rolls: { rarityRoll, raceRoll, classRoll, motivationRoll }
  };
}

function buildRegion(seed, centerCount) {
  const rng = createRng(seed);
  const theme = rng.pick(WORLD_TABLES.themes);

  const centers = [];
  const districts = [];

  for (let c = 1; c <= centerCount; c++) {
    const centerType = rng.pick(WORLD_TABLES.centerTypes);
    const center = {
      id: `center-${c}`,
      name: `${centerType.name} ${c}`,
      centerType: centerType.name,
      theme,
      districtCount: centerType.districtCount,
      letters: centerType.letters.slice(),
    };

    center.districts = centerType.letters.map((letter, i) => {
      const broadType = rng.pick(WORLD_TABLES.letters[letter]);
      const specific = rng.pick(WORLD_TABLES.specifics[broadType] || [broadType]);
      const id = `${center.id}-d${i + 1}`;
      const district = {
        id,
        key: id,
        centerId: center.id,
        centerName: center.name,
        theme,
        letter,
        broadType,
        specific,
        tags: [slug(theme), slug(centerType.name), slug(letter), slug(broadType), slug(specific)].filter(Boolean),
        persistent: state.persistentOverrides[id] ?? false,
        note: state.notes[id] || "",
      };
      district.npc = generateNpcPlaceholder(rng, district);
      return district;
    });

    centers.push(center);
    districts.push(...center.districts);
  }

  return {
    seed,
    settings: { centerCount },
    theme,
    centers,
    districts,
  };
}

function renderLogs() { els.logList.innerHTML = state.logs.map((x) => `<li>${x}</li>`).join(""); }

function renderMap() {
  els.mapCanvas.innerHTML = "";
  if (!state.region) return;

  state.region.districts.forEach((d) => {
    const b = document.createElement("button");
    b.className = "tile";
    if (d.key === state.selectedDistrictKey) b.classList.add("selected");
    if (d.persistent) b.classList.add("persistent");
    if (state.selectedTags.size && [...state.selectedTags].some((t) => d.tags.includes(t))) b.classList.add("highlight");

    b.innerHTML = `<span class="idx">${d.centerName} · D${d.id.split('-d').pop()}</span>${d.letter} → ${d.broadType}${d.persistent ? ' <span class="persistent-badge">★</span>' : ''}`;
    b.addEventListener("click", () => {
      state.selectedDistrictKey = d.key;
      renderMap();
      renderDetail();
    });
    els.mapCanvas.appendChild(b);
  });
}

function renderDetail() {
  const d = state.region?.districts.find((x) => x.key === state.selectedDistrictKey);
  if (!d) {
    els.detailContent.innerHTML = "<p>Select a district to view details.</p>";
    return;
  }

  els.detailContent.innerHTML = `
    <div class="card">
      <h3>${d.centerName} — District ${d.id.split('-d').pop()} ${d.persistent ? '<span class="persistent-badge">★ persistent</span>' : ''}</h3>
      <p><strong>Theme:</strong> ${d.theme}</p>
      <p><strong>Drill-down:</strong> Letter ${d.letter} → ${d.broadType} → ${d.specific}</p>
      <p><strong>Tags:</strong> ${d.tags.join(", ")}</p>
    </div>
    <div class="card">
      <h4>NPC Placeholder</h4>
      <p><strong>${d.npc.name}</strong> — ${d.npc.race} ${d.npc.npcClass} (${d.npc.raceRarity})<br/>
      Motivation: ${d.npc.motivation} | Attitude d6: ${d.npc.attitudeRoll}<br/>
      ${d.npc.placeholderQuestHook}<br/>
      <em>Rolls: rarity ${d.npc.rolls.rarityRoll}, race ${d.npc.rolls.raceRoll}, class ${d.npc.rolls.classRoll}, motivation ${d.npc.rolls.motivationRoll}</em></p>
    </div>
    <div class="card">
      <div class="button-row">
        <button id="persistentBtn">Mark Persistent</button>
      </div>
      <label for="noteInput">Add Note</label>
      <textarea id="noteInput" rows="3" placeholder="Session note">${d.note || ""}</textarea>
    </div>
  `;

  document.getElementById("persistentBtn").addEventListener("click", () => {
    d.persistent = !d.persistent;
    state.persistentOverrides[d.id] = d.persistent;
    persistLocal();
    renderMap();
    renderDetail();
  });

  document.getElementById("noteInput").addEventListener("input", (e) => {
    d.note = e.target.value;
    state.notes[d.id] = d.note;
    persistLocal();
  });
}

function renderTagFilters() {
  const tags = new Set();
  state.region?.districts.forEach((d) => d.tags.forEach((t) => tags.add(t)));

  els.tagFilters.innerHTML = "";
  [...tags].sort().forEach((tag) => {
    const b = document.createElement("button");
    b.className = `tag-chip${state.selectedTags.has(tag) ? " active" : ""}`;
    b.textContent = tag;
    b.addEventListener("click", () => {
      if (state.selectedTags.has(tag)) state.selectedTags.delete(tag);
      else state.selectedTags.add(tag);
      renderTagFilters();
      renderMap();
    });
    els.tagFilters.appendChild(b);
  });
}

function persistLocal() {
  localStorage.setItem("wm-notes", JSON.stringify(state.notes));
  localStorage.setItem("wm-persistent", JSON.stringify(state.persistentOverrides));
}

function loadLocal() {
  state.notes = JSON.parse(localStorage.getItem("wm-notes") || "{}");
  state.persistentOverrides = JSON.parse(localStorage.getItem("wm-persistent") || "{}");
}

function exportRegion() {
  if (!state.region) return;
  els.exportText.value = JSON.stringify(state.region, null, 2);
  els.exportModal.showModal();
}

els.generateBtn.addEventListener("click", () => {
  try {
    state.logs = [];
    const seed = els.seedInput.value.trim() || "default-seed";
    const centerCount = Math.min(8, Math.max(1, Number(els.sizeInput.value || 3)));
    state.region = buildRegion(seed, centerCount);
    state.selectedDistrictKey = state.region.districts[0]?.key || null;
    renderTagFilters();
    renderMap();
    renderDetail();
    log(`Generated ${centerCount} population center(s) with theme "${state.region.theme}".`);
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
  a.download = `world-mapper-${state.region.seed}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

loadLocal();
log("Ready. Generate a region from built-in World Mapper tables.");
