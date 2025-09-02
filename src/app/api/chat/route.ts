import { gateway } from '@ai-sdk/gateway';
import { streamText, convertToModelMessages } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, input_file } = await req.json();


    console.log(messages);
    const result = await streamText({
      model: gateway('gpt-4o-mini'),
      system: `You are an AI assistant helping users understand academic papers. 

Aim to an audience of undergraduate students focusing on applications and key results.

Use markdown formatting to structure your responses clearly. Including mathematical formulas and equations.

When discussing mathematical expressions, formulas, equations, or any mathematical content, please format them using LaTeX syntax:
- For inline math expressions, use single dollar signs: $x^2 + y^2 = z^2$
- For display math (block equations), use double dollar signs: $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

IMPORTANT: Do NOT wrap math expressions in square brackets []. Use only the dollar sign delimiters as shown above. The square brackets will prevent proper math rendering.

This will ensure proper mathematical and markdown rendering in the chat interface.`,
      messages: [
        {
          role: 'user',
          content: [{
            type: 'file',
            data: input_file,
            mediaType: 'application/pdf',
          }],
        },
        ...convertToModelMessages(messages),
      ],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Error processing chat request', { status: 500 });
  }
}
