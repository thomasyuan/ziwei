/**
 * SSE 解析（浏览器直连厂商接口时用，纯函数）
 *
 * 输入是任意字节切分的流：`TextDecoder({ stream: true })` 处理跨块的多字节字符，
 * 这里的行缓冲处理跨块的 `\n`，所以 `data: {"delta":…}` 被切成两段也能正确拼回。
 *
 * 取文本的口径：
 *   - 正文 `choices[0].delta.content`（OpenAI 官方格式）
 *   - 思考过程 `choices[0].delta.reasoning_content`（DeepSeek 等带 thinking 的模型）
 *   - 部分网关的 `choices[0].delta.text` 与 `delta.text`
 *   - 非流式兜底 `choices[0].message.content`（某些网关忽略 stream 参数时）
 * 正文与思考分开收集：只出思考不出正文时也必须有东西可显示（否则用户看到空白气泡）。
 */

/** 一条 delta：正文 + 思考过程（两者都可能为空串）+ 结束原因（只在最后一块出现） */
export interface SseDelta {
  content: string;
  reasoning: string;
  /** stop / length / content_filter / aborted …（到长度上限时就是 length） */
  finishReason?: string | null;
}

export function extractDelta(payload: string): SseDelta {
  const p = payload.trim();
  const empty: SseDelta = { content: '', reasoning: '' };
  if (!p || p === '[DONE]') return empty;
  try {
    const j = JSON.parse(p) as {
      choices?: {
        delta?: { content?: string | null; text?: string | null; reasoning_content?: string | null };
        message?: { content?: string | null };
        finish_reason?: string | null;
      }[];
      delta?: { text?: string | null };
    };
    const c = j.choices?.[0];
    return {
      content: c?.delta?.content ?? c?.delta?.text ?? j.delta?.text ?? c?.message?.content ?? '',
      reasoning: c?.delta?.reasoning_content ?? '',
      finishReason: c?.finish_reason ?? null,
    };
  } catch {
    return empty;
  }
}

/** 兼容旧调用：只要正文 */
export function extractDeltaText(payload: string): string {
  return extractDelta(payload).content;
}

/** 行缓冲解析：喂入累计文本，返回可消费的 delta 与留下的残段 */
export function parseSseBuffer(buffer: string): { deltas: SseDelta[]; rest: string } {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const deltas: SseDelta[] = [];
  for (const raw of lines) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (!line.startsWith('data:')) continue;
    const d = extractDelta(line.slice(5));
    if (d.content || d.reasoning || d.finishReason) deltas.push(d);
  }
  return { deltas, rest };
}

/**
 * 把 Response.body 读成流式文本，边读边回调。
 * @param onDelta 正文增量
 * @param onReasoning 思考增量（不传就只收集、不回调）
 * @returns 正文全文、思考全文与结束原因（length = 撞上 max_tokens 上限）
 */
export async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string) => void,
  onReasoning?: (chunk: string) => void,
): Promise<{ text: string; reasoning: string; finishReason: string | null }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let reasoning = '';
  let finishReason: string | null = null;
  let pending = '';
  const consume = (deltas: SseDelta[]) => {
    for (const d of deltas) {
      if (d.content) { text += d.content; onDelta(d.content); }
      if (d.reasoning) { reasoning += d.reasoning; onReasoning?.(d.reasoning); }
      if (d.finishReason) finishReason = d.finishReason;
    }
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const { deltas, rest } = parseSseBuffer(pending);
    pending = rest;
    if (deltas.length) consume(deltas);
  }
  // 流结束时若残段是完整的一条 data 行（末尾没有换行），补一次
  const tail = pending.replace(/\r$/, '');
  if (tail.startsWith('data:')) {
    const d = extractDelta(tail.slice(5));
    if (d.content || d.reasoning || d.finishReason) consume([d]);
  }
  return { text, reasoning, finishReason };
}

/** 非流式响应（网关忽略 stream 时）兜底：从整个 JSON 里取正文 */
export function textFromJsonBody(body: string): string {
  try {
    const j = JSON.parse(body) as { choices?: { message?: { content?: string | null } }[] };
    return j.choices?.[0]?.message?.content ?? '';
  } catch {
    return '';
  }
}
