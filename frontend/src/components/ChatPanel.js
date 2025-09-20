import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatPanel.css';

const ChatPanel = ({ 
  messages, 
  conversations, 
  onSendMessage, 
  isConnected, 
  isLoading,
  processingProgress = { isProcessing: false, stage: '', message: '' },
  onVisualizationChange, 
  onClearChat 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add CSS animation classes for new conversations
  useEffect(() => {
    if (conversations.length > 0 && messagesContainerRef.current) {
      const newConversation = messagesContainerRef.current.querySelector('.conversation-group:last-child');
      if (newConversation) {
        newConversation.classList.add('new-conversation');
        setTimeout(() => {
          newConversation.classList.remove('new-conversation');
        }, 600);
      }
    }
  }, [conversations]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleExampleClick = (question) => {
    if (!isLoading) {
      setInputValue(question);
      inputRef.current?.focus();
    }
  };

  const handleVisualizationClick = (visualization, conversation) => {
    console.log('🎬 User clicked to view visualization for:', conversation.question);
    
    // Add CSS animation class for button click
    const button = event.target.closest('.view-visualization-btn');
    if (button) {
      button.classList.add('button-clicked');
      setTimeout(() => {
        button.classList.remove('button-clicked');
      }, 300);
    }
    
    if (onVisualizationChange) {
      onVisualizationChange(visualization, conversation);
    }
  };

  const handleClearChatClick = () => {
    setShowConfirmation(true);
    setConfirmationInput('');
  };

  const handleConfirmationCancel = () => {
    setShowConfirmation(false);
    setConfirmationInput('');
  };

  const handleConfirmationDelete = () => {
    if (confirmationInput.toUpperCase() === 'DELETE') {
      setShowConfirmation(false);
      setConfirmationInput('');
      onClearChat();
    }
  };

  const handleConfirmationKeyPress = (e) => {
    if (e.key === 'Enter' && isDeleteButtonEnabled) {
      handleConfirmationDelete();
    } else if (e.key === 'Escape') {
      handleConfirmationCancel();
    }
  };

  const isDeleteButtonEnabled = confirmationInput.toUpperCase() === 'DELETE';

  const exampleQuestions = [
    "Explain Newton's First Law of Motion",
    "How does the Solar System work?",
    "What is photosynthesis?",
    "Explain how waves propagate",
    "What is atomic structure?"
  ];

  const renderConversationMessages = () => {
    if (conversations && conversations.length > 0) {
      // Render conversation-based messages with visualization buttons
      return conversations.slice().reverse().map((conversation) => (
        <div key={conversation.id} className="conversation-group">
          {/* User Question */}
          <div className="message user-message">
            <div className="message-content">
              <div className="message-text">{conversation.question}</div>
              {/* <div className="message-time">{formatTime(conversation.questionTime)}</div> */}
            </div>
          </div>

          {/* AI Answer */}
          {conversation.answer && (
            <div className="message assistant-message">
              <div className="message-content">
                <div className="message-text">{conversation.answer}</div>
                {/* <div className="message-time">{formatTime(conversation.answerTime)}</div> */}
                
                {/* Visualization Button */}
                {conversation.visualization && (
              
                    <button 
                      className="view-visualization-btn"
                      onClick={() => handleVisualizationClick(conversation.visualization, conversation)}
                    >
                      <span className="viz-icon">🎬</span>
                      View Visualization
                    </button>
                  
                )}
              </div>
            </div>
          )}

          {/* No individual loading indicators - use global isLoading instead */}
        </div>
      ));
    }

    // Fallback: render traditional messages if no conversations
    return messages.map((message, index) => (
      <div key={index} className={`message ${message.type}-message`}>
        <div className="message-content">
          <div className="message-text">{message.text}</div>
          {/* <div className="message-time">{formatTime(message.timestamp)}</div> */}
        </div>
      </div>
    ));
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        {((conversations && conversations.length > 0) || (messages.length > 0)) && (
          <button 
            className="clear-chat-btn" 
            onClick={handleClearChatClick}
            title="Clear all conversations"
          >
            🗑️ Clear Chat
          </button>
        )}
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {(conversations && conversations.length > 0) || (messages.length > 0) ? (
          <>
            {renderConversationMessages()}
            
            {/* Dynamic loading indicator with progress stages using state */}
            {(isLoading || processingProgress.isProcessing) && (
              <div className="message assistant-message loading">
                <div className="message-content">
                  <div className="analyzing-text">
                    {processingProgress.message || 'Analyzing your question and creating visualization'}
                    <span className="inline-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  </div>
                  {processingProgress.stage && (
                    <div className="progress-stage">
                      Stage: {processingProgress.stage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="welcome-message">
            <div className="welcome-content">
              <h3> Welcome to AI Science Tutor!</h3>
              <p>Ask me any science question and I'll explain it with both text and interactive visualizations.</p>
              <p className="sync-hint">💡 <strong>Scroll through your questions to see different visualizations automatically!</strong></p>
              
              <div className="example-questions">
                <p>Try these examples:</p>
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="example-button"
                    onClick={() => handleExampleClick(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a science question..."
              className="chat-input"
              rows="1"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`send-button ${inputValue.trim() && !isLoading ? 'active' : ''}`}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </form>
        
        {/* <div className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </div> */}
      </div>

      {/* Confirmation Overlay */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <div className="confirmation-header">
              <span className="confirmation-icon">⚠️</span>
              <h3 className="confirmation-title">Delete All Conversations</h3>
              <p className="confirmation-message">
                This action will permanently delete all your conversations and cannot be undone.
                To confirm, please type <strong>DELETE</strong> in the field below.
              </p>
            </div>

            <div className="confirmation-input-section">
              <label className="confirmation-input-label">
                Type "DELETE" to confirm:
              </label>
              <input
                type="text"
                className={`confirmation-input ${
                  confirmationInput 
                    ? (isDeleteButtonEnabled ? 'valid' : 'invalid')
                    : ''
                }`}
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                onKeyDown={handleConfirmationKeyPress}
                placeholder="Type DELETE here..."
                autoFocus
              />
              <div style={{ 
                fontSize: '12px', 
                color: '#7f8c8d', 
                marginTop: '8px',
                textAlign: 'center'
              }}>
                Press Enter to confirm • Press Escape to cancel
              </div>
            </div>

            <div className="confirmation-buttons">
              <button 
                className="confirmation-btn confirmation-btn-cancel"
                onClick={handleConfirmationCancel}
              >
                Cancel
              </button>
              <button 
                className="confirmation-btn confirmation-btn-delete"
                onClick={handleConfirmationDelete}
                disabled={!isDeleteButtonEnabled}
              >
                🗑️ Delete All Conversations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
