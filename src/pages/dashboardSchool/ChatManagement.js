import React, { useState, useEffect, useRef } from 'react';
import { Send, User, MessageCircle } from 'lucide-react';
import API_BASE_URL from '../../config/api.config';
import './ChatManagement.css';

const ChatManagement = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/admin/all`);
      const data = await response.json();
      if (data.message === 'success') {
        setChats(data.chats);
        
        // If a chat is selected, update it with fresh data
        if (selectedChat) {
          const updatedSelected = data.chats.find(c => c.sessionId === selectedChat.sessionId);
          if (updatedSelected) {
            setSelectedChat(updatedSelected);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    if (chat.unreadByAdmin) {
      try {
        await fetch(`${API_BASE_URL}/chat/admin/read/${chat.sessionId}`, { method: 'POST' });
        fetchChats(); // Refresh unread status locally
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat) return;

    const textToSend = inputText;
    setInputText('');

    // Optimistic UI update
    const newMsg = { senderRole: 'admin', text: textToSend, timestamp: new Date() };
    setSelectedChat(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));

    try {
      await fetch(`${API_BASE_URL}/chat/admin/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedChat.sessionId, text: textToSend })
      });
      fetchChats();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  return (
    <div className="chat-management-container">
      <div className="chat-sidebar">
        <h3 className="sidebar-header"><MessageCircle size={20} /> Active Chats</h3>
        <div className="chat-list">
          {chats.length === 0 ? (
            <p className="no-chats">No active chats</p>
          ) : (
            chats.map((chat) => (
              <div 
                key={chat.sessionId} 
                className={`chat-list-item ${selectedChat?.sessionId === chat.sessionId ? 'active' : ''}`}
                onClick={() => selectChat(chat)}
              >
                <div className="chat-avatar">
                  <User size={20} />
                  {chat.unreadByAdmin && <span className="unread-indicator"></span>}
                </div>
                <div className="chat-preview">
                  <h4>Visitor {chat.sessionId.substring(5, 9)}</h4>
                  <p className="preview-text">
                    {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'No messages'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedChat ? (
          <>
            <div className="chat-main-header">
              <h3>Chat with Visitor {selectedChat.sessionId.substring(5, 9)}</h3>
            </div>
            
            <div className="chat-main-messages">
              {selectedChat.messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.senderRole === 'admin' ? 'my-message' : 'user-message'}`}>
                  <p>{msg.text}</p>
                  <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendReply} className="chat-main-input">
              <input 
                type="text" 
                placeholder="Type your reply..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" disabled={!inputText.trim()}>
                <Send size={18} /> Send
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <MessageCircle size={64} color="#cbd5e1" />
            <p>Select a chat to view messages and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManagement;
