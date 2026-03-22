import { SHEET_LAYOUT } from './sheet-layout.js';

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}, text = null) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  });
  if (text !== null) node.textContent = text;
  return node;
}

function clampText(value, max = 36) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;
}

function panel(svg, cfg, title) {
  const g = el('g');
  g.appendChild(el('rect', { x: cfg.x, y: cfg.y, width: cfg.w, height: cfg.h, fill: '#f2f2f2', stroke: '#111', 'stroke-width': 2 }));
  if (title) {
    g.appendChild(el('rect', { x: cfg.x, y: cfg.y, width: cfg.w, height: cfg.titleBarH || 24, fill: SHEET_LAYOUT.colors.green, stroke: '#0d6a3f', 'stroke-width': 1.5 }));
    g.appendChild(el('text', { x: cfg.x + 8, y: cfg.y + 17, 'font-family': 'Arial, Helvetica, sans-serif', 'font-size': 13, 'font-weight': 700, fill: '#fff' }, title));
  }
  svg.appendChild(g);
  return g;
}

function checkboxTrack(g, x, y, count, size, gap, stroke = '#111') {
  for (let i = 0; i < count; i += 1) {
    g.appendChild(el('rect', { x: x + i * (size + gap), y, width: size, height: size, fill: 'none', stroke, 'stroke-width': 1.5 }));
  }
}

function circleTrack(g, x, y, count, radius, gap, color = '#10a85c') {
  for (let i = 0; i < count; i += 1) {
    g.appendChild(el('circle', { cx: x + radius + i * (radius * 2 + gap), cy: y + radius, r: radius, fill: 'none', stroke: color, 'stroke-width': 1.5 }));
  }
}

function drawWeapons(svg, build) {
  const p = SHEET_LAYOUT.weaponsPanel;
  const slotH = p.slotH;
  const weapons = Array.isArray(build.weapons) ? build.weapons.slice(0, 4) : [];
  const wpnPower = Array.isArray(build.functionsConfig?.weapons) ? build.functionsConfig.weapons : [];

  weapons.forEach((weapon, idx) => {
    const enabled = Boolean(wpnPower[idx]?.enabled ?? true);
    const y = p.y + idx * (slotH + p.slotGap);
    const g = el('g');
    g.appendChild(el('rect', { x: p.x, y, width: p.w, height: slotH, fill: '#f5f5f5', stroke: '#111', 'stroke-width': 1.6 }));
    g.appendChild(el('rect', { x: p.x, y, width: p.w, height: 22, fill: '#17a8df', stroke: '#0c79b4', 'stroke-width': 1.2 }));
    g.appendChild(el('text', { x: p.x + 7, y: y + 15, 'font-size': 12, 'font-family': 'Arial, sans-serif', 'font-weight': 700, fill: '#fff' }, clampText(weapon?.name || `WPN ${String.fromCharCode(65 + idx)}`, 26)));

    if (enabled && weapon?.name) {
      const ranges = Array.isArray(weapon.ranges) ? weapon.ranges.slice(0, 4) : [];
      ranges.forEach((range, rIdx) => {
        const ry = y + 30 + rIdx * 24;
        const color = range.type === 'green' ? '#12aa52' : range.type === 'red' ? '#d32f2f' : '#111';
        g.appendChild(el('text', { x: p.x + 8, y: ry + 10, 'font-size': 10, 'font-family': 'Arial, sans-serif', fill: color, 'font-weight': 700 }, clampText(range.band || '?', 10)));
        const dice = Array.isArray(range.dice) ? range.dice.slice(0, 6).join(' ') : '';
        g.appendChild(el('text', { x: p.x + 78, y: ry + 10, 'font-size': 10, 'font-family': 'Arial, sans-serif', fill: '#111' }, dice));
        checkboxTrack(g, p.x + 150, ry, Math.max(1, Number(weapon.structure || 1)), 9, 3, '#444');
      });
      if (weapon.special && String(weapon.special).trim()) {
        g.appendChild(el('text', { x: p.x + 8, y: y + slotH - 10, 'font-size': 9, 'font-family': 'Arial, sans-serif', fill: '#222' }, `SPECIAL: ${clampText(weapon.special, 30)}`));
      }
    }
    svg.appendChild(g);
  });
}

export function createShipSheetSVG(build, options = {}) {
  const layout = SHEET_LAYOUT;
  const { width, height } = layout.artboard;
  const svg = el('svg', {
    xmlns: NS,
    viewBox: `0 0 ${width} ${height}`,
    width: options.width || '100%',
    height: options.height || '100%',
    role: 'img',
    'aria-label': 'Starforce Commander ship sheet'
  });

  svg.appendChild(el('rect', { x: 0, y: 0, width, height, fill: layout.colors.pageBg }));
  svg.appendChild(el('rect', { x: layout.frame.x, y: layout.frame.y, width: layout.frame.w, height: layout.frame.h, fill: 'none', stroke: layout.colors.frame, 'stroke-width': layout.frame.stroke }));

  svg.appendChild(el('rect', { x: layout.title.shipBar.x, y: layout.title.shipBar.y, width: layout.title.shipBar.w, height: layout.title.shipBar.h, fill: '#c8d5e3', stroke: '#0e3f8c', 'stroke-width': 2 }));
  svg.appendChild(el('rect', { x: layout.title.classBar.x, y: layout.title.classBar.y, width: layout.title.classBar.w, height: layout.title.classBar.h, fill: 'none' }));
  svg.appendChild(el('text', { x: layout.title.shipBar.x + layout.title.shipBar.w / 2, y: layout.title.shipBar.y + 30, 'text-anchor': 'middle', 'font-family': 'Arial Black, Arial, sans-serif', 'font-size': 19, 'font-weight': 900, fill: '#364f63' }, clampText(build.identity?.name || 'SHIP NAME / ID', 34)));
  svg.appendChild(el('text', { x: layout.title.classBar.x + layout.title.classBar.w - 6, y: layout.title.classBar.y + 30, 'text-anchor': 'end', 'font-family': 'Arial Black, Arial, sans-serif', 'font-size': 17, 'font-weight': 900, fill: '#111' }, clampText(build.identity?.classType || '', 50)));

  const leftHeader = layout.engineering.header;
  svg.appendChild(el('rect', { x: leftHeader.x, y: leftHeader.y, width: leftHeader.w, height: leftHeader.h, fill: layout.colors.panelHeader, stroke: '#111', 'stroke-width': 2 }));
  svg.appendChild(el('text', { x: leftHeader.x + leftHeader.w / 2, y: leftHeader.y + 20, 'text-anchor': 'middle', 'font-size': 15, 'font-family': 'Arial, sans-serif', 'font-weight': 700, fill: layout.colors.panelHeaderText }, 'ENGINEERING'));

  const statRow = layout.engineering.statRow;
  const stats = [build.engineering?.move, build.engineering?.vector, build.engineering?.turn, build.engineering?.special, 'PWR', 'BAT'];
  const statW = statRow.w / stats.length;
  stats.forEach((stat, idx) => {
    svg.appendChild(el('rect', { x: statRow.x + idx * statW, y: statRow.y, width: statW - 2, height: statRow.h, fill: '#566674', stroke: '#eee', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: statRow.x + idx * statW + (statW - 2) / 2, y: statRow.y + 25, 'text-anchor': 'middle', 'font-size': 16, 'font-family': 'Arial Black, Arial, sans-serif', fill: idx > 3 ? '#111' : '#fff' }, String(stat ?? 0)));
  });

  const fnPanel = panel(svg, layout.functionsPanel, 'FUNCTIONS  /  POWER LEVEL');
  const fnRows = [];
  const cfg = build.functionsConfig || {};
  fnRows.push(['ACC/DEC', cfg.accDec?.values || []]);
  fnRows.push(['SIF/IDF', cfg.sifIdf?.values || []]);
  fnRows.push(['FTL', Array.from({ length: Number(cfg.ftl?.empty || 0) }).map(() => '○')]);
  if (cfg.cloak?.enabled) fnRows.push(['CLOAK', Array.from({ length: Number(cfg.cloak?.empty || 0) }).map(() => '○')]);
  fnRows.push(['SENSOR', cfg.sensor?.values || []]);
  fnRows.push(['GEN SYS', cfg.genSys?.values || []]);
  (cfg.weapons || []).forEach((weapon) => {
    if (weapon?.enabled && Array.isArray(weapon.values) && weapon.values.length) fnRows.push([weapon.label || 'WPN', weapon.values]);
  });

  fnRows.slice(0, 11).forEach(([label, values], idx) => {
    const y = layout.functionsPanel.lineStartY + idx * layout.functionsPanel.lineStep;
    fnPanel.appendChild(el('text', { x: layout.functionsPanel.x + 10, y, 'font-size': 12, 'font-family': 'Arial, sans-serif', 'font-weight': 700 }, label));
    fnPanel.appendChild(el('text', { x: layout.functionsPanel.x + 145, y, 'font-size': 11, 'font-family': 'Arial, sans-serif' }, values.map((value) => String(value)).join('  ')));
  });

  const powerPanel = panel(svg, layout.powerPanel, 'POWER SYSTEM');
  const tracks = Array.isArray(build.powerSystem?.tracks) ? build.powerSystem.tracks.filter((t) => Number(t.points) > 0) : [];
  tracks.slice(0, 7).forEach((track, idx) => {
    const y = layout.powerPanel.rowStartY + idx * layout.powerPanel.rowStep;
    powerPanel.appendChild(el('text', { x: layout.powerPanel.x + 8, y, 'font-size': 11, 'font-family': 'Arial, sans-serif', 'font-weight': 700 }, clampText(track.label || track.key, 12)));
    checkboxTrack(powerPanel, layout.powerPanel.x + 120, y - 10, Number(track.points || 0), 10, 4);
  });

  const man = panel(svg, layout.maneuverPanel, 'SUBLIGHT DRIVE AND MANEUVERING');
  const sub = build.sublight || {};
  man.appendChild(el('text', { x: layout.maneuverPanel.x + 8, y: layout.maneuverPanel.y + 42, 'font-size': 12, 'font-family': 'Arial, sans-serif' }, `MAX ACC / PHS: ${Number(sub.maxAccPhs || 0)}`));
  circleTrack(man, layout.maneuverPanel.x + 170, layout.maneuverPanel.y + 32, Number(sub.greenCircles || 0), 5, 4, '#10a85c');
  circleTrack(man, layout.maneuverPanel.x + 255, layout.maneuverPanel.y + 32, Number(sub.redCircles || 0), 5, 4, '#d32f2f');
  const spd = Array.isArray(sub.spd) ? sub.spd : [6, 5, 4, 3, 2, 1, 0];
  const turns = Array.isArray(sub.turns) ? sub.turns : [20, 20, 20, 20, 20, 20, 20];
  man.appendChild(el('text', { x: layout.maneuverPanel.x + 8, y: layout.maneuverPanel.y + 72, 'font-size': 11, 'font-family': 'Arial, sans-serif', 'font-weight': 700 }, 'SPD:'));
  man.appendChild(el('text', { x: layout.maneuverPanel.x + 56, y: layout.maneuverPanel.y + 72, 'font-size': 11, 'font-family': 'Arial, sans-serif' }, spd.slice(0, 7).join('  ')));
  man.appendChild(el('text', { x: layout.maneuverPanel.x + 8, y: layout.maneuverPanel.y + 96, 'font-size': 11, 'font-family': 'Arial, sans-serif', 'font-weight': 700 }, 'TURN:'));
  man.appendChild(el('text', { x: layout.maneuverPanel.x + 56, y: layout.maneuverPanel.y + 96, 'font-size': 11, 'font-family': 'Arial, sans-serif' }, turns.slice(0, 7).join('  ')));

  const shieldHeader = layout.shieldPanel.header;
  svg.appendChild(el('rect', { x: shieldHeader.x, y: shieldHeader.y, width: shieldHeader.w, height: shieldHeader.h, fill: layout.colors.panelHeader, stroke: '#111', 'stroke-width': 2 }));
  svg.appendChild(el('text', { x: shieldHeader.x + shieldHeader.w / 2, y: shieldHeader.y + 20, 'text-anchor': 'middle', 'font-size': 15, 'font-family': 'Arial, sans-serif', 'font-weight': 700, fill: '#fff' }, 'SHIELDS'));

  const shieldBody = layout.shieldPanel.body;
  const sg = el('g');
  sg.appendChild(el('rect', { x: shieldBody.x, y: shieldBody.y, width: shieldBody.w, height: shieldBody.h, fill: '#14a7de', stroke: '#10a5df', 'stroke-width': 2 }));
  sg.appendChild(el('rect', { x: shieldBody.x + 14, y: shieldBody.y + 44, width: shieldBody.w - 28, height: shieldBody.h - 88, fill: '#ececec', stroke: '#10a5df', 'stroke-width': 2 }));
  sg.appendChild(el('text', { x: shieldBody.x + shieldBody.w / 2, y: shieldBody.y + 24, 'text-anchor': 'middle', 'font-size': 15, 'font-family': 'Arial, sans-serif', 'font-weight': 700, fill: '#fff' }, `FWD SHIELD ${build.shields?.forward ?? 0}`));
  sg.appendChild(el('text', { x: shieldBody.x + shieldBody.w / 2, y: shieldBody.y + shieldBody.h - 14, 'text-anchor': 'middle', 'font-size': 15, 'font-family': 'Arial, sans-serif', 'font-weight': 700, fill: '#fff' }, `AFT SHIELD ${build.shields?.aft ?? 0}`));

  checkboxTrack(sg, shieldBody.x + 90, shieldBody.y + 58, Number(build.shields?.forward || 0), 10, 4, '#08a8df');
  checkboxTrack(sg, shieldBody.x + 90, shieldBody.y + shieldBody.h - 72, Number(build.shields?.aft || 0), 10, 4, '#08a8df');
  checkboxTrack(sg, shieldBody.x + 34, shieldBody.y + 130, Number(build.shields?.port || 0), 10, 4, '#08a8df');
  checkboxTrack(sg, shieldBody.x + shieldBody.w - 34 - (Number(build.shields?.starboard || 0) * 14), shieldBody.y + 130, Number(build.shields?.starboard || 0), 10, 4, '#08a8df');

  const art = layout.shieldPanel.centerArt;
  if (build.shipArtDataUrl) {
    sg.appendChild(el('image', { x: art.x, y: art.y, width: art.w, height: art.h, href: build.shipArtDataUrl, preserveAspectRatio: 'xMidYMid meet' }));
  } else {
    sg.appendChild(el('ellipse', { cx: art.x + art.w / 2, cy: art.y + art.h / 2, rx: art.w / 2, ry: art.h / 3, fill: '#dadada', stroke: '#888', 'stroke-width': 2 }));
  }
  svg.appendChild(sg);

  const systems = panel(svg, layout.systemsPanel, 'SYSTEMS');
  const rows = Array.isArray(build.systems) ? build.systems : [];
  rows.slice(0, 8).forEach((entry, idx) => {
    const y = layout.systemsPanel.y + 44 + idx * 18;
    systems.appendChild(el('text', { x: layout.systemsPanel.x + 8, y, 'font-size': 11, 'font-family': 'Arial, sans-serif', 'font-weight': 700 }, clampText(entry.key || '', 5).toUpperCase()));
    checkboxTrack(systems, layout.systemsPanel.x + 60, y - 10, Number(entry.value || 0), 10, 3);
  });
  systems.appendChild(el('text', { x: layout.systemsPanel.x + 250, y: layout.systemsPanel.y + 56, 'font-size': 11, 'font-family': 'Arial, sans-serif' }, `SHTL ${Number(build.crew?.shuttleCraft || 0)}`));
  systems.appendChild(el('text', { x: layout.systemsPanel.x + 250, y: layout.systemsPanel.y + 78, 'font-size': 11, 'font-family': 'Arial, sans-serif' }, `MAR ${Number(build.crew?.marinesStationed || 0)}`));

  const wHeader = layout.weaponsPanel.header;
  svg.appendChild(el('rect', { x: wHeader.x, y: wHeader.y, width: wHeader.w, height: wHeader.h, fill: layout.colors.panelHeader, stroke: '#111', 'stroke-width': 2 }));
  svg.appendChild(el('text', { x: wHeader.x + wHeader.w / 2, y: wHeader.y + 20, 'text-anchor': 'middle', 'font-size': 15, 'font-family': 'Arial, sans-serif', 'font-weight': 700, fill: '#fff' }, 'WEAPONS'));
  drawWeapons(svg, build);

  const footer = layout.structureFooter;
  svg.appendChild(el('rect', { x: footer.x, y: footer.y, width: footer.w, height: footer.h, fill: '#c8d5e3', stroke: '#0e3f8c', 'stroke-width': 2 }));
  svg.appendChild(el('text', { x: footer.x + 10, y: footer.y + 29, 'font-size': 17, 'font-family': 'Arial Black, Arial, sans-serif', 'font-weight': 900 }, 'STRUCTURE'));

  const repairable = Math.max(0, Number(build.structure?.repairable || 0));
  const permanent = Math.max(0, Number(build.structure?.permanent || 0));
  const total = repairable + permanent;
  for (let i = 0; i < total; i += 1) {
    svg.appendChild(el('rect', {
      x: footer.trackStartX + i * 17,
      y: footer.y + 14,
      width: 12,
      height: 16,
      fill: 'none',
      stroke: i < repairable ? '#111' : '#d32f2f',
      'stroke-width': 1.6
    }));
  }

  svg.appendChild(el('text', { x: footer.tagX, y: footer.y + 19, 'font-size': 11, 'font-family': 'Arial, sans-serif', 'text-anchor': 'middle' }, clampText(build.identity?.faction || '/', 12)));
  svg.appendChild(el('text', { x: footer.tagX + 72, y: footer.y + 19, 'font-size': 11, 'font-family': 'Arial, sans-serif', 'text-anchor': 'middle' }, `${Number(build.identity?.pointValue || 0)}PV`));
  svg.appendChild(el('text', { x: footer.tagX + 142, y: footer.y + 19, 'font-size': 11, 'font-family': 'Arial, sans-serif', 'text-anchor': 'middle' }, clampText(build.identity?.era || '/', 10)));

  return svg;
}

export function renderShipSheetSVG(container, build, options = {}) {
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(createShipSheetSVG(build, options));
}
