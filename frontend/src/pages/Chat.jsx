import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage, setActiveChat, addMessage, setTyping } from '../store/slices/chatSlice';
import { ArrowLeft, Send, Paperclip, MapPin, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import io from 'socket.io-client';

function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  
  const { conversations, activeChat, typingUsers } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const { matches } = useSelector((state) => state.match);
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const currentMatch = matches.find(m => m.match_id === matchId);
  const messages = conversations[matchId]?.messages || [];
  const isOtherUserTyping = typingUsers[matchId] && Object.keys(typingUsers[matchId]).length > 0;

  useEffect(() => {
    // Set active chat
    dispatch(setActiveChat(matchId));
    
    // Fetch messages
    dispatch(fetchMessages({ matchId }));

    // Setup socket connection
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join-matches');
    });

    socket.on('new-message', (message) => {
      if (message.match_id === matchId) {
        dispatch(addMessage({ matchId, message }));
      }
    });

    socket.on('user-typing', ({ userId, matchId: typingMatchId }) => {
      if (typingMatchId === matchId && userId !== user.id) {
        dispatch(setTyping({ matchId, userId, isTyping: true }));
      }
    });

    socket.on('user-stopped-typing', ({ userId, matchId: typingMatchId }) => {
      if (typingMatchId === matchId && userId !== user.id) {
        dispatch(setTyping({ matchId, userId, isTyping: false }));
      }
    });

    // Mark messages as read
    socket.emit('mark-read', { matchId });

    return () => {
      dispatch(setActiveChat(null));
      socket.disconnect();
    };
  }, [dispatch, matchId, user.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const messageData = {
      matchId,
      content: message
    };

    // Clear input immediately
    setMessage('');
    
    // Stop typing indicator
    if (socketRef.current) {
      socketRef.current.emit('typing-stop', { matchId });
    }

    // Send message via socket
    if (socketRef.current) {
      socketRef.current.emit('send-message', messageData);
    }

    // Also send via API for persistence
    dispatch(sendMessage(messageData));
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!isTyping && socketRef.current) {
      setIsTyping(true);
      socketRef.current.emit('typing-start', { matchId });
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing-stop', { matchId });
        setIsTyping(false);
      }
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Match not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/matches')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100">
              {currentMatch.profile_photo ? (
                <img
                  src={currentMatch.profile_photo}
                  alt={currentMatch.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
                  {currentMatch.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold">{currentMatch.name}</h2>
              {isOtherUserTyping ? (
                <p className="text-xs text-primary-500">Typing...</p>
              ) : (
                <p className="text-xs text-gray-500">
                  {currentMatch.user_type === 'local' ? 'Local Guide' : 'Traveler'}
                  {currentMatch.has_car && ' • 🚗'}
                  {currentMatch.has_motorcycle && ' • 🏍️'}
                </p>
              )}
            </div>
          </div>
        </div>

        <button className="p-2 rounded-lg hover:bg-gray-100">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-2">Say hello to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-400'}`}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                      {isOwn && msg.is_read && ' • Read'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <Paperclip size={20} className="text-gray-500" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <MapPin size={20} className="text-gray-500" />
          </button>
          
          <div className="flex-1">
            <textarea
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-2 rounded-lg ${
              message.trim()
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
