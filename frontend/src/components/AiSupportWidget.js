import { html, useState } from "../lib.js";

const supportAvatar = "./frontend/src/assets/3333.jpg";

const quickReplies = {
  тренировка: "Рекомендую начать с 3 базовых упражнений на крупные группы мышц и 1-2 изолирующих. Могу составить пример на неделю.",
  питание: "Для набора массы нужен умеренный профицит калорий и достаточное количество белка. Для сушки - дефицит и контроль углеводов.",
  техника: "Для безопасной техники: рабочий вес под контролем, нейтральная спина, полный диапазон без рывков.",
  default: "Я AI-помощник GYDEX. Напишите цель (масса/сушка/выносливость) или мышечную группу, и я подскажу упражнения."
};

function getAiReply(text) {
  const normalized = text.trim().toLowerCase();
  if (normalized.includes("трен")) return quickReplies.тренировка;
  if (normalized.includes("питан") || normalized.includes("калор")) return quickReplies.питание;
  if (normalized.includes("техник") || normalized.includes("ошиб")) return quickReplies.техника;
  return quickReplies.default;
}

export function AiSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: "m1", role: "ai", text: "Привет! Я AI-помощник GYDEX. Чем помочь?" }
  ]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const userMessage = { id: `u-${Date.now()}`, role: "user", text };
    const aiMessage = { id: `a-${Date.now() + 1}`, role: "ai", text: getAiReply(text) };
    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  }

  return html`
    <button
      className="ai-fab"
      title="AI поддержка"
      onClick=${() => setIsOpen((prev) => !prev)}
    >
      <img src=${supportAvatar} alt="AI поддержка" />
    </button>

    ${
      isOpen &&
      html`
        <section className="ai-chat-panel" role="dialog" aria-label="AI поддержка">
          <header className="ai-chat-header">
            <div className="ai-chat-title">
              <img src=${supportAvatar} alt="AI" />
              <span>AI поддержка</span>
            </div>
            <button className="ai-chat-close" onClick=${() => setIsOpen(false)}>✕</button>
          </header>
          <div className="ai-chat-messages">
            ${messages.map(
              (msg) => html`
                <div key=${msg.id} className=${`ai-msg ${msg.role === "user" ? "user" : "ai"}`}>
                  ${msg.text}
                </div>
              `
            )}
          </div>
          <div className="ai-chat-input-row">
            <input
              value=${input}
              onChange=${(e) => setInput(e.target.value)}
              onKeyDown=${(e) => e.key === "Enter" && sendMessage()}
              placeholder="Напишите вопрос..."
            />
            <button onClick=${sendMessage}>Отпр.</button>
          </div>
        </section>
      `
    }
  `;
}
