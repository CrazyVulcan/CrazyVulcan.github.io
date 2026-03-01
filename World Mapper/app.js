/*
World Mapper Generator Pipeline
1) Use built-in world tables (Theme -> Population Center -> District Letter -> Location Type -> Specific Site).
2) Create deterministic RNG from seed so same seed/settings reproduces identical output.
3) Build centers and districts with drill-down data.
4) Add NPC placeholders and a unique one-sentence story hook per motivation/theme/location combination.
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



const HOOK_INTENT_BY_MOTIVATION = {
  Wealth: ["secure a profitable edge", "lock down a lucrative contract", "divert a fresh revenue stream"],
  Fame: ["stage a reputation-saving reveal", "outshine a rival public figure", "turn a local scandal into applause"],
  Glory: ["claim credit for a bold feat", "win an honor no one expects", "prove their name deserves songs"],
  Adventure: ["drag someone into a risky excursion", "open a sealed opportunity", "test a path no one mapped"],
  Truth: ["expose what officials keep hidden", "prove a quiet lie", "force records into the light"],
  Knowledge: ["recover a missing source", "decode restricted notes", "verify a dangerous theory"],
  Revenge: ["settle a humiliating slight", "undo a rival's unfair victory", "force a rival to publicly pay"],
  Romance: ["win back a fractured bond", "protect a fragile courtship", "deliver a confession before it is too late"],
  Power: ["remove a blocker to influence", "bind a faction to their side", "seize control of a critical office"],
  Freedom: ["break a local chain of control", "erase a coercive obligation", "create an escape route"],
  Order: ["restore strict protocol", "stabilize a failing hierarchy", "shut down a growing disorder"],
  Escape: ["disappear before pursuit closes in", "fake a clean departure", "erase traces of a dangerous past"],
};

const THEME_DISTRICT_QUIRKS = {
  Civilized: {
    Farming: ["an annual livestock judging season shapes local prestige", "strict guild bylaws govern breeding rights"],
    Trade: ["merchant arbitration courts settle every disputed sale", "status is measured by patronage ledgers"],
    Housing: ["neighborhood associations police noise and decorum", "rent covenants hide old rivalries"],
    Manor: ["inheritance etiquette decides who can host key gatherings", "old-money galas quietly decide policy"],
    Tower: ["tower stewards license every official inspection", "public safety drills double as political theater"],
    Shops: ["shopfront awards can make or break a business", "artisan unions certify quality seals"],
    Factory: ["production quotas are audited by civic inspectors", "factory charters reward public efficiency"],
    Guilds: ["guild elections hinge on procedural loopholes", "committee votes quietly trade favors"],
    Mansion: ["mansion salons broker influence behind polite smiles", "estate feasts become campaign stages"],
    University: ["commission boards rank candidates by reputation", "faculty rivalries hide behind formal reviews"],
    Palace: ["court protocol defines who can petition first", "ceremonial rankings block direct access"],
    Fortress: ["garrison honors are granted through public tribunals", "security drills become political showcases"],
    Temple: ["donor patronage steers sacred priorities", "ritual precedence determines social standing"],
    Historic: ["heritage boards approve every restoration plan", "museum patrons fund selective narratives"],
    "Guild HQ": ["charter law is cited for every faction move", "minutes from old councils hold legal leverage"],
    "Seat of Power": ["cabinet etiquette limits who may challenge policy", "royal clerks can delay orders with procedure"],
    Docks: ["harbor permits are awarded by favored brokers", "shipping prestige depends on punctual manifests"],
    Warehouse: ["custom seals dictate whose goods move first", "insurance auditors inspect every crate"],
    Bank: ["credit scores are social weapons", "loan committees trade reputation for collateral"],
  },
  Haunted: {
    Farming: ["fields are marked by ghost-lights that move each dusk", "harvest rites are performed to placate old spirits"],
    Trade: ["buyers whisper that cursed coins return by morning", "markets close early when bells ring without hands"],
    Housing: ["entire blocks avoid houses with repeating echoes", "tenants leave offerings at hallway shrines"],
    Manor: ["portrait eyes are said to follow liars", "servants report footsteps in sealed wings"],
    Tower: ["night watch logs mention voices from empty stairwells", "signal fires relight after being extinguished"],
    Shops: ["some shelves restock with unlabeled goods overnight", "shopkeepers haggle with unseen patrons"],
    Factory: ["machines start in sync before dawn", "shift whistles sometimes answer themselves"],
    Guilds: ["dead founders are consulted through forbidden rituals", "guild seals appear on unsigned notices"],
    Mansion: ["ballrooms replay music from absent orchestras", "family crypt doors are never fully shut"],
    University: ["lecture halls repeat lost debates at midnight", "students trade notes on forbidden archives"],
    Palace: ["throne petitions are answered in a vanished monarch's voice", "court mirrors show delayed reflections"],
    Fortress: ["empty barracks still answer roll call", "old war banners bleed ink in rain"],
    Temple: ["candles relight when vows are broken", "confessions name people long dead"],
    Historic: ["memorial plaques rewrite dates at night", "tour routes avoid a corridor that hums"],
    "Guild HQ": ["charter rooms hold unexplained cold spots", "sealed votes are opened by unseen hands"],
    "Seat of Power": ["decrees are amended by unknown scribes", "throne room clocks all stop at the same hour"],
    Docks: ["fog reveals phantom moorings", "dock bells toll for ships that never arrive"],
    Warehouse: ["inventory vanishes then reappears rearranged", "night guards refuse aisle seven"],
    Bank: ["vault doors whisper account names", "ledgers include signatures from the dead"],
  },
  Magical: {
    Farming: ["crop cycles follow leyline surges", "pollination relies on bound sprites"],
    Trade: ["arcane tariffs change with moon phase", "enchanted stalls alter prices dynamically"],
    Housing: ["homes subtly reconfigure room layouts nightly", "warded apartments reject uninvited guests"],
    Manor: ["manor gates test visitors with glamours", "house sigils animate during negotiations"],
    Tower: ["tower runes recalibrate local weather", "watch beacons double as spell anchors"],
    Shops: ["shop inventories mutate with ambient mana", "clockwork familiars manage queue tokens"],
    Factory: ["assembly lines are stabilized by sigil arrays", "defective charms cause localized anomalies"],
    Guilds: ["guild licenses require arcane competency tests", "magi factions duel through legal proxies"],
    Mansion: ["warded salons suppress hostile magic", "heirlooms awaken during disputes"],
    University: ["labs produce spontaneous side effects", "departments feud over dangerous theses"],
    Palace: ["court advisors read omens before policy", "royal decrees are sealed with binding geasa"],
    Fortress: ["barriers pulse with stored spellwork", "garrison rotations follow divination charts"],
    Temple: ["miracles are audited by canon mages", "sacred relics respond to public doubt"],
    Historic: ["relic wings resonate with latent spells", "archives contain living manuscripts"],
    "Guild HQ": ["charter clauses are magically enforced", "oath circles expose hidden intent"],
    "Seat of Power": ["the throne amplifies spoken intent", "council chambers are warded against deceit"],
    Docks: ["harbor cranes are rune-guided", "cargo manifests are written in self-correcting ink"],
    Warehouse: ["storage wards prevent spoilage and theft", "miscast seals lock entire aisles"],
    Bank: ["vaults use sigil-authenticated access", "interest contracts include minor binding clauses"],
  },
  Isolated: {
    Farming: ["seed stock is rationed after harsh seasons", "neighbors barter labor instead of coin"],
    Trade: ["supply caravans arrive unpredictably", "price shocks follow every delayed convoy"],
    Housing: ["families share spare rooms in winter", "vacant homes become communal depots"],
    Manor: ["the manor is often the only neutral ground", "estate wells control settlement leverage"],
    Tower: ["watch posts are manned beyond normal shifts", "signal codes are the only fast communication"],
    Shops: ["shopkeepers hoard critical replacements", "queues are governed by need, not rank"],
    Factory: ["factories cannibalize old parts to keep running", "maintenance crews improvise everything"],
    Guilds: ["guilds merge roles to survive shortages", "apprentices hold senior responsibilities early"],
    Mansion: ["mansion cellars store emergency grain", "households rotate guard duty"],
    University: ["faculty teach broad survival curricula", "research priorities follow immediate local needs"],
    Palace: ["regional governors act with limited oversight", "petitions may take months to reach court"],
    Fortress: ["forts are lifelines, not symbols", "supply drills are treated as emergency rehearsals"],
    Temple: ["temples coordinate aid and triage", "vows are practical promises to the whole town"],
    Historic: ["old routes are vital infrastructure", "heritage sites double as shelters"],
    "Guild HQ": ["charters are simplified for crisis response", "councils prioritize logistics over politics"],
    "Seat of Power": ["authority depends on visible competence", "a single decree can alter survival odds"],
    Docks: ["harbors are lifelines for medicine and grain", "weather windows decide civic schedules"],
    Warehouse: ["inventory discipline prevents famine", "expired stock is repurposed immediately"],
    Bank: ["credit is granted by trust history", "debt terms flex during shortages"],
  },
  Frontier: {
    Farming: ["deed claims are contested along shifting boundaries", "armed patrols protect irrigation rights"],
    Trade: ["caravan law outranks city custom", "contracts are enforced by reputation and steel"],
    Housing: ["new blocks rise faster than codes can track", "land grants attract opportunists"],
    Manor: ["manor titles are only as strong as force", "estate militias secure tax routes"],
    Tower: ["watchtowers map fresh threats weekly", "beacons call ad hoc posses"],
    Shops: ["shops trade in practical survival gear first", "rare supplies draw dangerous buyers"],
    Factory: ["factories fuel expansion and conflict", "sabotage accusations are common"],
    Guilds: ["guild charters compete for new territory", "recruitment drives resemble political campaigns"],
    Mansion: ["new-money houses mimic old authority", "private guards rival local sheriffs"],
    University: ["field schools study active border change", "sponsors demand useful outcomes now"],
    Palace: ["distant decrees clash with frontier reality", "envoys bargain for practical autonomy"],
    Fortress: ["fortresses anchor fragile peace", "commanders improvise rules under pressure"],
    Temple: ["shrines arbitrate disputes when courts are absent", "pilgrims carry news between settlements"],
    Historic: ["ruins are mined for legal land claims", "old boundary stones trigger feuds"],
    "Guild HQ": ["guild hq acts as a rapid claims office", "maps are redrawn after every incident"],
    "Seat of Power": ["authority is proved by immediate results", "leaders secure loyalty through protection"],
    Docks: ["river ports handle contested cargo", "dockmasters mediate armed trade disagreements"],
    Warehouse: ["stockpiles attract raiders and speculators", "guard rosters rotate constantly"],
    Bank: ["loan houses finance risky expansion", "collateral often includes disputed land deeds"],
  },
  Militaristic: {
    Farming: ["ration quotas are set by command", "harvest logistics follow campaign timetables"],
    Trade: ["supply chains are routed by strategic priority", "civilian trade waits behind military freight"],
    Housing: ["residential blocks follow strict curfew orders", "barracks overflow into nearby homes"],
    Manor: ["estate halls host officer briefings", "household staff are screened for loyalty"],
    Tower: ["tower crews run around-the-clock surveillance", "alerts trigger mandatory drills"],
    Shops: ["price controls favor troop readiness", "black-market substitutes circulate quietly"],
    Factory: ["production lines prioritize armaments", "inspection failures carry severe penalties"],
    Guilds: ["guild contracts are tied to defense quotas", "craft disputes are treated as discipline issues"],
    Mansion: ["elite residences mirror command hierarchies", "private gatherings resemble war councils"],
    University: ["curricula emphasize logistics and tactics", "research grants favor military applications"],
    Palace: ["court ceremonies double as command reviews", "appointments require loyalty vetting"],
    Fortress: ["fortress readiness sets city tempo", "rotation schedules define daily life"],
    Temple: ["chaplains sanction campaigns", "oaths of service are publicly renewed"],
    Historic: ["battle memorials justify current policy", "archives are curated for morale"],
    "Guild HQ": ["guild hq tracks strategic output", "noncompliance is framed as dereliction"],
    "Seat of Power": ["orders cascade through rigid chains", "public dissent is labeled destabilizing"],
    Docks: ["naval manifests override merchant schedules", "harbor patrols enforce inspection regimes"],
    Warehouse: ["depots are locked by security tiers", "inventory discrepancies trigger investigations"],
    Bank: ["war bonds dominate lending policy", "credit access rewards compliant firms"],
  },
  Religious: {
    Farming: ["planting cycles follow sacred calendars", "tithes are paid in first harvests"],
    Trade: ["market days align with holy observances", "contracts include oath clauses"],
    Housing: ["neighborhood shrines arbitrate domestic disputes", "shared rituals maintain social peace"],
    Manor: ["manor patronage funds temple projects", "lineage legitimacy depends on piety"],
    Tower: ["tower bells govern prayer and work", "watch shifts begin with blessings"],
    Shops: ["blessed goods outsell ordinary wares", "shop signs display devotional marks"],
    Factory: ["production pauses during key rites", "quality checks include ritual sanctification"],
    Guilds: ["guild pledges are sworn before clergy", "discipline hearings invoke doctrine"],
    Mansion: ["house chapels host political mediation", "family reputation follows visible devotion"],
    University: ["scholarship debates intersect with doctrine", "archives restrict controversial texts"],
    Palace: ["state legitimacy is tied to sacred endorsement", "court policy seeks theological backing"],
    Fortress: ["garrisons carry consecrated standards", "defense plans include pilgrimage routes"],
    Temple: ["major temples direct civic priorities", "miracle claims can shift power overnight"],
    Historic: ["saint relic tours drive public mood", "heritage guardians defend sacred narratives"],
    "Guild HQ": ["guild charter updates require clerical witnesses", "oathbreakers face spiritual sanctions"],
    "Seat of Power": ["rulers govern with priestly counsel", "public penance can reset political fortunes"],
    Docks: ["harbor blessings open sailing seasons", "pilgrim traffic changes dock economics"],
    Warehouse: ["charity stores are mixed with commercial stock", "holy festivals strain inventory planning"],
    Bank: ["loan rates are influenced by moral standing", "endowments steer long-term investment"],
  },
  Decaying: {
    Farming: ["soil exhaustion forces desperate rotations", "abandoned plots invite squatters"],
    Trade: ["counterfeit goods flood weakly policed stalls", "old contracts are ignored when inconvenient"],
    Housing: ["maintenance backlogs hollow entire blocks", "evictions leave dangerous vacancies"],
    Manor: ["faded estates sell heirlooms to survive", "servants run households in decline"],
    Tower: ["watch infrastructure is underfunded", "alarm systems fail at critical moments"],
    Shops: ["supply quality has visibly dropped", "repair culture replaces replacement culture"],
    Factory: ["aging machines fail under pressure", "safety corners are routinely cut"],
    Guilds: ["guild standards erode under corruption", "dues are siphoned by intermediaries"],
    Mansion: ["once-grand halls mask unpaid debts", "family feuds consume remaining assets"],
    University: ["funding cuts shutter programs", "salvage crews strip disused labs"],
    Palace: ["court authority frays with each scandal", "administration limps behind crisis"],
    Fortress: ["garrisons are understaffed and tired", "walls are patched, not repaired"],
    Temple: ["charity demand overwhelms resources", "clergy factions quarrel over dwindling support"],
    Historic: ["monuments crumble without caretakers", "artifact theft rises as oversight fades"],
    "Guild HQ": ["records are incomplete and contested", "leadership rotates too fast for stability"],
    "Seat of Power": ["decrees arrive late and uneven", "public trust erodes with each failure"],
    Docks: ["rotting piers limit safe traffic", "smuggling thrives in neglected zones"],
    Warehouse: ["inventory losses are normalized", "fire suppression systems barely function"],
    Bank: ["defaults destabilize lending", "collections practices turn predatory"],
  },
  Ancient: {
    Farming: ["terrace systems follow inherited ritual maps", "ancestral claims govern irrigation order"],
    Trade: ["bargains reference centuries-old precedent", "weights and measures use antique standards"],
    Housing: ["homes are layered atop older foundations", "lineage grants determine renovation rights"],
    Manor: ["ancient oaths bind estate obligations", "ancestral halls preserve unresolved claims"],
    Tower: ["beacons align with archaic signal codes", "watch rotations mirror forgotten calendars"],
    Shops: ["craft methods preserve old guild secrets", "antiques are treated as civic assets"],
    Factory: ["modern systems are bolted onto relic works", "old schematics guide risky upgrades"],
    Guilds: ["rank is tied to inherited seals", "ritual initiation gates advancement"],
    Mansion: ["family archives hold quasi-legal authority", "ancestral portraits influence negotiations"],
    University: ["curricula center on recovered texts", "translation disputes can topple careers"],
    Palace: ["throne legitimacy cites archaic law", "succession debates invoke old omens"],
    Fortress: ["defenses follow ancient choke-point doctrine", "ward stones predate current rulers"],
    Temple: ["rites preserve pre-imperial traditions", "oracles interpret relic-era signs"],
    Historic: ["heritage districts are active power centers", "excavations can rewrite current claims"],
    "Guild HQ": ["charters date back to founding dynasties", "legacy clauses trigger modern disputes"],
    "Seat of Power": ["councils defer to ancestral protocol", "statecraft is constrained by old compacts"],
    Docks: ["harbor routes follow ancient tides charts", "stone quays are older than living memory"],
    Warehouse: ["vault layouts preserve ceremonial geometry", "catalogs include relic provenance rules"],
    Bank: ["coin standards retain legacy iconography", "trust houses audit lineages, not just ledgers"],
  },
  Industrial: {
    Farming: ["mechanized harvest trials strain old traditions", "supply buyers demand scale over craft"],
    Trade: ["bulk contracts outcompete small merchants", "transport timetables dictate pricing"],
    Housing: ["worker housing expands faster than services", "tenement blocks depend on shift cycles"],
    Manor: ["legacy owners pivot to industrial investment", "estate grounds host private foundries"],
    Tower: ["signal towers coordinate freight flow", "inspection platforms monitor emissions"],
    Shops: ["retail districts chase fast-turn inventory", "specialty stores survive on niche loyalists"],
    Factory: ["output targets dominate civic policy", "foremen wield outsized local influence"],
    Guilds: ["traditional guilds clash with machine-era unions", "training standards lag behind technology"],
    Mansion: ["industrial fortunes fund rapid social ascent", "salons negotiate labor and supply deals"],
    University: ["research grants favor applied engineering", "patent races spark sabotage rumors"],
    Palace: ["policy is driven by production metrics", "court factions align with industrial blocs"],
    Fortress: ["forts guard rail hubs and fuel depots", "security plans prioritize infrastructure"],
    Temple: ["clergy mediate labor and safety disputes", "sermons respond to mechanized hardship"],
    Historic: ["preservation clashes with redevelopment", "heritage sites are repurposed for industry"],
    "Guild HQ": ["charter reforms struggle to match new markets", "old masters resist modernization"],
    "Seat of Power": ["leaders balance growth with unrest", "regulation battles define authority"],
    Docks: ["steam schedules compress turnaround windows", "dock labor negotiations can halt entire sectors"],
    Warehouse: ["stacked logistics optimize throughput", "inventory systems rely on strict shift handoffs"],
    Bank: ["credit powers expansion at risky pace", "speculative finance can swing whole districts"],
  },
};

function comboHookSentence(theme, broadType, specific, motivation, rng) {
  const intents = HOOK_INTENT_BY_MOTIVATION[motivation] || ["push a personal agenda"];
  const quirkPool = THEME_DISTRICT_QUIRKS[theme]?.[broadType] || ["local tensions are unusually high"];
  const intent = rng.pick(intents);
  const quirk = rng.pick(quirkPool);
  return `In this ${theme} ${broadType} district at ${specific}, an NPC driven by ${motivation.toLowerCase()} asks you to ${intent} while ${quirk}.`;
}

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

  const storyHook = comboHookSentence(district.theme, district.broadType, district.specific, motivation, rng);

  return {
    id: `npc-${district.id}`,
    name: rng.pick(["Ari", "Thorne", "Mara", "Brigg", "Sel", "Jun", "Kest", "Rook"]),
    race,
    raceRarity: rarity,
    npcClass,
    motivation,
    attitudeRoll: rollDice("d6", rng),
    storyHook,
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
      district.storyHook = district.npc.storyHook;
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
      <strong>Story Hook:</strong> ${d.storyHook}<br/>
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
