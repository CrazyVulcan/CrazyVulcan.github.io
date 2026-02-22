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

function offenseScore(build) {
  const weapons = normalizeWeapons(build.weapons);

  const weaponScore = weapons.reduce((score, weapon) => {
    const mountCount = Math.max(1, weapon.mountArcs?.length || weapon.mountFacings?.length || 1);
    const structure = Math.max(1, num(weapon.structure));
    const ranges = Array.isArray(weapon.ranges) ? weapon.ranges : [];

    const rangeWeights = ranges.map((range) => {
      const dice = Array.isArray(range.dice) ? range.dice.length : 0;
      const bonus = Math.max(0, num(range.bonus));
      return {
        span: bandSpan(range.band),
        power: (dice + (bonus * 0.3)) * rangeTypeWeight(String(range.type || 'black').toLowerCase())
      };
    });

    const spanTotal = sum(rangeWeights.map((entry) => entry.span)) || 1;
    const weightedRangePower = sum(rangeWeights.map((entry) => entry.power * entry.span)) / spanTotal;

    const traitBonus = traitBonusScore(weapon.traits);
    const specialBonus = String(weapon.special || '').trim() ? 0.4 : 0;
    const powerDraw = num(weapon.powerCircles) * 0.2;
    const powerStops = (Array.isArray(weapon.powerStops) ? weapon.powerStops.length : 0) * 0.1;

    return score + ((mountCount * structure * weightedRangePower * 0.75) + traitBonus + specialBonus + powerDraw + powerStops);
  }, 0);

  const coordinatedBatteryBonus = Math.max(0, weapons.length - 1) * 3;
  return weaponScore + coordinatedBatteryBonus;
}

function durabilityScore(build) {
  const structure = build.structure || {};
  const shields = build.shields || {};
  const armor = build.armor || {};

  const structureTotal = num(structure.repairable) + num(structure.permanent);
  const shieldTotal = sum([shields.forward, shields.aft, shields.port, shields.starboard]);
  const armorTotal = sum([armor.forward, armor.aft, armor.port, armor.starboard]);

  return (structureTotal * 1.1) + (shieldTotal * 0.22) + (armorTotal * 0.3) + (num(build.shieldGen) * 0.9);
}

function mobilityScore(build) {
  const engineering = build.engineering || {};
  const sublight = build.sublight || {};

  const baseMobility = (num(engineering.move) * 1.1)
    + (num(engineering.vector) * 1.3)
    + (num(engineering.turn) * 0.8)
    + (num(engineering.special) * 0.75);

  const maxAcc = num(sublight.maxAccPhs) * 0.9;
  const circles = (num(sublight.greenCircles) * 0.4) + (num(sublight.redCircles) * 0.35);
  const turnFlexibility = sum(Array.isArray(sublight.turns) ? sublight.turns : []) * 0.02;
  const dmgStopControl = sum((Array.isArray(sublight.dmgStops) ? sublight.dmgStops : []).map((stop) => (stop ? 1 : 0))) * 0.35;

  return baseMobility + maxAcc + circles + turnFlexibility + dmgStopControl;
}

function systemsAndCrewScore(build) {
  const systems = Array.isArray(build.systems) ? build.systems : [];
  const crew = build.crew || {};

  const systemsValue = systems.reduce((total, entry) => total + num(entry?.value), 0);
  const systemsBreadth = systems.length * 0.5;
  const crewSupport = (num(crew.shuttleCraft) * 0.25) + (num(crew.marinesStationed) * 0.12);

  return systemsValue + systemsBreadth + crewSupport;
}

function powerAndFunctionsScore(build) {
  const tracks = Array.isArray(build.powerSystem?.tracks) ? build.powerSystem.tracks : [];
  const trackPower = tracks.reduce((total, track) => {
    const points = num(track?.points);
    const boxesPerPoint = Math.max(1, num(track?.boxesPerPoint));
    const patternBonus = (Array.isArray(track?.boxPattern) ? track.boxPattern : []).length * 0.08;
    const dotBonus = track?.hasDot === false ? 0 : 0.1;
    return total + (points * (0.7 + (boxesPerPoint * 0.12))) + patternBonus + dotBonus;
  }, 0);

  const cfg = build.functionsConfig || {};
  const rows = [cfg.accDec, cfg.sifIdf, cfg.batRech, cfg.sensor, cfg.genSys, ...(Array.isArray(cfg.weapons) ? cfg.weapons : [])];

  const functionsValue = rows.reduce((total, row) => {
    if (!row || row.enabled === false) {
      return total;
    }
    const valueCount = Array.isArray(row.values) ? row.values.length : 0;
    const free = num(row.free);
    const emergency = row.emer ? 0.35 : 0;
    return total + (valueCount * 0.55) + (free * 0.4) + emergency;
  }, 0)
    + (num(cfg.ftl?.empty) * 0.2)
    + (num(cfg.cloak?.empty) * 0.2)
    + (cfg.cloak?.enabled ? 1.2 : 0);

  return trackPower + functionsValue;
}

export function calculatePointValue(build) {
  const offense = offenseScore(build);
  const durability = durabilityScore(build);
  const mobility = mobilityScore(build);
  const systems = systemsAndCrewScore(build);
  const power = powerAndFunctionsScore(build);

  // Balanced model: every major ship section contributes to cost.
  const total = (offense * 0.7)
    + (durability * 0.95)
    + (mobility * 0.85)
    + (systems * 0.75)
    + (power * 0.8);

  // Survivability/utility floor prevents valid low-offense escorts from collapsing to 1 PV.
  const survivabilityFloor = (durability * 0.5) + (utility * 0.8) - 8;

  return Math.max(1, Math.round(Math.max(total, survivabilityFloor)));
}
