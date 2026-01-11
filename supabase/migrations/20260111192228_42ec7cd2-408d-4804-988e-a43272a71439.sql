-- Insert custom match for FC Barcelona vs Real Madrid
INSERT INTO public.custom_matches (
  id,
  home_team,
  away_team,
  category,
  match_date,
  stream_url,
  visible
) VALUES (
  'barca-real-2025',
  'FC Barcelona',
  'Real Madrid',
  'football',
  NOW(),
  'https://play7ba.peodlc.com/sport/202_4857525_2.m3u8',
  true
) ON CONFLICT (id) DO UPDATE SET
  stream_url = EXCLUDED.stream_url,
  visible = EXCLUDED.visible,
  updated_at = NOW();