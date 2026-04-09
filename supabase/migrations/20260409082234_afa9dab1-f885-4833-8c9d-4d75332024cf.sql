
-- Constraints table: executable rules that gate agent output
CREATE TABLE public.constraints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_code text NOT NULL,
  type text NOT NULL DEFAULT 'rule' CHECK (type IN ('red_line', 'rule')),
  description text NOT NULL,
  validator_type text NOT NULL DEFAULT 'regex' CHECK (validator_type IN ('regex', 'llm', 'function')),
  validator_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'warn' CHECK (severity IN ('block', 'warn')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own constraints" ON public.constraints FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own constraints" ON public.constraints FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own constraints" ON public.constraints FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own constraints" ON public.constraints FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Validation results log
CREATE TABLE public.validation_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  document_id uuid,
  idea_id uuid,
  agent_code text NOT NULL,
  constraint_id uuid REFERENCES public.constraints(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pass' CHECK (status IN ('pass', 'fail', 'needs_review')),
  message text,
  revision_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own validation results" ON public.validation_results FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own validation results" ON public.validation_results FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_constraints_updated_at BEFORE UPDATE ON public.constraints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
