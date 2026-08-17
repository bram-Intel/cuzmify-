import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
