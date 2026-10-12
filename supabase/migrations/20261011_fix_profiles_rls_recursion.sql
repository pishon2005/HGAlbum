-- ==============================================================================
-- HGAlbum — Fix: "infinite recursion detected in policy for relation profiles"
--
-- Causa: las políticas de profiles (y de otras tablas) consultan la propia
-- tabla profiles con `couple_id in (select couple_id from profiles ...)`.
-- Al evaluar la política, Postgres aplica RLS de nuevo sobre profiles → ciclo.
--
-- Solución: función SECURITY DEFINER que devuelve el couple_id del usuario
-- actual omitiendo RLS, y reescritura de todas las políticas afectadas.
-- Ejecutar en el SQL Editor de Supabase (idempotente).
-- ==============================================================================

create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid()
$$;

-- COUPLES ---------------------------------------------------------------------
drop policy if exists "Couple members can view their couple" on public.couples;
create policy "Couple members can view their couple"
  on public.couples for select to authenticated
  using (id = public.my_couple_id());

-- PROFILES --------------------------------------------------------------------
drop policy if exists "Couple members can view partner profile" on public.profiles;
create policy "Couple members can view partner profile"
  on public.profiles for select to authenticated
  using (couple_id is not null and couple_id = public.my_couple_id());

-- ALBUMS ----------------------------------------------------------------------
drop policy if exists "Couple members can view their albums" on public.albums;
create policy "Couple members can view their albums"
  on public.albums for select to authenticated
  using (couple_id = public.my_couple_id());

drop policy if exists "Couple members can create albums" on public.albums;
create policy "Couple members can create albums"
  on public.albums for insert to authenticated
  with check (couple_id = public.my_couple_id());

drop policy if exists "Couple members can update their albums" on public.albums;
create policy "Couple members can update their albums"
  on public.albums for update to authenticated
  using (couple_id = public.my_couple_id());

drop policy if exists "Couple members can delete their albums" on public.albums;
create policy "Couple members can delete their albums"
  on public.albums for delete to authenticated
  using (couple_id = public.my_couple_id());

-- PHOTOS ----------------------------------------------------------------------
drop policy if exists "Couple members can view their photos" on public.photos;
create policy "Couple members can view their photos"
  on public.photos for select to authenticated
  using (couple_id = public.my_couple_id());

drop policy if exists "Couple members can create photos" on public.photos;
create policy "Couple members can create photos"
  on public.photos for insert to authenticated
  with check (couple_id = public.my_couple_id());

drop policy if exists "Couple members can update their photos" on public.photos;
create policy "Couple members can update their photos"
  on public.photos for update to authenticated
  using (couple_id = public.my_couple_id());

drop policy if exists "Couple members can delete their photos" on public.photos;
create policy "Couple members can delete their photos"
  on public.photos for delete to authenticated
  using (couple_id = public.my_couple_id());

-- REACTIONS -------------------------------------------------------------------
drop policy if exists "Couple members can view reactions on their photos" on public.reactions;
create policy "Couple members can view reactions on their photos"
  on public.reactions for select to authenticated
  using (
    photo_id in (
      select id from public.photos where couple_id = public.my_couple_id()
    )
  );

drop policy if exists "Users can insert their own reactions" on public.reactions;
create policy "Users can insert their own reactions"
  on public.reactions for insert to authenticated
  with check (
    user_id = auth.uid() and
    photo_id in (
      select id from public.photos where couple_id = public.my_couple_id()
    )
  );

-- SHARED_ALBUMS ---------------------------------------------------------------
drop policy if exists "Couple members can view their shared links" on public.shared_albums;
create policy "Couple members can view their shared links"
  on public.shared_albums for select to authenticated
  using (
    album_id in (
      select id from public.albums where couple_id = public.my_couple_id()
    )
  );

drop policy if exists "Couple members can create shared links" on public.shared_albums;
create policy "Couple members can create shared links"
  on public.shared_albums for insert to authenticated
  with check (
    album_id in (
      select id from public.albums where couple_id = public.my_couple_id()
    )
  );

drop policy if exists "Couple members can delete their shared links" on public.shared_albums;
create policy "Couple members can delete their shared links"
  on public.shared_albums for delete to authenticated
  using (
    album_id in (
      select id from public.albums where couple_id = public.my_couple_id()
    )
  );

-- STORAGE ---------------------------------------------------------------------
drop policy if exists "Couple members can upload to their folder" on storage.objects;
create policy "Couple members can upload to their folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] = public.my_couple_id()::text
  );

drop policy if exists "Couple members can view their files" on storage.objects;
create policy "Couple members can view their files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] = public.my_couple_id()::text
  );

drop policy if exists "Couple members can delete their files" on storage.objects;
create policy "Couple members can delete their files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] = public.my_couple_id()::text
  );
