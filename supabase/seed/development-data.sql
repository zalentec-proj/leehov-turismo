-- Dados de desenvolvimento idempotentes da Sprint 01.
-- Aplicar somente em ambientes autorizados.

insert into public.caravans (
  id, title, slug, destination, category_id, type, summary, description,
  duration, price, status, card_image_url, hero_image_url,
  is_group_trip, is_accompanied, has_portuguese_guide,
  has_leehov_representative, has_travel_kit, has_travel_insurance,
  min_people, max_people, leader_name, leader_bio,
  included, not_included, featured_home, featured_hero,
  hero_title, hero_description, hero_cta_text, hero_cta_url, hero_order,
  published, seo_title, seo_description, created_by, updated_by
)
values
(
  '00000000-0000-4000-8000-000000000101',
  '[DEV] Caravana Japão',
  'dev-caravana-japao',
  'Tóquio, Kyoto e Osaka',
  (select id from public.caravan_categories where slug = 'internacional'),
  'Cultural',
  'Uma experiência acompanhada entre tradição, espiritualidade, gastronomia e tecnologia.',
  'Roteiro em grupo para conhecer o Japão com planejamento, suporte e acompanhamento próximo da Leehov.',
  '14 dias',
  'Sob consulta',
  'available',
  'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=2000&q=90',
  true, true, true, true, true, true,
  18, 36,
  'Equipe Leehov',
  'Acompanhamento dedicado antes, durante e depois da viagem.',
  '["Hospedagem selecionada", "Traslados do roteiro", "Acompanhamento Leehov", "Guia em português"]'::jsonb,
  '["Passagens até o ponto de encontro", "Despesas pessoais", "Refeições não mencionadas"]'::jsonb,
  true, true,
  'Japão em grupo, com cada detalhe acompanhado',
  'Tóquio, Kyoto e Osaka em uma caravana cultural criada para viajar com confiança.',
  'Conhecer a caravana',
  '/caravanas/dev-caravana-japao',
  10,
  true,
  'Caravana Japão | Leehov Turismo',
  'Conheça a caravana acompanhada da Leehov para Tóquio, Kyoto e Osaka.',
  (select id from public.profiles where role = 'admin' and active = true order by created_at limit 1),
  (select id from public.profiles where role = 'admin' and active = true order by created_at limit 1)
),
(
  '00000000-0000-4000-8000-000000000102',
  '[DEV] Caravana Terra Santa',
  'dev-caravana-terra-santa',
  'Jerusalém, Belém e Galileia',
  (select id from public.caravan_categories where slug = 'religioso'),
  'Religioso',
  'Uma jornada de fé, história e comunhão em grupo.',
  'Caravana acompanhada aos principais lugares da Terra Santa, em preparação para futura publicação.',
  '12 dias',
  'Consulte valores',
  'draft',
  'https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=2000&q=90',
  true, true, true, true, false, true,
  20, 40,
  'Equipe Leehov',
  'Acompanhamento próximo para uma experiência segura e significativa.',
  '["Hospedagem", "Traslados", "Guia em português", "Acompanhamento Leehov"]'::jsonb,
  '["Despesas pessoais", "Documentação", "Serviços não descritos"]'::jsonb,
  false, false,
  null, null, null, null, 20,
  false,
  'Caravana Terra Santa | Leehov Turismo',
  'Roteiro acompanhado da Leehov por Jerusalém, Belém e Galileia.',
  (select id from public.profiles where role = 'admin' and active = true order by created_at limit 1),
  (select id from public.profiles where role = 'admin' and active = true order by created_at limit 1)
)
on conflict (id) do update set
  title = excluded.title,
  destination = excluded.destination,
  category_id = excluded.category_id,
  summary = excluded.summary,
  description = excluded.description,
  duration = excluded.duration,
  price = excluded.price,
  status = excluded.status,
  card_image_url = excluded.card_image_url,
  hero_image_url = excluded.hero_image_url,
  included = excluded.included,
  not_included = excluded.not_included,
  featured_home = excluded.featured_home,
  featured_hero = excluded.featured_hero,
  hero_title = excluded.hero_title,
  hero_description = excluded.hero_description,
  hero_cta_text = excluded.hero_cta_text,
  hero_cta_url = excluded.hero_cta_url,
  hero_order = excluded.hero_order,
  published = excluded.published,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_by = excluded.updated_by;

insert into public.caravan_departures (
  id, caravan_id, label, start_date, end_date, available_spots, status, notes, order_index
)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', 'Primavera no Japão', '2027-04-05', '2027-04-18', 24, 'available', 'Datas de desenvolvimento.', 10),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000101', 'Outono no Japão', '2027-10-11', '2027-10-24', 30, 'coming_soon', 'Datas de desenvolvimento.', 20),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000102', 'Terra Santa — Abril', '2027-04-12', '2027-04-23', 32, 'coming_soon', 'Rascunho de saída.', 10),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000102', 'Terra Santa — Outubro', '2027-10-04', '2027-10-15', 36, 'coming_soon', 'Rascunho de saída.', 20)
on conflict (id) do update set
  label = excluded.label,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  available_spots = excluded.available_spots,
  status = excluded.status,
  notes = excluded.notes,
  order_index = excluded.order_index;

insert into public.caravan_itinerary_days (
  id, caravan_id, day_number, title, location, description, meals, accommodation, order_index
)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000101', 1, 'Encontro do grupo', 'São Paulo / Tóquio', 'Recepção da equipe Leehov e início da viagem em grupo.', '["Refeição a bordo"]'::jsonb, 'A bordo', 10),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000101', 2, 'Chegada ao Japão', 'Tóquio', 'Acolhimento, traslado e orientação para os primeiros dias.', '["Café da manhã"]'::jsonb, 'Tóquio', 20),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000101', 3, 'Tradição e modernidade', 'Tóquio', 'Visita acompanhada a templos, bairros históricos e centros contemporâneos.', '["Café da manhã", "Almoço"]'::jsonb, 'Tóquio', 30),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000102', 1, 'Partida do grupo', 'São Paulo / Tel Aviv', 'Encontro com a equipe e embarque acompanhado.', '["Refeição a bordo"]'::jsonb, 'A bordo', 10),
  ('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000102', 2, 'Chegada e acolhimento', 'Tel Aviv', 'Traslado ao hotel, apresentação do roteiro e integração do grupo.', '["Jantar"]'::jsonb, 'Tel Aviv', 20),
  ('00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000000102', 3, 'Caminhos da Galileia', 'Galileia', 'Dia de visitas guiadas e momentos de reflexão.', '["Café da manhã", "Jantar"]'::jsonb, 'Galileia', 30)
on conflict (id) do update set
  title = excluded.title,
  location = excluded.location,
  description = excluded.description,
  meals = excluded.meals,
  accommodation = excluded.accommodation,
  order_index = excluded.order_index;
