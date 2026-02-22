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

function normalizeArcValues(weapon) {
  const fromFacings = Array.isArray(weapon?.mountFacings)
    ? weapon.mountFacings.flatMap((mount) => (Array.isArray(mount) ? mount : []))
    : [];

  const fromArcs = Array.isArray(weapon?.mountArcs)
    ? weapon.mountArcs
      .flatMap((entry) => String(entry || '').split('|'))
      .flatMap((group) => group.split(','))
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value))
    : [];

  const merged = [...fromFacings, ...fromArcs]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 8);

  return merged.length > 0 ? merged : [1];
}

function arcFacingWeight(arc) {
  if (arc === 1) {
    return 1.6; // forward
  }
  if (arc === 2 || arc === 8) {
    return 1.35; // forward flanks
  }
  if (arc === 3 || arc === 7) {
    return 1.05; // side-forward quarters
  }
  if (arc === 4 || arc === 6) {
    return 0.82; // side-rear quarters
  }
  return 0.6; // arc 5 rear
}

function mountFacingScore(weapon) {
  const arcs = [...new Set(normalizeArcValues(weapon))];
  const summedFacing = sum(arcs.map((arc) => arcFacingWeight(arc)));
  const averagedFacing = summedFacing / Math.max(1, arcs.length);
  const arcCoverageBonus = Math.sqrt(Math.max(1, arcs.length));
  return averagedFacing * arcCoverageBonus;
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

const SECTION_MULTIPLIERS = {
  identity: 0.4,
  engineering: 1.2,
  defense: 1.9,
  maneuvering: 1.4,
  systemsCrew: 1.0,
  powerTracks: 1.9,
  functions: 1.7,
  weapons: 1.35
};

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
  return [identity.name, identity.classType, identity.faction, identity.era]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .length * 0.15;
}

function scoreEngineering(build) {
  const engineering = build?.engineering || {};
  return (positivePart(engineering.move) * 1.4)
    + (positivePart(engineering.vector) * 1.5)
    + (positivePart(engineering.turn) * 1.2)
    + (positivePart(engineering.special) * 1.1);
}

function scoreDefense(build) {
  const shields = build?.shields || {};
  const armor = build?.armor || {};
  const structure = build?.structure || {};

  const repairable = positivePart(structure.repairable);
  const permanent = positivePart(structure.permanent);
  const totalStructure = repairable + permanent;

  // Survival is non-linear: each extra hull box is worth more in staying power.
  // This especially rewards high-total ships versus low-total ships.
  const structureBase = totalStructure * 1.4;
  const structureScaling = Math.pow(totalStructure, 1.45) * 0.62;

  // Damage control has outsized value because it extends effective lifespan in combat.
  const damageControlScore = Math.pow(repairable, 1.55) * 1.9;

  // Permanent structure converts directly to scenario/VP durability and kill threshold.
  const permanentHullScore = Math.pow(permanent, 1.35) * 1.2;

  // Larger structure pools amplify value from shields/armor and vice versa.
  const durabilitySynergy = (Math.sqrt(totalStructure) * 0.35)
    * (sum([shields.forward, shields.aft, shields.port, shields.starboard]) * 0.05);

  const shieldScore = sum([shields.forward, shields.aft, shields.port, shields.starboard]) * 0.58;
  const armorScore = sum([armor.forward, armor.aft, armor.port, armor.starboard]) * 0.82;
  const structureScore = structureBase
    + structureScaling
    + damageControlScore
    + permanentHullScore
    + durabilitySynergy;
  const generatorScore = positivePart(build?.shieldGen) * 1.3;

  return shieldScore + armorScore + structureScore + generatorScore;
}

function scoreManeuvering(build) {
  const sublight = build?.sublight || {};
  const turnScore = sum(Array.isArray(sublight.turns) ? sublight.turns : []) * 0.03;
  const spdScore = sum(Array.isArray(sublight.spd) ? sublight.spd : []) * 0.09;
  const dmgStopScore = sum((Array.isArray(sublight.dmgStops) ? sublight.dmgStops : []).map((stop) => (stop ? 1 : 0))) * 0.5;
  return (positivePart(sublight.maxAccPhs) * 1.15)
    + (positivePart(sublight.greenCircles) * 0.62)
    + (positivePart(sublight.redCircles) * 0.58)
    + turnScore
    + spdScore
    + dmgStopScore;
}

function scoreSystemsAndCrew(build) {
  const systems = Array.isArray(build?.systems) ? build.systems : [];
  const crew = build?.crew || {};

  const systemsValue = systems.reduce((total, entry) => total + positivePart(entry?.value), 0);
  const systemsBreadth = systems.length * 0.45;
  const crewScore = (positivePart(crew.shuttleCraft) * 0.42) + (positivePart(crew.marinesStationed) * 0.22);

  return systemsValue + systemsBreadth + crewScore;
}

function scorePowerTracks(build) {
  const tracks = Array.isArray(build?.powerSystem?.tracks) ? build.powerSystem.tracks : [];
  return tracks.reduce((total, track) => {
    const key = String(track?.key || '').toLowerCase();
    const points = positivePart(track?.points);
    const boxesPerPoint = Math.max(1, positivePart(track?.boxesPerPoint, 1));
    const patternCount = (Array.isArray(track?.boxPattern) ? track.boxPattern : []).length;

    const isBattery = key === 'battery';
    const isFtl = key === 'ftldrive' || key === 'ftl';
    const isMainOrReactor = key.includes('main') || key.includes('reac');
    const isAux = key.includes('aux');

    // More usable/free energy means more combat capability.
    const basePointValue = isBattery
      ? 2.5
      : isMainOrReactor
        ? 1.55
        : isAux
          ? 1.35
          : isFtl
            ? 0.65
            : 1.1;

    const freePowerFromBoxes = (boxesPerPoint - 1) * (isBattery ? 1.05 : 0.55);
    const reserveFlexibility = isBattery ? (1.0 + (points * 0.35)) : 0;
    const patternBonus = patternCount * (isBattery ? 0.2 : 0.12);
    const freeDotBonus = track?.hasDot === false ? 0 : (isBattery ? 0.35 : 0.18);

    return total
      + (points * (basePointValue + freePowerFromBoxes))
      + reserveFlexibility
      + patternBonus
      + freeDotBonus;
  }, 0);
}


function parseFunctionMagnitude(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => {
    const raw = String(value || '').trim();
    if (!raw) {
      return total;
    }

    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      return total + Math.max(0, numeric);
    }

    // Named function steps still have non-zero tactical value.
    return total + 0.75;
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
    const valueMagnitude = parseFunctionMagnitude(row.values);
    const free = positivePart(row.free);
    const emergency = row.emer ? 0.45 : 0;
    const enabledBonus = row.enabled === true ? 0.35 : 0;

    return total
      + (valueCount * 0.95)
      + (valueMagnitude * 0.32)
      + (free * 0.65)
      + emergency
      + enabledBonus;
  }, 0);

  const trackSupport = (positivePart(cfg?.ftl?.empty) * 0.5)
    + (positivePart(cfg?.cloak?.empty) * 0.5)
    + (cfg?.cloak?.enabled ? 1.8 : 0);

  return rowScore + trackSupport;
}

function scoreWeaponQuality(weapon) {
  const ranges = Array.isArray(weapon?.ranges) ? weapon.ranges : [];

  const rangeScore = ranges.reduce((rangeTotal, range) => {
    const span = bandSpan(range?.band);
    const dice = Array.isArray(range?.dice) ? range.dice.length : 0;
    const bonus = positivePart(range?.bonus) * 0.45;
    const color = rangeTypeWeight(String(range?.type || 'black').toLowerCase());
    return rangeTotal + ((dice + bonus) * span * color * 0.62);
  }, 0);

  const powerScore = positivePart(weapon?.powerCircles) * 0.85;
  const stopScore = (Array.isArray(weapon?.powerStops) ? weapon.powerStops.length : 0) * 0.45;
  const structureScore = positivePart(weapon?.structure) * 0.95;
  const traitScore = traitBonusScore(weapon?.traits) * 1.0;
  const specialScore = String(weapon?.special || '').trim() ? 1.3 : 0;

  return rangeScore + powerScore + stopScore + structureScore + traitScore + specialScore;
}


function effectiveMountCount(weapon) {
  const facingMounts = Array.isArray(weapon?.mountFacings) ? weapon.mountFacings.length : 0;
  const arcMounts = Array.isArray(weapon?.mountArcs) ? weapon.mountArcs.length : 0;
  const rawCount = Math.max(facingMounts, arcMounts, 1);
  return Math.min(8, rawCount);
}

function scoreWeapons(build) {
  const weapons = normalizeWeapons(build?.weapons);
  return weapons.reduce((total, weapon) => {
    const mountCount = effectiveMountCount(weapon);
    const arcCount = new Set(normalizeArcValues(weapon)).size;
    const facingScore = mountFacingScore(weapon);
    const weaponQuality = Math.pow(Math.max(0.1, scoreWeaponQuality(weapon)), 0.82);

    // Better weapons scale super-linearly when mounted more times.
    const mountScale = 0.82 + (Math.pow(mountCount, 1.2) * 0.3) + (mountCount >= 4 ? (Math.sqrt(mountCount) * 0.12) : 0);

    // Arc quality matters: forward-biased facings scale value harder than poor arcs.
    const arcQualityScale = 0.82 + (Math.pow(facingScore, 1.12) * 0.55);

    // Coverage breadth gives a smaller additive multiplier for tactical flexibility.
    const coverageScale = 0.9 + (Math.log2(Math.max(1, arcCount) + 1) * 0.22);

    return total
      + (weaponQuality * mountScale * arcQualityScale * coverageScale)
      + (mountCount * 0.28);
  }, 0);
}


function applyPointValueCurve(totalScore) {
  const base = positivePart(totalScore) * 0.082;

  // Keep modest/smaller ships from inflating too quickly.
  const lowEndCompression = base <= 30
    ? Math.pow((30 - base) / 30, 1.25) * 2.8
    : 0;

  // Push high-end capability into a higher class band.
  const classSeparationBonus = base > 40
    ? Math.pow(base - 40, 1.22) * 0.24
    : 0;

  return Math.max(2, base - lowEndCompression + classSeparationBonus);
}

export function calculatePointValue(build) {
  const contributions = {
    identity: safeRun(() => scoreIdentity(build)) * SECTION_MULTIPLIERS.identity,
    engineering: safeRun(() => scoreEngineering(build)) * SECTION_MULTIPLIERS.engineering,
    defense: safeRun(() => scoreDefense(build)) * SECTION_MULTIPLIERS.defense,
    maneuvering: safeRun(() => scoreManeuvering(build)) * SECTION_MULTIPLIERS.maneuvering,
    systemsCrew: safeRun(() => scoreSystemsAndCrew(build)) * SECTION_MULTIPLIERS.systemsCrew,
    powerTracks: safeRun(() => scorePowerTracks(build)) * SECTION_MULTIPLIERS.powerTracks,
    functions: safeRun(() => scoreFunctions(build)) * SECTION_MULTIPLIERS.functions,
    weapons: safeRun(() => scoreWeapons(build)) * SECTION_MULTIPLIERS.weapons
  };

  const total = sum(Object.values(contributions));
  const curvedTotal = applyPointValueCurve(total);
  return Math.max(2, Math.round(curvedTotal));
}
