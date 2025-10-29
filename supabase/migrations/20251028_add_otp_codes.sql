-- OTP codes table for SMS-based authentication via sms.ir
create table if not exists public.otp_codes (
  id bigint generated always as identity primary key,
  phone text not null,
  code_hash text not null,
  expires_at timestamp with time zone not null,
  attempts int not null default 0,
  consumed boolean not null default false,
  ip inet,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists otp_codes_phone_idx on public.otp_codes (phone);
create index if not exists otp_codes_expires_idx on public.otp_codes (expires_at);

-- RLS enabled but permissive policies for service role only
alter table public.otp_codes enable row level security;

drop policy if exists "otp service read" on public.otp_codes;
drop policy if exists "otp service write" on public.otp_codes;

create policy "otp service read"
on public.otp_codes for select
to service_role
using (true);

create policy "otp service write"
on public.otp_codes for all
to service_role
using (true)
with check (true);

-- trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.otp_codes;
create trigger set_updated_at
before update on public.otp_codes
for each row execute function public.set_updated_at();




