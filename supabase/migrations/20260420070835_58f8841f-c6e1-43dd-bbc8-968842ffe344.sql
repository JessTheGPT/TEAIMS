-- Source files attached to an idea
CREATE TABLE public.idea_source_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.startup_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  storage_path text NOT NULL,
  size_bytes integer,
  extracted_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.idea_source_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own source files" ON public.idea_source_files
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own source files" ON public.idea_source_files
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own source files" ON public.idea_source_files
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own source files" ON public.idea_source_files
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_source_files_idea ON public.idea_source_files(idea_id);

-- Per-agent persistent chat threads
CREATE TABLE public.agent_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.startup_ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  agent_code text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own agent chats" ON public.agent_chats
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own agent chats" ON public.agent_chats
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own agent chats" ON public.agent_chats
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_agent_chats_idea_agent ON public.agent_chats(idea_id, agent_code, created_at);

-- Storage bucket for uploaded source files
INSERT INTO storage.buckets (id, name, public) VALUES ('idea-files', 'idea-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own idea files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'idea-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own idea files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'idea-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own idea files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'idea-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own idea files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'idea-files' AND auth.uid()::text = (storage.foldername(name))[1]);