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

const LS_CHECKOUT_URL = import.meta.env.VITE_LS_CHECKOUT_URL ?? '';

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
  $('#hero-title').innerText = currentEvent.title || '';
  $('#hero-sub-text').innerText = currentEvent.subtitle || '';
}

function renderMoments() {
  const list = $('#date-list');
  const openIds = new Set([...list.querySelectorAll('.date-card.open')].map(c => c.id.replace('card-', '')));
  list.innerHTML = '';

  if (moments.length === 0) {
    list.innerHTML = canEdit
      ? `<div class="empty-state">Noch keine Aktivitäten — füge deine erste hinzu</div>`
      : `<div class="empty-state">Noch keine Aktivitäten vorhanden</div>`;
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
      ? `<button class="date-delete-btn" data-delete-id="${m.id}">Aktivität löschen</button>`
      : '';

    card.innerHTML = `
      <div class="card-header" data-toggle="${m.id}">
        <div class="card-header-left">
          <div class="card-num">Aktivität ${String(i + 1).padStart(2, '0')}</div>
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

  const exportBtn = $('.export-btn');
  if (!canEdit) {
    exportBtn.style.display = 'none';
  } else if (currentEvent.is_paid) {
    exportBtn.textContent = 'Als Erinnerung exportieren ↓';
    exportBtn.classList.remove('export-btn--locked');
    exportBtn.style.display = '';
  } else {
    exportBtn.textContent = '✦ Buch freischalten & exportieren';
    exportBtn.classList.add('export-btn--locked');
    exportBtn.style.display = '';
  }

  renderHero();
  renderEditAffordances();
  renderMoments();
  renderExtras();
}

// ─── Setup modal (create or edit event metadata) ───────────────────
function openSetupModal() {
  if (setupMode === 'edit' && currentEvent) {
    $('#setup-title').value = currentEvent.title || '';
    $('#setup-location').value = currentEvent.subtitle || '';
    $('#setup-date').value = currentEvent.tag || '';
    $('#setup-save-btn').textContent = 'Speichern';
  } else {
    setupMode = 'create';
    $('#setup-title').value = '';
    $('#setup-location').value = '';
    $('#setup-date').value = '';
    $('#setup-save-btn').textContent = 'Event erstellen';
  }
  $('#setup-modal').classList.remove('hidden');
}

function closeSetupModal() {
  $('#setup-modal').classList.add('hidden');
}

async function submitSetupModal() {
  const title = $('#setup-title').value.trim();
  const subtitle = $('#setup-location').value.trim();
  const tag = $('#setup-date').value.trim();

  if (!title) {
    $('#setup-title').focus();
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
    showToast('Aktivität hinzugefügt ✓');
    setTimeout(() =>
      $('#date-list').lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  } catch (e) {
    console.error(e);
    showToast('Konnte Aktivität nicht speichern');
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
  if (!confirm('Diese Aktivität wirklich löschen?')) return;
  try {
    await deleteMoment(id);
    moments = moments.filter(m => m.id !== id);
    renderMoments();
    showToast('Aktivität gelöscht ✓');
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
async function exportPDF(theme = 'modern', layout = 'classic', useCover = true) {
  showToast('PDF wird erstellt…');

  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Theme settings mapping
    const styles = {
      modern: {
        fontMain: 'helvetica',
        fontTitle: 'helvetica',
        titleStyle: 'bold',
        numStyle: 'bold',
        descStyle: 'normal',
        textColor: [28, 26, 23],
        textMuted: [142, 138, 130],
        bgFill: null, // White
        dividerColor: [233, 233, 228],
        cornerRadius: 6,
        polaroid: false,
        useLine: true,
        headerAlign: 'center'
      },
      romantic: {
        fontMain: 'times',
        fontTitle: 'times',
        titleStyle: 'bold',
        numStyle: 'italic',
        descStyle: 'normal',
        textColor: [37, 32, 27],
        textMuted: [94, 86, 77],
        bgFill: [251, 250, 245], // Soft cream ivory
        dividerColor: [230, 218, 196],
        cornerRadius: 8,
        polaroid: false,
        useLine: true,
        headerAlign: 'center'
      },
      scrapbook: {
        fontMain: 'courier',
        fontTitle: 'courier',
        titleStyle: 'bold',
        numStyle: 'normal',
        descStyle: 'normal',
        textColor: [34, 34, 34],
        textMuted: [68, 68, 68],
        bgFill: [243, 235, 217], // Sand
        dividerColor: null, // No dividers
        cornerRadius: 0,
        polaroid: true,
        useLine: false,
        headerAlign: 'center'
      }
    };

    const currentStyle = styles[theme] || styles.modern;

    const EXTRA_SLOT_BG = theme === 'scrapbook' ? '#ffffff' : '#f5f5f3';
    const EXTRA_SLOT_BG_RGB = theme === 'scrapbook' ? [255, 255, 255] : [245, 245, 243];

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
      const targetRatio = w_mm / h_mm;
      
      let sx = 0, sy = 0, sw = imgEl.naturalWidth, sh = imgEl.naturalHeight;
      const srcRatio = sw / sh;
      if (srcRatio > targetRatio) {
        // Source is wider than target -> crop sides (horizontal crop)
        sw = sh * targetRatio;
        sx = (imgEl.naturalWidth - sw) / 2;
      } else {
        // Source is taller than target -> crop top/bottom (vertical crop)
        sh = sw / targetRatio;
        sy = (imgEl.naturalHeight - sh) / 2;
      }

      let cw = Math.round(sw);
      let ch = Math.round(sh);
      const MAX = 1200;
      if (cw > MAX || ch > MAX) {
        const scale = Math.max(cw / MAX, ch / MAX);
        cw = Math.round(cw / scale);
        ch = Math.round(ch / scale);
      }

      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, cw, ch);

      if (r_mm > 0) {
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
      }

      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, cw, ch);
      return canvas.toDataURL('image/jpeg', 0.95);
    }

    function fillPageBackground() {
      if (currentStyle.bgFill) {
        pdf.setFillColor(...currentStyle.bgFill);
        pdf.rect(0, 0, PW, PH, 'F');
      }
    }

    function ensureSpace(needed) {
      if (y + needed > PH - 12) {
        pdf.addPage();
        fillPageBackground();
        y = MT;
      }
    }

    const isLeft = currentStyle.headerAlign === 'left';
    const headerX = isLeft ? ML : PW / 2;
    const headerOpts = isLeft ? {} : { align: 'center' };

    // Layout configuration: Cover Page or Standard Header
    if (useCover) {
      // Cover Page (Deckblatt)
      fillPageBackground();

      // Clean decorative border frame on cover
      pdf.setDrawColor(...(currentStyle.dividerColor || [215, 215, 210]));
      pdf.setLineWidth(0.3);
      pdf.roundedRect(10, 10, PW - 20, PH - 20, 4, 4, 'D');

      pdf.setFont(currentStyle.fontMain, 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...currentStyle.textMuted);
      const tagText = $('#hero-tag-text').innerText || '';
      pdf.text(tagText.toUpperCase().split('').join('  '), PW / 2, PH / 3, { align: 'center' });

      pdf.setFont(currentStyle.fontTitle, currentStyle.titleStyle);
      pdf.setFontSize(28);
      pdf.setTextColor(...currentStyle.textColor);
      const title = $('#hero-title').innerText || '';
      const titleLines = pdf.splitTextToSize(title, PW - 40);
      pdf.text(titleLines, PW / 2, PH / 3 + 15, { align: 'center' });

      pdf.setFont(currentStyle.fontTitle, theme === 'romantic' ? 'italic' : 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(...currentStyle.textMuted);
      const subText = $('#hero-sub-text').innerText || '';
      pdf.text(subText, PW / 2, PH / 3 + 15 + titleLines.length * 9 + 4, { align: 'center' });

      pdf.addPage();
      fillPageBackground();
      y = MT;
    } else {
      // No Cover Page
      if (layout === 'classic' || layout === 'compact') {
        // Draw standard header on Page 1
        fillPageBackground();

        pdf.setFont(currentStyle.fontMain, 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...currentStyle.textMuted);
        const tagText = $('#hero-tag-text').innerText || '';
        const spacedTagText = tagText.toUpperCase().split('').join('  ');
        pdf.text(spacedTagText, headerX, y + 4, headerOpts);
        y += 9;

        pdf.setFont(currentStyle.fontTitle, currentStyle.titleStyle);
        pdf.setFontSize(22);
        pdf.setTextColor(...currentStyle.textColor);
        const title = $('#hero-title').innerText || '';
        pdf.text(title, headerX, y + 6, headerOpts);
        y += 12;

        pdf.setFont(currentStyle.fontTitle, theme === 'romantic' ? 'italic' : 'normal');
        pdf.setFontSize(10.5);
        pdf.setTextColor(...currentStyle.textMuted);
        const subText = $('#hero-sub-text').innerText || '';
        pdf.text(subText, headerX, y + 3, headerOpts);
        y += 8;

        if (currentStyle.useLine && currentStyle.dividerColor) {
          pdf.setDrawColor(...currentStyle.dividerColor);
          pdf.setLineWidth(0.25);
          pdf.line(ML, y, PW - MR, y);
          y += 7;
        } else {
          y += 4;
        }
      } else {
        // Spacious layout starts directly with activities on Page 1
        fillPageBackground();
      }
    }

    if (layout === 'spacious') {
      // Foto-Buch: 1 activity per page
      for (let i = 0; i < moments.length; i++) {
        const m = moments[i];
        y = MT + 10;

        let imgW = 130;
        let imgDrawH = 90;
        let imgEl = null;

        if (m.image_path) {
          imgEl = await loadImg(getPublicImageUrl(m.image_path));
          if (imgEl) {
            const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
            const targetRatio = 130 / 110;
            if (ratio >= targetRatio) {
              // Image is wider than bounding box -> fit to width
              imgW = 130;
              imgDrawH = 130 / ratio;
            } else {
              // Image is taller than bounding box -> fit to height
              imgDrawH = 110;
              imgW = 110 * ratio;
            }
          }
        }

        const imgX = (PW - imgW) / 2;

        if (imgEl) {
          if (currentStyle.polaroid) {
            // Polaroid style single page layout
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(215, 205, 185);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(imgX - 4, y - 4, imgW + 8, imgDrawH + 20, 3, 3, 'FD');

            const roundedSrc = getRoundedImgData(imgEl, imgW, imgDrawH, 0, '#ffffff');
            pdf.addImage(roundedSrc, 'JPEG', imgX, y, imgW, imgDrawH, '', 'FAST');
            y += imgDrawH + 22;
          } else {
            const bgHex = theme === 'romantic' ? '#fbfaf5' : '#ffffff';
            const roundedSrc = getRoundedImgData(imgEl, imgW, imgDrawH, currentStyle.cornerRadius * 1.5, bgHex);
            pdf.addImage(roundedSrc, 'JPEG', imgX, y, imgW, imgDrawH, '', 'FAST');
            y += imgDrawH + 12;
          }
        } else {
          pdf.setFillColor(242, 242, 240);
          pdf.roundedRect(imgX, y, imgW, 70, 4, 4, 'F');
          y += 82;
        }

        pdf.setFont(currentStyle.fontMain, currentStyle.numStyle);
        pdf.setFontSize(7.5);
        pdf.setTextColor(...currentStyle.textMuted);
        const labelText = theme === 'romantic' ? `Aktivität ${String(i + 1).padStart(2, '0')}` : `AKTIVITÄT ${String(i + 1).padStart(2, '0')}`;
        pdf.text(labelText, PW / 2, y, { align: 'center' });
        y += 6;

        pdf.setFont(currentStyle.fontTitle, currentStyle.titleStyle);
        pdf.setFontSize(22);
        pdf.setTextColor(...currentStyle.textColor);
        const titleLines = pdf.splitTextToSize(m.title, PW - 40);
        pdf.text(titleLines, PW / 2, y, { align: 'center' });
        y += titleLines.length * 8.5 + 2;

        pdf.setFont(currentStyle.fontMain, currentStyle.descStyle);
        pdf.setFontSize(10.5);
        pdf.setTextColor(...(theme === 'scrapbook' ? [68, 68, 68] : [105, 105, 98]));
        const descLines = pdf.splitTextToSize(m.description || '', PW - 40);
        pdf.text(descLines, PW / 2, y, { align: 'center' });

        if (i < moments.length - 1) {
          pdf.addPage();
          fillPageBackground();
        }
      }
    } else if (layout === 'compact') {
      // Kompaktes Poster (2 Column Tiled Grid) - Fits up to 10 activities per page
      const COLS = 2;
      const GAP_C = 6;
      const CARD_W = (CW - GAP_C) / COLS;

      let leftY = y;
      let rightY = y;

      for (let i = 0; i < moments.length; i++) {
        const m = moments[i];
        const col = i % COLS;

        let curY = col === 0 ? leftY : rightY;

        let imgEl = null;
        if (m.image_path) {
          imgEl = await loadImg(getPublicImageUrl(m.image_path));
        }

        const labelH = 3.5;
        const titleLines = pdf.splitTextToSize(m.title, CARD_W);
        const titleH = titleLines.length * 4.5;
        
        const descLines = pdf.splitTextToSize(m.description || '', CARD_W);
        const limitedLines = descLines.slice(0, 3);
        const descH = limitedLines.length * 3.5;
        
        const imgH = 30; // Fixed image height
        const imgSpacing = currentStyle.polaroid ? 8 : 4;
        const itemH = imgH + imgSpacing + labelH + titleH + descH + 6;

        if (curY + itemH > PH - 12) {
          pdf.addPage();
          fillPageBackground();
          curY = MT + 5;
          leftY = curY;
          rightY = curY;
        }

        const itemX = ML + col * (CARD_W + GAP_C);

        if (imgEl) {
          if (currentStyle.polaroid) {
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(215, 205, 185);
            pdf.setLineWidth(0.25);
            pdf.roundedRect(itemX - 1.5, curY - 1.5, CARD_W + 3, imgH + 8, 1, 1, 'FD');

            const roundedSrc = getRoundedImgData(imgEl, CARD_W, imgH, 0, '#ffffff');
            pdf.addImage(roundedSrc, 'JPEG', itemX, curY, CARD_W, imgH, '', 'FAST');
            curY += imgH + 8;
          } else {
            const bgHex = theme === 'romantic' ? '#fbfaf5' : '#ffffff';
            const roundedSrc = getRoundedImgData(imgEl, CARD_W, imgH, currentStyle.cornerRadius, bgHex);
            pdf.addImage(roundedSrc, 'JPEG', itemX, curY, CARD_W, imgH, '', 'FAST');
            curY += imgH + 4;
          }
        } else {
          pdf.setFillColor(242, 242, 240);
          pdf.roundedRect(itemX, curY, CARD_W, imgH, currentStyle.cornerRadius || 2, currentStyle.cornerRadius || 2, 'F');
          pdf.setFont(currentStyle.fontMain, 'normal');
          pdf.setFontSize(6);
          pdf.setTextColor(185, 185, 180);
          pdf.text('KEIN FOTO', itemX + CARD_W / 2, curY + imgH / 2, { align: 'center' });
          curY += imgH + 4;
        }

        pdf.setFont(currentStyle.fontMain, currentStyle.numStyle);
        pdf.setFontSize(5.5);
        pdf.setTextColor(...currentStyle.textMuted);
        const labelText = theme === 'romantic' ? `Aktivität ${String(i + 1).padStart(2, '0')}` : `AKTIVITÄT ${String(i + 1).padStart(2, '0')}`;
        pdf.text(labelText, itemX, curY);
        curY += 3.5;

        pdf.setFont(currentStyle.fontTitle, currentStyle.titleStyle);
        pdf.setFontSize(11);
        pdf.setTextColor(...currentStyle.textColor);
        pdf.text(titleLines, itemX, curY);
        curY += titleH;

        pdf.setFont(currentStyle.fontMain, currentStyle.descStyle);
        pdf.setFontSize(7.5);
        pdf.setTextColor(...(theme === 'scrapbook' ? [68, 68, 68] : [105, 105, 98]));
        pdf.text(limitedLines, itemX, curY);
        curY += descH + 6;

        if (col === 0) {
          leftY = curY;
        } else {
          rightY = curY;
        }
      }

      y = Math.max(leftY, rightY);
    } else {
      // Classic Magazine Layout (alternating row grid)
      for (let i = 0; i < moments.length; i++) {
        const m = moments[i];
        const rev = i % 2 === 1;

        let imgEl = null;
        if (m.image_path) {
          imgEl = await loadImg(getPublicImageUrl(m.image_path));
        }

        const titleLines = pdf.splitTextToSize(m.title, TEXT_COL);
        const titleBlockH = titleLines.length * (theme === 'romantic' ? 7.5 : 6.5);
        
        const descLines = pdf.splitTextToSize(m.description || '', TEXT_COL);
        const descBlockH = descLines.length * (theme === 'romantic' ? 4.8 : 4.2);
        
        const textBlockH = 2 + 13 + titleBlockH + 3 + descBlockH + 6;
        
        const imgDrawH = 55; // Fixed image height
        const addedPolaroidH = currentStyle.polaroid ? 16 : 0;
        const rowH = Math.max(imgDrawH + addedPolaroidH, textBlockH);
        
        ensureSpace(rowH + 10);

        const imgX = rev ? ML + TEXT_COL + GAP : ML;
        const textX = rev ? ML : ML + IMG_COL + GAP;

        if (imgEl) {
          const aspectRatio = imgEl.naturalWidth / imgEl.naturalHeight;
          const slotRatio = IMG_COL / imgDrawH;
          let drawW, drawH;
          if (aspectRatio >= slotRatio) {
            drawW = IMG_COL;
            drawH = IMG_COL / aspectRatio;
          } else {
            drawH = imgDrawH;
            drawW = imgDrawH * aspectRatio;
          }
          const offsetX = imgX + (IMG_COL - drawW) / 2;
          const offsetY = y + (imgDrawH - drawH) / 2;

          if (currentStyle.polaroid) {
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(215, 205, 185);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(imgX - 3, y - 3, IMG_COL + 6, imgDrawH + 16, 2, 2, 'FD');

            const roundedSrc = getRoundedImgData(imgEl, drawW, drawH, 0, '#ffffff');
            pdf.addImage(roundedSrc, 'JPEG', offsetX, offsetY, drawW, drawH, '', 'FAST');
          } else {
            const bgHex = theme === 'romantic' ? '#fbfaf5' : '#ffffff';
            const roundedSrc = getRoundedImgData(imgEl, drawW, drawH, currentStyle.cornerRadius, bgHex);
            pdf.addImage(roundedSrc, 'JPEG', offsetX, offsetY, drawW, drawH, '', 'FAST');
          }
        } else {
          if (currentStyle.polaroid) {
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(215, 205, 185);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(imgX - 3, y - 3, IMG_COL + 6, imgDrawH + 16, 2, 2, 'FD');
            pdf.setFont(currentStyle.fontMain, 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(180, 170, 150);
            pdf.text('KEIN FOTO', imgX + IMG_COL / 2, y + imgDrawH / 2, { align: 'center' });
          } else {
            const fillRgb = theme === 'romantic' ? [242, 238, 227] : [242, 242, 240];
            pdf.setFillColor(...fillRgb);
            pdf.roundedRect(imgX, y, IMG_COL, imgDrawH, currentStyle.cornerRadius || 2, currentStyle.cornerRadius || 2, 'F');
            pdf.setFont(currentStyle.fontMain, 'normal');
            pdf.setFontSize(6.5);
            pdf.setTextColor(185, 185, 180);
            pdf.text('KEIN FOTO', imgX + IMG_COL / 2, y + imgDrawH / 2, { align: 'center' });
          }
        }

        const textTopOffset = 2;

        pdf.setFont(currentStyle.fontMain, currentStyle.numStyle);
        pdf.setFontSize(6.5);
        pdf.setTextColor(...currentStyle.textMuted);

        if (theme === 'romantic') {
          pdf.text(`Aktivität ${String(i + 1).padStart(2, '0')}`, textX, y + textTopOffset + 5);
        } else if (theme === 'scrapbook') {
          pdf.text(`[ AKTIVITÄT ${String(i + 1).padStart(2, '0')} ]`, textX, y + textTopOffset + 5);
        } else {
          pdf.setCharSpace(1.8);
          pdf.text(`AKTIVITÄT ${String(i + 1).padStart(2, '0')}`, textX, y + textTopOffset + 5);
          pdf.setCharSpace(0);
        }

        pdf.setFont(currentStyle.fontTitle, currentStyle.titleStyle);
        pdf.setFontSize(theme === 'romantic' ? 19 : 17);
        pdf.setTextColor(...currentStyle.textColor);
        pdf.text(titleLines, textX, y + textTopOffset + 13);

        pdf.setFont(currentStyle.fontMain, currentStyle.descStyle);
        pdf.setFontSize(theme === 'romantic' ? 10 : 9);
        pdf.setTextColor(...(theme === 'scrapbook' ? [68, 68, 68] : [105, 105, 98]));
        pdf.text(descLines, textX, y + textTopOffset + 13 + titleBlockH + 3);

        y += rowH + 6;

        if (i < moments.length - 1) {
          ensureSpace(4);
          if (currentStyle.useLine && currentStyle.dividerColor) {
            pdf.setDrawColor(...currentStyle.dividerColor);
            pdf.setLineWidth(0.2);
            pdf.line(ML, y, PW - MR, y);
            y += 6;
          } else {
            y += 4;
          }
        }
      }
    }

    // Extras
    if (extras.length > 0) {
      const COLS = 3;
      const GAP_E = 5;
      const THUMB = (CW - GAP_E * (COLS - 1)) / COLS;

      y += 4;
      ensureSpace(20 + THUMB);

      if (currentStyle.useLine && currentStyle.dividerColor) {
        pdf.setDrawColor(...currentStyle.dividerColor);
        pdf.setLineWidth(0.25);
        pdf.line(ML, y, PW - MR, y);
        y += 6;
      } else {
        y += 4;
      }

      pdf.setFont(currentStyle.fontMain, 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(...currentStyle.textMuted);
      
      if (theme === 'romantic') {
        pdf.text('Weitere Bilder', ML, y + 3);
      } else if (theme === 'scrapbook') {
        pdf.text('* WEITERE BILDER *', ML, y + 3);
      } else {
        pdf.setCharSpace(1.8);
        pdf.text('WEITERE BILDER', ML, y + 3);
        pdf.setCharSpace(0);
      }
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

          if (currentStyle.polaroid) {
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(215, 205, 185);
            pdf.setLineWidth(0.25);
            pdf.roundedRect(ex_x - 1.5, y - 1.5, THUMB + 3, THUMB + 6, 1, 1, 'FD');
            
            const roundedSrc = getRoundedImgData(imgEl, dw, dh, 0, '#ffffff');
            pdf.addImage(roundedSrc, 'JPEG', ox, oy + 0.5, dw, dh, '', 'FAST');
          } else {
            pdf.setFillColor(...EXTRA_SLOT_BG_RGB);
            const bgHex = theme === 'romantic' ? '#fbfaf5' : EXTRA_SLOT_BG;
            const cornerR = currentStyle.cornerRadius ? Math.min(4, currentStyle.cornerRadius) : 6;
            pdf.roundedRect(ex_x, y, THUMB, THUMB, cornerR, cornerR, 'F');
            const roundedSrc = getRoundedImgData(imgEl, dw, dh, cornerR, bgHex);
            pdf.addImage(roundedSrc, 'JPEG', ox, oy, dw, dh, '', 'FAST');
          }
        } else {
          const fillRgb = theme === 'romantic' ? [242, 238, 227] : [242, 242, 240];
          pdf.setFillColor(...fillRgb);
          const cornerR = currentStyle.cornerRadius ? Math.min(4, currentStyle.cornerRadius) : 6;
          pdf.roundedRect(ex_x, y, THUMB, THUMB, cornerR, cornerR, 'F');
        }
      }
      y += THUMB + GAP_E;
    }

    const rawTag = $('#hero-tag-text').innerText || 'erinnerung';
    const filename = rawTag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'erinnerung';
    pdf.save(filename + '.pdf');
    showToast('PDF gespeichert ✓');
  } catch (e) {
    console.error('PDF Export Error:', e);
    showToast('Fehler beim PDF-Export: ' + e.message);
  }
}

// ─── Event wiring ──────────────────────────────────────────────────
$('.setup-btn').addEventListener('click', () => {
  setupMode = currentEvent ? 'edit' : 'create';
  openSetupModal();
});
$('.add-btn').addEventListener('click', openAddModal);
// Export Modal wiring
function openExportModal() {
  $('#export-modal').classList.remove('hidden');
}
function closeExportModal() {
  $('#export-modal').classList.add('hidden');
}
$('.export-btn').addEventListener('click', () => {
  if (!canEdit) return;
  if (!currentEvent?.is_paid) {
    openPaywallModal();
  } else {
    openExportModal();
  }
});
$('#export-cancel-btn').addEventListener('click', closeExportModal);
$('#export-modal').addEventListener('click', function (e) { if (e.target === this) closeExportModal(); });

// ─── Paywall ───────────────────────────────────────────────────────
function openPaywallModal() {
  $('#paywall-modal').classList.remove('hidden');
}
function closePaywallModal() {
  $('#paywall-modal').classList.add('hidden');
}

let _pollTimer = null;

function startCheckout() {
  if (!LS_CHECKOUT_URL) {
    showToast('Checkout nicht konfiguriert (VITE_LS_CHECKOUT_URL fehlt).');
    return;
  }
  closePaywallModal();
  const url = `${LS_CHECKOUT_URL}?checkout[custom][event_id]=${currentEvent.id}&embed=1`;
  window.createLemonSqueezy?.();
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Url.Open(url);
  } else {
    window.open(url, '_blank');
  }
  pollForPayment(currentEvent.id);
}

function pollForPayment(eventId) {
  let attempts = 0;
  clearInterval(_pollTimer);
  showToast('Warte auf Zahlungsbestätigung…');
  _pollTimer = setInterval(async () => {
    attempts++;
    try {
      const ev = await getEvent(eventId);
      if (ev?.is_paid) {
        clearInterval(_pollTimer);
        currentEvent = ev;
        renderEvent();
        showToast('✓ Freigeschaltet! Buch jetzt exportieren.');
        openExportModal();
      } else if (attempts >= 30) {
        clearInterval(_pollTimer);
        showToast('Zahlung noch nicht bestätigt — lade die Seite neu.');
      }
    } catch {
      // transient network errors during polling are ignored
    }
  }, 2000);
}

$('#paywall-checkout-btn').addEventListener('click', startCheckout);
$('#paywall-cancel-btn').addEventListener('click', closePaywallModal);
$('#paywall-modal').addEventListener('click', function (e) { if (e.target === this) closePaywallModal(); });

// Selection handler for export themes
document.querySelectorAll('.theme-option').forEach(card => {
  card.addEventListener('click', function() {
    document.querySelectorAll('.theme-option').forEach(c => c.classList.remove('selected'));
    this.classList.add('selected');
    const radio = this.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  });
});

// Selection handler for export layout density
document.querySelectorAll('.layout-option').forEach(pill => {
  pill.addEventListener('click', function() {
    document.querySelectorAll('.layout-option').forEach(p => p.classList.remove('selected'));
    this.classList.add('selected');
    const radio = this.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;

    // Auto-disable cover toggle for Poster (compact) layout
    const layout = radio?.value;
    const coverRow = document.getElementById('cover-setting-row');
    const coverCheckbox = document.getElementById('export-cover-toggle');
    if (layout === 'compact') {
      if (coverRow) {
        coverRow.style.opacity = '0.4';
        coverRow.style.pointerEvents = 'none';
      }
      if (coverCheckbox) coverCheckbox.checked = false;
    } else {
      if (coverRow) {
        coverRow.style.opacity = '1';
        coverRow.style.pointerEvents = 'auto';
      }
      if (coverCheckbox) coverCheckbox.checked = true;
    }
  });
});

$('#export-confirm-btn').addEventListener('click', () => {
  const selectedTheme = document.querySelector('input[name="export-theme"]:checked')?.value || 'modern';
  const selectedLayout = document.querySelector('input[name="export-layout"]:checked')?.value || 'classic';
  const useCover = document.getElementById('export-cover-toggle')?.checked ?? true;
  closeExportModal();
  exportPDF(selectedTheme, selectedLayout, useCover);
});

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
