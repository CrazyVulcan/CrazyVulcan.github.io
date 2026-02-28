function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + num(value), 0);
}

function rangeTypeWeight(type) {
  if (type === 'green') {
    return 1.1;
  }
  if (type === 'black') {
    return 1;
  }
  if (type === 'blue') {
    return 0.9;
  }
  // Keep support for legacy color tags.
  if (type === 'red') {
    return 1.05;
  }
  if (type === 'yellow') {
    return 1.02;
  }
  return 1;
}

function diceColorWeight(symbol) {
  const normalized = String(symbol || '').trim().toUpperCase();
  if (normalized === 'R') {
    return 2.5;
  }
  if (normalized === 'Y') {
    return 1.5;
  }
  if (normalized === 'G') {
    return 1;
  }
  if (normalized === 'B') {
    return 0.5;
  }
  return 1;
}

function bandMax(rawBand) {
  const [start, end] = String(rawBand || '')
    .split('-')
    .map((part) => Number(part.trim()));

  if (Number.isFinite(start) && Number.isFinite(end)) {
    return Math.max(start, end);
  }

  if (Number.isFinite(start)) {
    return start;
  }

  if (Number.isFinite(end)) {
    return end;
  }

  return 8;
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
  if (arc === 1 || arc === 2) {
    return 1.35; // strongest firing arcs
  }
  if (arc === 3) {
    return 1.18;
  }
  if (arc === 4 || arc === 8) {
    return 1.0;
  }
  if (arc === 5) {
    return 0.9;
  }
  if (arc === 6 || arc === 7) {
    return 0.7; // weakest firing arcs
  }
  return 1;
}

function mountFacingScore(weapon) {
  const arcs = [...new Set(normalizeArcValues(weapon))];
  const summedFacing = sum(arcs.map((arc) => arcFacingWeight(arc)));
  return summedFacing / Math.max(1, arcs.length);
}

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

const PV_RANKING_BASELINE = {
  rankIdentityFields: 0,
  rankEngineeringMove: 0.65,
  rankEngineeringVector: 0.7,
  rankEngineeringTurn: 0.6,
  rankEngineeringSpecial: 0.75,
  rankDefenseShields: 0.42,
  rankDefenseArmor: 0.4,
  rankDefenseRepairable: 0.3,
  rankDefensePermanent: 0.28,
  rankDefenseShieldGen: 0.45,
  rankManeuverMaxAcc: 0.65,
  rankManeuverGreen: 0.5,
  rankManeuverRed: 0.45,
  rankManeuverTurnProfile: 0.35,
  rankManeuverDmgStops: 0.55,
  rankSystemsValues: 0.55,
  rankSystemsBreadth: 0.45,
  rankCrewShuttle: 0.6,
  rankCrewMarines: 0.45,
  rankPowerPoints: 0.5,
  rankPowerBoxes: 0.45,
  rankPowerReserve: 0.5,
  rankPowerPattern: 0.4,
  rankFunctionsValues: 0.65,
  rankFunctionsFree: 0.6,
  rankFunctionsState: 0.6,
  rankFunctionsTrackSupport: 0.7,
  rankWeaponsRange: 0.42,
  rankWeaponsPower: 0.5,
  rankWeaponsStructure: 0.45,
  rankWeaponsTraitsSpecial: 0.6,
  rankWeaponsMountArc: 0.4,
  rankGlobalScale: 0.2
};

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

function rank(build, key) {
  const baseline = Number(PV_RANKING_BASELINE[key]);
  return Number.isFinite(baseline) ? Math.max(0, baseline) : 1;
}


function scoreIdentity(build) {
  const identity = build?.identity || {};
  const filled = [identity.name, identity.classType, identity.faction, identity.era]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .length;
  return (filled * 0.15) * rank(build, 'rankIdentityFields');
}

function scoreEngineering(build) {
  const engineering = build?.engineering || {};
  return (positivePart(engineering.move) * 1.4 * rank(build, 'rankEngineeringMove'))
    + (positivePart(engineering.vector) * 1.5 * rank(build, 'rankEngineeringVector'))
    + (positivePart(engineering.turn) * 1.2 * rank(build, 'rankEngineeringTurn'))
    + (positivePart(engineering.special) * 1.1 * rank(build, 'rankEngineeringSpecial'));
}

function scoreDefense(build) {
  const shields = build?.shields || {};
  const armor = build?.armor || {};
  const structure = build?.structure || {};

  const repairable = positivePart(structure.repairable);
  const permanent = positivePart(structure.permanent);
  const totalStructure = repairable + permanent;

  const shieldScore = sum([shields.forward, shields.aft, shields.port, shields.starboard])
    * 0.58 * rank(build, 'rankDefenseShields');
  const armorScore = sum([armor.forward, armor.aft, armor.port, armor.starboard])
    * 0.82 * rank(build, 'rankDefenseArmor');

  const repairableScore = (
    (repairable * 1.4)
    + (Math.pow(repairable, 1.45) * 0.62)
    + (Math.pow(repairable, 1.55) * 1.9)
  ) * rank(build, 'rankDefenseRepairable');

  const permanentScore = (
    (permanent * 1.4)
    + (Math.pow(permanent, 1.35) * 1.2)
  ) * rank(build, 'rankDefensePermanent');

  const durabilitySynergy = ((Math.sqrt(totalStructure) * 0.35)
    * (sum([shields.forward, shields.aft, shields.port, shields.starboard]) * 0.05))
    * ((rank(build, 'rankDefenseRepairable') + rank(build, 'rankDefensePermanent')) / 2);

  const generatorScore = positivePart(build?.shieldGen) * 1.3 * rank(build, 'rankDefenseShieldGen');

  return shieldScore + armorScore + repairableScore + permanentScore + durabilitySynergy + generatorScore;
}

function scoreManeuvering(build) {
  const sublight = build?.sublight || {};
  const turnScore = sum(Array.isArray(sublight.turns) ? sublight.turns : []) * 0.03 * rank(build, 'rankManeuverTurnProfile');
  const dmgStopScore = sum((Array.isArray(sublight.dmgStops) ? sublight.dmgStops : []).map((stop) => (stop ? 1 : 0)))
    * 0.5 * rank(build, 'rankManeuverDmgStops');
  return (positivePart(sublight.maxAccPhs) * 1.15 * rank(build, 'rankManeuverMaxAcc'))
    + (positivePart(sublight.greenCircles) * 0.62 * rank(build, 'rankManeuverGreen'))
    + (positivePart(sublight.redCircles) * 0.58 * rank(build, 'rankManeuverRed'))
    + turnScore
    + dmgStopScore;
}

function scoreSystemsAndCrew(build) {
  const systems = Array.isArray(build?.systems) ? build.systems : [];
  const crew = build?.crew || {};

  const systemsValue = systems.reduce((total, entry) => total + positivePart(entry?.value), 0) * rank(build, 'rankSystemsValues');
  const systemsBreadth = systems.length * 0.45 * rank(build, 'rankSystemsBreadth');
  const crewScore = (positivePart(crew.shuttleCraft) * 0.42 * rank(build, 'rankCrewShuttle'))
    + (positivePart(crew.marinesStationed) * 0.22 * rank(build, 'rankCrewMarines'));

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

    return total
      + (points * (basePointValue + freePowerFromBoxes) * rank(build, 'rankPowerPoints'))
      + (freePowerFromBoxes * rank(build, 'rankPowerBoxes'))
      + (reserveFlexibility * rank(build, 'rankPowerReserve'))
      + (patternBonus * rank(build, 'rankPowerPattern'));
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
      + ((valueCount * 0.95 + valueMagnitude * 0.32) * rank(build, 'rankFunctionsValues'))
      + (free * 0.65 * rank(build, 'rankFunctionsFree'))
      + ((emergency + enabledBonus) * rank(build, 'rankFunctionsState'));
  }, 0);

  const trackSupport = ((positivePart(cfg?.ftl?.empty) * 0.5)
    + (positivePart(cfg?.cloak?.empty) * 0.5)
    + (cfg?.cloak?.enabled ? 1.8 : 0)) * rank(build, 'rankFunctionsTrackSupport');

  return rowScore + trackSupport;
}

function scoreWeaponQuality(weapon, build) {
  const ranges = Array.isArray(weapon?.ranges) ? weapon.ranges : [];

  const rangeScore = ranges.reduce((rangeTotal, range) => {
    const diceScore = sum((Array.isArray(range?.dice) ? range.dice : []).map((die) => diceColorWeight(die)));
    const bonus = positivePart(range?.bonus);
    const rangeType = rangeTypeWeight(String(range?.type || 'black').toLowerCase());
    const maxDistance = bandMax(range?.band);
    const distanceFactor = Math.max(0.45, maxDistance / 8);
    return rangeTotal + ((diceScore + bonus) * rangeType * distanceFactor);
  }, 0);

  const powerCircles = Math.max(1, positivePart(weapon?.powerCircles, 1));
  const stopCount = Array.isArray(weapon?.powerStops) ? weapon.powerStops.length : 0;

  // Baseline is 2 circles = 100% mount value impact.
  // 1 circle is a surcharge (more expensive), while 3+ circles apply
  // progressively larger discounts.
  const circleAdjustment = powerCircles <= 2
    ? (2 - powerCircles) * 2.4
    : -Array.from({ length: powerCircles - 2 }, (_, index) => 1.05 + (index * 0.45)).reduce((a, b) => a + b, 0);

  // Stops always discount and each additional stop discounts more than a circle step.
  const stopDiscount = -Array.from({ length: stopCount }, (_, index) => 1.45 + (index * 0.65)).reduce((a, b) => a + b, 0);

  const powerScoreRaw = (circleAdjustment + stopDiscount) * rank(build, 'rankWeaponsPower');
  const structureScore = positivePart(weapon?.structure) * 0.35;

  const baseWeaponValue = (rangeScore * 1.35 * rank(build, 'rankWeaponsRange'))
    + (structureScore * rank(build, 'rankWeaponsStructure'));

  // Discounts can be substantial, but never reduce a mount below 50% of base value.
  const maxDiscount = baseWeaponValue * 0.5;
  const powerScore = powerScoreRaw < 0
    ? Math.max(powerScoreRaw, -maxDiscount)
    : powerScoreRaw;

  return baseWeaponValue + powerScore;
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
    const arcWeight = 0.12 + (mountFacingScore(weapon) * rank(build, 'rankWeaponsMountArc'));
    const weaponQuality = Math.max(0, scoreWeaponQuality(weapon, build));
    const singleMountValue = weaponQuality * arcWeight;
    return total + (singleMountValue * mountCount);
  }, 0);
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

  const totalScore = sum(Object.values(contributions)) * rank(build, 'rankGlobalScale');
  return Math.max(1, Math.round(totalScore));
}
