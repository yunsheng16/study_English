export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { word } = await req.json();
    if (!word) return Response.json({ error: 'No word' }, { status: 400 });

    const prompt = `给出英文单词"${word}"的音标和中文释义。严格按以下格式返回两行，无其他内容：\n音标: /xxx/\n释义: 词性. 中文意思；其他常用义`;

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
          max_tokens: 80,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.content?.[0]?.text) return Response.json(parse(data.content[0].text));
      console.error('Anthropic lookup error:', JSON.stringify(data));
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
          max_tokens: 80,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) return Response.json(parse(data.choices[0].message.content));
      console.error('DeepSeek lookup error:', JSON.stringify(data));
    }

    return Response.json({ ph: '', zh: '未配置 API Key' }, { status: 503 });
  } catch (e) {
    console.error('lookup error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

function parse(text) {
  const ph = (text.match(/音标[:：]\s*([^\n]+)/) || [])[1]?.trim() || '';
  const zh = (text.match(/释义[:：]\s*([^\n]+)/) || [])[1]?.trim() || text.trim();
  return { ph, zh };
}
