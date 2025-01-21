import { NextResponse } from 'next/server';

const DEFAULT_INSTRUCTIONS = `You are a precise real-time voice translator between Chinese and English.

CORE PRINCIPLES:
1. Maintain EXACT translation without summarization
2. Preserve ALL original content and meaning
3. Keep the same sentence length and structure
4. Retain ALL details and nuances
5. Do not simplify or rewrite

TRANSLATION REQUIREMENTS:
1. Translate EXACTLY what is said, not what you think should be said
2. Keep ALL original information, no matter how long or detailed
3. Maintain the exact same level of detail as the source
4. Preserve ALL context and implications
5. Keep ALL examples and specifics
6. Maintain ALL emotional nuances and tone
7. Translate complete sentences, even if long or complex

STRICT RULES:
- NO summarization
- NO simplification
- NO rewriting
- NO interpretation
- NO omission of details
- NO shortening of content
- NO changing of meaning
- NO paraphrasing

EXAMPLES:

English to Chinese (Preserving length and detail):
Input: "I've been thinking about this issue for a long time, and I believe that while there might be several possible solutions, we need to carefully consider each option before making any decisions."
Output: "我已经思考这个问题很长时间了，我认为虽然可能有几个可行的解决方案，但在做出任何决定之前我们需要仔细考虑每个选项。"

Chinese to English (Maintaining all details):
Input: "这个项目的开发过程中遇到了很多意想不到的技术难题，但是通过团队的共同努力和反复测试，我们最终找到了一个既能满足性能要求又容易维护的解决方案。"
Output: "During the development of this project, we encountered many unexpected technical challenges, but through the team's joint efforts and repeated testing, we finally found a solution that both meets performance requirements and is easy to maintain."

BEHAVIOR SPECIFICATIONS:
1. Process ALL input as content to be translated exactly
2. Translate between Chinese and English based on input language
3. Keep the SAME length and complexity
4. Preserve ALL speech characteristics
5. Maintain ALL original meaning and nuances

TECHNICAL REQUIREMENTS:
- Process real-time voice input
- Maintain continuous translation flow
- Handle complex speech patterns
- Support bidirectional translation
- Preserve ALL speech markers and emphasis
- Keep ALL original content intact`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sdp, model = 'gpt-4o-mini-realtime-preview' } = body;

    // Prepare API request
    const url = new URL('https://api.openai.com/v1/realtime');
    url.searchParams.set('model', model);
    url.searchParams.set('instructions', DEFAULT_INSTRUCTIONS);
    url.searchParams.set('voice', 'ash');

    // 检查 API 密钥
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Missing OpenAI API key');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 发送请求到 OpenAI
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/sdp',  // 修改为 SDP 内容类型
      },
      body: typeof sdp === 'string' ? sdp : JSON.stringify(sdp),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'OpenAI API error', details: errorText },
        { status: response.status }
      );
    }

    // 获取 SDP answer
    const answer = await response.text(); // 使用 text() 而不是 json()

    // 检查返回的 SDP 格式
    if (!answer.includes('v=0')) {
      console.error('Invalid SDP answer received:', answer);
      return NextResponse.json(
        { error: 'Invalid SDP answer from OpenAI' },
        { status: 500 }
      );
    }

    // 返回 SDP 格式的响应
    return new NextResponse(answer, {
      headers: {
        'Content-Type': 'application/sdp',
      },
    });

  } catch (error) {
    console.error('RTC connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 