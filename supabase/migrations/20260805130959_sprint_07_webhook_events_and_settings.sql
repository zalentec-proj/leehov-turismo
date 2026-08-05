alter type public.webhook_event add value if not exists 'lead.updated';
alter type public.webhook_event add value if not exists 'lead.status_changed';
alter type public.webhook_event add value if not exists 'lead.interaction.created';

alter table public.webhooks drop constraint webhooks_events_not_empty;
alter table public.webhooks
  add constraint webhooks_events_not_empty check (cardinality(events) between 1 and 14);

alter table public.email_logs drop constraint email_logs_template_key_allowed;
alter table public.email_logs
  add constraint email_logs_template_key_allowed check (
    template_key in (
      'admin_caravan_lead',
      'visitor_caravan_lead_confirmation',
      'admin_contact',
      'visitor_contact_confirmation',
      'newsletter_double_opt_in',
      'newsletter_welcome',
      'newsletter_campaign',
      'newsletter_campaign_test'
    )
  );

update public.site_settings
set value = value || jsonb_build_object(
  'provider', coalesce(value ->> 'provider', 'manual'),
  'evolutionBaseUrl', coalesce(value ->> 'evolutionBaseUrl', ''),
  'evolutionInstance', coalesce(value ->> 'evolutionInstance', ''),
  'generalTemplate', coalesce(value ->> 'generalTemplate', 'Olá, {{nome}}! Aqui é {{consultor}} da Leehov Turismo.'),
  'caravanTemplate', coalesce(value ->> 'caravanTemplate', 'Olá, {{nome}}! Vimos seu interesse na caravana {{caravana}}. Aqui é {{consultor}} da Leehov Turismo.')
)
where key = 'whatsapp_settings';
