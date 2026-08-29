alter table public.email_logs
  drop constraint if exists email_logs_template_key_allowed;

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
      'newsletter_campaign_test',
      'admin_user_invite',
      'admin_password_recovery',
      'admin_email_change_confirmation',
      'admin_email_changed',
      'admin_access_changed'
    )
  );
