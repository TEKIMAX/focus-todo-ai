import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest } from 'next/server'

const todoSchema = z.object({
  id: z.number(),
  text: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  estimatedMinutes: z.number(),
  order: z.number(),
})

const organizeResponseSchema = z.object({
  organizedTodos: z.array(todoSchema),
  timeAllocations: z.array(z.object({
    todoId: z.number(),
    allocatedMinutes: z.number(),
    suggestedOrder: z.number(),
    reasoning: z.string(),
  })),
  reasoning: z.string(),
  totalTimeNeeded: z.number(),
})

export async function POST(req: NextRequest) {
  try {
    const { todos, totalAvailableMinutes, focusMode } = await req.json()

    const result = await generateObject({
      model: openai('gpt-5', {
        reasoningEffort: 'medium'
      }),
      schema: organizeResponseSchema,
      prompt: `
You are an AI productivity assistant specializing in task prioritization and time management. 

Analyze the following todos and organize them optimally based on:
- Priority level (urgent > high > medium > low)
- Complexity (simple < moderate < complex)
- Estimated time to complete
- Available time: ${totalAvailableMinutes} minutes
- Focus mode: ${focusMode}

Current todos:
${JSON.stringify(todos, null, 2)}

Rules for organization:
1. For "urgent" focus mode: Prioritize by deadline and urgency
2. For "balanced" focus mode: Mix high-priority and quick wins
3. For "deadline" focus mode: Strictly order by deadline proximity
4. For "complexity" focus mode: Start with simple tasks to build momentum

For each todo:
- Assign realistic time estimates based on complexity
- Suggest optimal order (1 = do first)
- Provide reasoning for placement
- Ensure total allocated time doesn't exceed available time

If total time needed exceeds available time, prioritize the most important tasks and explain which ones to defer.

Return the organized todos with updated order values and detailed time allocations.
      `,
    })

    return Response.json(result.object)
  } catch (error) {
    console.error('Error organizing todos:', error)
    return Response.json(
      { error: 'Failed to organize todos' },
      { status: 500 }
    )
  }
}
