
CREATE TABLE public.context_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'core',
  description text,
  is_shared boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);

ALTER TABLE public.context_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own context files" ON public.context_files
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own context files" ON public.context_files
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own context files" ON public.context_files
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own context files" ON public.context_files
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Public can read shared context files" ON public.context_files
  FOR SELECT TO anon USING (is_shared = true);

CREATE TRIGGER update_context_files_updated_at
  BEFORE UPDATE ON public.context_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.judgement_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent text NOT NULL DEFAULT 'system',
  category text NOT NULL DEFAULT 'general',
  question text NOT NULL,
  context text,
  options jsonb DEFAULT '[]',
  decision text,
  reasoning text,
  confidence_level text DEFAULT 'low',
  status text NOT NULL DEFAULT 'pending',
  rule_created text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.judgement_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own judgements" ON public.judgement_entries
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own judgements" ON public.judgement_entries
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own judgements" ON public.judgement_entries
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own judgements" ON public.judgement_entries
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_judgement_entries_updated_at
  BEFORE UPDATE ON public.judgement_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.judgement_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  rule text NOT NULL,
  examples jsonb DEFAULT '[]',
  confidence text NOT NULL DEFAULT 'medium',
  active boolean NOT NULL DEFAULT true,
  times_applied integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.judgement_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rules" ON public.judgement_rules
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own rules" ON public.judgement_rules
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own rules" ON public.judgement_rules
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own rules" ON public.judgement_rules
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_judgement_rules_updated_at
  BEFORE UPDATE ON public.judgement_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
