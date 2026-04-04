-- Optional street / line-1 address for event venue (separate from venue name).

alter table public.events
  add column if not exists street_address text;

comment on column public.events.street_address is 'Street or line-1 address for the venue (optional).';
