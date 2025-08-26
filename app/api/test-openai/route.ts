import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Test the API key by making a simple request
    const testClient = openai({
      apiKey: apiKey,
    })

    // Try to list models to validate the key
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to validate API key' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error testing OpenAI API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
