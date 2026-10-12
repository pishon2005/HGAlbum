-- ==============================================================================
-- HGAlbum — Migración Inicial (Fase 1: Cimientos y Seguridad)
-- ==============================================================================

-- 1. Extensiones necesarias
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. Tabla: couples (se crea primero para que profiles pueda referenciarla)
-- ==============================================================================
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now() not null
);

alter table public.couples enable row level security;

-- Política para que los miembros de la pareja puedan ver su propia pareja
create policy "Couple members can view their couple"
  on public.couples for select
  to authenticated
  using (
    id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

-- Política para crear una pareja (al registrarse)
create policy "Anyone can create a couple"
  on public.couples for insert
  to authenticated
  with check (true);

-- Política para permitir buscar una pareja por código de invitación para unirse
create policy "Anyone authenticated can find couple to join"
  on public.couples for select
  to authenticated
  using (true);

-- ==============================================================================
-- 3. Tabla: profiles
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Miembros de la misma pareja pueden ver el perfil de su pareja
create policy "Couple members can view partner profile"
  on public.profiles for select
  to authenticated
  using (
    couple_id is not null and
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ==============================================================================
-- 4. Tabla: albums
-- ==============================================================================
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_photo_id uuid,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table public.albums enable row level security;

create policy "Couple members can view their albums"
  on public.albums for select
  to authenticated
  using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "Couple members can create albums"
  on public.albums for insert
  to authenticated
  with check (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "Couple members can update their albums"
  on public.albums for update
  to authenticated
  using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "Couple members can delete their albums"
  on public.albums for delete
  to authenticated
  using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

-- ==============================================================================
-- 5. Tabla: photos
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'media_type') then
    create type public.media_type as enum ('photo', 'video');
  end if;
end $$;

create table if not exists public.photos (
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

alter table public.photos enable row level security;

create policy "Couple members can view their photos"
  on public.photos for select
  to authenticated
  using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "Couple members can create photos"
  on public.photos for insert
  to authenticated
  with check (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "Couple members can update their photos"
  on public.photos for update
  to authenticated
  using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "Couple members can delete their photos"
  on public.photos for delete
  to authenticated
  using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

-- ==============================================================================
-- 6. Bucket de Storage: album-media y políticas RLS
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('album-media', 'album-media', false)
on conflict (id) do nothing;

-- Política de Storage: los miembros de la pareja pueden subir a su carpeta
create policy "Couple members can upload to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] in (
      select couple_id::text from public.profiles where id = auth.uid()
    )
  );

-- Política de Storage: los miembros de la pareja pueden ver sus archivos
create policy "Couple members can view their files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'album-media' and
    (storage.foldername(name))[1] in (
      select couple_id::text from public.profiles where id = auth.uid()
    )
  );

-- ==============================================================================
-- 7. Función RPC de ayuda: join_couple_by_code
-- Permite validar y vincularse atómicamente a una pareja mediante su código.
-- ==============================================================================
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
begin
  if caller_id is null then
    return json_build_object('success', false, 'error', 'No autenticado');
  end if;

  select * into target_couple from public.couples where invite_code = trim(code);
  if not found then
    return json_build_object('success', false, 'error', 'Código de invitación no válido o inexistente');
  end if;

  select count(*) into member_count from public.profiles where couple_id = target_couple.id;
  if member_count >= 2 then
    return json_build_object('success', false, 'error', 'Esta pareja ya cuenta con el máximo de 2 integrantes');
  end if;

  update public.profiles
  set couple_id = target_couple.id
  where id = caller_id;

  return json_build_object('success', true, 'couple_id', target_couple.id);
end;
$$;
