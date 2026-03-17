CREATE TABLE public.debate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.startup_ideas(id) ON DELETE CASCADE,
  debate_id text NOT NULL,
  agent text NOT NULL,
  content text NOT NULL,
  round integer NOT NULL DEFAULT 1,
  stance text DEFAULT 'assert',
  red_line_triggered boolean DEFAULT false,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.debate_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own debate messages" ON public.debate_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own debate messages" ON public.debate_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own debate messages" ON public.debate_messages FOR DELETE TO authenticated USING (user_id = auth.uid());