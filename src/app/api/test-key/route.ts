import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key by making a simple request to Vercel AI Gateway
    const testResponse = await fetch('https://api.vercel.com/v1/ai/gateway/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message.'
          }
        ],
        max_tokens: 10
      }),
    });

    if (testResponse.ok) {
      return NextResponse.json({ success: true, message: 'API key is valid' });
    } else {
      const errorData = await testResponse.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'API key validation failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API key test error:', error);
    return NextResponse.json(
      { error: 'Failed to test API key' },
      { status: 500 }
    );
  }
}
