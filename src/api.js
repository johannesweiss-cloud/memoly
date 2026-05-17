import { getClient, rebuildClient } from './supabase.js';

const STORAGE_KEY = 'memoly_edit_tokens';

function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeTokens(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function storeToken(eventId, token) {
  const map = readTokens();
  map[eventId] = token;
  writeTokens(map);
}

export function getEditToken(eventId) {
  if (!eventId) return null;
  return readTokens()[eventId] || null;
}

/**
 * Setzt das aktive Event und baut den Supabase-Client mit dessen edit_token neu auf.
 * Muss vor Write-Operationen aufgerufen werden (createEvent macht es automatisch).
 */
export function setActiveEvent(eventId) {
  rebuildClient(getEditToken(eventId));
}

/**
 * Entfernt den edit_token eines Events aus dem lokalen Speicher und setzt den
 * Client auf "ohne Token" zurück.
 */
export function clearEditToken(eventId) {
  const map = readTokens();
  delete map[eventId];
  writeTokens(map);
  rebuildClient(null);
}

/**
 * Holt ein Event anhand der ID aus der Datenbank.
 * GEMAESS GUIDELINES: Niemals edit_token abfragen!
 */
export async function getEvent(id) {
  const { data, error } = await getClient()
    .from('events')
    .select('id, title, subtitle, tag, is_paid, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Erstellt ein neues Event in Supabase.
 * Speichert den edit_token unter der Event-ID und macht das Event zum aktiven.
 */
export async function createEvent(eventData) {
  const { data, error } = await getClient()
    .from('events')
    .insert([eventData])
    .select('id, title, subtitle, tag, is_paid, edit_token')
    .single();

  if (error) throw error;

  if (data.edit_token) {
    storeToken(data.id, data.edit_token);
    rebuildClient(data.edit_token);
  }

  return data;
}

/**
 * Aktualisiert ein bestehendes Event (z.B. nach Zahlung).
 * Voraussetzung: setActiveEvent(id) wurde vorher aufgerufen, oder das Event
 * wurde gerade per createEvent angelegt.
 */
export async function updateEvent(id, updates) {
  const { data, error } = await getClient()
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('id, title, subtitle, tag, is_paid')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lädt alle Moments (Dates) für ein Event.
 */
export async function getMoments(eventId) {
  const { data, error } = await getClient()
    .from('moments')
    .select('id, event_id, title, description, sort_order, image_path, created_at')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Erstellt ein neues Moment.
 */
export async function createMoment(momentData) {
  const { data, error } = await getClient()
    .from('moments')
    .insert([momentData])
    .select('id, event_id, title, description, sort_order, image_path');

  if (error) throw error;
  return data[0];
}

/**
 * Aktualisiert ein Moment (z.B. den image_path nach Upload).
 */
export async function updateMoment(id, updates) {
  const { data, error } = await getClient()
    .from('moments')
    .update(updates)
    .eq('id', id)
    .select('id, event_id, title, description, sort_order, image_path');

  if (error) throw error;
  return data[0];
}

/**
 * Löscht ein Moment.
 */
export async function deleteMoment(id) {
  const { error } = await getClient()
    .from('moments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Lädt alle Extras für ein Event.
 */
export async function getExtras(eventId) {
  const { data, error } = await getClient()
    .from('extras')
    .select('id, event_id, sort_order, image_path')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fügt ein neues Extra hinzu.
 */
export async function createExtra(extraData) {
  const { data, error } = await getClient()
    .from('extras')
    .insert([extraData])
    .select('id, event_id, sort_order, image_path');

  if (error) throw error;
  return data[0];
}

/**
 * Löscht ein Extra.
 */
export async function deleteExtra(id) {
  const { error } = await getClient()
    .from('extras')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Lädt einen Bild-Blob in den event-images Bucket hoch.
 * Pfad-Konvention: <eventId>/moments/<momentId>.jpg oder <eventId>/extras/<extraId>.jpg
 */
export async function uploadImage(path, blob) {
  const { error } = await getClient().storage
    .from('event-images')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

  if (error) throw error;
  return path;
}

/**
 * Hilfsfunktion, um die Public URL eines Bildes zu bekommen.
 */
export function getPublicImageUrl(imagePath) {
  if (!imagePath) return null;
  const { data } = getClient().storage
    .from('event-images')
    .getPublicUrl(imagePath);
  return data.publicUrl;
}
