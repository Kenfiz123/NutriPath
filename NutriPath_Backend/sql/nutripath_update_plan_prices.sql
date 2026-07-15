-- NutriPath production plan price migration
-- Safe to run more than once in Supabase SQL Editor.

update public.nutripath_plans as plan
set monthly_price = price.monthly_price,
    data = jsonb_set(coalesce(plan.data, '{}'::jsonb), '{monthlyPrice}', to_jsonb(price.monthly_price), true),
    updated_at = now()
from (values
  ('vip', 25000),
  ('svip', 50000)
) as price(id, monthly_price)
where plan.id = price.id;

select id, name, monthly_price, data ->> 'monthlyPrice' as json_monthly_price
from public.nutripath_plans
where id in ('vip', 'svip')
order by id;
