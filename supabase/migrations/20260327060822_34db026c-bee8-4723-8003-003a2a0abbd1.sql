
CREATE TABLE public.typing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing status for their chats"
  ON public.typing_status FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can upsert own typing status"
  ON public.typing_status FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own typing status"
  ON public.typing_status FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
  ON public.blocked_users FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON public.blocked_users FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
