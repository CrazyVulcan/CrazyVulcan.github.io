export const SHEET_LAYOUT = {
  // Canonical SVG coordinate system for one sheet artboard.
  artboard: {
    width: 1100,
    height: 850,
    letterWidthIn: 11,
    letterHeightIn: 8.5,
    printMarginIn: 0.25
  },
  colors: {
    frame: '#0b71ba',
    panelHeader: '#566674',
    panelHeaderText: '#f6f7f8',
    pageBg: '#d9d9d9',
    white: '#ffffff',
    ink: '#0a1723',
    green: '#10a85c',
    shieldBlue: '#14a7de',
    muted: '#33495c',
    red: '#d32f2f'
  },
  // Global frame and identity/title bars.
  frame: { x: 20, y: 20, w: 1060, h: 810, stroke: 4 },
  title: {
    shipBar: { x: 80, y: 38, w: 400, h: 46 },
    classBar: { x: 500, y: 38, w: 520, h: 46 }
  },
  // Main body columns.
  columns: {
    y: 100,
    h: 660,
    left: { x: 34, w: 456 },
    middle: { x: 500, w: 336 },
    right: { x: 846, w: 220 }
  },
  engineering: {
    header: { x: 34, y: 100, w: 456, h: 28 },
    statRow: { x: 34, y: 132, w: 456, h: 38 }
  },
  functionsPanel: {
    x: 34, y: 176, w: 456, h: 220,
    titleBarH: 24,
    lineStartY: 210,
    lineStep: 18
  },
  powerPanel: {
    x: 34, y: 406, w: 456, h: 128,
    titleBarH: 24,
    rowStartY: 438,
    rowStep: 16
  },
  maneuverPanel: {
    x: 34, y: 540, w: 456, h: 220,
    titleBarH: 24
  },
  shieldPanel: {
    header: { x: 500, y: 100, w: 336, h: 28 },
    body: { x: 500, y: 132, w: 336, h: 420 },
    centerArt: { x: 592, y: 250, w: 150, h: 170 }
  },
  systemsPanel: {
    x: 500, y: 560, w: 336, h: 200,
    titleBarH: 24
  },
  weaponsPanel: {
    header: { x: 846, y: 100, w: 220, h: 28 },
    x: 846, y: 132, w: 220, h: 628,
    slotH: 148,
    slotGap: 10
  },
  structureFooter: {
    x: 34, y: 770, w: 1032, h: 46,
    trackStartX: 180,
    tagX: 830
  }
};
