import { NextRequest } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { DailyPlan, TodoItem } from '@/lib/types'

const todoItemSchema = z.object({
  id: z.number(),
  text: z.string(),
  description: z.string(),
  checked: z.boolean(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  estimatedMinutes: z.number(),
  deadline: z.string().optional(),
  createdAt: z.string(),
  tags: z.array(z.string()).optional(),
  order: z.number(),
  focusTimeSpent: z.number(),
  attempts: z.number(),
  isCurrentlyActive: z.boolean(),
  progressStatus: z.enum(['not-started', 'in-progress', 'completed', 'needs-clarification'])
})

const dailyPlanSchema = z.object({
  id: z.string(),
  date: z.string(),
  userInput: z.string(),
  availableHours: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  priorities: z.array(z.string()),
  todos: z.array(todoItemSchema),
  isFinalized: z.boolean(),
  reasoning: z.string()
})

export async function POST(req: NextRequest) {
  try {
    const { onboardingData, questions } = await req.json()
    
    const questionsAndAnswers = questions
      .filter((q: any) => q.answered)
      .map((q: any) => `Q: ${q.question}\nA: ${q.answer}`)
      .join('\n\n')

    const result = await generateObject({
      model: openai('gpt-5', {
        reasoningEffort: 'medium'
      }),
      schema: dailyPlanSchema,
      prompt: `
You are an AI productivity assistant creating a detailed daily plan. Based on the user's input and clarification questions, generate a comprehensive todo list with accurate time estimates.

User's Daily Description:
"${onboardingData.dailyDescription}"

Available Time: ${onboardingData.availableTime} hours (${onboardingData.startTime} to ${onboardingData.endTime})
User's Priorities: ${onboardingData.priorities.join(', ')}

Clarification Q&A:
${questionsAndAnswers}

Create a realistic daily plan with:

1. Break down the user's description into specific, actionable todos
2. Assign realistic time estimates based on complexity
3. Set appropriate priorities (urgent for deadlines today, high for important tasks, etc.)
4. Order tasks optimally considering:
   - Deadlines and time constraints
   - Energy levels (complex tasks earlier when possible)
   - Dependencies between tasks
   - User's stated priorities

5. Include small buffer time between tasks
6. Don't overscheduler - leave some flexibility

For each todo:
- id: unique number
- text: clear, actionable task title
- description: specific details about what needs to be done
- priority: based on urgency and importance
- complexity: realistic assessment
- estimatedMinutes: conservative time estimate
- deadline: if mentioned in description (ISO format)
- tags: relevant categories
- order: optimal sequence (1 = first task)

Provide reasoning for your task organization and time allocation decisions.

Generate the response in the exact schema format required.
      `,
    })

    // Convert string dates back to Date objects for the response
    const plan: DailyPlan = {
      ...result.object,
      date: new Date(result.object.date),
      isFinalized: result.object.isFinalized !== undefined ? result.object.isFinalized : true,
      todos: result.object.todos.map(todo => ({
        ...todo,
        checked: todo.checked || false,
        createdAt: new Date(todo.createdAt),
        deadline: todo.deadline ? new Date(todo.deadline) : undefined,
        focusTimeSpent: todo.focusTimeSpent || 0,
        attempts: todo.attempts || 0,
        isCurrentlyActive: todo.isCurrentlyActive || false,
        progressStatus: todo.progressStatus || 'not-started'
      }))
    }

    return Response.json(plan)
  } catch (error) {
    console.error('Error generating daily plan:', error)
    return Response.json(
      { error: 'Failed to generate daily plan' },
      { status: 500 }
    )
  }
}
