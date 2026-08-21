import React, { useState, useRef, useEffect } from 'react';
import api, { unwrapError } from '../utils/api';

export default function AICoachWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your SkillForge AI Coach. Ask me about skills to focus on, project ideas, or how to close a specific skill gap.",
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const res = await api.post('/ai/chat', { message: trimmed });
      const { reply, sources, grounded, method } = res.data.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, sources: sources || [], grounded, method },
      ]);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-brand-steel/30 bg-brand-navy shadow-card sm:w-96">
          <div className="flex items-center justify-between border-b border-brand-steel/20 bg-brand-navy px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-brand-light">AI Coach</p>
              <p className="text-xs text-brand-steel">Grounded in your skills &amp; our knowledge base</p>
            </div>
            <button
              aria-label="Close AI Coach"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-brand-steel hover:bg-brand-steel/10 hover:text-brand-light"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-orchid text-brand-navy'
                      : 'bg-brand-steel/15 text-brand-light'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 border-t border-brand-navy/10 pt-1.5 text-[11px] opacity-80">
                      Grounded in: {m.sources.map((s) => s.source).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-brand-steel/15 px-3 py-2 text-sm text-brand-steel">
                  Thinking…
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-300">{error}</p>}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-brand-steel/20 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a skill or resource…"
              className="flex-1 rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-brand-orchid px-3 py-2 text-sm font-semibold text-brand-navy transition-opacity disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close AI Coach' : 'Open AI Coach'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orchid text-brand-navy shadow-card transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orchid"
      >
        {isOpen ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-2xl" aria-hidden="true">💬</span>
        )}
      </button>
    </div>
  );
}
