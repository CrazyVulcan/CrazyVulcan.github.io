const form = document.getElementById('ssdForm');
const draftsEl = document.getElementById('drafts');
const jsonPreview = document.getElementById('jsonPreview');
const liveBadge = document.getElementById('liveBadge');
const STORAGE_KEY = 'sfCommanderSsdDrafts';
let shipArtDataUrl = '';

const POWER_TRACK_CONFIG = [
  { key: 'lMain', label: 'L MAIN', pointsField: 'powerLMainPoints', boxesField: 'powerLMainBoxes' },
  { key: 'rMain', label: 'R MAIN', pointsField: 'powerRMainPoints', boxesField: 'powerRMainBoxes' },
  { key: 'cMain', label: 'C MAIN', pointsField: 'powerCMainPoints', boxesField: 'powerCMainBoxes' },
  { key: 'slReac', label: 'SL REAC', pointsField: 'powerSlReacPoints', boxesField: 'powerSlReacBoxes' },
  { key: 'auxPwr', label: 'AUX PWR', pointsField: 'powerAuxPwrPoints', boxesField: 'powerAuxPwrBoxes' },
  { key: 'battery', label: 'BATTERY', pointsField: 'powerBatteryPoints', boxesField: 'powerBatteryBoxes' },
  { key: 'ftlDrive', label: 'FTL DRIVE', pointsField: 'powerFtlDrivePoints', boxesField: 'powerFtlDriveBoxes' }
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

function readPowerSystem() {
  return {
    tracks: POWER_TRACK_CONFIG.map((track) => ({
      key: track.key,
      label: track.label,
      points: Math.max(0, num(track.pointsField)),
      boxesPerPoint: clamp(num(track.boxesField), 1, 3)
    }))
  };
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
      functions: form.elements.functions.value,
      powerSystem: form.elements.powerSystem?.value ?? ''
    },
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

function weaponSlot(id, weapon) {
  const title = document.getElementById(`pvWpn${id}Title`);
  const body = document.getElementById(`pvWpn${id}Body`);
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

  document.getElementById('pvFunctions').textContent = build.textBlocks.functions;
  renderPowerSystem(build.powerSystem);
  renderManeuvering(build.sublight);

  weaponSlot(1, build.weapons[0]);
  weaponSlot(2, build.weapons[1]);
  weaponSlot(3, build.weapons[2]);
  weaponSlot(4, build.weapons[3]);

  const systemsText = build.systems.map((entry) => `${entry.key} ${entry.value}`.trim()).join('\n');
  document.getElementById('pvSystems').textContent = systemsText;
  renderStructure(build);
}

function renderPowerSystem(powerSystem) {
  const tracks = powerSystem?.tracks ?? [];
  const container = document.getElementById('pvPowerTracks');
  container.innerHTML = '';

  tracks
    .filter((track) => Number(track.points) > 0)
    .forEach((track) => {
      const row = document.createElement('div');
      row.className = 'power-track-row';

      const name = document.createElement('span');
      name.className = 'power-track-name';
      name.textContent = track.label;
      row.appendChild(name);

      const units = document.createElement('span');
      units.className = 'power-track-units';

      for (let i = 0; i < track.points; i += 1) {
        const unit = document.createElement('span');
        unit.className = 'power-unit';

        const dot = document.createElement('span');
        dot.className = `power-dot${track.key === 'battery' ? ' is-ring' : ''}`;
        unit.appendChild(dot);

        for (let boxIdx = 0; boxIdx < clamp(track.boxesPerPoint, 1, 3); boxIdx += 1) {
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

  form.elements.functions.value = draft.textBlocks?.functions ?? '';
  if (form.elements.powerSystem) {
    form.elements.powerSystem.value = draft.textBlocks?.powerSystem ?? '';
  }

  const draftTracks = draft.powerSystem?.tracks ?? [];
  POWER_TRACK_CONFIG.forEach((track) => {
    const trackData = draftTracks.find((entry) => entry.key === track.key || entry.label === track.label);
    form.elements[track.pointsField].value = Math.max(0, Number(trackData?.points ?? form.elements[track.pointsField].value ?? 0));
    form.elements[track.boxesField].value = clamp(Number(trackData?.boxesPerPoint ?? form.elements[track.boxesField].value ?? 2), 1, 3);
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
