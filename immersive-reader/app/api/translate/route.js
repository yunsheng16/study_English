export const runtime = 'edge';

export async function POST(req) {
  try {
    const { text, mode } = await req.json(); // mode: 'sentence' | 'full'
    if (!text) return Response.json({ error: 'No text provided' }, { status: 400 });

    const prompt = mode === 'full'
      ? `将以下英文文章翻译成中文，保留段落结构，只返回译文：\n\n${text}`
      : `将以下英文句子翻译成中文，只返回译文，不要任何解释：\n\n${text}`;

    const maxTokens = mode === 'full' ? 2000 : 400;

    // Try Anthropic first, then DeepSeek
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
      if (data.content?.[0]?.text) return Response.json({ result: data.content[0].text.trim() });
    }

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
      if (data.choices?.[0]?.message?.content)
        return Response.json({ result: data.choices[0].message.content.trim() });
    }

    return Response.json({ error: '未配置 API Key，请在 Vercel 控制台添加环境变量' }, { status: 503 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
