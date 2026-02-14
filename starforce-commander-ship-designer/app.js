const form = document.getElementById('ssdForm');
const draftsEl = document.getElementById('drafts');
const jsonPreview = document.getElementById('jsonPreview');
const liveBadge = document.getElementById('liveBadge');
const STORAGE_KEY = 'sfCommanderSsdDrafts';

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

function getBuild() {
  return {
    identity: {
      name: form.elements.name.value,
      classType: form.elements.classType.value,
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
    textBlocks: {
      functions: form.elements.functions.value,
      powerSystem: form.elements.powerSystem.value,
      maneuvering: form.elements.maneuvering.value
    },
    weapons: parseWeapons(form.elements.weapons.value),
    systems: parseSystems(form.elements.systems.value)
  };
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

function renderPreview(build) {
  document.getElementById('pvName').textContent = build.identity.name || 'SHIP NAME / ID';
  document.getElementById('pvClass').textContent = build.identity.classType || 'CLASSNAME ID-class Weight Class';
  document.getElementById('pvFaction').textContent = build.identity.faction || 'COMMON';
  document.getElementById('pvEra').textContent = build.identity.era || 'ERA';

  document.getElementById('pvMove').textContent = build.engineering.move;
  document.getElementById('pvVector').textContent = build.engineering.vector;
  document.getElementById('pvTurn').textContent = build.engineering.turn;
  document.getElementById('pvSpecial').textContent = build.engineering.special;

  document.getElementById('pvShieldFwd').textContent = String(build.shields.forward).padStart(2, '0');
  document.getElementById('pvShieldAft').textContent = String(build.shields.aft).padStart(2, '0');
  document.getElementById('pvShieldPort').textContent = String(build.shields.port).padStart(2, '0');
  document.getElementById('pvShieldStbd').textContent = String(build.shields.starboard).padStart(2, '0');

  document.getElementById('pvFunctions').textContent = build.textBlocks.functions;
  document.getElementById('pvPowerSystem').textContent = build.textBlocks.powerSystem;
  document.getElementById('pvManeuvering').textContent = build.textBlocks.maneuvering;

  weaponSlot(1, build.weapons[0]);
  weaponSlot(2, build.weapons[1]);
  weaponSlot(3, build.weapons[2]);
  weaponSlot(4, build.weapons[3]);

  const systemsText = build.systems.map((entry) => `${entry.key} ${entry.value}`.trim()).join('\n');
  document.getElementById('pvSystems').textContent = systemsText;
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
  jsonPreview.textContent = JSON.stringify(build, null, 2);
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

  form.elements.functions.value = draft.textBlocks?.functions ?? '';
  form.elements.powerSystem.value = draft.textBlocks?.powerSystem ?? '';
  form.elements.maneuvering.value = draft.textBlocks?.maneuvering ?? '';

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

render();
renderDrafts();
