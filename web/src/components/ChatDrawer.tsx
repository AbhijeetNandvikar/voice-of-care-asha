/**
 * ChatDrawer Component
 * Collapsible drawer for RAG-based chat functionality
 * Note: This is a placeholder for v1 - full implementation coming in future versions
 */

import { useState } from 'react';
import './ChatDrawer.css';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="chat-drawer-overlay" onClick={onClose} />}

      {/* Drawer */}
      <div className={`chat-drawer ${isOpen ? 'open' : ''}`}>
        <div className="chat-drawer-header">
          <h3>AI Assistant</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close chat">
            ✕
          </button>
        </div>

        <div className="chat-drawer-content">
          <div className="coming-soon-container">
            <div className="coming-soon-icon">💬</div>
            <h4>Coming Soon</h4>
            <p>
              AI-powered chat assistance will be available in a future version.
              This feature will help you query visit data, generate insights,
              and get answers to your questions.
            </p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Query visit records</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Generate insights</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💡</span>
                <span>Get recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
