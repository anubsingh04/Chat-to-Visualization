import React, { useState, useEffect, useRef, useCallback } from 'react';
import VisualizationCanvas from './VisualizationCanvas';
import './ChatHistory.css';

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onToggleVisualization
}) => {
  const [isVisualizationVisible, setIsVisualizationVisible] = useState(false);
  const conversationRef = useRef(null);

  const handleToggleVisualization = () => {
    const newState = !isVisualizationVisible;
    setIsVisualizationVisible(newState);
    onToggleVisualization(conversation.id, newState);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      ref={conversationRef}
      className={`conversation-item ${isActive ? 'active' : ''}`}
    >
      {/* User Question */}
      <div className="message user-message">
        <div className="message-bubble">
          {/* <div className="message-header">
            <span className="avatar user-avatar">🧑‍💼</span>
            <span className="timestamp">{formatTime(conversation.questionTime)}</span>
          </div> */}
          <div className="message-text">{conversation.question}</div>
        </div>
      </div>

      {/* AI Response */}
      {conversation.answer && (
        <div className="message ai-message">
         <div className="message-bubble">
          {/* <div className="message-header">
            <span className="avatar ai-avatar">🤖</span>
            <span className="timestamp">{formatTime(conversation.answerTime)}</span>
          </div> */}
          <div className="message-text">{conversation.answer}</div>
        </div>
          {/* Visualization Controls */}
          {conversation.visualization && (
            <div className="visualization-controls">
              <button
                className={`viz-toggle-btn ${isVisualizationVisible ? 'active' : ''}`}
                onClick={handleToggleVisualization}
              >
                <span className="viz-icon">
                  {isVisualizationVisible ? '🎬' : '▶️'}
                </span>
                {isVisualizationVisible ? 'Hide Visualization' : 'Show Visualization'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsible Visualization Container */}
      {conversation.visualization && isVisualizationVisible && (
        <div className="visualization-container">
          <div className="visualization-header">
            <h4>📊 Interactive Visualization</h4>
            <div className="visualization-meta">
              <span className="duration">⏱️ {Math.round(conversation.visualization.duration / 1000)}s</span>
              <span className="elements">🎯 {conversation.visualization.layers?.length || 0} elements</span>
            </div>
          </div>
          
          <div className="visualization-canvas-container">
            <VisualizationCanvas
              visualization={conversation.visualization}
              onPlayStateChange={(isPlaying) => {
                // Optional: Handle play state changes
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ChatHistory = ({ 
  conversations, 
  isLoading
}) => {
  const [activeConversations, setActiveConversations] = useState(new Set());
  const [scrollPosition, setScrollPosition] = useState(0);
  const historyRef = useRef(null);

  // Track scroll position for performance optimizations
  useEffect(() => {
    const handleScroll = () => {
      if (historyRef.current) {
        setScrollPosition(historyRef.current.scrollTop);
      }
    };

    const container = historyRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleToggleVisualization = useCallback((conversationId, isVisible) => {
    setActiveConversations(prev => {
      const newSet = new Set(prev);
      if (isVisible) {
        newSet.add(conversationId);
      } else {
        newSet.delete(conversationId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="chat-history" ref={historyRef}>
      <div className="history-header">
        <h3>💬 Conversation History</h3>
        <div className="history-stats">
          <span className="count">{conversations.filter(conv => conv.question).length} conversations</span>
          {activeConversations.size > 0 && (
            <span className="active-viz">{activeConversations.size} visualizations active</span>
          )}
        </div>
      </div>

      <div className="conversations-feed">
        {conversations.filter(conv => conv.question).length === 0 ? (
          <div className="empty-state">
            <div className="empty-animation">
              <div className="empty-icon">🚀</div>
              <div className="empty-text">
                <h4>Ready to explore science!</h4>
                <p>Ask your first question to see interactive visualizations</p>
              </div>
            </div>
          </div>
        ) : (
          conversations.filter(conv => conv.question).map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversations.has(conversation.id)}
              onToggleVisualization={handleToggleVisualization}
            />
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="loading-message">
            <div className="loading-bubble">
              <div className="thinking-animation">
                <div className="pulse-dot"></div>
                <div className="pulse-dot"></div>
                <div className="pulse-dot"></div>
              </div>
              <span>Creating your visualization...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;