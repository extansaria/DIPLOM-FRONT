import { useEffect, useRef, useState, type ReactNode } from "react";
import { SendIcon, SparkIcon } from "./icons";
import type { AiMatch, ChatMessage } from "../types";

const API_BASE_URL = (typeof window !== "undefined" && (window as Window & { __AI_API_URL__?: string }).__AI_API_URL__) || "http://localhost:3001";
const CHAT_STORAGE_KEY = "gydex-ai-chat-messages-v1";

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "ai",
    text: "Привет! Я AI-помощник GYDEX. Опиши цель или мышцу, и я подберу упражнения из базы."
  }
];

function cleanMarkdown(text: string) {
  const noMd = String(text || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\r/g, "");

  const cleaned = noMd
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^\|.*\|$/.test(t)) return false;
      if (/^[-|:\s]{5,}$/.test(t)) return false;
      return true;
    })
    .join("\n");

  return cleaned.trim();
}

function toParagraphs(text: string) {
  return cleanMarkdown(text)
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function linkifyChunks(text: string): ReactNode[] {
  const s = String(text ?? "");
  if (!s) return [];
  const urlRe = /https?:\/\/[^\s<>"')]+/gi;
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(s)) !== null) {
    if (m.index > last) nodes.push(s.slice(last, m.index));
    const href = m[0].replace(/[.,;:!?)]+$/, "");
    const tail = m[0].slice(href.length);
    nodes.push(
      <a
        key={`u-${m.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="ai-msg-inline-link"
      >
        {href}
      </a>
    );
    if (tail) nodes.push(tail);
    last = m.index + m[0].length;
  }
  if (last < s.length) nodes.push(s.slice(last));
  return nodes.length ? nodes : [s];
}

function linkifyMarkdownLinks(text: string): ReactNode[] {
  const s = String(text ?? "");
  if (!s) return [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) nodes.push(...linkifyChunks(s.slice(last, m.index)));
    const label = m[1];
    const href = m[2];
    nodes.push(
      <a
        key={`md-${m.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="ai-msg-inline-link"
      >
        {label}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < s.length) nodes.push(...linkifyChunks(s.slice(last)));
  return nodes.length ? nodes : linkifyChunks(s);
}

function normalizeText(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(text: string) {
  return normalizeText(text).replace(/[\s-]+/g, "");
}

function findDbMatchByTitle(title: string, matches: AiMatch[] | undefined): AiMatch | null {
  const cleanTitle = String(title || "").replace(/^\d+[.)]\s*/, "").replace(/\s*\(.*?\)\s*$/g, "");
  const normalizedTitle = normalizeText(cleanTitle);
  const compactTitle = compactText(cleanTitle);
  if (!normalizedTitle) return null;
  return (
    (matches || []).find((m) => {
      const rawDbTitle = String(m.title || "").replace(/\s*\(.*?\)\s*$/g, "");
      const dbTitle = normalizeText(rawDbTitle);
      const dbTitleCompact = compactText(rawDbTitle);
      return (
        dbTitle === normalizedTitle ||
        dbTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(dbTitle) ||
        dbTitleCompact === compactTitle ||
        dbTitleCompact.includes(compactTitle) ||
        compactTitle.includes(dbTitleCompact)
      );
    }) || null
  );
}

function findDbMatchForBlock(title: string, idx: number, matches: AiMatch[] | undefined): AiMatch | null {
  const list = matches || [];
  const byTitle = findDbMatchByTitle(title, list);
  if (byTitle) return byTitle;
  // Fallback: if the model reordered/shortened the name, keep DB links by position.
  return list[idx] || null;
}

type ExerciseBlock = { title: string; why: string; tip: string };

function parseExerciseBlocks(rawText: string): ExerciseBlock[] {
  const text = cleanMarkdown(rawText);
  const numbered = text.match(/(?:^|\n)\s*\d+[.)]\s[\s\S]*?(?=(?:\n\s*\d+[.)]\s)|$)/g);
  const chunks = numbered && numbered.length ? numbered : toParagraphs(text);

  return chunks
    .map((chunk) => {
      const lines = chunk
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
      if (!lines.length) return null;

      const first = lines[0].replace(/^\d+[.)]\s*/, "").trim();
      const whyLine = lines.find((x) => /^почему подходит[:]?/i.test(x));
      const tipLine = lines.find((x) => /^подсказка по технике[:]?/i.test(x));

      const why =
        whyLine?.replace(/^почему подходит[:]?/i, "").trim() ||
        lines.slice(1).find((x) => !/^подсказка по технике[:]?/i.test(x)) ||
        "";
      const tip = tipLine?.replace(/^подсказка по технике[:]?/i, "").trim() || "";

      return { title: first, why, tip };
    })
    .filter((x): x is ExerciseBlock => Boolean(x));
}

function renderAiMessageContent(msg: ChatMessage, onOpenExerciseBySlug?: (slug: string) => void): ReactNode {
  const dbMatches = msg.matches || [];
  if (!dbMatches.length) {
    return toParagraphs(msg.text).map((para, idx) => (
      <p key={`${msg.id}-p-${idx}`}>{linkifyMarkdownLinks(para)}</p>
    ));
  }

  const blocks = parseExerciseBlocks(msg.text);
  if (!blocks.length) {
    return toParagraphs(msg.text).map((para, idx) => (
      <p key={`${msg.id}-p-${idx}`}>{linkifyMarkdownLinks(para)}</p>
    ));
  }
  const sourceLength = Math.max(dbMatches.length, blocks.length);
  return Array.from({ length: sourceLength }).map((_, idx) => {
    const block = blocks[idx] || { title: "", why: "", tip: "" };
    const dbMatch = idx < dbMatches.length ? dbMatches[idx] : findDbMatchForBlock(block.title, idx, dbMatches);
    const titleText = dbMatch?.title || block.title || `Упражнение ${idx + 1}`;
    return (
      <div key={`${msg.id}-${idx}`} className="ai-exercise-block">
        {dbMatch ? (
          <button type="button" className="ai-exercise-link" onClick={() => onOpenExerciseBySlug?.(dbMatch.slug)}>
            {idx + 1}) {titleText}
          </button>
        ) : (
          <p className="ai-exercise-title">{linkifyMarkdownLinks(`${idx + 1}) ${titleText}`)}</p>
        )}
        {block.why ? (
          <p>
            <strong>Почему подходит:</strong> {linkifyMarkdownLinks(block.why)}
          </p>
        ) : null}
        {block.tip ? (
          <p>
            <strong>Подсказка по технике:</strong> {linkifyMarkdownLinks(block.tip)}
          </p>
        ) : null}
      </div>
    );
  });
}

type AiSupportWidgetProps = {
  onOpenCatalogByMuscleGroup?: (groupId: string) => void;
  onOpenExerciseBySlug?: (slug: string) => void;
};

export function AiSupportWidget({ onOpenExerciseBySlug }: AiSupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return DEFAULT_MESSAGES;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed as ChatMessage[];
    } catch {
      /* ignore corrupted storage */
    }
    return DEFAULT_MESSAGES;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore storage quota errors */
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const host = messagesRef.current;
    if (!host) return;
    host.scrollTop = host.scrollHeight;
  }, [isOpen, messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const ac = new AbortController();
      // Backend can retry model calls; keep client timeout longer.
      const timeoutId = setTimeout(() => ac.abort(), 130000);
      let res: Response;
      try {
        res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          signal: ac.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      const data: { answer?: string; error?: string; matches?: AiMatch[] } = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Ошибка AI API");
      }

      const matches = Array.isArray(data.matches) ? data.matches : [];
      const aiMessage: ChatMessage = {
        id: `a-${Date.now() + 1}`,
        role: "ai",
        text: `${data.answer || "Нет ответа от AI."}`,
        matches
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const isAbortError =
        (error instanceof DOMException && error.name === "AbortError") ||
        String(error instanceof Error ? error.message : error).toLowerCase().includes("aborted");
      const friendlyError = isAbortError
        ? "AI долго отвечает. Попробуйте еще раз через пару секунд."
        : `Не удалось получить ответ AI: ${String(error instanceof Error ? error.message : error)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now() + 1}`,
          role: "ai",
          text: friendlyError
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="ai-fab" title="AI поддержка" onClick={() => setIsOpen((prev) => !prev)}>
        {SparkIcon({ className: "ui-icon", size: 34 })}
      </button>

      {isOpen && (
        <section className="ai-chat-panel" role="dialog" aria-label="AI поддержка">
          <header className="ai-chat-header">
            <div className="ai-chat-title">
              {SparkIcon({ className: "ui-icon", size: 18 })}
              <span>AI поддержка</span>
            </div>
            <button type="button" className="ai-chat-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </header>
          <div className="ai-chat-messages" ref={messagesRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-msg ${msg.role === "user" ? "user" : "ai"}`}>
                {msg.role === "ai" ? (
                  <div className="ai-msg-content">{renderAiMessageContent(msg, onOpenExerciseBySlug)}</div>
                ) : (
                  msg.text
                )}
              </div>
            ))}
          </div>
          <div className="ai-chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
              placeholder="Напишите вопрос..."
              disabled={isLoading}
            />
            <button type="button" onClick={() => void sendMessage()} disabled={isLoading}>
              {isLoading ? (
                "..."
              ) : (
                <>
                  {SendIcon({ className: "ui-icon", size: 15 })} Отпр.
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
