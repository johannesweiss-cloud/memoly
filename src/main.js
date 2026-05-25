import { jsPDF } from 'jspdf';
import {
  setActiveEvent,
  getEditToken,
  getEvent,
  createEvent,
  updateEvent,
  getMoments,
  createMoment,
  updateMoment,
  deleteMoment,
  getExtras,
  createExtra,
  deleteExtra,
  uploadImage,
  getPublicImageUrl,
} from './api.js';

// ─── State ──────────────────────────────────────────────────────────
let currentEvent = null;
let moments = [];
let extras = [];
let canEdit = false;
let setupMode = 'create'; // 'create' | 'edit'
let currentImageCallback = null;

// ─── DOM helpers ────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── Routing ────────────────────────────────────────────────────────
function parseRoute() {
  const m = window.location.hash.match(/^#\/event\/([0-9a-f-]+)$/i);
  return m ? { route: 'event', eventId: m[1] } : { route: 'home' };
}

function goToEvent(eventId) {
  window.location.hash = `#/event/${eventId}`;
}

// ─── Image handling ─────────────────────────────────────────────────
function resizeImageToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

const globalFileInput = document.createElement('input');
globalFileInput.type = 'file';
globalFileInput.accept = 'image/*';
globalFileInput.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;z-index:-1;pointer-events:none;top:0;left:0;';
document.body.appendChild(globalFileInput);

globalFileInput.addEventListener('change', function () {
  const file = this.files && this.files[0];
  if (file && currentImageCallback) {
    currentImageCallback(file);
  }
  this.value = '';
  currentImageCallback = null;
});

function pickImage(onFile) {
  currentImageCallback = onFile;
  globalFileInput.click();
}

// ─── Rendering ──────────────────────────────────────────────────────
function renderHero() {
  if (!currentEvent) return;
  $('#hero-tag-text').innerText = currentEvent.tag || '';
  // The DB has a single title field; we keep the v0 split presentation by
  // taking the subtitle as the italic highlight and the title as line 1.
  $('#hero-title-line1').innerText = currentEvent.title || '';
  $('#hero-title-highlight').innerText = currentEvent.subtitle || '';
  $('#hero-sub-text').innerText = currentEvent.subtitle ? '' : '';
  // Note: v0 had a separate "sub" field. The current schema folds that into
  // subtitle. If we need a distinct subline later, the schema needs a column.
}

function renderMoments() {
  const list = $('#date-list');
  const openIds = new Set([...list.querySelectorAll('.date-card.open')].map(c => c.id.replace('card-', '')));
  list.innerHTML = '';

  if (moments.length === 0) {
    list.innerHTML = canEdit
      ? `<div class="empty-state">Noch keine Dates — füge deinen ersten hinzu</div>`
      : `<div class="empty-state">Noch keine Dates vorhanden</div>`;
    return;
  }

  moments.forEach((m, i) => {
    const imgUrl = m.image_path ? getPublicImageUrl(m.image_path) : null;
    const card = document.createElement('div');
    card.className = 'date-card' + (openIds.has(m.id) ? ' open' : '');
    card.id = 'card-' + m.id;

    const thumbHTML = imgUrl
      ? `<div class="card-thumb"><img src="${imgUrl}" alt=""></div>`
      : `<div class="card-thumb"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

    const imgZoneHTML = canEdit
      ? (imgUrl
          ? `<div class="img-zone" data-id="${m.id}"><img class="img-zone-preview" src="${imgUrl}" alt=""><div class="img-zone-hint">Tippen zum Ändern</div></div>`
          : `<div class="img-zone" data-id="${m.id}"><div class="img-zone-placeholder"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Foto hinzufügen</div></div>`)
      : (imgUrl
          ? `<div class="img-zone"><img class="img-zone-preview" src="${imgUrl}" alt=""></div>`
          : '');

    const deleteBtnHTML = canEdit
      ? `<button class="date-delete-btn" data-delete-id="${m.id}">Date löschen</button>`
      : '';

    card.innerHTML = `
      <div class="card-header" data-toggle="${m.id}">
        <div class="card-header-left">
          <div class="card-num">Date ${String(i + 1).padStart(2, '0')}</div>
          <div class="card-title">${esc(m.title)}</div>
          <div class="card-desc-preview">${esc(m.description)}</div>
        </div>
        <div class="card-right">${thumbHTML}
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="card-body"><div class="card-body-inner">
        <div class="card-desc-full">${esc(m.description)}</div>
        ${imgZoneHTML}
        ${deleteBtnHTML}
      </div></div>`;
    list.appendChild(card);
  });

  list.querySelectorAll('[data-toggle]').forEach(el =>
    el.addEventListener('click', () => toggleCard(el.dataset.toggle)));
  list.querySelectorAll('.img-zone[data-id]').forEach(el =>
    el.addEventListener('click', () => triggerMomentImageUpload(el.dataset.id)));
  list.querySelectorAll('[data-delete-id]').forEach(el =>
    el.addEventListener('click', () => handleDeleteMoment(el.dataset.deleteId)));
}

function toggleCard(id) {
  const card = document.getElementById('card-' + id);
  if (!card) return;
  const isOpen = card.classList.contains('open');
  document.querySelectorAll('.date-card.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) card.classList.add('open');
}

function renderExtras() {
  const section = $('.extra-section');
  const grid = $('#extra-grid');
  grid.innerHTML = '';

  if (extras.length === 0 && !canEdit) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  extras.forEach((ex) => {
    const url = ex.image_path ? getPublicImageUrl(ex.image_path) : null;
    const slot = document.createElement('div');
    slot.className = 'extra-slot';

    if (url) {
      const imgEl = document.createElement('img');
      imgEl.src = url;
      imgEl.alt = '';
      slot.appendChild(imgEl);
    }

    if (canEdit) {
      const delBtn = document.createElement('div');
      delBtn.className = 'extra-delete';
      delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteExtra(ex.id);
      });
      slot.appendChild(delBtn);
    }

    grid.appendChild(slot);
  });

  if (canEdit) {
    const addBtn = document.createElement('div');
    addBtn.className = 'extra-add';
    addBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    addBtn.addEventListener('click', handleAddExtra);
    grid.appendChild(addBtn);
  }
}

function renderEditAffordances() {
  // Hide editor-only UI when viewer has no edit token.
  $('.setup-btn').style.display = canEdit ? '' : 'none';
  $('.add-btn-wrap').style.display = canEdit ? '' : 'none';
}

function renderHome() {
  $('#date-list').innerHTML = '';
  $('#extra-grid').innerHTML = '';
  $('.add-btn-wrap').style.display = 'none';
  $('.setup-btn').style.display = '';
  $('#bottom-bar').style.display = 'none';
  canEdit = false;
  setupMode = 'create';
  openSetupModal();
}

function renderEvent() {
  $('#bottom-bar').style.display = '';
  $('#share-btn').classList.remove('hidden');
  renderHero();
  renderEditAffordances();
  renderMoments();
  renderExtras();
}

// ─── Setup modal (create or edit event metadata) ───────────────────
function openSetupModal() {
  if (setupMode === 'edit' && currentEvent) {
    $('#setup-tag').value = currentEvent.tag || '';
    $('#setup-title1').value = currentEvent.title || '';
    $('#setup-title-highlight').value = currentEvent.subtitle || '';
    $('#setup-sub').value = '';
    $('#setup-save-btn').textContent = 'Speichern';
  } else {
    setupMode = 'create';
    $('#setup-tag').value = '';
    $('#setup-title1').value = '';
    $('#setup-title-highlight').value = '';
    $('#setup-sub').value = '';
    $('#setup-save-btn').textContent = 'Event erstellen';
  }
  $('#setup-modal').classList.remove('hidden');
}

function closeSetupModal() {
  $('#setup-modal').classList.add('hidden');
}

async function submitSetupModal() {
  const tag = $('#setup-tag').value.trim();
  const title = $('#setup-title1').value.trim();
  const subtitle = $('#setup-title-highlight').value.trim();

  if (!title) {
    $('#setup-title1').focus();
    return;
  }

  if (setupMode === 'create') {
    try {
      const event = await createEvent({ title, subtitle, tag });
      closeSetupModal();
      // createEvent already activates the new event in api.js.
      // Going to the event hash triggers a reload, which re-runs init().
      goToEvent(event.id);
      location.reload();
    } catch (e) {
      console.error(e);
      showToast('Konnte Event nicht erstellen');
    }
  } else {
    try {
      const updated = await updateEvent(currentEvent.id, { title, subtitle, tag });
      currentEvent = { ...currentEvent, ...updated };
      renderHero();
      closeSetupModal();
      showToast('Gespeichert ✓');
    } catch (e) {
      console.error(e);
      showToast('Konnte nicht speichern');
    }
  }
}

// ─── Add-date modal ────────────────────────────────────────────────
function openAddModal() {
  $('#modal').classList.remove('hidden');
  setTimeout(() => $('#new-title').focus(), 350);
}

function closeAddModal() {
  $('#modal').classList.add('hidden');
  $('#new-title').value = '';
  $('#new-desc').value = '';
}

async function submitAddModal() {
  const title = $('#new-title').value.trim();
  const description = $('#new-desc').value.trim();
  if (!title) {
    $('#new-title').focus();
    return;
  }
  try {
    const moment = await createMoment({
      event_id: currentEvent.id,
      title,
      description,
      sort_order: moments.length,
    });
    moments.push(moment);
    renderMoments();
    closeAddModal();
    showToast('Date hinzugefügt ✓');
    setTimeout(() =>
      $('#date-list').lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  } catch (e) {
    console.error(e);
    showToast('Konnte Date nicht speichern');
  }
}

// ─── Moment operations ─────────────────────────────────────────────
function triggerMomentImageUpload(momentId) {
  pickImage(async (file) => {
    try {
      const blob = await resizeImageToBlob(file);
      const path = `${currentEvent.id}/moments/${momentId}.jpg`;
      await uploadImage(path, blob);
      const updated = await updateMoment(momentId, { image_path: path });
      const idx = moments.findIndex(m => m.id === momentId);
      if (idx !== -1) moments[idx] = { ...moments[idx], ...updated };
      renderMoments();
      requestAnimationFrame(() => {
        document.getElementById('card-' + momentId)?.classList.add('open');
      });
      showToast('Foto gespeichert ✓');
    } catch (e) {
      console.error(e);
      showToast('Upload fehlgeschlagen');
    }
  });
}

async function handleDeleteMoment(id) {
  if (!confirm('Dieses Date wirklich löschen?')) return;
  try {
    await deleteMoment(id);
    moments = moments.filter(m => m.id !== id);
    renderMoments();
    showToast('Date gelöscht ✓');
  } catch (e) {
    console.error(e);
    showToast('Konnte nicht löschen');
  }
}

// ─── Extra operations ──────────────────────────────────────────────
function handleAddExtra() {
  pickImage(async (file) => {
    try {
      const id = crypto.randomUUID();
      const path = `${currentEvent.id}/extras/${id}.jpg`;
      const blob = await resizeImageToBlob(file);
      await uploadImage(path, blob);
      const extra = await createExtra({
        id,
        event_id: currentEvent.id,
        sort_order: extras.length,
        image_path: path,
      });
      extras.push(extra);
      renderExtras();
      showToast('Bild hinzugefügt ✓');
    } catch (e) {
      console.error(e);
      showToast('Upload fehlgeschlagen');
    }
  });
}

async function handleDeleteExtra(id) {
  if (!confirm('Dieses Bild löschen?')) return;
  try {
    await deleteExtra(id);
    extras = extras.filter(e => e.id !== id);
    renderExtras();
    showToast('Bild gelöscht ✓');
  } catch (e) {
    console.error(e);
    showToast('Konnte nicht löschen');
  }
}

// ─── PDF Export ────────────────────────────────────────────────────
async function exportPDF() {
  showToast('PDF wird erstellt…');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const EXTRA_SLOT_BG = '#f5f5f3';
  const EXTRA_SLOT_BG_RGB = [245, 245, 243];

  const PW = 210, PH = 297;
  const ML = 14, MR = 14, MT = 14;
  const CW = PW - ML - MR;

  const IMG_COL = 78;
  const GAP = 8;
  const TEXT_COL = CW - IMG_COL - GAP;

  let y = MT;

  function loadImg(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function getRoundedImgData(imgEl, w_mm, h_mm, r_mm = 2, bgColor = '#ffffff') {
    const canvas = document.createElement('canvas');
    let cw = imgEl.naturalWidth;
    let ch = imgEl.naturalHeight;
    const MAX = 1200;
    if (cw > MAX || ch > MAX) {
      const r = Math.max(cw / MAX, ch / MAX);
      cw = Math.round(cw / r);
      ch = Math.round(ch / r);
    }
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);

    const radiusPx = cw * (r_mm / w_mm);
    ctx.beginPath();
    ctx.moveTo(radiusPx, 0);
    ctx.lineTo(cw - radiusPx, 0);
    ctx.quadraticCurveTo(cw, 0, cw, radiusPx);
    ctx.lineTo(cw, ch - radiusPx);
    ctx.quadraticCurveTo(cw, ch, cw - radiusPx, ch);
    ctx.lineTo(radiusPx, ch);
    ctx.quadraticCurveTo(0, ch, 0, ch - radiusPx);
    ctx.lineTo(0, radiusPx);
    ctx.quadraticCurveTo(0, 0, radiusPx, 0);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(imgEl, 0, 0, cw, ch);
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  function ensureSpace(needed) {
    if (y + needed > PH - 12) {
      pdf.addPage();
      y = MT;
    }
  }

  // Header
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(160, 160, 155);
  pdf.setCharSpace(2);
  const tagText = $('#hero-tag-text').innerText || '';
  pdf.text(tagText.toUpperCase(), PW / 2, y + 5, { align: 'center' });
  pdf.setCharSpace(0);
  y += 10;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(17, 17, 17);
  const title1 = $('#hero-title-line1').innerText || '';
  const titleH = $('#hero-title-highlight').innerText || '';
  pdf.text(`${title1} ${titleH}`.trim(), PW / 2, y + 7, { align: 'center' });
  y += 13;

  pdf.setFont('times', 'italic');
  pdf.setFontSize(10.5);
  pdf.setTextColor(120, 120, 115);
  const subText = $('#hero-sub-text').innerText || '';
  pdf.text(subText, PW / 2, y + 4, { align: 'center' });
  y += 9;

  pdf.setDrawColor(215, 215, 210);
  pdf.setLineWidth(0.25);
  pdf.line(ML, y, PW - MR, y);
  y += 7;

  // Date rows
  for (let i = 0; i < moments.length; i++) {
    const m = moments[i];
    const rev = i % 2 === 1;

    let imgDrawH = 55;
    let imgEl = null;

    if (m.image_path) {
      imgEl = await loadImg(getPublicImageUrl(m.image_path));
      if (imgEl) {
        const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
        imgDrawH = IMG_COL / ratio;
        if (imgDrawH > 120) imgDrawH = 120;
      }
    }

    const minTextH = 50;
    const rowH = Math.max(imgDrawH, minTextH);
    ensureSpace(rowH + 10);

    const imgX = rev ? ML + TEXT_COL + GAP : ML;
    const textX = rev ? ML : ML + IMG_COL + GAP;

    if (imgEl) {
      const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
      let drawW = IMG_COL;
      let drawH = drawW / ratio;
      if (drawH > 120) { drawH = 120; drawW = drawH * ratio; }
      const offsetX = imgX + (IMG_COL - drawW) / 2;
      const roundedSrc = getRoundedImgData(imgEl, drawW, drawH, 6, '#ffffff');
      pdf.addImage(roundedSrc, 'JPEG', offsetX, y, drawW, drawH, '', 'FAST');
    } else {
      pdf.setFillColor(242, 242, 240);
      pdf.roundedRect(imgX, y, IMG_COL, imgDrawH, 6, 6, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(185, 185, 180);
      pdf.text('KEIN FOTO', imgX + IMG_COL / 2, y + imgDrawH / 2, { align: 'center' });
    }

    const textTopOffset = 2;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(165, 165, 158);
    pdf.setCharSpace(1.8);
    pdf.text(`DATE ${String(i + 1).padStart(2, '0')}`, textX, y + textTopOffset + 5);
    pdf.setCharSpace(0);

    pdf.setFont('times', 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(17, 17, 17);
    const titleLines = pdf.splitTextToSize(m.title, TEXT_COL);
    pdf.text(titleLines, textX, y + textTopOffset + 13);
    const titleBlockH = titleLines.length * 6.5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(105, 105, 98);
    const descLines = pdf.splitTextToSize(m.description || '', TEXT_COL);
    pdf.text(descLines, textX, y + textTopOffset + 13 + titleBlockH + 3);

    y += rowH + 6;

    if (i < moments.length - 1) {
      ensureSpace(4);
      pdf.setDrawColor(228, 228, 223);
      pdf.setLineWidth(0.2);
      pdf.line(ML, y, PW - MR, y);
      y += 6;
    }
  }

  // Extras
  if (extras.length > 0) {
    const COLS = 3;
    const GAP_E = 5;
    const THUMB = (CW - GAP_E * (COLS - 1)) / COLS;

    y += 4;
    ensureSpace(20 + THUMB);

    pdf.setDrawColor(215, 215, 210);
    pdf.setLineWidth(0.25);
    pdf.line(ML, y, PW - MR, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(165, 165, 158);
    pdf.setCharSpace(1.8);
    pdf.text('WEITERE BILDER', ML, y + 3);
    pdf.setCharSpace(0);
    y += 8;

    for (let i = 0; i < extras.length; i++) {
      const col = i % COLS;
      if (col === 0 && i > 0) {
        y += THUMB + GAP_E;
        ensureSpace(THUMB + GAP_E);
      }
      const ex_x = ML + col * (THUMB + GAP_E);

      const url = extras[i].image_path ? getPublicImageUrl(extras[i].image_path) : null;
      const imgEl = url ? await loadImg(url) : null;

      if (imgEl) {
        const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
        let dw = THUMB, dh = THUMB;
        if (ratio > 1) dh = dw / ratio; else dw = dh * ratio;
        const ox = ex_x + (THUMB - dw) / 2;
        const oy = y + (THUMB - dh) / 2;
        pdf.setFillColor(...EXTRA_SLOT_BG_RGB);
        pdf.roundedRect(ex_x, y, THUMB, THUMB, 6, 6, 'F');
        const roundedSrc = getRoundedImgData(imgEl, dw, dh, 6, EXTRA_SLOT_BG);
        pdf.addImage(roundedSrc, 'JPEG', ox, oy, dw, dh, '', 'FAST');
      } else {
        pdf.setFillColor(242, 242, 240);
        pdf.roundedRect(ex_x, y, THUMB, THUMB, 6, 6, 'F');
      }
    }
    y += THUMB + GAP_E;
  }

  const rawTag = $('#hero-tag-text').innerText || 'erinnerung';
  const filename = rawTag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'erinnerung';
  pdf.save(filename + '.pdf');
  showToast('PDF gespeichert ✓');
}

// ─── Event wiring ──────────────────────────────────────────────────
$('.setup-btn').addEventListener('click', () => {
  setupMode = currentEvent ? 'edit' : 'create';
  openSetupModal();
});
$('.add-btn').addEventListener('click', openAddModal);
$('.export-btn').addEventListener('click', exportPDF);
$('#modal-cancel-btn').addEventListener('click', closeAddModal);
$('#modal-save-btn').addEventListener('click', submitAddModal);
$('#setup-cancel-btn').addEventListener('click', closeSetupModal);
$('#setup-save-btn').addEventListener('click', submitSetupModal);

$('#modal').addEventListener('click', function (e) { if (e.target === this) closeAddModal(); });
$('#setup-modal').addEventListener('click', function (e) { if (e.target === this) closeSetupModal(); });

$('#share-btn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    const btn = $('#share-btn');
    btn.textContent = 'Kopiert ✓';
    setTimeout(() => {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Link kopieren`;
    }, 2000);
  } catch {
    showToast('Konnte Link nicht kopieren');
  }
});

window.addEventListener('hashchange', () => location.reload());

// ─── Init ──────────────────────────────────────────────────────────
async function init() {
  const route = parseRoute();

  if (route.route === 'home') {
    renderHome();
    return;
  }

  $('#loading-overlay').classList.remove('hidden');
  setActiveEvent(route.eventId);
  canEdit = !!getEditToken(route.eventId);

  try {
    currentEvent = await getEvent(route.eventId);
    moments = await getMoments(route.eventId);
    extras = await getExtras(route.eventId);
  } catch (e) {
    console.error('Failed to load event', e);
    $('#loading-overlay').classList.add('hidden');
    $('#error-state').classList.remove('hidden');
    return;
  }

  $('#loading-overlay').classList.add('hidden');
  renderEvent();
}

init();
