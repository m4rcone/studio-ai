import { env } from "./env";
import { STUDIO_TOOLS } from "./tools";
import { executeTool } from "./tool-handlers";
import { getSession } from "./session";
import { buildSystemPrompt } from "./system-prompt";
import type { UserRole, StreamEvent } from "./types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;
const MAX_ITERATIONS = 10; // guard against infinite tool loops

// ---------------------------------------------------------------------------
// Anthropic message types (internal)
// ---------------------------------------------------------------------------

type TextBlock = { type: "text"; text: string };
type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
};
type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
};
type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

// ---------------------------------------------------------------------------
// SSE stream parser
// Yields parsed data objects from an Anthropic streaming response.
// ---------------------------------------------------------------------------

async function* parseSSE(
  response: Response,
): AsyncGenerator<Record<string, unknown>> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!; // last element may be incomplete

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          yield JSON.parse(raw) as Record<string, unknown>;
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Single Anthropic API call (always streaming)
// ---------------------------------------------------------------------------

async function callAnthropic(
  messages: AnthropicMessage[],
  systemPrompt: string,
): Promise<Response> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      tools: STUDIO_TOOLS,
      stream: true,
    }),
  });

  if (!res.ok) {
    let msg = `Anthropic API error ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) msg += `: ${body.error.message}`;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Process one streaming API response.
// Forwards text deltas immediately via pushEvent.
// Returns the stop reason, accumulated assistant content, and any tool calls.
// ---------------------------------------------------------------------------

interface BlockState {
  type: "text" | "tool_use";
  text: string;
  tool_id: string;
  tool_name: string;
  input_json: string;
}

interface IterationResult {
  stopReason: string;
  assistantContent: ContentBlock[];
  toolCalls: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
}

async function processStream(
  response: Response,
  pushEvent: (event: StreamEvent) => void,
): Promise<IterationResult> {
  const blocks = new Map<number, BlockState>();
  let stopReason = "end_turn";

  for await (const event of parseSSE(response)) {
    const eventType = event.type as string;

    if (eventType === "content_block_start") {
      const index = event.index as number;
      const block = event.content_block as Record<string, unknown>;

      if (block.type === "text") {
        blocks.set(index, {
          type: "text",
          text: (block.text as string) ?? "",
          tool_id: "",
          tool_name: "",
          input_json: "",
        });
      } else if (block.type === "tool_use") {
        const name = block.name as string;
        blocks.set(index, {
          type: "tool_use",
          text: "",
          tool_id: block.id as string,
          tool_name: name,
          input_json: "",
        });
      }
      continue;
    }

    if (eventType === "content_block_delta") {
      const index = event.index as number;
      const delta = event.delta as Record<string, unknown>;
      const block = blocks.get(index);
      if (!block) continue;

      if (delta.type === "text_delta" && block.type === "text") {
        const chunk = delta.text as string;
        block.text += chunk;
        pushEvent({ type: "text", content: chunk });
      } else if (
        delta.type === "input_json_delta" &&
        block.type === "tool_use"
      ) {
        block.input_json += delta.partial_json as string;
      }
      continue;
    }

    if (eventType === "content_block_stop") {
      // Nothing to do — block is fully accumulated already
      continue;
    }

    if (eventType === "message_delta") {
      const delta = event.delta as Record<string, unknown>;
      if (delta.stop_reason) stopReason = delta.stop_reason as string;
      continue;
    }
  }

  // Assemble assistant content blocks and tool calls
  const assistantContent: ContentBlock[] = [];
  const toolCalls: IterationResult["toolCalls"] = [];

  for (const [, block] of [...blocks.entries()].sort(([a], [b]) => a - b)) {
    if (block.type === "text") {
      if (block.text) assistantContent.push({ type: "text", text: block.text });
    } else {
      let input: Record<string, unknown> = {};
      try {
        input = block.input_json
          ? (JSON.parse(block.input_json) as Record<string, unknown>)
          : {};
      } catch {
        input = {};
      }

      assistantContent.push({
        type: "tool_use",
        id: block.tool_id,
        name: block.tool_name,
        input,
      });

      toolCalls.push({ id: block.tool_id, name: block.tool_name, input });
    }
  }

  return { stopReason, assistantContent, toolCalls };
}

// ---------------------------------------------------------------------------
// Stream output helpers
// ---------------------------------------------------------------------------

function makeEncoder(controller: ReadableStreamDefaultController) {
  const enc = new TextEncoder();
  return (event: StreamEvent) => {
    controller.enqueue(enc.encode(JSON.stringify(event) + "\n"));
  };
}

// ---------------------------------------------------------------------------
// Public: run the agent and return a ReadableStream of StreamEvents
// ---------------------------------------------------------------------------

export async function runAgent(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  username: string;
  userRole: UserRole;
}): Promise<ReadableStream> {
  const { messages, username, userRole } = params;

  // Build system prompt (may hit GitHub API, cached after first call)
  const systemPrompt = await buildSystemPrompt(userRole);

  // Convert simple messages to Anthropic format
  const history: AnthropicMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return new ReadableStream({
    async start(controller) {
      const push = makeEncoder(controller);

      try {
        let iteration = 0;

        while (iteration < MAX_ITERATIONS) {
          iteration++;

          const response = await callAnthropic(history, systemPrompt);
          const { stopReason, assistantContent, toolCalls } =
            await processStream(response, push);

          // Always append assistant turn (even if it only has tool_use blocks)
          if (assistantContent.length > 0) {
            history.push({ role: "assistant", content: assistantContent });
          }

          if (stopReason === "end_turn" || toolCalls.length === 0) {
            // Done — emit final session state
            const activeSession = getSession(username);
            push({ type: "done", session: activeSession });
            break;
          }

          // Execute tool calls and collect results
          const toolResults: ToolResultBlock[] = [];

          for (const call of toolCalls) {
            push({ type: "tool_call", name: call.name, input: call.input });

            let resultContent: string;
            try {
              resultContent = await executeTool(call.name, call.input, {
                username,
              });
            } catch (err) {
              resultContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
            }

            // Emit a short summary (first line of result keeps chat UI tidy)
            const summary = resultContent.split("\n")[0].slice(0, 120);
            push({ type: "tool_result", name: call.name, summary });

            toolResults.push({
              type: "tool_result",
              tool_use_id: call.id,
              content: resultContent,
            });
          }

          // Append tool results as a user turn
          history.push({ role: "user", content: toolResults });
        }

        if (iteration >= MAX_ITERATIONS) {
          push({
            type: "error",
            message: "Maximum iterations reached. Please try again.",
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        push({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });
}
