/**
 * SSE 解析（浏览器直连厂商接口时用，纯函数）
 *
 * 输入是任意字节切分的流：`TextDecoder({ stream: true })` 处理跨块的多字节字符，
 * 这里的行缓冲处理跨块的 `\n`，所以 `data: {"delta":…}` 被切成两段也能正确拼回。
 *
 * delta 文本口径与全站一致：`{"delta":{"text":"…"}}`，同时兼容 OpenAI 官方格式
 * （`choices[0].delta.content`）与部分网关的 `choices[0].delta.text`。
 */

/** 从一条 `data:` 载荷里取出增量文本；取不到就返回空串（不抛异常） */
export function extractDeltaText(payload: string): string {
  const p = payload.trim();
  if (!p || p === '[DONE]') return '';
  try {
    const j = JSON.parse(p) as {
      choices?: { delta?: { content?: string; text?: string } }[];
      delta?: { text?: string };
    };
    return j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.delta?.text ?? j.delta?.text ?? '';
  } catch {
    return '';
  }
}

/**
 * 行缓冲解析：喂入累计文本，返回可消费的 delta 与留下的残段。
 * `rest` 交给下一块继续拼。
 */
export function parseSseBuffer(buffer: string): { deltas: string[]; rest: string } {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const deltas: string[] = [];
  for (const raw of lines) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (!line.startsWith('data:')) continue;
    const text = extractDeltaText(line.slice(5));
    if (text) deltas.push(text);
  }
  return { deltas, rest };
}

/**
 * 把 Response.body 读成流式文本，边读边回调（用于 setAnalysis / setMessages 刷新）。
 * @returns 全文
 */
export async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let acc = '';
  let pending = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const { deltas, rest } = parseSseBuffer(pending);
    pending = rest;
    if (deltas.length) {
      const joined = deltas.join('');
      acc += joined;
      onDelta(joined);
    }
  }
  // 流结束时若残段是完整的一条 data 行（末尾没有换行），补一次
  const tail = pending.replace(/\r$/, '');
  if (tail.startsWith('data:')) {
    const text = extractDeltaText(tail.slice(5));
    if (text) { acc += text; onDelta(text); }
  }
  return acc;
}
