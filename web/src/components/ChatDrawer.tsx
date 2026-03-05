/**
 * ChatDrawer Component
 * AI assistant chat drawer powered by Claude on AWS Bedrock
 */

import { useState, useRef, useEffect } from 'react';
import './ChatDrawer.css';
import chatService, { type ConversationMessage } from '../services/chatService';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const result = await chatService.sendMessage(text, conversationHistory);
      setConversationHistory(result.conversation_history);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([]);
    setConversationHistory([]);
    setError(null);
  }

  return (
    <>
      {isOpen && <div className="chat-drawer-overlay" onClick={onClose} />}

      <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
        <div className="chat-drawer-header">
          <h3>AI Assistant</h3>
          <div className="chat-header-actions">
            {messages.length > 0 && (
              <button className="clear-btn" onClick={handleClear} title="Clear conversation">
                Clear
              </button>
            )}
            <button className="close-btn" onClick={onClose} aria-label="Close chat">
              ✕
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && !isLoading && (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">💬</div>
              <p>Ask me anything about your field data.</p>
              <div className="chat-suggestions">
                {[
                  'How many visits were done this week?',
                  'Which ASHA worker has the most visits?',
                  'Show me unsynced visits',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="suggestion-chip"
                    onClick={() => {
                      setInputText(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble-row ${msg.role}`}>
              <div className={`chat-bubble ${msg.role}`}>
                <span className="bubble-text">{msg.content}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble-row assistant">
              <div className="chat-bubble assistant typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about visits, workers, beneficiaries..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isLoading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
          >
            &#9658;
          </button>
        </div>
      </div>
    </>
  );
}
