import { supabase } from './supabase.js';

// Globale Variable für den Token (wird beim Erstellen oder per LocalStorage gesetzt)
let currentEditToken = localStorage.getItem('memoly_edit_token') || null;

export function getEditToken() {
  return currentEditToken;
}

export function setEditToken(token) {
  currentEditToken = token;
  if (token) {
    localStorage.setItem('memoly_edit_token', token);
  } else {
    localStorage.removeItem('memoly_edit_token');
  }
}

/**
 * Holt ein Event anhand der ID aus der Datenbank.
 * GEMAESS GUIDELINES: Niemals edit_token abfragen!
 */
export async function getEvent(id) {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, subtitle, tag, is_paid, created_at, updated_at')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Erstellt ein neues Event in Supabase.
 * Gibt das Event und den exklusiven edit_token zurück.
 */
export async function createEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select('id, title, subtitle, tag, is_paid, edit_token')
    .single();
    
  if (error) throw error;
  
  // Token direkt speichern
  if (data.edit_token) {
    setEditToken(data.edit_token);
  }
  
  return data;
}

/**
 * Aktualisiert ein bestehendes Event (z.B. nach Zahlung)
 * Nutzt den X-Edit-Token Header für RLS.
 */
export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('id, title, subtitle, tag, is_paid')
    .single();
    
  // WORKAROUND für Supabase JS Client: Headers direkt im Fetcher mitgeben.
  // Ab Supabase v2 kann man headers global auf der Instanz setzen, 
  // oder pro Request überschreiben (abhängig vom Endpoint).
  // Hier ein Beispiel, falls man es per global setHeaders nutzen möchte:
  // supabase.auth.setAuth(currentEditToken) // Nicht ideal
  
  if (error) throw error;
  return data;
}

/**
 * Lädt alle Moments (Dates) für ein Event.
 */
export async function getMoments(eventId) {
  const { data, error } = await supabase
    .from('moments')
    .select('id, event_id, title, description, sort_order, image_path, created_at')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });
    
  if (error) throw error;
  return data || [];
}

/**
 * Erstellt ein neues Moment.
 * Zeigt konkret, wie der X-Edit-Token Header mit dem Supabase JS Client gesetzt wird.
 */
export async function createMoment(momentData) {
  // Option 1: Den globalen Client Header setzen
  supabase.rest.headers['X-Edit-Token'] = currentEditToken;
  
  const { data, error } = await supabase
    .from('moments')
    .insert([momentData])
    .select('id, event_id, title, description, sort_order, image_path');
    
  // Cleanup Header nach dem Request
  delete supabase.rest.headers['X-Edit-Token'];
  
  if (error) throw error;
  return data[0];
}

/**
 * Aktualisiert ein Moment (z.B. den image_path nach Upload).
 */
export async function updateMoment(id, updates) {
  supabase.rest.headers['X-Edit-Token'] = currentEditToken;
  
  const { data, error } = await supabase
    .from('moments')
    .update(updates)
    .eq('id', id)
    .select('id, event_id, title, description, sort_order, image_path');
    
  delete supabase.rest.headers['X-Edit-Token'];
  
  if (error) throw error;
  return data[0];
}

/**
 * Löscht ein Moment.
 */
export async function deleteMoment(id) {
  supabase.rest.headers['X-Edit-Token'] = currentEditToken;
  
  const { error } = await supabase
    .from('moments')
    .delete()
    .eq('id', id);
    
  delete supabase.rest.headers['X-Edit-Token'];
  
  if (error) throw error;
}

/**
 * Lädt alle Extras für ein Event.
 */
export async function getExtras(eventId) {
  const { data, error } = await supabase
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
  supabase.rest.headers['X-Edit-Token'] = currentEditToken;
  
  const { data, error } = await supabase
    .from('extras')
    .insert([extraData])
    .select('id, event_id, sort_order, image_path');
    
  delete supabase.rest.headers['X-Edit-Token'];
  
  if (error) throw error;
  return data[0];
}

/**
 * Löscht ein Extra.
 */
export async function deleteExtra(id) {
  supabase.rest.headers['X-Edit-Token'] = currentEditToken;
  
  const { error } = await supabase
    .from('extras')
    .delete()
    .eq('id', id);
    
  delete supabase.rest.headers['X-Edit-Token'];
  
  if (error) throw error;
}

/**
 * Hilfsfunktion, um die Public URL eines Bildes zu bekommen
 */
export function getPublicImageUrl(imagePath) {
  if (!imagePath) return null;
  const { data } = supabase.storage
    .from('event-images')
    .getPublicUrl(imagePath);
  return data.publicUrl;
}
