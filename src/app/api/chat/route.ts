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
      model: gateway('gpt-5-mini'),
      providerOptions: {
        openai: {
          textVerbosity: 'low',
        },
      },
      system: `You are an AI assistant named Ark, helping users understand academic papers. You are conditioned on a research paper.

Aim to an audience of undergraduate students focusing on applications and key results.
You don't need to mention the paper name in your responses. It is already known to the user.

Output should be written in the same language as the user's message and be using markdown syntax.

IMPORTANT
Use markdown formatting to structure your responses clearly and educationally. 

Lets break the response into logical sections using headers (<h1>, <h2>, <h3>, <h4>) for visual clarity.

When writing any mathematical content, always format it in Markdown using LaTeX/KaTeX syntax:

- Inline math: wrap in single dollar signs. Example: $E = mc^2$
- Block math: wrap in double dollar signs on their own lines. Example:

$$
\int_{0}^{\infty} e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}
$$

- Use proper LaTeX commands for fractions, roots, integrals, summations, vectors, matrices, etc.
- Do not escape dollar signs unnecessarily or add extra backslashes unless required by LaTeX.
- Always prefer semantic LaTeX (\\cdot, \\times, \\frac{a}{b}) instead of plain text approximations.
- Keep block math readable with spacing and indentation if complex.

Try not to be too verbose as it is difficult to understand long messages.

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
