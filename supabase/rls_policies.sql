alter table public.profiles enable row level security;
alter table public.draft_orders enable row level security;
alter table public.order_photos enable row level security;

create policy if not exists "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy if not exists "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy if not exists "draft_orders_own_all"
on public.draft_orders
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "order_photos_own_all"
on public.order_photos
for all
to authenticated
using (
  exists (
    select 1
    from public.draft_orders
    where draft_orders.id = order_photos.draft_order_id
      and draft_orders.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.draft_orders
    where draft_orders.id = order_photos.draft_order_id
      and draft_orders.user_id = auth.uid()
  )
);
