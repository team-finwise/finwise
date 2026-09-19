import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import useStore from '../store/useStore';
import { checkBackendHealth, sendChatMessage } from '../lib/api';

const THINKING_PHASES = [
  { text: 'Analysing your finances',        startAt: 0  },
  { text: 'Running financial calculations', startAt: 9  },
  { text: 'Consulting the model',           startAt: 18 },
  { text: 'Generating response',            startAt: 26 },
];

function ThinkingIndicator() {
  const [elapsed, setElapsed]   = useState(0);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    const dots = setInterval(() => setDotCount((d) => (d >= 3 ? 1 : d + 1)), 500);
    return () => { clearInterval(tick); clearInterval(dots); };
  }, []);

  let phaseIndex = 0;
  for (let i = 0; i < THINKING_PHASES.length; i++) {
    if (elapsed >= THINKING_PHASES[i].startAt) phaseIndex = i;
  }

  const phase    = THINKING_PHASES[phaseIndex];
  const showHint = elapsed >= 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span
        key={phaseIndex}
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-secondary, #6b7280)',
          animation: 'fadeInPhase 0.5s ease',
          letterSpacing: '0.01em',
        }}
      >
        {phase.text}{'.'.repeat(dotCount)}
      </span>

      <span style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)', letterSpacing: '0.01em' }}>
        {showHint ? 'Still working, model is processing your data...' : 'This may take a few seconds'}
      </span>

      <style>{`
        @keyframes fadeInPhase {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}

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
            <span><strong>Strands SDK Backend Active:</strong> Connected to FastAPI on port 8001 using local Ollama (llama3.1) &amp; financial calculation tools.</span>
          ) : (
            <span><strong>Backend Offline:</strong> Ensure <code>python server.py</code> is running on port 8001 and Ollama is active.</span>
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
            <div className="chat-bubble assistant">
              <ThinkingIndicator />
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
