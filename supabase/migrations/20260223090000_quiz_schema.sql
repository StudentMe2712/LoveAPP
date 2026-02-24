-- Quiz questions table (each person writes questions that only their partner will answer)
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID NOT NULL REFERENCES public.pair(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see pair quiz questions" ON public.quiz_questions FOR SELECT
USING (
    pair_id IN (
        SELECT id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own quiz questions" ON public.quiz_questions FOR INSERT
WITH CHECK (
    author_id = auth.uid() AND
    pair_id IN (
        SELECT id FROM public.pair WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
);

-- Quiz answers table
CREATE TABLE public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    answerer_id UUID NOT NULL REFERENCES auth.users(id),
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own quiz answers" ON public.quiz_answers FOR SELECT
USING (answerer_id = auth.uid());

CREATE POLICY "Users can insert own quiz answers" ON public.quiz_answers FOR INSERT
WITH CHECK (answerer_id = auth.uid());
