-- ==============================================================================
-- HGAlbum — Habilitar Supabase Realtime para actualización en vivo
--
-- Permite que cuando un miembro de la pareja suba/edite/elimine fotos,
-- la otra persona vea los cambios al instante sin recargar la página.
-- ==============================================================================

alter publication supabase_realtime add table public.photos;
alter publication supabase_realtime add table public.albums;
alter publication supabase_realtime add table public.reactions;
