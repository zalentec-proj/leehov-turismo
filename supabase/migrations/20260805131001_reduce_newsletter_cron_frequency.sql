do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'leehov-newsletter-campaigns-every-minute'
  ) then
    perform cron.unschedule('leehov-newsletter-campaigns-every-minute');
  end if;

  if not exists (
    select 1
    from cron.job
    where jobname = 'leehov-newsletter-campaigns-hourly'
  ) then
    perform cron.schedule(
      'leehov-newsletter-campaigns-hourly',
      '0 * * * *',
      'select private.dispatch_due_newsletter_campaigns()'
    );
  end if;
end
$$;
