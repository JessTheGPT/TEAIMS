
-- Add user_id to startup_ideas
ALTER TABLE public.startup_ideas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to idea_documents
ALTER TABLE public.idea_documents ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to idea_messages  
ALTER TABLE public.idea_messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add DELETE and UPDATE policies for idea_messages (missing)
CREATE POLICY "Authenticated users can update their messages"
ON public.idea_messages FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete their messages"
ON public.idea_messages FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Drop old permissive policies on startup_ideas
DROP POLICY IF EXISTS "Anyone can delete ideas" ON public.startup_ideas;
DROP POLICY IF EXISTS "Anyone can insert ideas" ON public.startup_ideas;
DROP POLICY IF EXISTS "Anyone can read ideas" ON public.startup_ideas;
DROP POLICY IF EXISTS "Anyone can update ideas" ON public.startup_ideas;

-- New RLS for startup_ideas (user-scoped)
CREATE POLICY "Users can read own ideas" ON public.startup_ideas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own ideas" ON public.startup_ideas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own ideas" ON public.startup_ideas FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own ideas" ON public.startup_ideas FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Drop old permissive policies on idea_documents
DROP POLICY IF EXISTS "Anyone can delete docs" ON public.idea_documents;
DROP POLICY IF EXISTS "Anyone can insert docs" ON public.idea_documents;
DROP POLICY IF EXISTS "Anyone can read docs" ON public.idea_documents;
DROP POLICY IF EXISTS "Anyone can update docs" ON public.idea_documents;

-- New RLS for idea_documents
CREATE POLICY "Users can read own docs" ON public.idea_documents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own docs" ON public.idea_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own docs" ON public.idea_documents FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own docs" ON public.idea_documents FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Drop old permissive policies on idea_messages
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.idea_messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.idea_messages;

-- New RLS for idea_messages
CREATE POLICY "Users can read own messages" ON public.idea_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own messages" ON public.idea_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
