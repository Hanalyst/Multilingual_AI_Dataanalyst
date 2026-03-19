import { useState, useRef, useEffect } from "react";
import API from "../../services/api";

function InputBar({ messages, setMessages, setLoading, sessionId, setSessionId, injectedQuestion, setInjectedQuestion }) {
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (injectedQuestion) {
      setQuestion(injectedQuestion);
      setInjectedQuestion("");
    }
  }, [injectedQuestion, setInjectedQuestion]);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice input not supported in your browser."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuestion((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = async () => {
    if (!question.trim()) return;
    const dataset_id = localStorage.getItem("dataset_id");
    if (!dataset_id || dataset_id === "null") { alert("Please upload a dataset first"); return; }
    const currentQuestion = question;
    setMessages((prev) => [...prev, { role: "user", text: currentQuestion }]);
    setLoading(true);
    setQuestion("");
    try {
      const res = await API.post("/ask", {
        dataset_id,
        question: currentQuestion,
        session_id: sessionId || null
      });
      if (res.data.session_id) {
        setSessionId(res.data.session_id);
      }
      setMessages((prev) => [...prev, {
        role: "assistant",
        question: currentQuestion,
        sql: res.data.sql,
        data: res.data.table,
        insight: res.data.insight,
        chart: res.data.chart,
      }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className={`input-bar ${isListening ? "listening-active" : ""}`}>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder={isListening ? "Listening..." : "Ask your dataset..."}
      />
      <button className={`mic-btn ${isListening ? "listening" : ""}`} onClick={startVoiceInput} title="Voice input">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="9" y1="22" x2="15" y2="22" />
        </svg>
      </button>
      <button className="send-btn" onClick={sendMessage} title="Send">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}

export default InputBar;
