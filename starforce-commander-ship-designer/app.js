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
      points: num('points')
    },
    coreStats: {
      attack: num('attack'),
      defense: num('defense'),
      hull: num('hull'),
      crew: num('crew')
    },
    engineering: {
      move: num('move'),
      turn: num('turn'),
      special: num('special'),
      power: num('power')
    },
    shields: {
      forward: num('shieldFwd'),
      aft: num('shieldAft'),
      port: num('shieldPort'),
      starboard: num('shieldStbd')
    },
    weapons: parseWeapons(form.elements.weapons.value),
    systems: parseSystems(form.elements.systems.value)
  };
}

function renderPreview(build) {
  document.getElementById('pvName').textContent = build.identity.name || 'Unnamed Ship';
  document.getElementById('pvClass').textContent = build.identity.classType || 'Unknown Class';

  document.getElementById('pvAttack').textContent = build.coreStats.attack;
  document.getElementById('pvDefense').textContent = build.coreStats.defense;
  document.getElementById('pvHull').textContent = build.coreStats.hull;
  document.getElementById('pvCrew').textContent = build.coreStats.crew;

  document.getElementById('pvMove').textContent = build.engineering.move;
  document.getElementById('pvTurn').textContent = build.engineering.turn;
  document.getElementById('pvSpecial').textContent = build.engineering.special;
  document.getElementById('pvPower').textContent = build.engineering.power;

  document.getElementById('pvShieldFwd').textContent = build.shields.forward;
  document.getElementById('pvShieldAft').textContent = build.shields.aft;
  document.getElementById('pvShieldPort').textContent = build.shields.port;
  document.getElementById('pvShieldStbd').textContent = build.shields.starboard;

  const weaponsEl = document.getElementById('pvWeapons');
  weaponsEl.innerHTML = '';
  build.weapons.forEach((weapon) => {
    const row = document.createElement('div');
    row.className = 'weapon-row';
    row.innerHTML = `<div class="weapon-name">${weapon.name}</div><div class="weapon-ranges">${weapon.ranges.join(' • ')}</div>`;
    weaponsEl.appendChild(row);
  });

  const systemsEl = document.getElementById('pvSystems');
  systemsEl.innerHTML = '';
  build.systems.forEach((entry) => {
    const key = document.createElement('span');
    key.textContent = entry.key;
    const val = document.createElement('strong');
    val.textContent = entry.value;
    systemsEl.appendChild(key);
    systemsEl.appendChild(val);
  });

  document.getElementById('pvFaction').textContent = build.identity.faction || 'UNKNOWN';
  document.getElementById('pvPoints').textContent = String(build.identity.points);
}

function pulseLiveBadge() {
  liveBadge.style.opacity = '0.4';
  setTimeout(() => {
    liveBadge.style.opacity = '1';
  }, 120);
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
    btn.textContent = `${entry.draft.identity.name} (${new Date(entry.savedAt).toLocaleString()})`;
    btn.addEventListener('click', () => restoreDraft(entry.draft));
    li.appendChild(btn);
    draftsEl.appendChild(li);
  });
}

function restoreDraft(draft) {
  form.elements.name.value = draft.identity.name;
  form.elements.classType.value = draft.identity.classType;
  form.elements.faction.value = draft.identity.faction;
  form.elements.points.value = draft.identity.points;

  form.elements.attack.value = draft.coreStats?.attack ?? 0;
  form.elements.defense.value = draft.coreStats?.defense ?? 0;
  form.elements.hull.value = draft.coreStats?.hull ?? 0;
  form.elements.crew.value = draft.coreStats?.crew ?? 0;

  form.elements.move.value = draft.engineering.move;
  form.elements.turn.value = draft.engineering.turn;
  form.elements.special.value = draft.engineering.special;
  form.elements.power.value = draft.engineering.power;

  form.elements.shieldFwd.value = draft.shields.forward;
  form.elements.shieldAft.value = draft.shields.aft;
  form.elements.shieldPort.value = draft.shields.port;
  form.elements.shieldStbd.value = draft.shields.starboard;

  form.elements.weapons.value = draft.weapons.map((item) => [item.name, ...item.ranges].join('|')).join('\n');
  form.elements.systems.value = draft.systems.map((item) => `${item.key}:${item.value}`).join('\n');
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
