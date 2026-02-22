function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + num(value), 0);
}

function bandSpan(rawBand) {
  const [start, end] = String(rawBand || '')
    .split('-')
    .map((part) => Number(part.trim()));

  if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
    return Math.max(1, end - start + 1);
  }

  return 1;
}

function rangeTypeWeight(type) {
  if (type === 'green') {
    return 1.15;
  }
  if (type === 'red') {
    return 0.9;
  }
  return 1;
}

function normalizeWeapons(weapons) {
  return Array.isArray(weapons) ? weapons.filter((weapon) => weapon && weapon.name) : [];
}

function normalizeTrait(trait) {
  return String(trait || '').trim().toUpperCase();
}

const TRAIT_BONUS_BY_PREFIX = [
  { match: 'HOMING', bonus: 1.2 },
  { match: 'HVY', bonus: 1.4 },
  { match: 'PREC', bonus: 1.4 },
  { match: 'PIERCE', bonus: 1.4 },
  { match: 'PIRCE', bonus: 1.4 },
  { match: 'PARICAL', bonus: 1.1 },
  { match: 'PARTIAL', bonus: 1.1 },
  { match: 'LEAK', bonus: 1.1 },
  { match: 'PD MODE', bonus: 1.1 },
  { match: 'ATMO', bonus: 0.8 },
  { match: 'NOBAT', bonus: 0.6 },
  { match: 'FTL', bonus: 1.0 }
];

function traitBonusScore(traits) {
  if (!Array.isArray(traits) || traits.length === 0) {
    return 0;
  }

  return traits.reduce((score, trait) => {
    const normalized = normalizeTrait(trait);
    if (!normalized) {
      return score;
    }

    const weighted = TRAIT_BONUS_BY_PREFIX.find((entry) => normalized.startsWith(entry.match));
    return score + (weighted ? weighted.bonus : 0.9);
  }, 0);
}

function positivePart(value, fallback = 0) {
  const parsed = num(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, parsed);
}

function safeRun(scorer, fallback = 0) {
  try {
    return positivePart(scorer(), fallback);
  } catch {
    return fallback;
  }
}

function scoreIdentity(build) {
  const identity = build?.identity || {};
  const labelBonus = [identity.name, identity.classType, identity.faction, identity.era]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .length * 0.1;
  return labelBonus;
}

function scoreEngineering(build) {
  const engineering = build?.engineering || {};
  return (positivePart(engineering.move) * 1.15)
    + (positivePart(engineering.vector) * 1.25)
    + (positivePart(engineering.turn) * 0.9)
    + (positivePart(engineering.special) * 0.85);
}

function scoreDefense(build) {
  const shields = build?.shields || {};
  const armor = build?.armor || {};
  const structure = build?.structure || {};

  const shieldScore = sum([shields.forward, shields.aft, shields.port, shields.starboard]) * 0.42;
  const armorScore = sum([armor.forward, armor.aft, armor.port, armor.starboard]) * 0.52;
  const structureScore = (positivePart(structure.repairable) * 1.45) + (positivePart(structure.permanent) * 1.2);
  const generatorScore = positivePart(build?.shieldGen) * 1.1;

  return shieldScore + armorScore + structureScore + generatorScore;
}

function scoreManeuvering(build) {
  const sublight = build?.sublight || {};
  const turnScore = sum(Array.isArray(sublight.turns) ? sublight.turns : []) * 0.025;
  const spdScore = sum(Array.isArray(sublight.spd) ? sublight.spd : []) * 0.05;
  const dmgStopScore = sum((Array.isArray(sublight.dmgStops) ? sublight.dmgStops : []).map((stop) => (stop ? 1 : 0))) * 0.4;
  return (positivePart(sublight.maxAccPhs) * 0.95)
    + (positivePart(sublight.greenCircles) * 0.5)
    + (positivePart(sublight.redCircles) * 0.45)
    + turnScore
    + spdScore
    + dmgStopScore;
}

function scoreSystemsAndCrew(build) {
  const systems = Array.isArray(build?.systems) ? build.systems : [];
  const crew = build?.crew || {};

  const systemsValue = systems.reduce((total, entry) => total + positivePart(entry?.value), 0);
  const systemsBreadth = systems.length * 0.4;
  const crewScore = (positivePart(crew.shuttleCraft) * 0.3) + (positivePart(crew.marinesStationed) * 0.14);

  return systemsValue + systemsBreadth + crewScore;
}

function scorePowerTracks(build) {
  const tracks = Array.isArray(build?.powerSystem?.tracks) ? build.powerSystem.tracks : [];
  return tracks.reduce((total, track) => {
    const points = positivePart(track?.points);
    const boxesPerPoint = Math.max(1, positivePart(track?.boxesPerPoint, 1));
    const patternBonus = (Array.isArray(track?.boxPattern) ? track.boxPattern : []).length * 0.07;
    const dotBonus = track?.hasDot === false ? 0 : 0.08;
    return total + (points * (0.75 + (boxesPerPoint * 0.11))) + patternBonus + dotBonus;
  }, 0);
}

function scoreFunctions(build) {
  const cfg = build?.functionsConfig || {};
  const rows = [cfg.accDec, cfg.sifIdf, cfg.batRech, cfg.sensor, cfg.genSys, ...(Array.isArray(cfg.weapons) ? cfg.weapons : [])];

  const rowScore = rows.reduce((total, row) => {
    if (!row || row.enabled === false) {
      return total;
    }

    const valueCount = Array.isArray(row.values) ? row.values.length : 0;
    const free = positivePart(row.free);
    const emergency = row.emer ? 0.3 : 0;
    return total + (valueCount * 0.45) + (free * 0.32) + emergency;
  }, 0);

  return rowScore
    + (positivePart(cfg?.ftl?.empty) * 0.22)
    + (positivePart(cfg?.cloak?.empty) * 0.22)
    + (cfg?.cloak?.enabled ? 1 : 0);
}

function scoreWeapons(build) {
  const weapons = normalizeWeapons(build?.weapons);
  return weapons.reduce((total, weapon) => {
    const ranges = Array.isArray(weapon?.ranges) ? weapon.ranges : [];

    const rangeScore = ranges.reduce((rangeTotal, range) => {
      const span = bandSpan(range?.band);
      const dice = Array.isArray(range?.dice) ? range.dice.length : 0;
      const bonus = positivePart(range?.bonus) * 0.35;
      const color = rangeTypeWeight(String(range?.type || 'black').toLowerCase());
      return rangeTotal + ((dice + bonus) * span * color * 0.2);
    }, 0);

    const mountCount = Math.max(1, weapon?.mountArcs?.length || weapon?.mountFacings?.length || 1);
    const powerScore = positivePart(weapon?.powerCircles) * 0.35;
    const stopScore = (Array.isArray(weapon?.powerStops) ? weapon.powerStops.length : 0) * 0.2;
    const structureScore = positivePart(weapon?.structure) * 0.45;
    const traitScore = traitBonusScore(weapon?.traits) * 0.4;
    const specialScore = String(weapon?.special || '').trim() ? 0.5 : 0;

    return total + rangeScore + (mountCount * 0.55) + powerScore + stopScore + structureScore + traitScore + specialScore;
  }, 0);
}

export function calculatePointValue(build) {
  const contributions = [
    safeRun(() => scoreIdentity(build)),
    safeRun(() => scoreEngineering(build)),
    safeRun(() => scoreDefense(build)),
    safeRun(() => scoreManeuvering(build)),
    safeRun(() => scoreSystemsAndCrew(build)),
    safeRun(() => scorePowerTracks(build)),
    safeRun(() => scoreFunctions(build)),
    safeRun(() => scoreWeapons(build))
  ];

  const total = sum(contributions);
  const normalizedTotal = total * 0.2;
  return Math.max(1, Math.round(normalizedTotal));
}
