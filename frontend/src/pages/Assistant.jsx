import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import useStore from '../store/useStore';
import { checkBackendHealth, sendChatMessage } from '../lib/api';

const SUGGESTED_PROMPTS = [
  "Calculate my current monthly financial snapshot and savings rate.",
  "How can I reach my financial goal faster?",
  "What if I reduce my housing expense by ₹2,000?",
  "Analyze my debt-to-income ratio and suggest practical actions.",
];

export default function Assistant() {
  const { results, chatMessages, addChatMessage } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });
  const chatBottomRef = useRef(null);

  useEffect(() => {
    async function verifyHealth() {
      const status = await checkBackendHealth();
      setBackendStatus({ ...status, checking: false });
    }
    verifyHealth();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  const initialMessages = [
    {
      role: 'assistant',
      content: results
        ? `Hello! I'm your FINWISE AI Assistant powered by Strands SDK & Ollama (llama3.1). I have access to your financial profile (Income: ₹${results.profile.income.toLocaleString('en-IN')}) and tools to calculate snapshots, goal timelines, and what-if scenarios. How can I help you today?`
        : `Hello! I'm your FINWISE AI Assistant powered by Strands SDK & Ollama (llama3.1). Set up your financial profile to get personalized observations, or ask any general financial questions!`,
    },
    ...chatMessages,
  ];

  async function handleSend(textToSend) {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    addChatMessage({ role: 'user', content: query });
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(
        query,
        results?.profile || null,
        results?.goal || null
      );
      addChatMessage({
        role: 'assistant',
        content: response,
      });
    } catch (err) {
      addChatMessage({
        role: 'assistant',
        content: `Error connecting to Strands Agent API: ${err.message || 'Server error'}. Please ensure python backend (server.py) and Ollama are running.`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="AI Financial Assistant"
      subtitle="Strands Agentic AI Assistant powered by Ollama (llama3.1) & Financial Tools"
    >
      <div className="chat-container">
        {/* Dynamic Status Banner */}
        <div
          className="chat-banner"
          style={{
            backgroundColor: backendStatus.online && backendStatus.agent_ready
              ? 'var(--green-muted)'
              : 'var(--amber-muted)',
            borderBottomColor: backendStatus.online && backendStatus.agent_ready
              ? 'var(--green-border)'
              : 'var(--amber-border)',
            color: backendStatus.online && backendStatus.agent_ready
              ? 'var(--green-hover)'
              : '#92400e',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {backendStatus.checking ? (
            <span>Checking backend connection...</span>
          ) : backendStatus.online && backendStatus.agent_ready ? (
            <span><strong>Strands SDK Backend Active:</strong> Connected to FastAPI on port 8000 using local Ollama (llama3.1) &amp; financial calculation tools.</span>
          ) : (
            <span><strong>Backend Offline:</strong> Ensure <code>python server.py</code> is running on port 8000 and Ollama is active.</span>
          )}
        </div>

        {/* Message Thread */}
        <div className="chat-messages">
          {initialMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}
              style={{ whiteSpace: 'pre-line' }}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Strands Agent is executing financial tools with Ollama (llama3.1)...
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="suggested-prompts">
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: '100%' }}>
            SUGGESTED QUESTIONS FOR STRANDS OLLAMA AGENT
          </span>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="prompt-chip"
              onClick={() => handleSend(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="chat-input-area">
          <input
            type="text"
            className="form-input"
            placeholder="Ask a financial question (Strands agent will call tools)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      </div>
    </Layout>
  );
}
