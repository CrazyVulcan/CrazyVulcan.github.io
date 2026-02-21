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

function offenseScore(build) {
  const weapons = normalizeWeapons(build.weapons);

  return weapons.reduce((score, weapon) => {
    const mountCount = Math.max(1, weapon.mountArcs?.length || weapon.mountFacings?.length || 1);
    const structure = Math.max(1, num(weapon.structure));
    const ranges = Array.isArray(weapon.ranges) ? weapon.ranges : [];

    const rangeWeights = ranges.map((range) => {
      const dice = Array.isArray(range.dice) ? range.dice.length : 0;
      const bonus = Math.max(0, num(range.bonus));
      const rawPower = (dice + (bonus * 0.3)) * rangeTypeWeight(String(range.type || 'black').toLowerCase());
      return {
        span: bandSpan(range.band),
        power: rawPower
      };
    });

    const spanTotal = sum(rangeWeights.map((entry) => entry.span)) || 1;
    const weightedRangePower = sum(rangeWeights.map((entry) => entry.power * entry.span)) / spanTotal;

    const traitCount = Array.isArray(weapon.traits) ? weapon.traits.length : 0;
    const traitBonus = traitCount * 0.18;
    const specialBonus = String(weapon.special || '').trim() ? 0.3 : 0;
    const powerReqBonus = num(weapon.powerCircles) * 0.08;

    return score + ((mountCount * structure * weightedRangePower * 0.62) + traitBonus + specialBonus + powerReqBonus);
  }, 0);
}

function durabilityScore(build) {
  const structure = build.structure || {};
  const shields = build.shields || {};
  const armor = build.armor || {};

  const structureTotal = num(structure.repairable) + num(structure.permanent);
  const shieldTotal = sum([shields.forward, shields.aft, shields.port, shields.starboard]);
  const armorTotal = sum([armor.forward, armor.aft, armor.port, armor.starboard]);

  return (structureTotal * 1.4) + (shieldTotal * 0.18) + (armorTotal * 0.24) + (num(build.shieldGen) * 1.1);
}

function mobilityAndSystemsScore(build) {
  const engineering = build.engineering || {};
  const systems = Array.isArray(build.systems) ? build.systems : [];
  const crew = build.crew || {};

  const mobility = (num(engineering.move) * 0.7)
    + (num(engineering.vector) * 0.9)
    + (num(engineering.turn) * 0.45)
    + (num(engineering.special) * 0.4);

  const systemDepth = systems.length * 0.35;
  const crewSupport = (num(crew.shuttleCraft) * 0.08) + (num(crew.marinesStationed) * 0.04);

  return mobility + systemDepth + crewSupport;
}

export function calculatePointValue(build) {
  const offense = offenseScore(build);
  const durability = durabilityScore(build);
  const utility = mobilityAndSystemsScore(build);

  // Core philosophy: value sustained combat pressure over burst.
  // A ship that keeps firing while absorbing return fire scales faster than linearly.
  const sustainedCombatPressure = offense * (1 + (durability / 50));

  // Calibrated targets:
  // - Yorktown II baseline remains in the 25-35 PV band.
  // - Yorktown V advanced fit lands in the 75-80 PV band.
  const total = -30 + sustainedCombatPressure + (utility * 0.2);

  return Math.max(1, Math.round(total));
}
