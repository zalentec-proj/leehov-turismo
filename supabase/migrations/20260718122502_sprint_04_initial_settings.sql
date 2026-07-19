-- Sprint 04: safe, inactive defaults only.
insert into public.google_business_settings (
  singleton,
  enabled,
  display_mode,
  reviews_limit,
  min_rating,
  cache_hours
)
values (true, false, 'manual', 6, 4, 24)
on conflict (singleton) do nothing;

insert into public.site_settings (key, value, public_read)
values
  (
    'contact_info',
    '{"phone":"","contactEmail":"contato@leehovturismo.com.br","address":""}'::jsonb,
    true
  ),
  (
    'whatsapp_settings',
    '{"number":"","defaultMessage":"Olá! Gostaria de falar com a equipe Leehov.","caravanMessage":"Olá! Gostaria de saber mais sobre esta caravana."}'::jsonb,
    true
  ),
  (
    'social_links',
    '{"instagram":"","facebook":"","youtube":""}'::jsonb,
    true
  ),
  (
    'home_settings',
    '{"videoUrl":"","testimonialsEyebrow":"Avaliado por quem viaja conosco","testimonialsTitle":"Depoimentos"}'::jsonb,
    true
  ),
  (
    'seo_global',
    '{"siteName":"Leehov Turismo","titleTemplate":"%s | Leehov Turismo","defaultDescription":"Caravanas e viagens em grupo acompanhadas pela Leehov Turismo."}'::jsonb,
    true
  ),
  (
    'email_settings',
    '{"enabled":true,"visitorConfirmationsEnabled":true,"contactRecipients":[],"leadRecipients":[],"senderName":"Leehov Turismo","replyTo":"","footerText":"Leehov Turismo","whatsapp":""}'::jsonb,
    false
  ),
  (
    'analytics_settings',
    '{"gaMeasurementId":"","gtmContainerId":"","metaPixelId":""}'::jsonb,
    false
  ),
  (
    'cookie_consent',
    '{"enabled":true,"version":1,"durationDays":180}'::jsonb,
    true
  )
on conflict (key) do nothing;
