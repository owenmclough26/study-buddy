-- Study Buddy: run the reminder sender every minute.
-- A filled-in copy (with your project id and secret) is generated as
-- supabase/reminders-cron.local.sql, which git ignores. Paste THAT one into the SQL Editor.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- the shared secret the function checks, stored encrypted in Supabase Vault
select vault.create_secret('<CRON_SECRET>', 'reminders_cron_secret');

select cron.schedule(
  'send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
