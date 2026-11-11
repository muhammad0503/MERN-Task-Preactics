import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../api/chatService';

function ChatScreen() {
  // State for messages displayed in the UI
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your AI Assistant (Gemini). How can I help you today?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Input field state
  const [input, setInput] = useState('');

  // Request loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-scroll ref
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();

    const userText = input.trim();
    if (!userText || loading) return;

    // 1. Append user's message to state
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      // 2. Send single message to backend (Stateless: Phase 1 does not send conversation history)
      const data = await chatService.sendMessage(userText);

      // 3. Append AI reply to state
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const serverMessage =
        err.response?.data?.message ||
        'Failed to connect to AI server. Please ensure GEMINI_API_KEY is configured in backend .env.';
      setError(serverMessage);

      // Add failure notification bubble
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ Error: ${serverMessage}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Notice header */}
      <div className="chat-notice">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          Phase 1 AI Chat: Stateless Single-Turn (Model does not retain memory across messages)
        </span>
      </div>

      {/* Messages viewport */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
            <div className={`chat-avatar ${msg.sender}`}>
              {msg.sender === 'user' ? 'U' : 'AI'}
            </div>
            <div className="chat-content-wrap">
              <div className="chat-text">{msg.text}</div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                  marginTop: '3px',
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                }}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="chat-bubble ai">
            <div className="chat-avatar ai">AI</div>
            <div className="chat-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Gemini is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert-toast error" style={{ margin: '8px 14px', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
          <span>{error}</span>
          <button type="button" className="toast-close" onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask Gemini anything... (e.g. My name is Alex)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

export default ChatScreen;

