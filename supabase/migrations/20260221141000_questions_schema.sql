-- Insert default question packs and questions

INSERT INTO public.questions (pack_id, text) VALUES
('about_us', 'Какое твое самое любимое воспоминание о нас?'),
('about_us', 'Что в моих привычках заставляет тебя улыбаться?'),
('about_us', 'Если бы мы могли прямо сейчас телепортироваться куда угодно вдвоем, куда бы мы отправились?'),
('hobby', 'О каком хобби ты всегда мечтал(а), но так и не попробовал(а)?'),
('hobby', 'Какое занятие заставляет тебя терять счет времени?'),
('funny', 'Какая самая нелепая покупка в твоей жизни?'),
('funny', 'Если бы о тебе снимали ситком, как бы он назывался?'),
('deep', 'Что для тебя значит чувство дома?'),
('deep', 'О чем ты чаще всего думаешь перед сном?')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT answers_unique UNIQUE (question_id, user_id)
);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pair isolation for answers" ON public.answers FOR ALL
USING (EXISTS (SELECT 1 FROM public.pair WHERE (pair.user1_id = auth.uid() OR pair.user2_id = auth.uid()) AND (pair.user1_id = answers.user_id OR pair.user2_id = answers.user_id)));
