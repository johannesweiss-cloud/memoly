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

Supabase Storage has its own RLS separate from the DB policies. For v1, keep it simple:

- **Download (GET):** public, no policy needed on a public bucket.
- **Upload (INSERT):** allow all — the anon key is sufficient. Tighten later if abuse becomes a concern.
- **Delete:** restrict to service-role key (only called server-side if you add a cleanup job later).
