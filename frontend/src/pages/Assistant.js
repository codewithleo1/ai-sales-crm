import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import api from "../lib/api";
import { Card } from "../components/ui";
import { toast } from "sonner";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI sales assistant. Ask me anything about your pipeline — risks, priorities, or which deals to chase today." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get("/ai/assistant/suggestions").then((r) => setSuggestions(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    const history = messages.filter((m) => m.role !== "system");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/assistant/chat", { message: msg, history });
      setMessages((m) => [...m, { role: "assistant", content: data.data.answer }]);
    } catch {
      toast.error("Assistant failed to respond");
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I hit an error. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-up flex flex-col h-[calc(100vh-8rem)]" data-testid="ai-assistant-page">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bot size={22} className="text-indigo-400" /> AI Sales Assistant</h1>
        <p className="text-sm text-slate-400">Chat with Qwen3 about your live pipeline</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4" data-testid="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-indigo-500 to-violet-500"}`}>
                {m.role === "user" ? <User size={15} className="text-white" /> : <Sparkles size={15} className="text-white" />}
              </div>
              <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${m.role === "user" ? "bg-accent text-white" : "bg-slate-800/70 text-slate-200 border border-slate-700"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"><Sparkles size={15} className="text-white" /></div>
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl px-4 py-3 flex gap-1">
                {[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && suggestions.length > 0 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} data-testid="suggestion-chip"
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:border-accent hover:text-white transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-800 p-3">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your pipeline…"
              data-testid="assistant-input"
              className="flex-1 bg-ink border border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button type="submit" disabled={loading || !input.trim()} data-testid="assistant-send"
              className="bg-accent hover:bg-accenthover disabled:opacity-40 text-white rounded-lg px-4 flex items-center gap-2 text-sm font-semibold transition-colors">
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
