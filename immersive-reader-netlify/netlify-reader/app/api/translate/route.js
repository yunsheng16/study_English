export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { text, mode } = await req.json();
    if (!text) return Response.json({ error: 'No text' }, { status: 400 });

    const prompt = mode === 'full'
      ? `将以下英文文章翻译成中文，保留段落结构，只返回译文：\n\n${text}`
      : `将以下英文句子翻译成中文，只返回译文，不要任何解释：\n\n${text}`;

    const maxTokens = mode === 'full' ? 2000 : 400;

    // Try Anthropic first
    if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.content?.[0]?.text) {
        return Response.json({ result: data.content[0].text.trim() });
      }
      console.error('Anthropic error:', JSON.stringify(data));
    }

    // Try DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return Response.json({ result: data.choices[0].message.content.trim() });
      }
      console.error('DeepSeek error:', JSON.stringify(data));
    }

    return Response.json(
      { error: '未找到可用的 API Key，请在 Netlify → Site configuration → Environment variables 中添加 ANTHROPIC_API_KEY 或 DEEPSEEK_API_KEY' },
      { status: 503 }
    );
  } catch (e) {
    console.error('translate error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
