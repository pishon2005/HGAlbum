-- ==============================================================================
-- HGAlbum — Fix: vinculación de pareja robusta
--
-- Problemas corregidos:
-- 1. Al cambiarse de pareja, la pareja anterior quedaba huérfana (0 miembros)
--    con sus álbumes/fotos apuntando a ella. Ahora se reasigna el contenido
--    a la nueva pareja y se elimina la pareja vacía.
-- 2. Si el usuario ya pertenece a la pareja del código, se devuelve éxito
--    sin hacer nada (idempotente).
-- 3. Comparación del código insensible a mayúsculas/minúsculas.
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
  previous_couple_id uuid;
begin
  if caller_id is null then
    return json_build_object('success', false, 'error', 'No autenticado');
  end if;

  select * into target_couple
  from public.couples
  where invite_code = lower(trim(code));

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

  -- Vincular al usuario a la nueva pareja
  update public.profiles
  set couple_id = target_couple.id
  where id = caller_id;

  -- Si tenía una pareja anterior que se queda vacía, mover su contenido
  -- (álbumes y fotos) a la nueva pareja y eliminar la pareja huérfana.
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
