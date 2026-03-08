-- Allow authenticated users to read basic profile info (for leaderboard names)
CREATE POLICY "Authenticated can view basic profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
