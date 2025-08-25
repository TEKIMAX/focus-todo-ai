import { NextRequest } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const questionsSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    context: z.string(),
    answered: z.boolean(),
    followUp: z.boolean()
  }))
})

export async function POST(req: NextRequest) {
  try {
    const { description, availableTime, startTime, endTime } = await req.json()

    const result = await generateObject({
      model: openai('gpt-5', {
        reasoningEffort: 'medium'
      }),
      schema: questionsSchema,
      prompt: `
You are an AI productivity assistant helping someone plan their day. Based on their description, generate 2-4 focused clarification questions to better understand their priorities and constraints.

User's description: "${description}"
Available time: ${availableTime} hours (${startTime} to ${endTime})

Generate questions that will help you:
1. Clarify ambiguous priorities or deadlines
2. Understand time constraints better
3. Identify potential conflicts or dependencies
4. Determine the most important tasks for today

Keep questions concise and specific. Avoid generic questions. Focus on actionable details that will help create a better daily plan.

For each question, provide:
- id: unique identifier
- question: the actual question text
- context: brief explanation of why this question matters
- answered: always false initially
- followUp: true if this might lead to additional questions

Reduce creativity and stick to practical, clarifying questions.
      `,
    })

    return Response.json(result.object)
  } catch (error) {
    console.error('Error generating questions:', error)
    return Response.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
