DROP POLICY IF EXISTS "Authenticated can view basic profiles" ON public.profiles;

CREATE POLICY "Staff can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'lecturer'::app_role)
  OR has_role(auth.uid(), 'counselor'::app_role)
);

DROP POLICY IF EXISTS "Leaderboard view completed tests" ON public.student_tests;

CREATE OR REPLACE FUNCTION public.get_test_leaderboard(p_test_id uuid, p_limit int DEFAULT 20)
RETURNS TABLE(student_usn text, full_name text, score int, completed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT st.student_usn, p.full_name, st.score, st.completed_at
  FROM public.student_tests st
  LEFT JOIN public.profiles p ON p.usn = st.student_usn
  WHERE st.test_id = p_test_id
    AND st.status = 'completed'
    AND st.score IS NOT NULL
    AND auth.uid() IS NOT NULL
  ORDER BY st.score DESC, st.completed_at ASC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1);
$$;

CREATE OR REPLACE FUNCTION public.get_overall_leaderboard(p_limit int DEFAULT 25)
RETURNS TABLE(student_usn text, full_name text, total_score bigint, tests_completed bigint, avg_score numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT st.student_usn,
         p.full_name,
         SUM(st.score)::bigint AS total_score,
         COUNT(*)::bigint AS tests_completed,
         ROUND(AVG(st.score)::numeric, 0) AS avg_score
  FROM public.student_tests st
  LEFT JOIN public.profiles p ON p.usn = st.student_usn
  WHERE st.status = 'completed' AND st.score IS NOT NULL AND auth.uid() IS NOT NULL
  GROUP BY st.student_usn, p.full_name
  ORDER BY total_score DESC
  LIMIT GREATEST(COALESCE(p_limit, 25), 1);
$$;

DROP POLICY IF EXISTS "Authenticated can view questions of published tests" ON public.test_questions;

CREATE POLICY "Lecturers can view questions"
ON public.test_questions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'lecturer'::app_role));

CREATE OR REPLACE FUNCTION public.get_test_questions_for_student(p_test_id uuid)
RETURNS TABLE(id uuid, question_text text, question_type text, options jsonb, marks int, question_order int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT q.id, q.question_text, q.question_type, q.options, q.marks, q.question_order
  FROM public.test_questions q
  JOIN public.tests t ON t.id = q.test_id
  WHERE q.test_id = p_test_id
    AND t.status = 'published'
    AND auth.uid() IS NOT NULL
  ORDER BY q.question_order;
$$;

CREATE OR REPLACE FUNCTION public.submit_test(p_test_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_usn text;
  v_total int := 0;
  v_earned int := 0;
  v_pct int := 0;
  v_q record;
  v_sel text;
  v_correct boolean;
  v_results jsonb := '[]'::jsonb;
  v_published boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT usn INTO v_usn FROM public.profiles WHERE id = auth.uid();
  IF v_usn IS NULL THEN
    RAISE EXCEPTION 'no usn for user';
  END IF;

  SELECT (status = 'published') INTO v_published FROM public.tests WHERE id = p_test_id;
  IF NOT COALESCE(v_published, false) THEN
    RAISE EXCEPTION 'test not available';
  END IF;

  FOR v_q IN
    SELECT id, correct_answer, marks
    FROM public.test_questions
    WHERE test_id = p_test_id
  LOOP
    v_total := v_total + v_q.marks;
    v_sel := p_answers ->> v_q.id::text;
    v_correct := (v_sel IS NOT NULL AND v_sel = v_q.correct_answer);
    IF v_correct THEN v_earned := v_earned + v_q.marks; END IF;

    INSERT INTO public.student_answers (student_usn, test_id, question_id, selected_answer, is_correct)
    VALUES (v_usn, p_test_id, v_q.id, v_sel, v_correct)
    ON CONFLICT (student_usn, question_id) DO UPDATE
      SET selected_answer = EXCLUDED.selected_answer,
          is_correct = EXCLUDED.is_correct,
          test_id = EXCLUDED.test_id;

    v_results := v_results || jsonb_build_object(
      'question_id', v_q.id,
      'correct_answer', v_q.correct_answer,
      'is_correct', v_correct
    );
  END LOOP;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_earned::numeric / v_total) * 100)::int ELSE 0 END;

  INSERT INTO public.student_tests (student_usn, test_id, score, status, started_at, completed_at)
  VALUES (v_usn, p_test_id, v_pct, 'completed', now(), now())
  ON CONFLICT (student_usn, test_id) DO UPDATE
    SET score = EXCLUDED.score,
        status = 'completed',
        completed_at = now();

  RETURN jsonb_build_object('score', v_pct, 'results', v_results);
END;
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.parent_can_view_student(uuid, text) FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.get_test_leaderboard(uuid, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_test_leaderboard(uuid, int) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_overall_leaderboard(int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_overall_leaderboard(int) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_test_questions_for_student(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_test_questions_for_student(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_test(uuid, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.submit_test(uuid, jsonb) TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.tablename);
  END LOOP;
END $$;