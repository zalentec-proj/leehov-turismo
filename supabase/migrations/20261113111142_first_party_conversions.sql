-- Private, first-party measurement; public requests only go through the application.
create table public.site_measurement_events (
  id uuid primary key,
  kind text not null check (kind in ('page', 'whatsapp')),
  occurred_at timestamptz not null default now(),
  visitor_id uuid not null,
  session_id uuid not null,
  page_path text not null check (length(page_path) between 1 and 180),
  caravan_id uuid references public.caravans(id) on delete set null,
  attribution jsonb not null check (jsonb_typeof(attribution) = 'object'),
  reference text unique check (reference ~ '^LH-[A-Z0-9]{14}$'),
  linked_lead_id uuid references public.leads(id) on delete set null,
  is_test boolean not null default false,
  check ((kind = 'whatsapp') = (reference is not null))
);

-- Keep an erased browser from being reinserted by an in-flight request.
create table private.site_measurement_erased (
  visitor_id uuid primary key,
  expires_at timestamptz not null default (now() + interval '180 days')
);
alter table private.site_measurement_erased enable row level security;
revoke all on private.site_measurement_erased from public, anon, authenticated;
grant select, insert, update, delete on private.site_measurement_erased to service_role;
grant usage on schema private to service_role;

create function private.measurement_is_erased(p_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_id is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('leehov-visitor:' || p_id::text, 0));
  return exists (select 1 from private.site_measurement_erased where visitor_id = p_id and expires_at > now());
end;
$$;

create function private.prevent_erased_measurement()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if private.measurement_is_erased(new.visitor_id) then return null; end if;
  return new;
end;
$$;
create trigger prevent_erased_measurement before insert on public.site_measurement_events
for each row execute function private.prevent_erased_measurement();
revoke all on function private.measurement_is_erased(uuid), private.prevent_erased_measurement() from public, anon, authenticated;
grant execute on function private.measurement_is_erased(uuid), private.prevent_erased_measurement() to service_role;

create index site_measurement_date_idx on public.site_measurement_events (is_test, occurred_at);
create index site_measurement_visitor_idx on public.site_measurement_events (visitor_id);
create index site_measurement_lead_idx on public.site_measurement_events (linked_lead_id) where linked_lead_id is not null;

create function private.normalize_lead_phone(p_phone text)
returns text language sql immutable strict security invoker set search_path = '' as $$
  select case
    when d ~ '^[0-9]{10,11}$' and p_phone !~ '^\s*\+' then '55' || d
    when d ~ '^00[0-9]{10,15}$' then substring(d from 3)
    when d ~ '^[0-9]{10,15}$' then d
    else null end
  from (select regexp_replace(p_phone, '[^0-9]', '', 'g') as d) cleaned;
$$;

alter table public.leads
  add column normalized_phone text generated always as (private.normalize_lead_phone(phone)) stored,
  add column commercial_stage text check (commercial_stage in ('new','contact_received','qualified','quote_requested','proposal_sent','negotiation','won','lost')),
  add column marketing_attribution jsonb not null default '{}' check (jsonb_typeof(marketing_attribution) = 'object'),
  add column attribution_basis text check (attribution_basis in ('observed', 'reported')),
  add column attribution_visitor_id uuid,
  add column is_test boolean not null default false,
  add column contact_received_at timestamptz,
  add column quote_requested_at timestamptz,
  add column proposal_sent_at timestamptz,
  add column closed_at timestamptz,
  add column loss_reason text check (length(loss_reason) <= 500),
  add column next_action text check (length(next_action) <= 240),
  add column proposal_minor bigint check (proposal_minor > 0 and proposal_minor <= 10000000000),
  add column proposal_currency text check (proposal_currency in ('BRL','USD','EUR')),
  add column sale_minor bigint check (sale_minor > 0 and sale_minor <= 10000000000),
  add column sale_currency text check (sale_currency in ('BRL','USD','EUR')),
  add constraint leads_proposal_currency_pair check ((proposal_minor is null) = (proposal_currency is null)),
  add constraint leads_sale_currency_pair check ((sale_minor is null) = (sale_currency is null)),
  add constraint leads_won_requires_sale check (commercial_stage <> 'won' or (sale_minor is not null and closed_at is not null));

-- Keep existing lead columns available under the existing RLS policy.
-- Browser capability digests and new analytics fields are server-only.
revoke select on public.leads from authenticated;
grant select (id,name,email,phone,city,state,message,source,caravan_id,status,metadata,updated_by,created_at,updated_at,assigned_to,next_follow_up_at)
on public.leads to authenticated;

create index leads_normalized_phone_idx on public.leads (normalized_phone, is_test, created_at, id) where normalized_phone is not null;
create index leads_attribution_visitor_idx on public.leads (attribution_visitor_id) where attribution_visitor_id is not null;

create table public.lead_caravan_interests (
  lead_id uuid not null references public.leads(id) on delete cascade,
  caravan_id uuid not null references public.caravans(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, caravan_id)
);
create index lead_caravan_interests_caravan_idx on public.lead_caravan_interests (caravan_id, lead_id);

create table public.lead_conversion_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null check (kind in ('lead_created','lead_updated','form_submitted','contact_received','quote_requested','proposal_sent','sale_won','sale_cancelled','stage_change')),
  occurred_at timestamptz not null default now(),
  recorded_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  caravan_id uuid references public.caravans(id) on delete set null,
  amount_minor bigint,
  currency text check (currency in ('BRL','USD','EUR')),
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  attribution jsonb not null default '{}' check (jsonb_typeof(attribution) = 'object'),
  attribution_basis text check (attribution_basis in ('observed','reported')),
  attribution_visitor_id uuid,
  check ((amount_minor is null) = (currency is null)),
  check (amount_minor is null or amount_minor between 1 and 10000000000)
);
create index lead_conversion_date_idx on public.lead_conversion_events (occurred_at, kind);
create index lead_conversion_visitor_idx on public.lead_conversion_events (attribution_visitor_id) where attribution_visitor_id is not null;
create index lead_conversion_history_idx on public.lead_conversion_events (lead_id, occurred_at);

create table public.campaign_spend (
  day date not null,
  channel text not null,
  medium text not null default '' check (length(medium) <= 100),
  campaign text not null default '' check (length(campaign) <= 100),
  currency text not null check (currency in ('BRL','USD','EUR')),
  amount_minor bigint not null check (amount_minor between 0 and 10000000000),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (day, channel, medium, campaign, currency)
);

alter table public.site_measurement_events enable row level security;
alter table public.lead_caravan_interests enable row level security;
alter table public.lead_conversion_events enable row level security;
alter table public.campaign_spend enable row level security;

revoke all on public.site_measurement_events, public.lead_caravan_interests,
  public.lead_conversion_events, public.campaign_spend from public, anon, authenticated;
grant select, insert, update, delete on public.site_measurement_events, public.lead_caravan_interests,
  public.lead_conversion_events, public.campaign_spend to service_role;

insert into public.permissions (key,module,action,label,sort_order) values
  ('conversions.view','conversions','view','Visualizar conversões e leads',101),
  ('conversions.export','conversions','export','Exportar resultados de conversões',102),
  ('conversions.manage_costs','conversions','manage_costs','Registrar investimento em campanhas',103);

-- Keep the origin as it was when the event happened, not when a report runs.
create function private.snapshot_lead_conversion()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.attribution_basis is null and new.kind not in ('form_submitted','sale_cancelled') then
    select l.marketing_attribution, l.attribution_basis, l.attribution_visitor_id
    into new.attribution, new.attribution_basis, new.attribution_visitor_id
    from public.leads l where l.id = new.lead_id;
  end if;
  return new;
end;
$$;
create trigger snapshot_lead_conversion before insert on public.lead_conversion_events
for each row execute function private.snapshot_lead_conversion();
revoke all on function private.snapshot_lead_conversion() from public, anon, authenticated;
grant execute on function private.snapshot_lead_conversion() to service_role;

-- A phone lock prevents races without imposing a new uniqueness constraint on
-- historical data. The idempotency key only applies to a specific submission.
create function public.capture_conversion_lead(p_data jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_phone text := private.normalize_lead_phone(p_data->>'phone');
  v_lead public.leads%rowtype;
  v_attempt public.site_measurement_events%rowtype;
  v_caravan uuid := nullif(p_data->>'caravanId','')::uuid;
  v_actor uuid := nullif(p_data->>'actorId','')::uuid;
  v_requested uuid := nullif(p_data->>'leadId','')::uuid;
  v_event uuid := (p_data->>'eventId')::uuid;
  v_source text := p_data->>'source';
  v_form boolean := v_source in ('contact','caravan_interest');
  v_test boolean := coalesce((p_data->>'isTest')::boolean,false);
  v_attribution jsonb := coalesce(p_data->'attribution','{}');
  v_visitor uuid := nullif(p_data->>'visitorId','')::uuid;
  v_basis text := nullif(p_data->>'basis','');
  v_created boolean := false;
begin
  if v_event is null then raise exception 'Missing submission ID'; end if;
  if private.measurement_is_erased(v_visitor) then
    v_attribution := '{}';
    v_visitor := null;
    v_basis := null;
  end if;
  if (v_form and (v_actor is not null or v_requested is not null or nullif(p_data->>'reference','') is not null))
     or (not v_form and v_actor is null) or v_source is null then raise exception 'Invalid actor'; end if;
  perform pg_advisory_xact_lock(hashtextextended('leehov-submission:' || v_event::text, 0));
  select lead_id into v_lead.id from public.lead_conversion_events where id = v_event;
  if found then return jsonb_build_object('id',v_lead.id,'result','replay'); end if;

  if nullif(p_data->>'reference','') is not null then
    select * into v_attempt from public.site_measurement_events
    where reference = p_data->>'reference' and kind = 'whatsapp'
      and occurred_at >= now() - interval '30 days' for update;
    if not found then return jsonb_build_object('result','reference_missing'); end if;
    if v_attempt.linked_lead_id is not null then
      return jsonb_build_object('id',v_attempt.linked_lead_id,'result','reference_linked');
    end if;
    v_test := v_attempt.is_test;
    v_caravan := coalesce(v_attempt.caravan_id,v_caravan);
    v_attribution := v_attempt.attribution;
    v_visitor := v_attempt.visitor_id;
    v_basis := 'observed';
  end if;

  if v_requested is not null then
    select * into v_lead from public.leads where id = v_requested for update;
    if not found or v_lead.is_test <> v_test then return jsonb_build_object('result','lead_missing'); end if;
  else
    if v_phone is null then raise exception 'Invalid phone'; end if;
    perform pg_advisory_xact_lock(hashtextextended('leehov-phone:' || v_phone || ':' || v_test::text, 0));
    select * into v_lead from public.leads where normalized_phone = v_phone and is_test = v_test
    order by created_at, id limit 1 for update;
    if found and not v_form and v_attempt.id is null then
      return jsonb_build_object('id',v_lead.id,'result','duplicate');
    end if;
  end if;

  if v_lead.id is null then
    insert into public.leads (name,phone,email,city,state,message,source,caravan_id,assigned_to,next_follow_up_at,
      commercial_stage,metadata,marketing_attribution,attribution_basis,attribution_visitor_id,updated_by,is_test)
    values (p_data->>'name',p_data->>'phone',nullif(p_data->>'email',''),nullif(p_data->>'city',''),nullif(p_data->>'state',''),
      nullif(p_data->>'message',''),v_source,v_caravan,nullif(p_data->>'assignedTo','')::uuid,
      nullif(p_data->>'nextFollowUpAt','')::timestamptz,'new',coalesce(p_data->'metadata','{}') - array['utmSource','utmMedium','utmCampaign','utmContent','utmTerm','referrer'],v_attribution,v_basis,v_visitor,v_actor,v_test)
    returning * into v_lead;
    v_created := true;
  elsif v_basis is not null then
    -- Keep the original known origin, even if the visitor later returns directly.
    if v_lead.attribution_basis = 'observed' and v_basis = 'observed' and v_lead.attribution_visitor_id = v_visitor
       and jsonb_typeof(v_lead.marketing_attribution->'first') = 'object' then
      v_attribution := jsonb_set(v_attribution,'{first}',v_lead.marketing_attribution->'first');
    end if;
    if v_lead.attribution_basis is null
      or (v_basis = 'observed' and v_lead.attribution_basis = 'reported')
      or (v_basis = 'observed' and v_lead.attribution_basis = 'observed' and v_lead.attribution_visitor_id = v_visitor and coalesce(v_attribution->'conversion'->>'channel','unknown') not in ('direct','unknown')) then
      update public.leads set marketing_attribution = v_attribution, attribution_visitor_id = v_visitor, attribution_basis = v_basis
      where id = v_lead.id;
    end if;
  end if;

  if v_caravan is not null then
    insert into public.lead_caravan_interests (lead_id,caravan_id) values (v_lead.id,v_caravan) on conflict do nothing;
  end if;

  if v_created or not v_form then
    insert into public.lead_conversion_events (id,lead_id,kind,actor_id,caravan_id)
    values (case when v_form then gen_random_uuid() else v_event end,v_lead.id,case when v_created then 'lead_created' else 'lead_updated' end,v_actor,v_caravan);
  end if;
  if v_form then
    insert into public.lead_conversion_events (id,lead_id,kind,caravan_id,metadata,attribution,attribution_basis,attribution_visitor_id)
    values (v_event,v_lead.id,'form_submitted',v_caravan,jsonb_build_object('source',v_source),v_attribution,v_basis,v_visitor);
    if not v_created then
      update public.leads set email = coalesce(email,nullif(p_data->>'email','')),
        city = coalesce(city,nullif(p_data->>'city','')), state = coalesce(state,nullif(p_data->>'state',''))
      where id = v_lead.id and (email is null or city is null or state is null);
      insert into public.lead_interactions (lead_id,interaction_type,title,body)
      values (v_lead.id,'profile_update','Novo formulário recebido',
        concat_ws(E'\n', nullif(p_data->>'message',''),
          case when nullif(p_data->>'name','') is distinct from v_lead.name then 'Nome informado: ' || (p_data->>'name') end,
          case when nullif(p_data->>'email','') is distinct from v_lead.email::text then 'E-mail informado: ' || (p_data->>'email') end,
          case when nullif(p_data->>'city','') is distinct from v_lead.city then 'Cidade informada: ' || nullif(p_data->>'city','') end,
          case when nullif(p_data->>'state','') is distinct from v_lead.state then 'Estado informado: ' || nullif(p_data->>'state','') end));
    end if;
  end if;
  if v_attempt.id is not null or (not v_form and v_actor is not null and p_data->>'confirmContact' = 'true') then
    if v_attempt.id is not null then
      update public.site_measurement_events set linked_lead_id = v_lead.id where id = v_attempt.id;
    end if;
    if v_lead.contact_received_at is null then
      update public.leads set contact_received_at = now(), updated_by = v_actor,
        commercial_stage = case when commercial_stage is null or commercial_stage = 'new' then 'contact_received' else commercial_stage end
      where id = v_lead.id;
      insert into public.lead_conversion_events (lead_id,kind,actor_id,caravan_id,attribution,attribution_basis,attribution_visitor_id)
      values (v_lead.id,'contact_received',v_actor,coalesce(v_caravan,v_lead.caravan_id),v_attribution,v_basis,v_visitor);
    end if;
    insert into public.lead_interactions (lead_id,interaction_type,title,metadata,created_by)
    values (v_lead.id,'whatsapp',case when v_attempt.id is not null then 'Contato recebido com referência do WhatsApp' else 'Contato recebido confirmado pela equipe' end,
      jsonb_strip_nulls(jsonb_build_object('reference',v_attempt.reference,'basis',v_basis)),v_actor);
  elsif not v_form then
    insert into public.lead_interactions (lead_id,interaction_type,title,created_by)
    values (v_lead.id,'profile_update','Lead cadastrado manualmente',v_actor);
  end if;

  return jsonb_build_object('id',v_lead.id,'result',case when v_created then 'created' else 'updated' end);
end;
$$;

-- An explicit milestone is recorded only once. Repeated saves are harmless.
-- Moving away from a won stage requires a distinct, audited cancellation.
create function public.update_commercial_lead(p_data jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_lead public.leads%rowtype;
  v_actor uuid := (p_data->>'actorId')::uuid;
  v_stage text := p_data->>'stage';
  v_at timestamptz := coalesce(nullif(p_data->>'at','')::timestamptz,now());
  v_cancel boolean := coalesce((p_data->>'cancelSale')::boolean,false);
  v_is_test boolean;
  v_new_phone text;
  v_sale public.lead_conversion_events%rowtype;
  v_kind text;
  v_proposal_minor bigint := nullif(p_data->>'proposalMinor','')::bigint;
  v_proposal_currency text := nullif(p_data->>'proposalCurrency','');
  v_sale_minor bigint := nullif(p_data->>'saleMinor','')::bigint;
  v_sale_currency text := nullif(p_data->>'saleCurrency','');
  v_reason text := nullif(p_data->>'lossReason','');
  v_caravan uuid := nullif(p_data->>'caravanId','')::uuid;
  v_channel text := nullif(p_data->>'reportedChannel','');
  v_campaign text := nullif(p_data->>'reportedCampaign','');
  v_reported boolean;
begin
  select * into v_lead from public.leads where id = (p_data->>'leadId')::uuid for update;
  if not found then return jsonb_build_object('result','missing'); end if;
  v_is_test := coalesce((p_data->>'isTest')::boolean,v_lead.is_test);
  if v_is_test <> v_lead.is_test and not coalesce((p_data->>'allowTestChange')::boolean,false) then
    return jsonb_build_object('result','invalid');
  end if;
  v_new_phone := coalesce(private.normalize_lead_phone(p_data->>'phone'), v_lead.normalized_phone);
  if v_new_phone is distinct from v_lead.normalized_phone or v_is_test <> v_lead.is_test then
    perform pg_advisory_xact_lock(hashtextextended('leehov-phone:' || v_new_phone || ':' || v_is_test::text, 0));
    if exists (select 1 from public.leads
      where id <> v_lead.id and normalized_phone = v_new_phone and is_test = v_is_test) then
      return jsonb_build_object('result','duplicate');
    end if;
  end if;
  if v_stage not in ('new','contact_received','qualified','quote_requested','proposal_sent','negotiation','won','lost')
     or v_stage is null or v_at > now() + interval '5 minutes'
     or (v_stage = 'lost' and v_reason is null)
     or (v_cancel and (v_lead.commercial_stage is distinct from 'won' or v_stage = 'won' or v_at < v_lead.closed_at))
     or (v_lead.commercial_stage = 'won' and v_stage <> 'won' and not v_cancel)
     or (v_stage = 'won' and v_lead.commercial_stage is distinct from 'won' and (v_sale_minor is null or v_sale_currency is null)) then
    return jsonb_build_object('result','invalid');
  end if;
  if v_cancel then
    select * into v_sale from public.lead_conversion_events
    where lead_id = v_lead.id and kind = 'sale_won' order by recorded_at desc, id desc limit 1;
    if not found then return jsonb_build_object('result','invalid'); end if;
    insert into public.lead_conversion_events (lead_id,kind,actor_id,caravan_id,occurred_at,amount_minor,currency,attribution,attribution_basis,attribution_visitor_id,metadata)
    values (v_lead.id,'sale_cancelled',v_actor,v_sale.caravan_id,v_at,v_sale.amount_minor,v_sale.currency,v_sale.attribution,v_sale.attribution_basis,v_sale.attribution_visitor_id,
      jsonb_build_object('saleEventId',v_sale.id));
  elsif v_stage = 'won' and v_lead.commercial_stage is distinct from 'won' then v_kind := 'sale_won';
  elsif v_stage = 'contact_received' and v_lead.contact_received_at is null then v_kind := 'contact_received';
  elsif v_stage = 'quote_requested' and v_lead.quote_requested_at is null then v_kind := 'quote_requested';
  elsif v_stage = 'proposal_sent' and v_lead.proposal_sent_at is null then v_kind := 'proposal_sent';
  end if;
  v_reported := v_channel is not null and v_lead.attribution_basis is distinct from 'observed';

  update public.leads set
    commercial_stage = v_stage, updated_by = v_actor,
    name = coalesce(nullif(p_data->>'name',''),v_lead.name),
    phone = coalesce(nullif(p_data->>'phone',''),v_lead.phone),
    email = case when p_data ? 'email' then nullif(p_data->>'email','')::text else v_lead.email end,
    next_action = nullif(p_data->>'nextAction',''), loss_reason = case when v_stage = 'lost' then v_reason end,
    proposal_minor = v_proposal_minor, proposal_currency = v_proposal_currency,
    sale_minor = case when v_kind = 'sale_won' then v_sale_minor when not v_cancel then v_lead.sale_minor end,
    sale_currency = case when v_kind = 'sale_won' then v_sale_currency when not v_cancel then v_lead.sale_currency end,
    contact_received_at = case when v_kind = 'contact_received' then v_at else v_lead.contact_received_at end,
    quote_requested_at = case when v_kind = 'quote_requested' then v_at else v_lead.quote_requested_at end,
    proposal_sent_at = case when v_kind = 'proposal_sent' then v_at else v_lead.proposal_sent_at end,
    closed_at = case when v_kind = 'sale_won' or (v_stage = 'lost' and v_lead.commercial_stage is distinct from 'lost') then v_at when v_cancel then null else v_lead.closed_at end,
    marketing_attribution = case when v_reported then jsonb_build_object('conversion',jsonb_strip_nulls(jsonb_build_object('channel',v_channel,'campaign',v_campaign))) else v_lead.marketing_attribution end,
    attribution_basis = case when v_reported then 'reported' else v_lead.attribution_basis end,
    caravan_id = coalesce(v_caravan,v_lead.caravan_id), is_test = v_is_test
  where id = v_lead.id;

  if v_caravan is not null then
    if v_lead.caravan_id is not null then
      insert into public.lead_caravan_interests (lead_id,caravan_id) values (v_lead.id,v_lead.caravan_id) on conflict do nothing;
    end if;
    insert into public.lead_caravan_interests (lead_id,caravan_id) values (v_lead.id,v_caravan) on conflict do nothing;
  end if;
  if v_kind is not null then
    insert into public.lead_conversion_events (lead_id,kind,actor_id,caravan_id,occurred_at,amount_minor,currency)
    values (v_lead.id,v_kind,v_actor,coalesce(v_caravan,v_lead.caravan_id),v_at,
      case when v_kind = 'sale_won' then v_sale_minor end,case when v_kind = 'sale_won' then v_sale_currency end);
  end if;
  if v_lead.is_test <> v_is_test then
    update public.site_measurement_events set is_test = v_is_test where linked_lead_id = v_lead.id;
  end if;
  if v_lead.commercial_stage is distinct from v_stage then
    insert into public.lead_conversion_events (lead_id,kind,actor_id,caravan_id,metadata)
    values (v_lead.id,'stage_change',v_actor,coalesce(v_caravan,v_lead.caravan_id),jsonb_build_object('from',v_lead.commercial_stage,'to',v_stage));
  end if;
  insert into public.lead_conversion_events (lead_id,kind,actor_id,caravan_id) values (v_lead.id,'lead_updated',v_actor,coalesce(v_caravan,v_lead.caravan_id));
  insert into public.lead_interactions (lead_id,interaction_type,title,metadata,created_by)
  values (v_lead.id,'profile_update',case when v_cancel then 'Venda cancelada' when v_kind = 'sale_won' then 'Venda confirmada'
    when v_lead.commercial_stage is distinct from v_stage then 'Etapa comercial atualizada' else 'Dados comerciais atualizados' end,
    jsonb_strip_nulls(jsonb_build_object('from',v_lead.commercial_stage,'to',v_stage,'occurredAt',v_at,'reason',v_reason,'event',v_kind,
      'test',case when v_lead.is_test <> v_is_test then v_is_test end,'phoneChanged',case when v_lead.normalized_phone is distinct from v_new_phone then true end,'reportedChannel',case when v_reported then v_channel end)),v_actor);
  return jsonb_build_object('result','updated');
end;
$$;

create function public.erase_site_measurement(p_visitor_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_visitor_id is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('leehov-visitor:' || p_visitor_id::text, 0));
  insert into private.site_measurement_erased (visitor_id) values (p_visitor_id)
  on conflict (visitor_id) do update set expires_at = now() + interval '180 days';
  delete from public.site_measurement_events where visitor_id = p_visitor_id;
  update public.lead_conversion_events set attribution = '{}', attribution_basis = null, attribution_visitor_id = null
    where attribution_visitor_id = p_visitor_id and attribution_basis = 'observed';
  update public.leads set marketing_attribution = '{}', attribution_basis = null, attribution_visitor_id = null,
    metadata = metadata - array['utmSource','utmMedium','utmCampaign','utmContent','utmTerm','referrer']
    where attribution_visitor_id = p_visitor_id and attribution_basis = 'observed';
end;
$$;

revoke all on function private.normalize_lead_phone(text) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.normalize_lead_phone(text) to service_role;
revoke all on function public.capture_conversion_lead(jsonb), public.update_commercial_lead(jsonb), public.erase_site_measurement(uuid) from public, anon, authenticated;
grant execute on function public.capture_conversion_lead(jsonb), public.update_commercial_lead(jsonb), public.erase_site_measurement(uuid) to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('leehov-cleanup-site-measurement', '13 4 * * *', $cleanup$
      delete from public.site_measurement_events where occurred_at < now() - interval '180 days';
      delete from private.site_measurement_erased where expires_at < now();
      delete from public.form_rate_limits where scope = 'site_measurement' and window_started_at < now() - interval '2 days';
      update public.lead_conversion_events set attribution_visitor_id = null
        where attribution_visitor_id is not null and recorded_at < now() - interval '180 days';
      update public.leads set attribution_visitor_id = null
        where attribution_visitor_id is not null and updated_at < now() - interval '180 days';
    $cleanup$);
  end if;
end;
$$;

alter table public.form_rate_limits drop constraint form_rate_limits_scope_allowed;
alter table public.form_rate_limits add constraint form_rate_limits_scope_allowed
  check (scope in ('contact', 'caravan_interest', 'newsletter', 'login', 'password_recovery', 'site_measurement'));

create function public.consume_measurement_rate_limit(p_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_attempts smallint;
begin
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  insert into public.form_rate_limits (scope,identifier_hash,window_started_at,attempts)
  values ('site_measurement',p_hash,date_trunc('minute',now()),1)
  on conflict (scope,identifier_hash,window_started_at) do update
    set attempts = least(121,public.form_rate_limits.attempts + 1), last_attempt_at = now()
  returning attempts into v_attempts;
  return v_attempts <= 120;
end;
$$;
revoke all on function public.consume_measurement_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_measurement_rate_limit(text) to service_role;
