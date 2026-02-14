const form = document.getElementById('shipForm');
const card = document.getElementById('card');
const draftsEl = document.getElementById('drafts');
const STORAGE_KEY = 'sfCommanderShipDrafts';

let moduleData = null;

async function init() {
  const res = await fetch('./data.json');
  moduleData = await res.json();
  fillSelect('weapon');
  fillSelect('engine');
  fillSelect('utility');
  form.addEventListener('input', render);
  document.getElementById('saveBtn').addEventListener('click', saveDraft);
  document.getElementById('exportBtn').addEventListener('click', exportCurrent);
  document.getElementById('clearBtn').addEventListener('click', clearDrafts);
  render();
  renderDrafts();
}

function fillSelect(slot) {
  const select = form.elements[slot];
  moduleData.modules[slot].forEach((mod) => {
    const option = document.createElement('option');
    option.value = mod.name;
    option.textContent = `${mod.name} (${mod.power}p)`;
    select.appendChild(option);
  });
}

function valNum(name) {
  return Number(form.elements[name].value || 0);
}

function getBuild() {
  const slots = ['weapon', 'engine', 'utility'];
  const selectedModules = Object.fromEntries(
    slots.map((slot) => {
      const name = form.elements[slot].value;
      const mod = moduleData.modules[slot].find((m) => m.name === name);
      return [slot, mod];
    })
  );

  const usedPower = Object.values(selectedModules).reduce((sum, mod) => sum + (mod?.power ?? 0), 0);
  const budget = valNum('powerBudget');

  return {
    name: form.elements.name.value,
    faction: form.elements.faction.value,
    class: form.elements.shipClass.value,
    baseSize: form.elements.baseSize.value,
    stats: {
      attack: valNum('attack'),
      defense: valNum('defense'),
      hull: valNum('hull'),
      shields: valNum('shields')
    },
    power: {
      budget,
      used: usedPower,
      valid: usedPower <= budget
    },
    modules: selectedModules
  };
}

function render() {
  const build = getBuild();
  card.textContent = JSON.stringify(build, null, 2);
  card.style.border = build.power.valid ? '1px solid #285e43' : '1px solid #8a2f2f';
}

function loadDrafts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveDraft() {
  const draft = getBuild();
  const drafts = loadDrafts();
  drafts.push({ id: crypto.randomUUID(), savedAt: new Date().toISOString(), draft });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  renderDrafts();
}

function clearDrafts() {
  localStorage.removeItem(STORAGE_KEY);
  renderDrafts();
}

function exportCurrent() {
  const blob = new Blob([JSON.stringify(getBuild(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${form.elements.name.value || 'ship-build'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderDrafts() {
  draftsEl.innerHTML = '';
  const drafts = loadDrafts();
  if (drafts.length === 0) {
    draftsEl.innerHTML = '<li>No drafts saved yet.</li>';
    return;
  }
  drafts.slice().reverse().forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = `${entry.draft.name || 'Unnamed Ship'} — ${new Date(entry.savedAt).toLocaleString()}`;
    draftsEl.appendChild(li);
  });
}

init();
