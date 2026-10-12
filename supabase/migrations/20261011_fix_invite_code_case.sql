-- ==============================================================================
-- HGAlbum — Fix: código de invitación rechazado por distinción mayús/minús
--
-- El invite_code se genera en hex minúsculas, pero la UI lo muestra/escribe
-- en mayúsculas. La comparación `invite_code = trim(code)` distingue caso.
-- Solución: normalizar con lower() dentro de la RPC.
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

  select * into target_couple
  from public.couples
  where invite_code = lower(trim(code));

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
