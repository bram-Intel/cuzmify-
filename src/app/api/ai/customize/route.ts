import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai/ai-service';

export async function POST(req: Request) {
  try {
    const { currentConfig, prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const updatedConfig = await AIService.customizeProject(currentConfig, prompt);
    return NextResponse.json(updatedConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to customize project' }, { status: 500 });
  }
}


