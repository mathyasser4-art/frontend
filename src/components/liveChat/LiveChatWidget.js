import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import API_BASE_URL from '../../config/api.config';
import './LiveChatWidget.css';

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('chatUserName') || '');
  const [userPhone, setUserPhone] = useState(localStorage.getItem('chatUserPhone') || '');
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Use a ref to store sessionId to prevent unnecessary re-renders or stale closures
  const sessionIdRef = useRef(localStorage.getItem('chatSessionId'));

  // Dragging state logic
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });
  const isClickRef = useRef(true);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('input') || e.target.closest('textarea')) return;
    if (e.target.closest('.chat-window button')) return;

    setIsDragging(true);
    isClickRef.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialOffset.current = { ...position };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    if (e.target.closest('input') || e.target.closest('textarea')) return;
    if (e.target.closest('.chat-window button')) return;

    setIsDragging(true);
    isClickRef.current = true;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    initialOffset.current = { ...position };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isClickRef.current = false;
      }
      setPosition({
        x: initialOffset.current.x + dx,
        y: initialOffset.current.y + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isClickRef.current = false;
      }
      setPosition({
        x: initialOffset.current.x + dx,
        y: initialOffset.current.y + dy
      });
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!sessionIdRef.current) {
      // Generate a random anonymous ID
      sessionIdRef.current = 'anon_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chatSessionId', sessionIdRef.current);
    }
    
    // Initial fetch
    syncChat();

    // Poll for new messages every 10 seconds
    const interval = setInterval(syncChat, 10000);
    return () => clearInterval(interval);
  }, []);

  const syncChat = async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const response = await fetch(`${API_BASE_URL}/chat/sync/${sessionIdRef.current}`);
      const data = await response.json();
      
      if (data.message === 'success' && data.chat) {
        setMessages(data.chat.messages);
        if (data.chat.unreadByUser && !isOpen) {
          setHasUnread(true);
        }
      }
    } catch (error) {
      console.error('Chat sync error:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Tell backend we read it by syncing while open
      syncChat();
    }
  }, [isOpen, messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = { senderRole: 'user', text: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    const textToSend = inputText;
    setInputText('');

    try {
      await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: sessionIdRef.current, 
          text: textToSend,
          userName: userName,
          userPhone: userPhone
        })
      });
      // Save to local storage after first successful send
      localStorage.setItem('chatUserName', userName);
      localStorage.setItem('chatUserPhone', userPhone);
      syncChat();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div 
      className="live-chat-container"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {isOpen && (
        <div className="chat-window">
          <div 
            className="chat-header"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}
          >
            <h3>Message Us</h3>
            <button onClick={() => setIsOpen(false)} className="close-btn">
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="no-messages">Have a question? Leave us a message and we'll reply soon!</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.senderRole === 'user' ? 'my-message' : 'admin-message'}`}>
                  <p>{msg.text}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chat-input-area">
            {(!localStorage.getItem('chatUserName') || !localStorage.getItem('chatUserPhone')) && (
              <div className="chat-user-info">
                <input 
                  type="text" 
                  placeholder="Your Name (Required)" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number (Required)" 
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="input-row">
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" disabled={!inputText.trim() || !userName.trim() || !userPhone.trim()}>
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      <button 
        className={`chat-fab ${hasUnread ? 'pulse' : ''}`} 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => {
          if (isClickRef.current) {
            setIsOpen(!isOpen);
          }
        }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {hasUnread && !isOpen && <span className="notification-dot"></span>}
      </button>
    </div>
  );
};

export default React.memo(LiveChatWidget);
