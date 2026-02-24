"use server";

import { generateQuizQuestions } from '@/lib/ai';

export async function generateQuizQuestionsAction(): Promise<{
    data?: { question: string; hint?: string }[];
    error?: string;
}> {
    try {
        const questions = await generateQuizQuestions();
        return { data: questions };
    } catch (e) {
        console.error('generateQuizQuestionsAction error:', e);
        return { error: 'Не удалось сгенерировать вопросы' };
    }
}
