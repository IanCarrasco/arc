# Setup Guide for Vercel AI SDK Integration

## Prerequisites

1. **OpenAI API Key**: You'll need an OpenAI API key to use the AI chat functionality.

## Installation

1. Install the required dependencies:
   ```bash
   npm install ai openai
   ```

2. Create a `.env.local` file in your project root with your OpenAI API key:
   ```bash
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional: Set a different model if needed
   # OPENAI_MODEL=gpt-4o-mini
   ```

## Configuration

The AI chat functionality is now integrated into your paper viewer panel. The system will:

- Use the Vercel AI SDK for real-time streaming chat
- Connect to OpenAI's GPT-4o-mini model
- Provide context-aware responses about academic papers
- Support real-time typing indicators and message streaming

## Features

- **Real-time Chat**: Stream responses from OpenAI
- **Context Awareness**: The AI knows which paper you're viewing
- **Interactive UI**: Clickable example questions and smooth animations
- **Responsive Design**: Works with the resizable panel system

## Usage

1. Navigate to any paper URL (e.g., `/paper/2401.00123`)
2. Use the right panel to chat with the AI about the paper
3. Ask questions about methodology, results, or any academic content
4. The AI will provide helpful, context-aware responses

## Troubleshooting

- Ensure your `.env.local` file contains a valid OpenAI API key
- Check that the API route `/api/chat` is accessible
- Verify that the `ai` and `openai` packages are properly installed

## Security Notes

- Never commit your `.env.local` file to version control
- The OpenAI API key is only used server-side in the API route
- All chat interactions are processed through secure API endpoints
