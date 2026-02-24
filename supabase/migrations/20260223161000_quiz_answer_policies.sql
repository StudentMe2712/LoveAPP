-- Allow answerers to update their own answers (for is_correct flag)
CREATE POLICY "Users can update own quiz answers" ON public.quiz_answers FOR UPDATE
USING (answerer_id = auth.uid());

-- Allow question authors to see answers to their questions (so they can show status in My Questions tab)
CREATE POLICY "Authors can see answers to their questions" ON public.quiz_answers FOR SELECT
USING (
    question_id IN (
        SELECT id FROM public.quiz_questions WHERE author_id = auth.uid()
    )
);
