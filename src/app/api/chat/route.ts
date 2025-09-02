import { gateway } from '@ai-sdk/gateway';
import { streamText, convertToModelMessages } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, input_file, apiKey } = await req.json();

    console.log(messages);
    
    // Set the API key in environment if provided
    if (apiKey) {
      process.env.VERCEL_AI_GATEWAY_API_KEY = apiKey;
    }
    
    const result = streamText({
      model: gateway('gpt-4o-mini'),
      system: `You are an AI assistant helping users understand academic papers. You are conditioned on a research paper.

Aim to an audience of undergraduate students focusing on applications and key results. 
You don't need to mention the paper name in your responses. It is already known to the user.

Use markdown formatting to structure your responses clearly and educationally. Including mathematical formulas and equations that are formatted using 
rehype-katex.

IMPORTANT:
Wrap inline math expressions in double dollar signs like this: $ H(p, q) = -\sum_{x} p(x) \log(q(x)) $ not [ H(p, q) = -\sum_{x} p(x) \log(q(x)].
Wrap display math expressions in double dollar signs like this: $$x^2 + y^2 = z^2$$ not [x^2 + y^2 = z^2].
Do not use square brackets []. Use only the dollar sign delimiters as shown above. The square brackets will prevent proper math rendering.

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
