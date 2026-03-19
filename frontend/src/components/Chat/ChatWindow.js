import Message from "./Message";
import InputBar from "./InputBar";
import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Total sales by category",
  "Show profit trend over time",
  "Top 5 products by revenue",
  "Average profit by region",
  "Total revenue last 3 months"
];

function ChatWindow({ messages, setMessages, sessionId, setSessionId }) {
  const [loading, setLoading] = useState(false);
  const [injectedQuestion, setInjectedQuestion] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat">
            <h3>Hanalyst</h3>
            <p>Ask anything about your dataset</p>
            <div className="suggestion-chips">
              {SUGGESTIONS.map((s, i) => (
                <div key={i} className="chip" onClick={() => setInjectedQuestion(s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const question = msg.role === "assistant"
            ? messages.slice(0, index).reverse().find(m => m.role === "user")?.text || ""
            : "";
          return <Message key={index} message={msg} question={question} />;
        })}

        {loading && (
          <div className="ai-loading">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <InputBar
          messages={messages}
          setMessages={setMessages}
          setLoading={setLoading}
          sessionId={sessionId}
          setSessionId={setSessionId}
          injectedQuestion={injectedQuestion}
          setInjectedQuestion={setInjectedQuestion}
        />
        <p className="input-hint">Hanalyst can make mistakes. Verify important results.</p>
      </div>
    </div>
  );
}

export default ChatWindow;
