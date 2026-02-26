"use server";

import { generateQuizQuestions } from '@/lib/ai';
import { rememberJson } from '@/lib/redis/cache';

const QUIZ_AI_CACHE_KEY = "ai:quiz:ru:count:5";
const QUIZ_AI_CACHE_TTL_SEC = 1800;

export async function generateQuizQuestionsAction(): Promise<{
    data?: { question: string; hint?: string }[];
    error?: string;
}> {
    try {
        const questions = await rememberJson(
            QUIZ_AI_CACHE_KEY,
            QUIZ_AI_CACHE_TTL_SEC,
            async () => generateQuizQuestions(),
            "quiz_ai",
        );
        return { data: questions };
    } catch (e) {
        console.error('generateQuizQuestionsAction error:', e);
        return { error: 'Не удалось сгенерировать вопросы' };
    }
}
