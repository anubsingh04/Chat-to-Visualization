import React, { useState, useEffect, useRef } from 'react';
import ChatPanel from './components/ChatPanel';
import ChatHistory from './components/ChatHistory';
import VisualizationCanvas from './components/VisualizationCanvas';
import ModularVisualizationCanvas from './components/ModularVisualizationCanvas';
import ApiService from './services/apiService';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]); // New: conversation history
  const [currentVisualization, setCurrentVisualization] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sseConnection, setSSEConnection] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'history'

  // Refs for animations
  const appRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  // User ID for the session (in a real app, this would come from authentication)
  const userId = 'user_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    console.log('🚀 Initializing Chat-to-Viz App');
    
    // Add entrance animation classes
    if (headerRef.current) {
      headerRef.current.classList.add('animate-entrance');
    }
    if (contentRef.current) {
      setTimeout(() => {
        contentRef.current.classList.add('animate-entrance-delayed');
      }, 300);
    }

    try {
      // Initialize SSE connection
      console.log('🔄 Creating SSE connection...');
      const eventSource = ApiService.createSSEConnection(
        handleSSEMessage,
        handleSSEError
      );
      
      setSSEConnection(eventSource);
      console.log('✅ SSE connection created');
      
      // Test connection
      console.log('🏥 Testing backend connection...');
      ApiService.healthCheck()
        .then(() => {
          setIsConnected(true);
          console.log('✅ Connected to backend');
        })
        .catch((error) => {
          console.error('❌ Backend connection failed:', error);
          setIsConnected(false);
          // Don't set error state for connection issues, just log them
        });

      // Cleanup on unmount
      return () => {
        console.log('🧹 Cleaning up SSE connection');
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (err) {
      console.error('❌ Error initializing app:', err);
      setError(err.message);
    }
  }, []);

  // Load existing conversations on startup
  useEffect(() => {
    const loadConversations = async () => {
      try {
        console.log('📚 Loading conversation history...');
        const questions = await ApiService.getQuestions();
        
        const conversationPromises = questions.map(async (question) => {
          if (question.answerId) {
            const answer = await ApiService.getAnswer(question.answerId);
            return {
              id: question.id,
              question: question.question,
              answer: answer.text,
              visualization: answer.visualization,
              questionTime: question.createdAt,
              answerTime: answer.createdAt,
              userId: question.userId
            };
          }
          return {
            id: question.id,
            question: question.question,
            answer: null,
            visualization: null,
            questionTime: question.createdAt,
            answerTime: null,
            userId: question.userId
          };
        });

        const loadedConversations = await Promise.all(conversationPromises);
        setConversations(loadedConversations.reverse()); // Most recent first
        console.log('✅ Loaded', loadedConversations.length, 'conversations');
      } catch (error) {
        console.error('❌ Failed to load conversations:', error);
      }
    };

    if (isConnected) {
      loadConversations();
    }
  }, [isConnected]);

  const handleSSEMessage = (data) => {
    try {
      console.log('📨 SSE Message received in App:', data);
      
      switch (data.type) {
        case 'connected':
          console.log('🔗 SSE connection confirmed');
          setIsConnected(true);
          break;
          
        case 'question_created':
          console.log('❓ Question created event received');
          // Add question to messages
          const questionMessage = {
            type: 'user',
            text: data.question.question,
            timestamp: new Date(data.question.createdAt)
          };
          setMessages(prev => [...prev, questionMessage]);
          
          // Add to conversations (without answer yet)
          const newConversation = {
            id: data.question.id,
            question: data.question.question,
            answer: null,
            visualization: null,
            questionTime: data.question.createdAt,
            answerTime: null,
            userId: data.question.userId
          };
          setConversations(prev => [newConversation, ...prev]);
          break;
          
        case 'answer_created':
          console.log('💡 Answer created event received');
          setIsLoading(false);
          
          // Add answer to messages
          const answerMessage = {
            type: 'assistant',
            text: data.answer.text,
            timestamp: new Date(data.answer.createdAt)
          };
          setMessages(prev => [...prev, answerMessage]);
          setCurrentVisualization(data.answer.visualization);
          
          // Update the corresponding conversation with answer
          setConversations(prev => prev.map(conv => 
            conv.id === data.questionId 
              ? {
                  ...conv,
                  answer: data.answer.text,
                  visualization: data.answer.visualization,
                  answerTime: data.answer.createdAt
                }
              : conv
          ));
          
          console.log('🎬 Visualization updated:', data.answer.visualization);
          break;
          
        case 'heartbeat':
          console.log('💓 Heartbeat received');
          break;
          
        default:
          console.log('❓ Unknown SSE message type:', data.type);
      }
    } catch (err) {
      console.error('❌ Error handling SSE message:', err);
    }
  };

  const handleSSEError = (error) => {
    console.error('SSE connection error:', error);
    setIsConnected(false);
  };

  const handleSendMessage = async (message) => {
    if (isLoading) return;
    
    console.log('📤 Sending message:', message);
    setIsLoading(true);
    
    try {
      // Submit question to backend
      const response = await ApiService.submitQuestion(userId, message);
      console.log('✅ Question submitted successfully:', response);
      
      // The SSE will handle adding the question and answer to the UI
      // No need to update state here as it will be done via SSE
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setIsLoading(false);
      
      // Add error message to chat
      const errorMessage = {
        type: 'assistant',
        text: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleVisualizationPlayStateChange = (isPlaying) => {
    console.log('Visualization play state changed:', isPlaying);
  };

  // Handle visualization change when user clicks view button
  const handleVisualizationChange = (visualization, conversation) => {
    console.log('🎬 User clicked to view visualization for:', conversation?.question);
    console.log('📊 Setting visualization:', visualization);
    
    // Add CSS animation class for visualization change
    if (contentRef.current) {
      const vizSection = contentRef.current.querySelector('.visualization-section');
      if (vizSection) {
        vizSection.classList.add('visualization-update');
        setTimeout(() => {
          vizSection.classList.remove('visualization-update');
        }, 400);
      }
    }
    
    setCurrentVisualization(visualization);
  };

  // Animated view mode switching
  const handleViewModeChange = (newMode) => {
    if (newMode === viewMode) return;

    // Add CSS transition class
    if (contentRef.current) {
      contentRef.current.classList.add('view-transition');
      setTimeout(() => {
        setViewMode(newMode);
        setTimeout(() => {
          contentRef.current.classList.remove('view-transition');
        }, 200);
      }, 200);
    } else {
      setViewMode(newMode);
    }
  };

  // Error boundary fallback
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        background: '#f8f9fa', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '16px' }}>❌ Application Error</h2>
          <p style={{ color: '#2c3e50', marginBottom: '20px' }}>
            Sorry, something went wrong while loading the app.
          </p>
          <details style={{ textAlign: 'left', margin: '20px 0' }}>
            <summary>Error Details</summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {error}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app" ref={appRef}>
      <div className="app-header" ref={headerRef}>
        <h1>Chat-to-Visualization</h1>
        
        <div className="header-controls">
          {/* View Mode Dropdown */}
          <div className="view-dropdown">
            <select 
              value={viewMode} 
              onChange={(e) => handleViewModeChange(e.target.value)}
              className="view-selector"
            >
              <option value="chat">💬 Chat Mode</option>
              <option value="history">� History ({conversations.length} conversations)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="app-content" ref={contentRef}>
        {viewMode === 'chat' ? (
          <>
            <div className="visualization-section">
              {console.log('🎬 App.js - Current visualization:', currentVisualization)}
              <VisualizationCanvas 
                visualization={currentVisualization}
                onPlayStateChange={handleVisualizationPlayStateChange}
              />
            </div>
            
            <div className="chat-section">
              <ChatPanel
                messages={messages}
                conversations={conversations}
                onSendMessage={handleSendMessage}
                onVisualizationChange={handleVisualizationChange}
                isConnected={isConnected}
                isLoading={isLoading}
              />
            </div>
          </>
        ) : (
          <div className="history-section">
            <ChatHistory
              conversations={conversations}
              isLoading={isLoading}
              autoPlayEnabled={true}
            />
          </div>
        )}
      </div>
      
      <div className="app-footer">
        <p>
          Powered by AI • Built with React & Node.js • 
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;
