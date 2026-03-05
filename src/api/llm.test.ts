import { describe, expect, it } from "vitest";
import { parseSSEDataLine } from "./llm.ts";

describe("parseSSEDataLine", () => {
  it("extracts content from a valid Groq SSE chunk line", () => {
    const line = 'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}';
    expect(parseSSEDataLine(line)).toBe("Hello");
  });

  it("extracts content from chunk with single character", () => {
    const line = 'data: {"choices":[{"delta":{"content":"!"},"finish_reason":null}]}';
    expect(parseSSEDataLine(line)).toBe("!");
  });

  it("returns null for data: [DONE]", () => {
    expect(parseSSEDataLine("data: [DONE]")).toBeNull();
  });

  it("returns null for empty line", () => {
    expect(parseSSEDataLine("")).toBeNull();
    expect(parseSSEDataLine("   ")).toBeNull();
  });

  it("returns null for line without data: prefix", () => {
    expect(parseSSEDataLine('{"choices":[]}')).toBeNull();
  });

  it("returns null when delta has no content", () => {
    const line = 'data: {"choices":[{"delta":{},"finish_reason":null}]}';
    expect(parseSSEDataLine(line)).toBeNull();
  });

  it("parses multiple lines like a real SSE stream", () => {
    const lines = [
      'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}',
      'data: {"choices":[{"delta":{"content":" "},"finish_reason":null}]}',
      'data: {"choices":[{"delta":{"content":"world"},"finish_reason":null}]}',
      "data: [DONE]",
    ];
    const result: string[] = [];
    for (const line of lines) {
      const content = parseSSEDataLine(line);
      if (content !== null) result.push(content);
    }
    expect(result.join("")).toBe("Hello world");
  });
});
