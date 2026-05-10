
-- Telegram chat ↔ user link (single bot, multi-user via chat_id)
CREATE TABLE public.telegram_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chat_id bigint NOT NULL UNIQUE,
  username text,
  first_name text,
  linked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own links select" ON public.telegram_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own links insert" ON public.telegram_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own links delete" ON public.telegram_links FOR DELETE USING (auth.uid() = user_id);

-- Telegram messages ingest
CREATE TABLE public.telegram_messages (
  update_id bigint PRIMARY KEY,
  user_id uuid,
  chat_id bigint NOT NULL,
  from_user_id bigint,
  text text,
  raw_update jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tgm_user ON public.telegram_messages(user_id, created_at DESC);
CREATE INDEX idx_tgm_chat ON public.telegram_messages(chat_id, created_at DESC);
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages select" ON public.telegram_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own messages delete" ON public.telegram_messages FOR DELETE USING (auth.uid() = user_id);

-- Firecrawl extractions
CREATE TABLE public.firecrawl_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  mode text NOT NULL DEFAULT 'scrape', -- scrape | map | crawl | search
  title text,
  markdown text,
  summary text,
  links jsonb,
  metadata jsonb,
  status text NOT NULL DEFAULT 'completed',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fc_user ON public.firecrawl_extractions(user_id, created_at DESC);
ALTER TABLE public.firecrawl_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fc select" ON public.firecrawl_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own fc insert" ON public.firecrawl_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own fc delete" ON public.firecrawl_extractions FOR DELETE USING (auth.uid() = user_id);
