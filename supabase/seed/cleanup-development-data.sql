-- Limpeza manual dos dados [DEV] da Sprint 01.
-- Não executar automaticamente.

delete from public.caravans
where id in (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102'
)
or title like '[DEV] %';
