import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    console.log('Received text for translation:', text)

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // 调用 OpenAI API 进行翻译
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a translator. Translate the following English text to Chinese. Only output the translation, no explanations."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    const translation = completion.choices[0].message.content;
    console.log('Translation result:', translation)
    
    return NextResponse.json({ translation })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
} 