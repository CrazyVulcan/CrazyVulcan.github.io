const form = document.getElementById('ssdForm');
const draftsEl = document.getElementById('drafts');
const jsonPreview = document.getElementById('jsonPreview');
const liveBadge = document.getElementById('liveBadge');
const STORAGE_KEY = 'sfCommanderSsdDrafts';
let shipArtDataUrl = '';

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
    shieldGen: num('shieldGen'),
    textBlocks: {
      functions: form.elements.functions.value,
      powerSystem: form.elements.powerSystem.value
    },
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
  for (let i = 0; i < build.structure.repairable; i += 1) {
    const box = document.createElement('span');
    box.className = 'structure-box';
    row.appendChild(box);
  }
  for (let i = 0; i < build.structure.permanent; i += 1) {
    const box = document.createElement('span');
    box.className = 'structure-box permanent';
    row.appendChild(box);
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

  const previewColumns = 6;
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

  document.getElementById('pvShieldFwd').textContent = String(build.shields.forward).padStart(2, '0');
  document.getElementById('pvShieldAft').textContent = String(build.shields.aft).padStart(2, '0');
  document.getElementById('pvShieldPort').textContent = String(build.shields.port).padStart(2, '0');
  document.getElementById('pvShieldStbd').textContent = String(build.shields.starboard).padStart(2, '0');

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
  document.getElementById('pvPowerSystem').textContent = build.textBlocks.powerSystem;
  renderManeuvering(build.sublight);

  weaponSlot(1, build.weapons[0]);
  weaponSlot(2, build.weapons[1]);
  weaponSlot(3, build.weapons[2]);
  weaponSlot(4, build.weapons[3]);

  const systemsText = build.systems.map((entry) => `${entry.key} ${entry.value}`.trim()).join('\n');
  document.getElementById('pvSystems').textContent = systemsText;
  renderStructure(build);
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

  form.elements.shieldGen.value = draft.shieldGen ?? 0;

  form.elements.functions.value = draft.textBlocks?.functions ?? '';
  form.elements.powerSystem.value = draft.textBlocks?.powerSystem ?? '';

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
