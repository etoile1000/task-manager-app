-- Pro plan flag (Stripe webhook sets true on successful checkout)
alter table public.profiles
  add column if not exists is_pro boolean not null default false;

comment on column public.profiles.is_pro is 'Stripe customer: unlocks background themes & completion effects';
