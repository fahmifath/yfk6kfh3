// @ts-check

import {
  addChore, removeChore, selectRandomChore,
  assignSegmentColor, formatChoreCount, loadChores, saveChores
} from './core.js';

// ==== STATE ====

/** @type {import('./core.js').Chore[]} */
let chores = [];
let isSpinning = false;

// ==== CACHED ELEMENTS ====

/** @type {HTMLFormElement|null} */ let addForm = null;
/** @type {HTMLInputElement|null} */ let choreInput = null;
/** @type {HTMLButtonElement|null} */ let spinBtn = null;
/** @type {HTMLDivElement|null} */ let resultDisplay = null;
/** @type {HTMLUListElement|null} */ let choreList = null;
/** @type {HTMLHeadingElement|null} */ let choreCountEl = null;
/** @type {HTMLDivElement|null} */ let errorDisplay = null;
/** @type {SVGElement|null} */ let wheel = null;
/** @type {SVGGElement|null} */ let wheelSegments = null;

/** @returns {boolean} */
function cacheElements() {
  addForm        = /** @type {HTMLFormElement|null} */    (document.getElementById('add-form'));
  choreInput     = /** @type {HTMLInputElement|null} */   (document.getElementById('chore-input'));
  spinBtn        = /** @type {HTMLButtonElement|null} */  (document.getElementById('spin-btn'));
  resultDisplay  = /** @type {HTMLDivElement|null} */     (document.getElementById('result'));
  choreList      = /** @type {HTMLUListElement|null} */   (document.getElementById('chore-list'));
  choreCountEl   = /** @type {HTMLHeadingElement|null} */ (document.getElementById('chore-count'));
  errorDisplay   = /** @type {HTMLDivElement|null} */     (document.getElementById('chore-error'));
  wheel          = /** @type {SVGElement|null} */         (document.getElementById('wheel'));
  wheelSegments  = /** @type {SVGGElement|null} */        (document.getElementById('wheel-segments'));
  return !!(addForm && choreInput && spinBtn && resultDisplay &&
    choreList && choreCountEl && errorDisplay && wheel && wheelSegments);
}

// ==== RENDER ====

/** @param {string} msg */
function showError(msg) { if (errorDisplay) errorDisplay.textContent = msg; }

function clearError() { if (errorDisplay) errorDisplay.textContent = ''; }

/** @param {string|null} name */
function displayResult(name) {
  if (!resultDisplay) return;
  if (name) {
    resultDisplay.textContent = `Tonight's chore: ${name}`;
    resultDisplay.classList.add('winner');
  } else {
    resultDisplay.textContent = 'Spin to assign a chore!';
    resultDisplay.classList.remove('winner');
  }
}

function renderChoreList() {
  if (!choreList || !choreCountEl) return;
  choreList.innerHTML = '';
  choreCountEl.textContent = formatChoreCount(chores.length);
  chores.forEach(chore => {
    const li = document.createElement('li');
    li.className = 'chore-item';
    const span = document.createElement('span');
    span.className = 'chore-name';
    span.textContent = chore.name;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-remove';
    btn.textContent = '✕';
    btn.setAttribute('data-remove', chore.id);
    btn.setAttribute('aria-label', `Remove ${chore.name}`);
    li.appendChild(span);
    li.appendChild(btn);
    if (choreList) choreList.appendChild(li);
  });
}

const NS = 'http://www.w3.org/2000/svg';
const toRad = (/** @type {number} */ deg) => (deg - 90) * Math.PI / 180;

/**
 * @param {number} startAngle
 * @param {number} endAngle
 * @param {string} color
 * @param {string} label
 * @returns {SVGGElement}
 */
function createSegment(startAngle, endAngle, color, label) {
  const cx = 200, cy = 200, r = 180, rText = 120;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = (endAngle - startAngle) > 180 ? 1 : 0;

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`);
  path.setAttribute('fill', color);
  path.setAttribute('stroke', '#fff');
  path.setAttribute('stroke-width', '2');

  // Label at midpoint of segment arc
  const mid = (startAngle + endAngle) / 2;
  const tx = cx + rText * Math.cos(toRad(mid));
  const ty = cy + rText * Math.sin(toRad(mid));
  const text = document.createElementNS(NS, 'text');
  text.setAttribute('x', String(tx));
  text.setAttribute('y', String(ty));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('transform', `rotate(${mid}, ${tx}, ${ty})`);
  text.setAttribute('font-size', '14');
  text.setAttribute('font-weight', '600');
  text.setAttribute('fill', '#fff');
  text.setAttribute('pointer-events', 'none');
  // Truncate long names so they fit in the segment
  text.textContent = label.length > 10 ? label.slice(0, 9) + '…' : label;

  const g = document.createElementNS(NS, 'g');
  g.appendChild(path);
  g.appendChild(text);
  return g;
}

function renderWheel() {
  if (!wheelSegments || !spinBtn) return;
  wheelSegments.innerHTML = '';
  if (chores.length === 0) { spinBtn.disabled = true; return; }
  spinBtn.disabled = false;
  const step = 360 / chores.length;
  chores.forEach((chore, i) => {
    const seg = createSegment(i * step, (i + 1) * step, assignSegmentColor(i), chore.name);
    if (wheelSegments) wheelSegments.appendChild(seg);
  });
}

// ==== EVENT HANDLERS ====

/** @param {Event} e */
function handleAddChore(e) {
  e.preventDefault();
  if (!choreInput || !addForm) return;
  const submitBtn = addForm.querySelector('button[type="submit"]');
  if (submitBtn instanceof HTMLButtonElement) {
    submitBtn.disabled = true;
    requestAnimationFrame(() => { submitBtn.disabled = false; });
  }
  const result = addChore(chores, choreInput.value);
  if (result.error) { showError(result.error); return; }
  chores = result.chores;
  saveChores(chores, localStorage);
  choreInput.value = '';
  clearError();
  renderChoreList();
  currentRotation = 0;
  if (wheel) { wheel.style.transition = 'none'; wheel.style.transform = 'rotate(0deg)'; }
  renderWheel();
  displayResult(null);
}

/** @param {Event} e */
function handleRemoveChore(e) {
  if (!(e.target instanceof HTMLElement)) return;
  const btn = e.target.closest('[data-remove]');
  if (!btn) return;
  const id = btn.getAttribute('data-remove');
  if (!id) return;
  chores = removeChore(chores, id);
  saveChores(chores, localStorage);
  renderChoreList();
  currentRotation = 0;
  if (wheel) { wheel.style.transition = 'none'; wheel.style.transform = 'rotate(0deg)'; }
  renderWheel();
  displayResult(null);
}

/** @type {number} Track cumulative rotation so each spin continues from last stop */
let currentRotation = 0;

function handleSpin() {
  if (isSpinning || chores.length === 0 || !wheel || !spinBtn) return;
  spinBtn.disabled = true;
  isSpinning = true;

  // Pick the winning chore first, then derive the angle
  const winIndex = Math.floor(Math.random() * chores.length);
  const step = 360 / chores.length;
  // Aim pointer (at top = 0°) at midpoint of winning segment
  // Segment i spans [i*step, (i+1)*step]; its midpoint is (i+0.5)*step
  // We need to rotate so that midpoint ends up at 0° (top)
  const segMid = (winIndex + 0.5) * step;
  const extraSpins = 1800; // 5 full rotations for visual momentum
  // New absolute rotation: align winning segment to top + extra spins
  const targetRotation = currentRotation + extraSpins + ((360 - (currentRotation % 360) - segMid + 360) % 360);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 0.8 : 3;

  wheel.style.transition = `transform ${duration}s cubic-bezier(0.17, 0.67, 0.3, 0.99)`;
  wheel.style.transform = `rotate(${targetRotation}deg)`;
  currentRotation = targetRotation;

  setTimeout(() => {
    displayResult(chores[winIndex].name);
    isSpinning = false;
    if (spinBtn) spinBtn.disabled = false;
  }, duration * 1000);
}

// ==== APP WIRING ====

function showFatalError() {
  if (!resultDisplay) return;
  resultDisplay.textContent = 'Something went wrong — please refresh.';
  resultDisplay.classList.add('winner');
}

function init() {
  try {
    if (!cacheElements()) { showFatalError(); return; }
    chores = loadChores(localStorage);
    renderChoreList();
    renderWheel();
    displayResult(null);
    addForm?.addEventListener('submit', handleAddChore);
    choreList?.addEventListener('click', handleRemoveChore);
    spinBtn?.addEventListener('click', handleSpin);
    choreInput?.addEventListener('input', clearError);
  } catch (err) {
    console.error('Init failed:', err);
    showFatalError();
  }
}

init();
