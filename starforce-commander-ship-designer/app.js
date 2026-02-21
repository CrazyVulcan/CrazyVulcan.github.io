const form = document.getElementById('ssdForm');
const draftsEl = document.getElementById('drafts');
const jsonPreview = document.getElementById('jsonPreview');
const liveBadge = document.getElementById('liveBadge');
const STORAGE_KEY = 'sfCommanderSsdDrafts';
let shipArtDataUrl = '';

const POWER_TRACK_CONFIG = [
  { key: 'lMain', label: 'L MAIN', pointsField: 'powerLMainPoints', boxesField: 'powerLMainBoxes', patternField: 'powerLMainPattern', hasDotField: 'powerLMainHasDot' },
  { key: 'rMain', label: 'R MAIN', pointsField: 'powerRMainPoints', boxesField: 'powerRMainBoxes', patternField: 'powerRMainPattern', hasDotField: 'powerRMainHasDot' },
  { key: 'cMain', label: 'C MAIN', pointsField: 'powerCMainPoints', boxesField: 'powerCMainBoxes', patternField: 'powerCMainPattern', hasDotField: 'powerCMainHasDot' },
  { key: 'slReac', label: 'SL REAC', pointsField: 'powerSlReacPoints', boxesField: 'powerSlReacBoxes', patternField: 'powerSlReacPattern', hasDotField: 'powerSlReacHasDot' },
  { key: 'auxPwr', label: 'AUX PWR', pointsField: 'powerAuxPwrPoints', boxesField: 'powerAuxPwrBoxes', patternField: 'powerAuxPwrPattern', hasDotField: 'powerAuxPwrHasDot' },
  { key: 'battery', label: 'BATTERY', pointsField: 'powerBatteryPoints', boxesField: 'powerBatteryBoxes', patternField: 'powerBatteryPattern', hasDotField: 'powerBatteryHasDot' },
  { key: 'ftlDrive', label: 'FTL DRIVE', pointsField: 'powerFtlDrivePoints', boxesField: 'powerFtlDriveBoxes', patternField: 'powerFtlDrivePattern', hasDotField: 'powerFtlDriveHasDot' }
];

function parseWeapons(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...ranges] = line.split('|').map((part) => part.trim());
      return { name, ranges };
    });
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
  return Number(form.elements[name].value || 0);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readSublight() {
  const speeds = [6, 5, 4, 3, 2, 1, 0];
  return {
    maxAccPhs: num('sublightMaxAcc'),
    greenCircles: clamp(num('sublightGreen'), 0, 3),
    redCircles: clamp(num('sublightRed'), 0, 3),
    spd: speeds.map((speed) => speed),
    turns: speeds.map((speed) => num(`sublightTurn${speed}`)),
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
      sizeClassIcon: form.elements.sizeClassIcon.value,
      faction: form.elements.faction.value,
      era: form.elements.era.value
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
    weapons: parseWeapons(form.elements.weapons.value),
    systems: parseSystems(form.elements.systems.value)
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

function weaponSlot(id, weapon, enabled = true) {
  const slot = document.getElementById(`pvWpn${id}Slot`);
  const title = document.getElementById(`pvWpn${id}Title`);
  const body = document.getElementById(`pvWpn${id}Body`);

  if (!enabled) {
    slot.style.display = 'none';
    title.textContent = 'WPN NAME TYP';
    body.textContent = '';
    return;
  }

  slot.style.display = 'flex';
  if (!weapon) {
    title.textContent = 'WPN NAME TYP';
    body.textContent = '';
    return;
  }
  title.textContent = weapon.name || 'WPN NAME TYP';
  body.textContent = weapon.ranges.join('  •  ');
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

function renderPreview(build) {
  document.getElementById('pvName').textContent = build.identity.name || 'SHIP NAME / ID';
  document.getElementById('pvClass').textContent = build.identity.classType || 'CLASSNAME ID-class Weight Class';
  document.getElementById('pvFaction').textContent = build.identity.faction || 'COMMON';
  const sizeClassIcon = document.getElementById('pvSizeClassIcon');
  const defaultSizeClassIcon = 'assets/size-class-icon.svg';
  sizeClassIcon.onerror = () => {
    if (sizeClassIcon.src.endsWith(defaultSizeClassIcon)) return;
    sizeClassIcon.src = defaultSizeClassIcon;
  };
  sizeClassIcon.src = build.identity.sizeClassIcon || build.identity.hullIcon || defaultSizeClassIcon;
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

  const systemsText = build.systems.map((entry) => `${entry.key} ${entry.value}`.trim()).join('\n');
  document.getElementById('pvSystems').textContent = systemsText;
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
  if (!build.shipArtDataUrl) {
    return JSON.stringify(build, null, 2);
  }
  const previewBuild = {
    ...build,
    shipArtDataUrl: `[image data url omitted: ${build.shipArtDataUrl.length} chars]`
  };
  return JSON.stringify(previewBuild, null, 2);
}

function pulseLiveBadge() {
  liveBadge.style.opacity = '0.35';
  setTimeout(() => {
    liveBadge.style.opacity = '1';
  }, 110);
}

function render() {
  syncDerivedFunctionInputs();
  const build = getBuild();
  renderPreview(build);
  jsonPreview.textContent = getJsonPreview(build);
  pulseLiveBadge();
}

function loadDrafts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
  form.elements.name.value = draft.identity?.name ?? '';
  form.elements.classType.value = draft.identity?.classType ?? '';
  form.elements.sizeClassIcon.value = draft.identity?.sizeClassIcon ?? draft.identity?.hullIcon ?? 'assets/size-class-icon.svg';
  form.elements.faction.value = draft.identity?.faction ?? '';
  form.elements.era.value = draft.identity?.era ?? '';

  form.elements.move.value = draft.engineering?.move ?? 0;
  form.elements.vector.value = draft.engineering?.vector ?? 0;
  form.elements.turn.value = draft.engineering?.turn ?? 0;
  form.elements.special.value = draft.engineering?.special ?? 0;

  form.elements.shieldFwd.value = draft.shields?.forward ?? 0;
  form.elements.shieldAft.value = draft.shields?.aft ?? 0;
  form.elements.shieldPort.value = draft.shields?.port ?? 0;
  form.elements.shieldStbd.value = draft.shields?.starboard ?? 0;

  form.elements.armorFwd.value = draft.armor?.forward ?? 0;
  form.elements.armorAft.value = draft.armor?.aft ?? 0;
  form.elements.armorPort.value = draft.armor?.port ?? 0;
  form.elements.armorStbd.value = draft.armor?.starboard ?? 0;

  form.elements.shieldGen.value = draft.shieldGen ?? 0;

  const fn = draft.functionsConfig || {};
  form.elements.fnAccDecValues.value = (fn.accDec?.values ?? ['1', '2', '3', '4', '5', '6']).join(',');
  form.elements.fnAccDecFree.checked = Boolean(fn.accDec?.free ?? 1);
  form.elements.fnSifIdfValues.value = (fn.sifIdf?.values ?? ['1', '2', '3']).join(',');
  form.elements.fnSifIdfFree.checked = Boolean(fn.sifIdf?.free ?? 0);
  form.elements.fnSifIdfEmer.checked = Boolean(fn.sifIdf?.emer ?? true);
  form.elements.fnFtlEmpty.value = fn.ftl?.empty ?? 2;
  form.elements.fnCloakEnabled.checked = Boolean(fn.cloak?.enabled ?? false);
  form.elements.fnCloakEmpty.value = fn.cloak?.empty ?? 3;
  form.elements.fnSensorValues.value = (fn.sensor?.values ?? ['2', '4', '6']).join(',');
  form.elements.fnSensorFree.checked = Boolean(fn.sensor?.free ?? 1);
  form.elements.fnGenSysValues.value = (fn.genSys?.values ?? ['NRM', 'MAX']).join(',');
  form.elements.fnGenSysFree.checked = Boolean(fn.genSys?.free ?? 1);
  const fnWpn = fn.weapons ?? [];
  form.elements.fnWpnALabel.value = fnWpn[0]?.label ?? 'A/MAT TRP';
  form.elements.fnWpnAFree.checked = Boolean(fnWpn[0]?.free ?? 1);
  form.elements.fnWpnAEnabled.checked = Boolean(fnWpn[0]?.enabled ?? true);
  form.elements.fnWpnAValues.value = (fnWpn[0]?.values ?? ['2']).join(',');
  form.elements.fnWpnBLabel.value = fnWpn[1]?.label ?? 'PHASER';
  form.elements.fnWpnBFree.checked = Boolean(fnWpn[1]?.free ?? 1);
  form.elements.fnWpnBEnabled.checked = Boolean(fnWpn[1]?.enabled ?? true);
  form.elements.fnWpnBValues.value = (fnWpn[1]?.values ?? ['4']).join(',');
  form.elements.fnWpnCLabel.value = fnWpn[2]?.label ?? 'WPN C';
  form.elements.fnWpnCFree.checked = Boolean(fnWpn[2]?.free ?? 1);
  form.elements.fnWpnCEnabled.checked = Boolean(fnWpn[2]?.enabled ?? true);
  form.elements.fnWpnCValues.value = (fnWpn[2]?.values ?? []).join(',');
  form.elements.fnWpnDLabel.value = fnWpn[3]?.label ?? 'WPN D';
  form.elements.fnWpnDFree.checked = Boolean(fnWpn[3]?.free ?? 0);
  form.elements.fnWpnDEnabled.checked = Boolean(fnWpn[3]?.enabled ?? false);
  form.elements.fnWpnDValues.value = (fnWpn[3]?.values ?? []).join(',');

  if (form.elements.powerSystem) {
    form.elements.powerSystem.value = draft.textBlocks?.powerSystem ?? '';
  }

  const draftTracks = draft.powerSystem?.tracks ?? [];
  POWER_TRACK_CONFIG.forEach((track) => {
    const trackData = draftTracks.find((entry) => entry.key === track.key || entry.label === track.label);
    form.elements[track.pointsField].value = Math.max(0, Number(trackData?.points ?? form.elements[track.pointsField].value ?? 0));
    form.elements[track.boxesField].value = clamp(Number(trackData?.boxesPerPoint ?? form.elements[track.boxesField].value ?? 2), 1, 3);
    form.elements[track.patternField].value = (trackData?.boxPattern ?? []).join(',');
    form.elements[track.hasDotField].checked = Boolean(trackData?.hasDot ?? form.elements[track.hasDotField].checked);
  });

  const sublight = draft.sublight ?? {
    maxAccPhs: 2,
    greenCircles: 3,
    redCircles: 3,
    spd: [6, 5, 4, 3, 2, 1, 0],
    turns: [20, 20, 20, 20, 20, 20, 20],
    dmgStops: [false, false, false, false, false, false, false]
  };
  form.elements.sublightMaxAcc.value = sublight.maxAccPhs ?? 2;
  form.elements.sublightGreen.value = sublight.greenCircles ?? 3;
  form.elements.sublightRed.value = sublight.redCircles ?? 3;
  [6, 5, 4, 3, 2, 1, 0].forEach((speed, index) => {
    form.elements[`sublightTurn${speed}`].value = sublight.turns?.[index] ?? 20;
    form.elements[`sublightDmg${speed}`].checked = Boolean(sublight.dmgStops?.[index]);
  });

  form.elements.structureBlack.value = draft.structure?.repairable ?? 0;
  form.elements.structureRed.value = draft.structure?.permanent ?? 0;

  shipArtDataUrl = draft.shipArtDataUrl ?? '';
  form.elements.weapons.value = (draft.weapons ?? []).map((item) => [item.name, ...(item.ranges ?? [])].join('|')).join('\n');
  form.elements.systems.value = (draft.systems ?? []).map((item) => `${item.key}:${item.value ?? ''}`).join('\n');

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

function exportCurrent() {
  const name = form.elements.name.value || 'starforce-ssd';
  const blob = new Blob([JSON.stringify(getBuild(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

form.addEventListener('input', render);
form.addEventListener('change', render);
document.getElementById('saveBtn').addEventListener('click', saveDraft);
document.getElementById('clearBtn').addEventListener('click', clearDrafts);
document.getElementById('exportBtn').addEventListener('click', exportCurrent);

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

render();
renderDrafts();
