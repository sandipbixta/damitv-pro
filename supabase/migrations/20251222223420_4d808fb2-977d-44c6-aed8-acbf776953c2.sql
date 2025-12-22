-- Schedule goal-alerts to run every minute
SELECT cron.schedule(
  'goal-alerts-every-minute',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://wxvsteaayxgygihpshoz.supabase.co/functions/v1/goal-alerts',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dnN0ZWFheXhneWdpaHBzaG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzMzNDMsImV4cCI6MjA2NDM0OTM0M30.L2OVGuYiiynekERIwZceuH42iKVAD_YPJL25HXV6ing"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);