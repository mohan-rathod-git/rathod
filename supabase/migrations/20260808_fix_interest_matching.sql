-- Migration: Fix interest matching model
-- Allows single-direction acceptance = matched (no mutual send required)
-- Also allows sender to update their own interests (for unmatch)

-- 1. Update RLS: allow BOTH sender AND receiver to update interests
DROP POLICY IF EXISTS "Receivers can update interests" ON public.interests;
CREATE POLICY "Participants can update interests" ON public.interests
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 2. Add 'unmatched' to the status check constraint
-- First drop the old constraint, then add the new one
ALTER TABLE public.interests DROP CONSTRAINT IF EXISTS interests_status_check;
ALTER TABLE public.interests ADD CONSTRAINT interests_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'unmatched'));

-- 3. Update is_matched function: a match = single accepted interest from either direction
CREATE OR REPLACE FUNCTION public.is_matched(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.interests
    WHERE (
      (sender_id = _user_a AND receiver_id = _user_b)
      OR (sender_id = _user_b AND receiver_id = _user_a)
    )
    AND status = 'accepted'
  );
$$;
