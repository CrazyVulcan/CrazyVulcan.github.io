import { renderShipSheetSVG } from './ship-sheet-svg.js';

const sheetHost = document.getElementById('printSheet');

function loadBuild() {
  try {
    const raw = sessionStorage.getItem('sfCommanderPrintBuild');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const build = loadBuild();

if (build) {
  renderShipSheetSVG(sheetHost, build, { width: '10.5in' });
} else {
  sheetHost.textContent = 'No ship sheet data available. Open this page from the editor print button.';
}
