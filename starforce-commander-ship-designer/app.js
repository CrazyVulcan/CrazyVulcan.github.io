import { calculatePointValue } from './pv-calculator.js';

const form = document.getElementById('ssdForm');
const draftsEl = document.getElementById('drafts');
const jsonPreview = document.getElementById('jsonPreview');
const liveBadge = document.getElementById('liveBadge');
const STORAGE_KEY = 'sfCommanderSsdDrafts';
const TURN_OPTIONS = [0, 20, 25, 30, 35, 40, 45, 65];
let shipArtDataUrl = '';


const STANDARD_DEFAULT_LOADOUT = {
  identity: {
    name: 'SHIP NAME / ID',
    classType: 'YORKTOWN II - Class Heavy Cruiser',
    faction: 'COMMON',
    era: '3655',
    pointValue: 29
  },
  engineering: { move: 5, vector: 2, turn: 4, special: 4 },
  shields: { forward: 16, aft: 15, port: 15, starboard: 15 },
  armor: { forward: 0, aft: 0, port: 0, starboard: 0 },
  shieldGen: 3,
  textBlocks: { powerSystem: '' },
  functionsConfig: {
    accDec: { values: ['1', '2', '3', '4'], free: 1 },
    sifIdf: { values: ['1', '2', '3'], free: 0, emer: true },
    batRech: { values: ['1'], free: 0 },
    ftl: { empty: 3 },
    cloak: { enabled: false, empty: 3 },
    sensor: { values: ['2', '4', '6'], free: 1 },
    genSys: { values: ['NRM', 'MAX'], free: 1 },
    weapons: [
      { label: 'A/MAT TORP', enabled: true, free: 1, values: ['1', '4'] },
      { label: 'PHASER', enabled: true, free: 1, values: ['1', '4', '6', '8'] },
      { label: 'WPN C', enabled: false, free: 0, values: [] },
      { label: 'WPN D', enabled: false, free: 0, values: [] }
    ]
  },
  powerSystem: {
    tracks: [
      { key: 'lMain', label: 'L MAIN', points: 3, boxesPerPoint: 2, boxPattern: [], hasDot: true },
      { key: 'rMain', label: 'R MAIN', points: 3, boxesPerPoint: 2, boxPattern: [], hasDot: true },
      { key: 'cMain', label: 'C MAIN', points: 0, boxesPerPoint: 2, boxPattern: [], hasDot: true },
      { key: 'slReac', label: 'SL REAC', points: 1, boxesPerPoint: 2, boxPattern: [], hasDot: true },
      { key: 'auxPwr', label: 'AUX PWR', points: 1, boxesPerPoint: 2, boxPattern: [], hasDot: true },
      { key: 'battery', label: 'BATTERY', points: 1, boxesPerPoint: 1, boxPattern: [], hasDot: true },
      { key: 'ftlDrive', label: 'FTL DRIVE', points: 1, boxesPerPoint: 2, boxPattern: [], hasDot: false }
    ]
  },
  sublight: {
    maxAccPhs: 2,
    greenCircles: 2,
    redCircles: 2,
    spd: [6, 5, 4, 3, 2, 1, 0],
    turns: [0, 20, 30, 30, 35, 35, 40],
    dmgStops: [true, true, true, false, true, true, true]
  },
  structure: { repairable: 3, permanent: 10 },
  shipArtDataUrl: '',
  weapons: [
    {
      name: 'MK-4 A\\MAT TORPEDO',
      mountArcs: ['1', '2|1', '2|1', '2|1', '2'],
      mountFacings: [[1, 2], [1, 2], [1, 2], [1, 2]],
      powerCircles: 2,
      powerStops: [1],
      structure: 1,
      ranges: [
        { band: '0-4', type: 'green', bonus: 0, dice: ['R'] },
        { band: '5-10', type: 'black', bonus: 0, dice: ['R'] },
        { band: '11-14', type: 'red', bonus: 0, dice: ['R'] },
        { band: '15-20', type: 'red', bonus: 0, dice: ['Y'] }
      ],
      traits: ['HVY', 'FTL', 'NoBAT'],
      special: 'H(4+1), STR 1'
    },
    {
      name: 'LNC-447 PHASER',
      mountArcs: ['1', '6', '7', '8|8', '1', '2', '3|4', '5', '6', '7|2', '3', '4', '5'],
      mountFacings: [[1, 6, 7, 8], [8, 1, 2, 3], [4, 5, 6, 7], [2, 3, 4, 5]],
      powerCircles: 2,
      powerStops: [],
      structure: 2,
      ranges: [
        { band: '0-2', type: 'green', bonus: 0, dice: ['G', 'G'] },
        { band: '3-5', type: 'green', bonus: 0, dice: ['G', 'B'] },
        { band: '6-8', type: 'black', bonus: 0, dice: ['G', 'B'] },
        { band: '9-10', type: 'black', bonus: 0, dice: ['B', 'B'] },
        { band: '11-12', type: 'red', bonus: 0, dice: ['B'] }
      ],
      traits: ['PREC 1', 'PD MODE'],
      special: ''
    },
    { name: '', mountArcs: [], mountFacings: [], powerCircles: 2, powerStops: [], structure: 2, ranges: [], traits: [], special: '' },
    { name: '', mountArcs: [], mountFacings: [], powerCircles: 2, powerStops: [], structure: 2, ranges: [], traits: [], special: '' }
  ],
  systems: [
    { key: 'SCNC', value: '4' },
    { key: 'SENS', value: '3' },
    { key: 'TRAC', value: '2' },
    { key: 'TRAN', value: '2' },
    { key: 'SHTL', value: '2' },
    { key: 'QTRS', value: '4' },
    { key: 'CRGO', value: '2' }
  ],
  crew: { shuttleCraft: 4, marinesStationed: 11 }
};

const POWER_TRACK_CONFIG = [
  { key: 'lMain', label: 'L MAIN', pointsField: 'powerLMainPoints', boxesField: 'powerLMainBoxes', patternField: 'powerLMainPattern', hasDotField: 'powerLMainHasDot' },
  { key: 'rMain', label: 'R MAIN', pointsField: 'powerRMainPoints', boxesField: 'powerRMainBoxes', patternField: 'powerRMainPattern', hasDotField: 'powerRMainHasDot' },
  { key: 'cMain', label: 'C MAIN', pointsField: 'powerCMainPoints', boxesField: 'powerCMainBoxes', patternField: 'powerCMainPattern', hasDotField: 'powerCMainHasDot' },
  { key: 'slReac', label: 'SL REAC', pointsField: 'powerSlReacPoints', boxesField: 'powerSlReacBoxes', patternField: 'powerSlReacPattern', hasDotField: 'powerSlReacHasDot' },
  { key: 'auxPwr', label: 'AUX PWR', pointsField: 'powerAuxPwrPoints', boxesField: 'powerAuxPwrBoxes', patternField: 'powerAuxPwrPattern', hasDotField: 'powerAuxPwrHasDot' },
  { key: 'battery', label: 'BATTERY', pointsField: 'powerBatteryPoints', boxesField: 'powerBatteryBoxes', patternField: 'powerBatteryPattern', hasDotField: 'powerBatteryHasDot' },
  { key: 'ftlDrive', label: 'FTL DRIVE', pointsField: 'powerFtlDrivePoints', boxesField: 'powerFtlDriveBoxes', patternField: 'powerFtlDrivePattern', hasDotField: 'powerFtlDriveHasDot' }
];

function parseList(raw, separator = ',') {
  return String(raw || '')
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseLegacyWeapons(raw) {
  return String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...ranges] = line.split('|').map((part) => part.trim());
      return {
        name,
        mountArcs: [],
        powerCircles: 1,
        powerStops: [],
        structure: 1,
        ranges: ranges.map((band) => ({ band, type: 'black' })),
        diceByRange: ranges.map(() => ({ bonus: 0, dice: ['R'] })),
        traits: [],
        special: ''
      };
    });
}

function parseWeaponRanges(raw) {
  const values = parseList(raw);
  const parsed = [];

  values.forEach((entry) => {
    if (entry.includes(':')) {
      const [band, type] = entry.split(':').map((part) => part.trim());
      const normalizedType = ['green', 'black', 'red'].includes((type || '').toLowerCase())
        ? type.toLowerCase()
        : 'black';
      parsed.push({ band: band || '?', type: normalizedType });
    }
  });

  if (parsed.length > 0) {
    return parsed;
  }

  for (let idx = 0; idx < values.length; idx += 2) {
    const band = values[idx] || '?';
    const rawType = values[idx + 1] || 'black';
    const type = ['green', 'black', 'red'].includes(rawType.toLowerCase()) ? rawType.toLowerCase() : 'black';
    parsed.push({ band, type });
  }

  return parsed;
}

function parseWeaponDice(raw) {
  return String(raw || '')
    .split('|')
    .map((group) => {
      const tokens = parseList(group);
      const [firstToken, ...rest] = tokens;
      const maybeBonus = Number(firstToken);
      const hasBonus = Number.isFinite(maybeBonus) && String(firstToken || '').trim() !== '';
      return {
        bonus: hasBonus ? maybeBonus : 0,
        dice: (hasBonus ? rest : tokens).map((token) => token.toUpperCase())
      };
    });
}

function parseMountFacings(raw) {
  return String(raw || '')
    .split('|')
    .map((group) => group.trim())
    .filter(Boolean)
    .map((group) => parseList(group).map((value) => clamp(Number(value), 1, 8)).filter((value) => Number.isFinite(value)));
}

function buildRangeProfile(ranges, diceByRange, structure = 1) {
  return (Array.isArray(ranges) ? ranges : []).map((range, index) => ({
    band: range.band || '?',
    type: ['green', 'black', 'red'].includes((range.type || '').toLowerCase()) ? range.type.toLowerCase() : 'black',
    bonus: Number(diceByRange?.[index]?.bonus || 0),
    dice: (Array.isArray(diceByRange?.[index]?.dice) ? diceByRange[index].dice : []).slice(0, Math.max(1, Number(structure || 1)))
  }));
}

function splitDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) {
    return null;
  }
  return {
    mimeType: match[1],
    base64: match[2]
  };
}

function buildDataUrlFromEmbedded(embeddedAsset) {
  if (!embeddedAsset || typeof embeddedAsset !== 'object') {
    return '';
  }
  const mimeType = String(embeddedAsset.mimeType || '').trim();
  const base64 = String(embeddedAsset.base64 || '').trim();
  if (!mimeType || !base64) {
    return '';
  }
  return `data:${mimeType};base64,${base64}`;
}

function withEmbeddedShipArt(build) {
  const normalizedDataUrl = typeof build?.shipArtDataUrl === 'string' ? build.shipArtDataUrl : '';
  const split = splitDataUrl(normalizedDataUrl);
  return {
    ...build,
    embeddedAssets: split
      ? {
        ...(build.embeddedAssets && typeof build.embeddedAssets === 'object' ? build.embeddedAssets : {}),
        shipArt: split
      }
      : (build.embeddedAssets && typeof build.embeddedAssets === 'object' ? build.embeddedAssets : undefined)
  };
}

function resolveImportedShipArt(importedDraft = {}) {
  if (typeof importedDraft.shipArtDataUrl === 'string' && importedDraft.shipArtDataUrl.trim()) {
    return importedDraft.shipArtDataUrl;
  }
  const embeddedDataUrl = buildDataUrlFromEmbedded(importedDraft.embeddedAssets?.shipArt);
  if (embeddedDataUrl) {
    return embeddedDataUrl;
  }
  return shipArtDataUrl;
}

function readWeaponsFromForm() {
  return [1, 2, 3, 4].map((index) => {
    const name = form.elements[`wpn${index}Name`]?.value?.trim() || '';
    return {
      name,
      mountArcs: parseList(form.elements[`wpn${index}MountArcs`]?.value),
      mountFacings: parseMountFacings(form.elements[`wpn${index}MountArcs`]?.value),
      powerCircles: clamp(num(`wpn${index}PowerCircles`), 1, 6),
      powerStops: parseList(form.elements[`wpn${index}PowerStops`]?.value).map((value) => Number(value)).filter((value) => Number.isFinite(value)),
      structure: clamp(num(`wpn${index}Structure`), 1, 4),
      ranges: (() => {
        const ranges = parseWeaponRanges(form.elements[`wpn${index}Ranges`]?.value);
        const diceByRange = parseWeaponDice(form.elements[`wpn${index}Dice`]?.value);
        return buildRangeProfile(ranges, diceByRange, clamp(num(`wpn${index}Structure`), 1, 4));
      })(),
      traits: parseList(form.elements[`wpn${index}Traits`]?.value),
      special: form.elements[`wpn${index}Special`]?.value?.trim() || ''
    };
  });
}

function normalizeWeapon(weapon = {}) {
  const structure = clamp(Number(weapon.structure || 1), 1, 4);
  const normalizedRanges = Array.isArray(weapon.ranges)
    ? weapon.ranges.map((range) => {
      if (typeof range === 'string') {
        return { band: range, type: 'black', dice: [] };
      }
      return {
        band: range.band || '?',
        type: ['green', 'black', 'red'].includes((range.type || '').toLowerCase()) ? range.type.toLowerCase() : 'black',
        bonus: Number(range.bonus || 0),
        dice: (Array.isArray(range.dice) ? range.dice : []).slice(0, structure)
      };
    })
    : [];

  const rangeProfile = Array.isArray(weapon.rangeProfile)
    ? weapon.rangeProfile.map((range) => ({
      band: range.band || '?',
      type: ['green', 'black', 'red'].includes((range.type || '').toLowerCase()) ? range.type.toLowerCase() : 'black',
      bonus: Number(range.bonus || 0),
      dice: (Array.isArray(range.dice) ? range.dice : []).slice(0, structure)
    }))
    : buildRangeProfile(normalizedRanges, Array.isArray(weapon.diceByRange) ? weapon.diceByRange : [], structure).map((range, index) => ({
      ...range,
      bonus: Number(range.bonus || normalizedRanges[index]?.bonus || 0),
      dice: range.dice.length ? range.dice : (normalizedRanges[index]?.dice || []).slice(0, structure)
    }));

  const mountFacings = Array.isArray(weapon.mountFacings)
    ? weapon.mountFacings.map((mount) => (Array.isArray(mount) ? mount.map((value) => clamp(Number(value), 1, 8)).filter((value) => Number.isFinite(value)) : []))
    : (Array.isArray(weapon.mountArcs)
      ? weapon.mountArcs.map((arc) => {
        if (typeof arc === 'string' && arc.includes(',')) {
          return parseList(arc).map((value) => clamp(Number(value), 1, 8)).filter((value) => Number.isFinite(value));
        }
        return [];
      }).filter((mount) => mount.length > 0)
      : []);

  return {
    name: weapon.name || '',
    mountArcs: Array.isArray(weapon.mountArcs) ? weapon.mountArcs : [],
    mountFacings,
    powerCircles: clamp(Number(weapon.powerCircles || 1), 1, 6),
    powerStops: Array.isArray(weapon.powerStops) ? weapon.powerStops : [],
    structure,
    ranges: rangeProfile,
    rangeProfile,
    traits: Array.isArray(weapon.traits) ? weapon.traits : [],
    special: String(weapon.special || '')
  };
}

function mountSectorPath(sector) {
  const center = '24 24';
  const pointMap = {
    1: '2 2 24 2',
    2: '24 2 46 2',
    3: '46 2 46 24',
    4: '46 24 46 46',
    5: '46 46 24 46',
    6: '24 46 2 46',
    7: '2 46 2 24',
    8: '2 24 2 2'
  };
  const pair = pointMap[sector] || '';
  return pair ? `M ${center} L ${pair} Z` : '';
}

function createMountDiagram(facings, structure, powerCircles, powerStops) {
  const mount = document.createElement('div');
  mount.className = 'wpn-mount';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('class', 'wpn-mount-svg');

  const allSectors = [1, 2, 3, 4, 5, 6, 7, 8];
  allSectors.forEach((sector) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', mountSectorPath(sector));
    path.setAttribute('class', `wpn-sector${facings.includes(sector) ? ' active' : ''}`);
    svg.appendChild(path);
  });

  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  outline.setAttribute('x', '2');
  outline.setAttribute('y', '2');
  outline.setAttribute('width', '44');
  outline.setAttribute('height', '44');
  outline.setAttribute('class', 'wpn-mount-outline');
  svg.appendChild(outline);
  mount.appendChild(svg);

  const struct = document.createElement('div');
  struct.className = 'wpn-mount-structure';
  for (let i = 0; i < structure; i += 1) {
    const box = document.createElement('span');
    box.className = 'wpn-structure-box';
    struct.appendChild(box);
  }
  mount.appendChild(struct);

  const power = document.createElement('div');
  power.className = 'wpn-mount-power';
  for (let i = 1; i <= powerCircles; i += 1) {
    const circle = document.createElement('span');
    circle.className = 'wpn-power-circle';
    power.appendChild(circle);
    if (powerStops.includes(i)) {
      const stop = document.createElement('span');
      stop.className = 'wpn-power-stop';
      power.appendChild(stop);
    }
  }
  mount.appendChild(power);

  return mount;
}

function parseSystems(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, value] = line.split(':').map((part) => part.trim());
      return { key, value: value ?? '' };
    });
}

function num(name) {
  const field = form.elements.namedItem(name);
  if (!field || !('value' in field)) {
    return 0;
  }
  const raw = String(field.value ?? '').trim();
  if (raw === '') {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTurnOption(value) {
  return TURN_OPTIONS.includes(value) ? value : 20;
}

function readSublight() {
  const speeds = [6, 5, 4, 3, 2, 1, 0];
  return {
    maxAccPhs: num('sublightMaxAcc'),
    greenCircles: clamp(num('sublightGreen'), 0, 3),
    redCircles: clamp(num('sublightRed'), 0, 3),
    spd: speeds.map((speed) => speed),
    turns: speeds.map((speed) => normalizeTurnOption(num(`sublightTurn${speed}`))),
    dmgStops: speeds.map((speed) => Boolean(form.elements[`sublightDmg${speed}`]?.checked))
  };
}

function parsePowerPattern(raw) {
  return String(raw || '')
    .split(/[\s,]+/)
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 3)
    .map((value) => clamp(Math.round(value), 1, 3));
}



function parseFunctionValues(raw) {
  return String(raw || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}


function readFunctionsConfig() {
  const batteryPoints = Math.max(0, num('powerBatteryPoints'));
  const batteryValues = Array.from({ length: batteryPoints }, (_, idx) => String(idx + 1));

  return {
    accDec: { values: parseFunctionValues(form.elements.fnAccDecValues?.value), free: form.elements.fnAccDecFree?.checked ? 1 : 0 },
    sifIdf: {
      values: parseFunctionValues(form.elements.fnSifIdfValues?.value),
      free: form.elements.fnSifIdfFree?.checked ? 1 : 0,
      emer: Boolean(form.elements.fnSifIdfEmer?.checked)
    },
    batRech: { values: batteryValues, free: 0 },
    ftl: { empty: clamp(num('fnFtlEmpty'), 0, 6) },
    cloak: { enabled: Boolean(form.elements.fnCloakEnabled?.checked), empty: clamp(num('fnCloakEmpty'), 0, 6) },
    sensor: { values: parseFunctionValues(form.elements.fnSensorValues?.value), free: form.elements.fnSensorFree?.checked ? 1 : 0 },
    genSys: { values: parseFunctionValues(form.elements.fnGenSysValues?.value), free: form.elements.fnGenSysFree?.checked ? 1 : 0 },
    weapons: [
      {
        label: form.elements.fnWpnALabel?.value || 'WPN A',
        enabled: Boolean(form.elements.fnWpnAEnabled?.checked),
        free: form.elements.fnWpnAFree?.checked ? 1 : 0,
        values: parseFunctionValues(form.elements.fnWpnAValues?.value)
      },
      {
        label: form.elements.fnWpnBLabel?.value || 'WPN B',
        enabled: Boolean(form.elements.fnWpnBEnabled?.checked),
        free: form.elements.fnWpnBFree?.checked ? 1 : 0,
        values: parseFunctionValues(form.elements.fnWpnBValues?.value)
      },
      {
        label: form.elements.fnWpnCLabel?.value || 'WPN C',
        enabled: Boolean(form.elements.fnWpnCEnabled?.checked),
        free: form.elements.fnWpnCFree?.checked ? 1 : 0,
        values: parseFunctionValues(form.elements.fnWpnCValues?.value)
      },
      {
        label: form.elements.fnWpnDLabel?.value || 'WPN D',
        enabled: Boolean(form.elements.fnWpnDEnabled?.checked),
        free: form.elements.fnWpnDFree?.checked ? 1 : 0,
        values: parseFunctionValues(form.elements.fnWpnDValues?.value)
      }
    ]
  };
}

function readPowerSystem() {
  return {
    tracks: POWER_TRACK_CONFIG.map((track) => ({
      key: track.key,
      label: track.label,
      points: Math.max(0, num(track.pointsField)),
      boxesPerPoint: clamp(num(track.boxesField), 1, 3),
      boxPattern: parsePowerPattern(form.elements[track.patternField]?.value),
      hasDot: Boolean(form.elements[track.hasDotField]?.checked)
    }))
  };
}


function syncDerivedFunctionInputs() {
  if (form.elements.fnBatRechLinked) {
    form.elements.fnBatRechLinked.value = `Linked to BATTERY points (${num('powerBatteryPoints')})`;
  }
}

function getBuild() {
  return {
    identity: {
      name: form.elements.name.value,
      classType: form.elements.classType.value,
      faction: form.elements.faction.value,
      era: form.elements.era.value,
      pointValue: num('pointValueCalculated')
    },
    engineering: {
      move: num('move'),
      vector: num('vector'),
      turn: num('turn'),
      special: num('special')
    },
    shields: {
      forward: num('shieldFwd'),
      aft: num('shieldAft'),
      port: num('shieldPort'),
      starboard: num('shieldStbd')
    },
    armor: {
      forward: num('armorFwd'),
      aft: num('armorAft'),
      port: num('armorPort'),
      starboard: num('armorStbd')
    },
    shieldGen: num('shieldGen'),
    textBlocks: {
      powerSystem: form.elements.powerSystem?.value ?? ''
    },
    functionsConfig: readFunctionsConfig(),
    powerSystem: readPowerSystem(),
    sublight: readSublight(),
    structure: {
      repairable: num('structureBlack'),
      permanent: num('structureRed')
    },
    shipArtDataUrl,
    weapons: readWeaponsFromForm(),
    systems: parseSystems(form.elements.systems.value),
    crew: {
      shuttleCraft: num('shuttleCraft'),
      marinesStationed: num('marinesStationed')
    }
  };
}

function renderBoxes(containerId, count, className) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const box = document.createElement('span');
    box.className = className;
    container.appendChild(box);
  }
}

function weaponSlot(id, rawWeapon, enabled = true) {
  const weapon = normalizeWeapon(rawWeapon);
  const slot = document.getElementById(`pvWpn${id}Slot`);
  const title = document.getElementById(`pvWpn${id}Title`);
  const body = document.getElementById(`pvWpn${id}Body`);

  if (!enabled) {
    slot.style.display = 'none';
    title.textContent = 'WPN NAME TYP';
    body.innerHTML = '';
    return;
  }

  slot.style.display = 'flex';
  if (!weapon.name) {
    title.textContent = 'WPN NAME TYP';
    body.innerHTML = '';
    return;
  }

  title.textContent = weapon.name;
  body.innerHTML = '';

  const mountRow = document.createElement('div');
  mountRow.className = 'wpn-mount-row';
  const mounts = weapon.mountFacings.slice(0, 8);
  mounts.forEach((facings) => {
    mountRow.appendChild(createMountDiagram(facings, weapon.structure, weapon.powerCircles, weapon.powerStops));
  });
  body.appendChild(mountRow);

  const rangeGrid = document.createElement('div');
  rangeGrid.className = 'wpn-range-grid';
  const traits = weapon.traits.map((trait) => trait.trim()).filter(Boolean);
  const hasHvy = traits.some((trait) => trait.toUpperCase() === 'HVY');
  const hasHoming = traits.some((trait) => trait.toUpperCase() === 'HOMING');

  weapon.ranges.forEach((range) => {
    const rangeCol = document.createElement('div');
    rangeCol.className = `wpn-range-col${hasHoming ? ' homing' : ''}`;

    const band = document.createElement('span');
    band.className = `wpn-range-band ${range.type}`;
    band.textContent = range.band;
    rangeCol.appendChild(band);

    const dice = document.createElement('span');
    dice.className = 'wpn-dice-row';
    if (Number(range.bonus || 0) > 0) {
      const bonus = document.createElement('span');
      bonus.className = 'wpn-bonus';
      bonus.textContent = `+${Number(range.bonus)}`;
      dice.appendChild(bonus);
    }
    const diceValues = (range.dice || []).slice(0, weapon.structure);
    diceValues.forEach((die) => {
      const pip = document.createElement('span');
      pip.className = `wpn-die ${String(die).toLowerCase()}`;
      pip.textContent = String(die).toUpperCase();
      dice.appendChild(pip);
    });
    rangeCol.appendChild(dice);

    rangeGrid.appendChild(rangeCol);
  });
  body.appendChild(rangeGrid);

  if (hasHvy && weapon.special) {
    const special = document.createElement('div');
    special.className = 'wpn-special-row';
    special.innerHTML = `<b>SPECIAL:</b> ${weapon.special}`;
    body.appendChild(special);
  }

  if (traits.length) {
    const traitRow = document.createElement('div');
    traitRow.className = 'wpn-trait-row';
    traitRow.innerHTML = `<b>TRAIT:</b> ${traits.join(', ')}`;
    body.appendChild(traitRow);
  }
}

function renderStructure(build) {
  const row = document.getElementById('pvStructureBoxes');
  row.innerHTML = '';

  const repairable = Math.max(0, Number(build.structure.repairable || 0));
  const permanent = Math.max(0, Number(build.structure.permanent || 0));
  const totalBoxes = repairable + permanent;
  const teamCount = Math.max(1, Number(build.engineering?.special || 0));
  const gapCount = Math.max(totalBoxes - 1, 0);
  const markerCount = Math.min(teamCount, gapCount);

  const labels = [];
  for (let team = teamCount; team >= 1 && labels.length < markerCount; team -= 1) {
    labels.push(team);
  }
  if (markerCount > 0 && !labels.includes(1)) {
    labels[labels.length - 1] = 1;
  }

  const markerByGap = new Map();
  if (markerCount > 0) {
    const lastGap = gapCount - 1;
    markerByGap.set(lastGap, 1);

    const earlierCount = markerCount - 1;
    const maxEarlierGap = Math.max(lastGap - 1, 0);
    for (let idx = 0; idx < earlierCount; idx += 1) {
      let targetGap = Math.round(((idx + 1) * (lastGap + 1)) / (earlierCount + 1)) - 1;
      targetGap = Math.max(0, Math.min(targetGap, maxEarlierGap));

      let probe = targetGap;
      while (markerByGap.has(probe) && probe < maxEarlierGap) {
        probe += 1;
      }
      while (markerByGap.has(probe) && probe > 0) {
        probe -= 1;
      }
      if (!markerByGap.has(probe)) {
        markerByGap.set(probe, labels[idx]);
      }
    }
  }

  for (let i = 0; i < totalBoxes; i += 1) {
    const box = document.createElement('span');
    box.className = i < repairable ? 'structure-box repairable' : 'structure-box permanent';
    row.appendChild(box);

    if (i < totalBoxes - 1 && markerByGap.has(i)) {
      const marker = document.createElement('span');
      marker.className = 'structure-inline-marker';

      const count = document.createElement('span');
      count.className = 'team-count';
      count.textContent = String(markerByGap.get(i));

      const icon = document.createElement('span');
      icon.className = 'wrench-icon';
      icon.setAttribute('aria-hidden', 'true');

      marker.appendChild(count);
      marker.appendChild(icon);
      row.appendChild(marker);
    }
  }
}

function circleRun(containerId, count) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 0; i < clamp(count, 0, 3); i += 1) {
    const circle = document.createElement('span');
    circle.className = 'rnd-circle';
    container.appendChild(circle);
  }
}

function renderManeuvering(sublight) {
  const data = sublight || {
    maxAccPhs: 2,
    greenCircles: 3,
    redCircles: 3,
    spd: [6, 5, 4, 3, 2, 1, 0],
    turns: [20, 20, 20, 20, 20, 20, 20],
    dmgStops: [false, false, false, false, false, false, false]
  };

  document.getElementById('pvMaxAcc').textContent = data.maxAccPhs;
  circleRun('pvRndGreen', data.greenCircles);
  circleRun('pvRndRed', data.redCircles);

  const previewColumns = 7;
  const spdValues = data.spd.slice(-previewColumns);
  const turnValues = data.turns.slice(-previewColumns);
  const dmgValues = data.dmgStops.slice(-previewColumns);

  document.getElementById('pvSpdVals').innerHTML = spdValues.map((value) => `<b>${value}</b>`).join('');
  document.getElementById('pvTurnVals').innerHTML = turnValues.map((value) => `<b>${value}</b>`).join('');
  document.getElementById('pvDmgStops').innerHTML = dmgValues
    .map((stop) => `<span class="dmg-stop${stop ? '' : ' is-inactive'}"></span>`)
    .join('');
}


function safeCalculatePointValue(build) {
  try {
    const pointValue = calculatePointValue(build);
    return Number.isFinite(pointValue) ? pointValue : 1;
  } catch {
    return 1;
  }
}

function renderPreview(build, options = {}) {
  const { recalculatePointValue = true } = options;
  document.getElementById('pvName').textContent = build.identity.name || 'SHIP NAME / ID';
  document.getElementById('pvClass').textContent = build.identity.classType || 'CLASSNAME ID-class Weight Class';
  document.getElementById('pvFaction').textContent = build.identity.faction || 'COMMON';
  document.getElementById('pvSizeClassIcon').src = 'assets/size-class-icon.svg';
  if (recalculatePointValue) {
    const pointValue = safeCalculatePointValue(build);
    document.getElementById('pvPointValue').textContent = `${pointValue}PV`;
    const pointValueField = form.elements.namedItem('pointValueCalculated');
    if (pointValueField && 'value' in pointValueField) {
      pointValueField.value = String(pointValue);
    }
  }
  document.getElementById('pvEra').textContent = build.identity.era || 'ERA';

  document.getElementById('pvMove').textContent = build.engineering.move;
  document.getElementById('pvVector').textContent = build.engineering.vector;
  document.getElementById('pvTurn').textContent = build.engineering.turn;
  document.getElementById('pvSpecial').textContent = build.engineering.special;

  document.getElementById('pvShieldFwd').textContent = String(build.shields.forward);
  document.getElementById('pvShieldAft').textContent = String(build.shields.aft);
  document.getElementById('pvShieldPort').textContent = String(build.shields.port);
  document.getElementById('pvShieldStbd').textContent = String(build.shields.starboard);

  const blackGenRow = document.getElementById('pvShieldGenBlackBoxes');
  blackGenRow.innerHTML = '';
  for (let i = 0; i < build.shieldGen; i += 1) {
    const box = document.createElement('span');
    box.className = 'shield-gen-black';
    blackGenRow.appendChild(box);
  }

  renderBoxes('pvFwdShieldBoxes', build.shields.forward, 'shield-box');
  renderBoxes('pvAftShieldBoxes', build.shields.aft, 'shield-box');
  renderBoxes('pvPortShieldBoxes', build.shields.port, 'shield-box');
  renderBoxes('pvStbdShieldBoxes', build.shields.starboard, 'shield-box');

  const armor = build.armor || { forward: 0, aft: 0, port: 0, starboard: 0 };
  renderBoxes('pvFwdArmorBoxes', armor.forward, 'armor-box');
  renderBoxes('pvAftArmorBoxes', armor.aft, 'armor-box');
  renderBoxes('pvPortArmorBoxes', armor.port, 'armor-box');
  renderBoxes('pvStbdArmorBoxes', armor.starboard, 'armor-box');

  renderBoxes('pvFwdGenBoxes', build.shieldGen, 'shield-gen');
  renderBoxes('pvAftGenBoxes', build.shieldGen, 'shield-gen');
  renderBoxes('pvPortGenBoxes', build.shieldGen, 'shield-gen');
  renderBoxes('pvStbdGenBoxes', build.shieldGen, 'shield-gen');

  const artEl = document.getElementById('pvShipArt');
  const silhouetteEl = document.getElementById('pvShipSilhouette');
  if (build.shipArtDataUrl) {
    artEl.src = build.shipArtDataUrl;
    artEl.style.display = 'block';
    silhouetteEl.style.display = 'none';
  } else {
    artEl.removeAttribute('src');
    artEl.style.display = 'none';
    silhouetteEl.style.display = 'block';
  }

  renderFunctions(build.functionsConfig);
  renderPowerSystem(build.powerSystem);
  renderManeuvering(build.sublight);

  const weaponPower = (build.functionsConfig?.weapons ?? []).map((weapon) => Boolean(weapon?.enabled) && Array.isArray(weapon?.values) && weapon.values.length > 0);
  weaponSlot(1, build.weapons[0], weaponPower[0] !== false);
  weaponSlot(2, build.weapons[1], weaponPower[1] !== false);
  weaponSlot(3, build.weapons[2], weaponPower[2] !== false);
  weaponSlot(4, build.weapons[3], weaponPower[3] !== false);

  renderSystems(build.systems, build.crew);
  renderStructure(build);
}



function renderFunctions(functionsConfig) {
  const container = document.getElementById('pvFunctions');
  container.innerHTML = '';
  const cfg = functionsConfig || {};

  const addDot = (parent, filled = false) => {
    const dot = document.createElement('span');
    dot.className = `fn-dot${filled ? ' filled' : ''}`;
    parent.appendChild(dot);
  };

  const addToken = (parent, text) => {
    const tok = document.createElement('span');
    tok.className = 'fn-token';
    tok.textContent = text;
    parent.appendChild(tok);
  };

  const addRow = (name, colorClass = '') => {
    const row = document.createElement('div');
    row.className = 'fn-row';
    const label = document.createElement('span');
    label.className = `fn-name${colorClass ? ` ${colorClass}` : ''}`;
    label.textContent = name;
    row.appendChild(label);

    const levels = document.createElement('span');
    levels.className = 'fn-levels';
    row.appendChild(levels);

    container.appendChild(row);
    return levels;
  };

  const addValueDots = (levelsEl, values = [], free = 0) => {
    const freeCount = Number(free || 0);
    for (let i = 0; i < freeCount; i += 1) addDot(levelsEl, true);

    values.forEach((value, idx) => {
      if (idx >= freeCount) {
        addDot(levelsEl, false);
      }
      addToken(levelsEl, String(value));
    });
  };

  const acc = cfg.accDec || { values: ['1', '2', '3', '4', '5', '6'], free: 1 };
  addValueDots(addRow('ACC/DEC', 'green'), acc.values, acc.free);

  const sif = cfg.sifIdf || { values: ['1', '2', '3'], free: 0, emer: true };
  const sifLevels = addRow('SIF/IDF', 'green');
  addValueDots(sifLevels, sif.values, sif.free);
  if (sif.emer) {
    const emer = document.createElement('span');
    emer.className = 'fn-emer';
    const emerDot = document.createElement('span');
    emerDot.className = 'fn-dot';
    const emerText = document.createElement('span');
    emerText.className = 'fn-token';
    emerText.textContent = 'EMER';
    emer.appendChild(emerDot);
    emer.appendChild(emerText);
    sifLevels.appendChild(emer);
  }

  const bat = cfg.batRech || { values: ['1'], free: 0 };
  addValueDots(addRow('BAT RECH', 'green'), bat.values, 0);

  const ftl = cfg.ftl || { empty: 2 };
  const ftlLevels = addRow('FTL', 'green');
  for (let i = 0; i < Number(ftl.empty || 0); i += 1) addDot(ftlLevels, false);

  const cloak = cfg.cloak || { enabled: false, empty: 3 };
  if (cloak.enabled) {
    const cloakLevels = addRow('CLOAK', 'magenta');
    for (let i = 0; i < Number(cloak.empty || 0); i += 1) addDot(cloakLevels, false);
  }

  const shldRenf = addRow('SHLD RNFC', 'cyan');
  ['F', 'P', 'S', 'A'].forEach((part) => {
    addDot(shldRenf, false);
    addToken(shldRenf, part);
  });

  const shldRepr = addRow('SHLD REPR', 'cyan');
  ['F', 'P', 'S', 'A'].forEach((part) => {
    addDot(shldRepr, false);
    addToken(shldRepr, part);
  });

  const sensor = cfg.sensor || { values: ['2', '4', '6'], free: 1 };
  addValueDots(addRow('SENSOR', 'gold'), sensor.values, sensor.free);

  const gen = cfg.genSys || { values: ['NRM', 'MAX'], free: 1 };
  addValueDots(addRow('GEN SYS', 'gold'), gen.values, gen.free);

  const weapons = Array.isArray(cfg.weapons) ? cfg.weapons : [];
  weapons.forEach((weapon, idx) => {
    const values = Array.isArray(weapon?.values) ? weapon.values : [];
    if (!weapon?.enabled || values.length <= 0) return;
    const row = addRow(weapon.label || `WPN ${String.fromCharCode(65 + idx)}`, 'red');
    addValueDots(row, values, Number(weapon.free || 0));
  });
}


function renderSystems(systems, crew) {
  const container = document.getElementById('pvSystems');
  container.innerHTML = '';
  const rows = Array.isArray(systems) ? systems : [];

  rows.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'system-row';

    const key = document.createElement('span');
    key.className = 'system-key';
    key.textContent = String(entry.key || '').slice(0, 5).toUpperCase();
    row.appendChild(key);

    const count = Math.max(0, Number(entry.value || 0));
    for (let i = 0; i < count; i += 1) {
      const box = document.createElement('span');
      box.className = 'system-box';
      row.appendChild(box);
    }

    container.appendChild(row);
  });

  document.getElementById('pvShuttleCraft').textContent = String(Math.max(0, Number(crew?.shuttleCraft || 0)));
  document.getElementById('pvMarines').textContent = String(Math.max(0, Number(crew?.marinesStationed || 0)));
}

function renderPowerSystem(powerSystem) {
  const tracks = powerSystem?.tracks ?? [];
  const activeTracks = tracks.filter((track) => Number(track.points) > 0);
  const container = document.getElementById('pvPowerTracks');
  const maxPowerEl = document.getElementById('pvMaxPower');
  container.innerHTML = '';

  const basePower = activeTracks
    .filter((track) => track.key !== 'battery' && track.key !== 'ftlDrive')
    .reduce((sum, track) => sum + Number(track.points || 0), 0);
  const batteryPower = activeTracks
    .filter((track) => track.key === 'battery')
    .reduce((sum, track) => sum + Number(track.points || 0), 0);
  maxPowerEl.textContent = `MAX POWER:${basePower}+${batteryPower}`;

  activeTracks.forEach((track) => {
    const row = document.createElement('div');
    row.className = 'power-track-row';

    const name = document.createElement('span');
    name.className = 'power-track-name';
    name.textContent = track.label;
    row.appendChild(name);

    const units = document.createElement('span');
    units.className = 'power-track-units';

    const pointCount = Math.max(0, Number(track.points || 0));
    const pattern = Array.isArray(track.boxPattern) ? track.boxPattern : [];

    for (let i = 0; i < pointCount; i += 1) {
      const unit = document.createElement('span');
      unit.className = 'power-unit';

      if (track.hasDot !== false) {
        const dot = document.createElement('span');
        dot.className = `power-dot${track.key === 'battery' ? ' is-ring' : ''}`;
        unit.appendChild(dot);
      }

      const boxesForPoint = pattern.length > 0
        ? pattern[i % pattern.length]
        : clamp(track.boxesPerPoint, 1, 3);

      for (let boxIdx = 0; boxIdx < boxesForPoint; boxIdx += 1) {
        const box = document.createElement('span');
        box.className = 'power-box';
        unit.appendChild(box);
      }

      units.appendChild(unit);
    }

    row.appendChild(units);
    container.appendChild(row);
  });
}

function getJsonPreview(build) {
  const previewBuild = { ...build };

  if (previewBuild.shipArtDataUrl) {
    previewBuild.shipArtDataUrl = `[image data url omitted: ${previewBuild.shipArtDataUrl.length} chars]`;
  }

  const embeddedBase64 = previewBuild.embeddedAssets?.shipArt?.base64;
  if (typeof embeddedBase64 === 'string' && embeddedBase64.length > 0) {
    previewBuild.embeddedAssets = {
      ...(previewBuild.embeddedAssets || {}),
      shipArt: {
        ...(previewBuild.embeddedAssets?.shipArt || {}),
        base64: `[image base64 omitted: ${embeddedBase64.length} chars]`
      }
    };
  }

  return JSON.stringify(previewBuild, null, 2);
}

function pulseLiveBadge() {
  liveBadge.style.opacity = '0.35';
  setTimeout(() => {
    liveBadge.style.opacity = '1';
  }, 110);
}

function render(options = {}) {
  const { recalculatePointValue = true } = options;
  syncDerivedFunctionInputs();
  const build = withEmbeddedShipArt(getBuild());
  renderPreview(build, { recalculatePointValue });
  jsonPreview.textContent = getJsonPreview(build);
  pulseLiveBadge();
}

function loadDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function renderDrafts() {
  draftsEl.innerHTML = '';
  const drafts = loadDrafts();
  if (!drafts.length) {
    draftsEl.innerHTML = '<li>No drafts saved yet.</li>';
    return;
  }
  drafts.slice().reverse().forEach((entry) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${entry.draft.identity.name || 'Unnamed Ship'} (${new Date(entry.savedAt).toLocaleString()})`;
    btn.addEventListener('click', () => restoreDraft(entry.draft));
    li.appendChild(btn);
    draftsEl.appendChild(li);
  });
}

function restoreDraft(draft) {
  const getField = (name) => form.elements.namedItem(name);
  const setValue = (name, value) => {
    const field = getField(name);
    if (field && 'value' in field) {
      field.value = value;
    }
  };
  const setChecked = (name, checked) => {
    const field = getField(name);
    if (field && 'checked' in field) {
      field.checked = Boolean(checked);
    }
  };

  setValue('name', draft.identity?.name ?? '');
  setValue('classType', draft.identity?.classType ?? '');
  setValue('faction', draft.identity?.faction ?? '');
  setValue('era', draft.identity?.era ?? '');

  setValue('move', draft.engineering?.move ?? 3);
  setValue('vector', draft.engineering?.vector ?? 2);
  setValue('turn', draft.engineering?.turn ?? 2);
  setValue('special', draft.engineering?.special ?? 3);

  setValue('shieldFwd', draft.shields?.forward ?? 0);
  setValue('shieldAft', draft.shields?.aft ?? 0);
  setValue('shieldPort', draft.shields?.port ?? 0);
  setValue('shieldStbd', draft.shields?.starboard ?? 0);

  setValue('armorFwd', draft.armor?.forward ?? 0);
  setValue('armorAft', draft.armor?.aft ?? 0);
  setValue('armorPort', draft.armor?.port ?? 0);
  setValue('armorStbd', draft.armor?.starboard ?? 0);

  setValue('shieldGen', draft.shieldGen ?? 0);

  const fn = draft.functionsConfig || {};
  setValue('fnAccDecValues', (fn.accDec?.values ?? ['1', '2', '3', '4', '5', '6']).join(','));
  setChecked('fnAccDecFree', fn.accDec?.free ?? 1);
  setValue('fnSifIdfValues', (fn.sifIdf?.values ?? ['1', '2', '3']).join(','));
  setChecked('fnSifIdfFree', fn.sifIdf?.free ?? 0);
  setChecked('fnSifIdfEmer', fn.sifIdf?.emer ?? true);
  setValue('fnFtlEmpty', fn.ftl?.empty ?? 2);
  setChecked('fnCloakEnabled', fn.cloak?.enabled ?? false);
  setValue('fnCloakEmpty', fn.cloak?.empty ?? 3);
  setValue('fnSensorValues', (fn.sensor?.values ?? ['2', '4', '6']).join(','));
  setChecked('fnSensorFree', fn.sensor?.free ?? 1);
  setValue('fnGenSysValues', (fn.genSys?.values ?? ['NRM', 'MAX']).join(','));
  setChecked('fnGenSysFree', fn.genSys?.free ?? 1);

  const fnWpn = fn.weapons ?? [];
  setValue('fnWpnALabel', fnWpn[0]?.label ?? 'A/MAT TRP');
  setChecked('fnWpnAFree', fnWpn[0]?.free ?? 1);
  setChecked('fnWpnAEnabled', fnWpn[0]?.enabled ?? true);
  setValue('fnWpnAValues', (fnWpn[0]?.values ?? ['2']).join(','));
  setValue('fnWpnBLabel', fnWpn[1]?.label ?? 'PHASER');
  setChecked('fnWpnBFree', fnWpn[1]?.free ?? 1);
  setChecked('fnWpnBEnabled', fnWpn[1]?.enabled ?? true);
  setValue('fnWpnBValues', (fnWpn[1]?.values ?? ['4']).join(','));
  setValue('fnWpnCLabel', fnWpn[2]?.label ?? 'WPN C');
  setChecked('fnWpnCFree', fnWpn[2]?.free ?? 1);
  setChecked('fnWpnCEnabled', fnWpn[2]?.enabled ?? true);
  setValue('fnWpnCValues', (fnWpn[2]?.values ?? []).join(','));
  setValue('fnWpnDLabel', fnWpn[3]?.label ?? 'WPN D');
  setChecked('fnWpnDFree', fnWpn[3]?.free ?? 0);
  setChecked('fnWpnDEnabled', fnWpn[3]?.enabled ?? false);
  setValue('fnWpnDValues', (fnWpn[3]?.values ?? []).join(','));

  if (getField('powerSystem')) {
    setValue('powerSystem', draft.textBlocks?.powerSystem ?? '');
  }

  const draftTracks = draft.powerSystem?.tracks ?? [];
  POWER_TRACK_CONFIG.forEach((track) => {
    const trackData = draftTracks.find((entry) => entry.key === track.key || entry.label === track.label);
    const pointsField = getField(track.pointsField);
    const boxesField = getField(track.boxesField);
    const patternField = getField(track.patternField);
    const hasDotField = getField(track.hasDotField);

    if (pointsField) {
      pointsField.value = Math.max(0, Number(trackData?.points ?? pointsField.value ?? 0));
    }
    if (boxesField) {
      boxesField.value = clamp(Number(trackData?.boxesPerPoint ?? boxesField.value ?? 2), 1, 3);
    }
    if (patternField) {
      patternField.value = (trackData?.boxPattern ?? []).join(',');
    }
    if (hasDotField) {
      hasDotField.checked = Boolean(trackData?.hasDot ?? hasDotField.checked);
    }
  });

  const sublight = draft.sublight ?? {
    maxAccPhs: 2,
    greenCircles: 3,
    redCircles: 3,
    spd: [6, 5, 4, 3, 2, 1, 0],
    turns: [20, 20, 20, 20, 20, 20, 20],
    dmgStops: [false, false, false, false, false, false, false]
  };
  setValue('sublightMaxAcc', sublight.maxAccPhs ?? 2);
  setValue('sublightGreen', sublight.greenCircles ?? 3);
  setValue('sublightRed', sublight.redCircles ?? 3);
  [6, 5, 4, 3, 2, 1, 0].forEach((speed, index) => {
    setValue(`sublightTurn${speed}`, normalizeTurnOption(sublight.turns?.[index] ?? 20));
    setChecked(`sublightDmg${speed}`, sublight.dmgStops?.[index]);
  });

  setValue('structureBlack', draft.structure?.repairable ?? 0);
  setValue('structureRed', draft.structure?.permanent ?? 0);

  shipArtDataUrl = draft.shipArtDataUrl ?? '';
  const normalizedWeapons = (Array.isArray(draft.weapons) ? draft.weapons : []).map((weapon) => normalizeWeapon(weapon));
  [1, 2, 3, 4].forEach((index) => {
    const weapon = normalizedWeapons[index - 1] || normalizeWeapon({});
    setValue(`wpn${index}Name`, weapon.name || '');
    setValue(`wpn${index}Traits`, (weapon.traits || []).join(', '));
    setValue(`wpn${index}MountArcs`, (weapon.mountFacings || []).map((mount) => mount.join(',')).join('|'));
    setValue(`wpn${index}PowerCircles`, weapon.powerCircles || 1);
    setValue(`wpn${index}PowerStops`, (weapon.powerStops || []).join(', '));
    setValue(`wpn${index}Structure`, weapon.structure || 1);
    setValue(`wpn${index}Ranges`, (weapon.ranges || []).map((range) => `${range.band}:${range.type}`).join(','));
    setValue(`wpn${index}Dice`, (weapon.ranges || []).map((range) => {
      const dice = (range.dice || []).join(',');
      return Number(range.bonus || 0) > 0 ? `${Number(range.bonus)},${dice}` : dice;
    }).join('|'));
    setValue(`wpn${index}Special`, weapon.special || '');
  });

  setValue('systems', (draft.systems ?? []).map((item) => `${item.key}:${item.value ?? ''}`).join('\n'));
  setValue('shuttleCraft', draft.crew?.shuttleCraft ?? 4);
  setValue('marinesStationed', draft.crew?.marinesStationed ?? 10);

  render();
}

function saveDraft() {
  const drafts = loadDrafts();
  drafts.push({ id: crypto.randomUUID(), savedAt: new Date().toISOString(), draft: getBuild() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  renderDrafts();
}

function clearDrafts() {
  localStorage.removeItem(STORAGE_KEY);
  renderDrafts();
}


function slugifyFileName(raw) {
  return String(raw || 'starforce-ssd')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'starforce-ssd';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCurrent() {
  const name = slugifyFileName(form.elements.name.value);
  const shareableBuild = withEmbeddedShipArt(getBuild());
  const blob = new Blob([JSON.stringify(shareableBuild, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${name}.json`);
}

function importJsonFile(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedDraft = JSON.parse(String(reader.result || '{}'));
      if (!importedDraft || typeof importedDraft !== 'object') {
        throw new Error('Invalid JSON');
      }

      const mergedDraft = {
        ...importedDraft,
        shipArtDataUrl: resolveImportedShipArt(importedDraft)
      };
      restoreDraft(mergedDraft);
    } catch {
      window.alert('Could not import JSON. Please choose a valid SSD export file.');
    }
  };
  reader.readAsText(file);
}

form.addEventListener('input', () => render({ recalculatePointValue: false }));
form.addEventListener('change', () => render({ recalculatePointValue: false }));
document.getElementById('saveBtn').addEventListener('click', saveDraft);
document.getElementById('clearBtn').addEventListener('click', clearDrafts);
document.getElementById('exportBtn').addEventListener('click', exportCurrent);
document.getElementById('importBtn').addEventListener('click', () => {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'application/json,.json';
  picker.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    importJsonFile(file);
  }, { once: true });

  if (typeof picker.showPicker === 'function') {
    picker.showPicker();
  } else {
    picker.click();
  }
});
document.getElementById('printBtn').addEventListener('click', () => window.print());
document.querySelectorAll('.update-pv-btn').forEach((button) => {
  button.addEventListener('click', () => render({ recalculatePointValue: true }));
});

const shipArtInput = document.getElementById('shipArt');
document.getElementById('clearArtBtn').addEventListener('click', () => {
  shipArtDataUrl = '';
  shipArtInput.value = '';
  render();
});

shipArtInput.addEventListener('change', (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    shipArtDataUrl = String(reader.result || '');
    render();
  };
  reader.readAsDataURL(file);
});

restoreDraft(STANDARD_DEFAULT_LOADOUT);
renderDrafts();
