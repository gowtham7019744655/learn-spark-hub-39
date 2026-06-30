CREATE OR REPLACE FUNCTION public.submit_test(p_test_id uuid, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_already_completed boolean;
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

  SELECT EXISTS (
    SELECT 1 FROM public.student_tests
    WHERE student_usn = v_usn AND test_id = p_test_id AND status = 'completed'
  ) INTO v_already_completed;
  IF v_already_completed THEN
    RAISE EXCEPTION 'test already submitted';
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
    ON CONFLICT (student_usn, question_id) DO NOTHING;

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
        completed_at = now()
    WHERE public.student_tests.status <> 'completed';

  RETURN jsonb_build_object('score', v_pct, 'results', v_results);
END;
$function$;