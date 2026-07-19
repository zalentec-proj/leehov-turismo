insert into public.blog_categories (name, slug, description)
values
  ('Destinos', 'destinos', 'Guias e inspirações sobre destinos visitados pela Leehov.'),
  ('Dicas de viagem', 'dicas-de-viagem', 'Informações práticas para planejar viagens com tranquilidade.'),
  ('Viagens em grupo', 'viagens-em-grupo', 'Conteúdos sobre experiências, segurança e acompanhamento em grupo.'),
  ('História e fé', 'historia-e-fe', 'Histórias, cultura e espiritualidade dos destinos visitados.')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;
