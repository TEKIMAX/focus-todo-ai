import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: NextRequest) {
  try {
    const { bulletPoints } = await req.json()

    const result = await generateText({
      model: openai('gpt-5', {
        reasoningEffort: 'medium'
      }),
      prompt: `
You are an AI writing assistant helping someone organize their daily tasks into a clear, detailed paragraph.

The user has provided this list of tasks/items:
"${bulletPoints}"

Please rewrite this into a well-structured, detailed paragraph that includes:
- All the tasks and activities mentioned
- Any time information provided
- A natural flow that makes sense chronologically
- Additional context that would help with planning
- Specific details about priorities, deadlines, and time constraints

Make it sound natural and comprehensive, as if the person is describing their full day to a productivity assistant. Include estimated timeframes where appropriate and mention any dependencies or priorities.

Keep the writing style conversational but detailed. Don't add tasks that weren't mentioned, but do provide helpful context and organize the information logically.
      `,
    })

    return Response.json({ rewrittenText: result.text })
  } catch (error) {
    console.error('Error rewriting description:', error)
    return Response.json(
      { error: 'Failed to rewrite description' },
      { status: 500 }
    )
  }
}
