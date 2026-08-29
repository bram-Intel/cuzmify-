import { GoogleGenerativeAI } from '@google/generative-ai';

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

const rawModel = process.env.GEMINI_MODEL || '';
export const GEMINI_MODEL = rawModel && !rawModel.includes('3.') && !rawModel.includes('preview')
  ? rawModel
  : 'gemini-2.0-flash';
