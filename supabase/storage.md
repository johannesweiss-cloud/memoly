# Storage Structure

## Bucket: `event-images`

- **Visibility:** public (files are readable without authentication via the public URL)
- Create manually in the Supabase Dashboard under Storage → New bucket → name `event-images`, toggle Public on.

## Folder convention

```
event-images/
  <event_id>/
    moments/
      <moment_id>.<ext>   -- one file per moment card
    extras/
      <extra_id>.<ext>    -- one file per extra photo
```

Using the row's own UUID as the filename means no collisions and no separate name field needed.

## image_path column

`moments.image_path` and `extras.image_path` store the path **within** the bucket, e.g.:

```
a1b2c3d4-.../moments/e5f6g7h8-....jpg
```

To build the public URL in the client:

```js
const { data } = supabase.storage.from('event-images').getPublicUrl(image_path)
// data.publicUrl → https://<project>.supabase.co/storage/v1/object/public/event-images/<image_path>
```

## Upload flow

1. Client resizes image (already done client-side in v0).
2. Upload to `event-images/<event_id>/moments/<moment_id>.jpg` using the anon key — no auth needed since the bucket is public.
3. Save the returned path into `moments.image_path` (or `extras.image_path`).

## Storage RLS

Supabase Storage hat sein eigenes RLS auf `storage.objects` — die DB-Policies aus dem Schema reichen **nicht**. Für v1 brauchen wir drei Policies, die alle direkt im SQL Editor anzulegen sind:

```sql
-- INSERT: Uploads erlauben
create policy "Anyone can upload to event-images"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'event-images');

-- UPDATE: weil .upload(path, blob, { upsert: true }) im Re-Upload-Fall UPDATE auslöst
create policy "Anyone can update event-images"
  on storage.objects for update to anon, authenticated
  using      (bucket_id = 'event-images')
  with check (bucket_id = 'event-images');

-- SELECT: Pflicht trotz Public-Bucket — die JS-SDK-Methode .upload() macht nach dem
-- INSERT intern noch ein SELECT auf storage.objects, um die Metadaten zurückzugeben.
-- Ohne diese Policy schlägt der Upload mit "new row violates row-level security
-- policy" fehl, obwohl die INSERT-Policy stimmt. Public-Bucket-Setting allein deckt
-- nur Public-URL-GETs ab, nicht den SELECT auf der Tabelle.
create policy "Anyone can read event-images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'event-images');
```

- **Delete:** keine Policy → bleibt der `service_role` vorbehalten (nur server-seitig nötig, falls später ein Cleanup-Job dazukommt).
