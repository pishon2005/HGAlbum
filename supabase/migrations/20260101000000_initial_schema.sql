-- ==============================================================================
-- HGAlbum — Esquema completo (Fase 1 + Fase 2 Tareas 3 y 4)
-- Ejecutar de una sola vez en el SQL Editor de Supabase.
-- ==============================================================================

-- 1. EXTENSIONES
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. TABLAS (todas primero, sin políticas)
-- ==============================================================================

-- couples
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now() not null
);

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null,
  created_at timestamptz default now() not null
);

-- albums
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_photo_id uuid,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- media_type enum
create type public.media_type as enum ('photo', 'video');

-- photos
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.albums(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  media_type public.media_type default 'photo' not null,
  title text,
  description text,
  taken_at timestamptz,
  created_at timestamptz default now() not null
);

-- reactions
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid references public.photos(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now() not null,
  unique (photo_id, user_id, emoji)
);

-- shared_albums
create table public.shared_albums (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.albums(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ==============================================================================
-- 3. HABILITAR RLS EN TODAS
-- ==============================================================================
alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.reactions enable row level security;
alter table public.shared_albums enable row level security;

-- ==============================================================================
-- 3.5. FUNCIÓN AUXILIAR ANTI-RECURSIÓN
-- Las políticas necesitan saber el couple_id del usuario actual, pero hacerlo
-- con una subconsulta a profiles dentro de las políticas de profiles provoca
-- "infinite recursion detected in policy". Una función SECURITY DEFINER se
-- ejecuta como el propietario y omite RLS, rompiendo el ciclo.
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

-- ==============================================================================
-- 4. POLÍTICAS RLS — COUPLES
-- ==============================================================================
create policy "Couple members can view their couple"
  on public.couples for select to authenticated
  using (id = public.my_couple_id());

create policy "Authenticated users can create a couple"
  on public.couples for insert to authenticated
  with check (true);

create policy "Authenticated can find couple to join"
  on public.couples for select to authenticated
  using (true);

-- ==============================================================================
-- 5. POLÍTICAS RLS — PROFILES
-- ==============================================================================
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Couple members can view partner profile"
  on public.profiles for select to authenticated
  using (
    couple_id is not null and
    couple_id = public.my_couple_id()
  );

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- ==============================================================================
-- 6. POLÍTICAS RLS — ALBUMS
-- ==============================================================================
create policy "Couple members can view their albums"
  on public.albums for select to authenticated
  using (couple_id = public.my_couple_id());

create policy "Couple members can create albums"
  on public.albums for insert to authenticated
  with check (couple_id = public.my_couple_id());

create policy "Couple members can update their albums"
  on public.albums for update to authenticated
  using (couple_id = public.my_couple_id());

create policy "Couple members can delete their albums"
  on public.albums for delete to authenticated
  using (couple_id = public.my_couple_id());

-- ==============================================================================
-- 7. POLÍTICAS RLS — PHOTOS
-- ==============================================================================
create policy "Couple members can view their photos"
  on public.photos for select to authenticated
  using (couple_id = public.my_couple_id());

create policy "Couple members can create photos"
  on public.photos for insert to authenticated
  with check (couple_id = public.my_couple_id());

create policy "Couple members can update their photos"
  on public.photos for update to authenticated
  using (couple_id = public.my_couple_id());

create policy "Couple members can delete their photos"
  on public.photos for delete to authenticated
  using (couple_id = public.my_couple_id());

-- ==============================================================================
-- 8. POLÍTICAS RLS — REACTIONS
-- ==============================================================================
create policy "Couple members can view reactions on their photos"
  on public.reactions for select to authenticated
  using (
    photo_id in (
      select id from public.photos
      where couple_id = public.my_couple_id()
    )
  );

create policy "Users can insert their own reactions"
  on public.reactions for insert to authenticated
  with check (
    user_id = auth.uid() and
    photo_id in (
      select id from public.photos
      where couple_id = public.my_couple_id()
    )
  );

create policy "Users can delete their own reactions"
  on public.reactions for delete to authenticated
  using (user_id = auth.uid());

-- ==============================================================================
-- 9. POLÍTICAS RLS — SHARED_ALBUMS
-- ==============================================================================
create policy "Couple members can view their shared links"
  on public.shared_albums for select to authenticated
  using (
    album_id in (
      select id from public.albums
      where couple_id = public.my_couple_id()
    )
  );

create policy "Couple members can create shared links"
  on public.shared_albums for insert to authenticated
  with check (
    album_id in (
      select id from public.albums
      where couple_id = public.my_couple_id()
    )
  );

create policy "Couple members can delete their shared links"
  on public.shared_albums for delete to authenticated
  using (
    album_id in (
      select id from public.albums
      where couple_id = public.my_couple_id()
    )
  );

create policy "Anyone can validate a shared token"
  on public.shared_albums for select to anon
  using (expires_at is null or expires_at > now());

-- ==============================================================================
-- 10. STORAGE BUCKET + POLÍTICAS
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('album-media', 'album-media', false)
on conflict (id) do nothing;

create policy "Couple members can upload to their folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] = public.my_couple_id()::text
  );

create policy "Couple members can view their files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] = public.my_couple_id()::text
  );

create policy "Couple members can delete their files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] = public.my_couple_id()::text
  );

create policy "Anyone can view files of actively shared albums"
  on storage.objects for select to anon
  using (
    bucket_id = 'album-media' and
    exists (
      select 1
      from public.photos p
      join public.shared_albums s on s.album_id = p.album_id
      where p.storage_path = name
        and (s.expires_at is null or s.expires_at > now())
    )
  );

-- ==============================================================================
-- 11. FUNCIONES RPC
-- ==============================================================================

-- Unirse a una pareja por código
create or replace function public.join_couple_by_code(code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  target_couple record;
  member_count int;
  caller_id uuid := auth.uid();
  previous_couple_id uuid;
begin
  if caller_id is null then
    return json_build_object('success', false, 'error', 'No autenticado');
  end if;

  select * into target_couple from public.couples where invite_code = lower(trim(code));
  if not found then
    return json_build_object('success', false, 'error', 'Código de invitación no válido o inexistente');
  end if;

  -- Pareja actual del usuario (si tiene)
  select couple_id into previous_couple_id
  from public.profiles
  where id = caller_id;

  -- Ya está en esa pareja: nada que hacer
  if previous_couple_id = target_couple.id then
    return json_build_object('success', true, 'couple_id', target_couple.id);
  end if;

  select count(*) into member_count from public.profiles where couple_id = target_couple.id;
  if member_count >= 2 then
    return json_build_object('success', false, 'error', 'Esta pareja ya cuenta con el máximo de 2 integrantes');
  end if;

  update public.profiles
  set couple_id = target_couple.id
  where id = caller_id;

  -- Si la pareja anterior queda vacía, mover su contenido y eliminarla
  if previous_couple_id is not null and previous_couple_id <> target_couple.id then
    if (select count(*) from public.profiles where couple_id = previous_couple_id) = 0 then
      update public.albums set couple_id = target_couple.id where couple_id = previous_couple_id;
      update public.photos set couple_id = target_couple.id where couple_id = previous_couple_id;
      delete from public.couples where id = previous_couple_id;
    end if;
  end if;

  return json_build_object('success', true, 'couple_id', target_couple.id);
end;
$$;

-- Validar token de álbum compartido
create or replace function public.get_album_by_token(p_token text)
returns table (album_id uuid, expires_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select album_id, expires_at
  from public.shared_albums
  where token = p_token
    and (expires_at is null or expires_at > now())
  limit 1;
$$;

-- Contenido completo de un álbum compartido
create or replace function public.get_shared_album_content(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  share record;
  album record;
  photos json;
begin
  select * into share
  from public.shared_albums
  where token = p_token
    and (expires_at is null or expires_at > now())
  limit 1;

  if not found then
    return json_build_object('success', false, 'error', 'Enlace no válido o caducado');
  end if;

  select * into album from public.albums where id = share.album_id;

  select coalesce(json_agg(row_to_json(p) order by p.taken_at desc), '[]'::json)
  into photos
  from (
    select id, album_id, couple_id, storage_path, media_type, title, description, taken_at, created_at
    from public.photos
    where album_id = share.album_id
  ) p;

  return json_build_object(
    'success', true,
    'album', json_build_object(
      'id', album.id,
      'name', album.name,
      'description', album.description,
      'created_at', album.created_at
    ),
    'photos', photos
  );
end;
$$;

-- Permisos de ejecución
grant execute on function public.join_couple_by_code(text) to authenticated;
grant execute on function public.get_album_by_token(text) to anon, authenticated;
grant execute on function public.get_shared_album_content(text) to anon, authenticated