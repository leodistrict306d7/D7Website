'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Array<{
    title: string;
    url: string;
    similarity: number;
  }>;
}

const AscentChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('ascentChatMessages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ascentChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        sources: data.sources || []
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error. Please try again or visit d7leos.org for more information.',
        sender: 'bot',
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to remove markdown formatting
  const cleanText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italics
      .replace(/_(.*?)_/g, '$1')       // Remove underline italics
      .replace(/`(.*?)`/g, '$1')       // Remove inline code
      .replace(/#{1,6}\s/g, '')        // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/^\s*[-*+]\s/g, '• ');   // Convert list bullets
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-4 sm:bottom-6 sm:right-6 z-50 glass hover:shadow-xl transition-all duration-300 p-4 rounded-full"
        style={{
          background: 'rgb(var(--btn-bg))',
          color: '#fff'
        }}
        aria-label="Open Ascent Assistant"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
        </div>
      </motion.button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Embedded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] sm:h-[600px] max-h-[80vh] surface-card rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:rounded-t-2xl pb-safe-area-inset-bottom"
          >
            {/* Header */}
            <div 
              className="px-4 py-3 flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--btn-bg)), rgb(var(--btn-bg-hover)))',
                color: '#fff'
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">🦁</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Ascent Assistant</h3>
                  <p className="text-xs opacity-90">District 306 D7 Guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-3 sm:p-2 hover:bg-white/10 rounded-lg min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px]"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-6 sm:py-8 px-4">
                  <div className="text-3xl sm:text-4xl mb-3">🦁</div>
                  <h4 className="font-semibold mb-2 text-sm" style={{ color: 'rgb(var(--heading))' }}>
                    Welcome to Ascent Assistant!
                  </h4>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: 'rgb(var(--fg))' }}>
                    I'm here to help you learn about Leo District 306 D7. Ask me anything!
                  </p>

                  <div className="space-y-3">
                    <div className="text-xs font-medium mb-2" style={{ color: 'rgb(var(--heading))' }}>
                      Try asking:
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "What is Leo District 306 D7?",
                        "Who is the District President?",
                        "How can I join?",
                        "What projects do you have?"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="text-xs px-3 py-2 sm:py-1 rounded-full transition-all hover:scale-105 shadow-sm min-h-[32px]"
                          style={{
                            background: 'rgba(var(--btn-bg), 0.1)',
                            color: 'rgb(var(--link))',
                            border: '1px solid rgba(var(--btn-bg), 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(var(--btn-bg), 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(var(--btn-bg), 0.1)';
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-3 sm:px-3 py-2 sm:py-2 ${
                          message.sender === 'user'
                            ? ''
                            : 'glass'
                        } shadow-sm`}
                        style={{
                          background: message.sender === 'user'
                            ? 'linear-gradient(135deg, rgb(var(--btn-bg)), rgb(var(--btn-bg-hover)))'
                            : 'rgba(var(--surface), 0.8)',
                          color: message.sender === 'user' ? '#fff' : 'inherit'
                        }}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed biography-content">
                          {cleanText(message.text)}
                        </div>
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                            <div className="text-xs font-medium mb-1" style={{ color: 'rgb(var(--heading))' }}>
                              Sources:
                            </div>
                            <div className="space-y-1">
                              {message.sources.map((source, index) => (
                                <a
                                  key={index}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline block biography-content hover:opacity-80 transition-opacity"
                                  style={{ color: 'rgb(var(--link))' }}
                                >
                                  {source.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                        style={{ color: 'rgb(var(--fg))', opacity: 0.7 }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="glass rounded-2xl px-3 py-2 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" 
                        style={{ backgroundColor: 'rgb(var(--btn-bg))' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" 
                        style={{ backgroundColor: 'rgb(var(--btn-bg))', animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" 
                        style={{ backgroundColor: 'rgb(var(--btn-bg))', animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about Leo District 306 D7..."
                  className="flex-1 px-4 py-3 sm:py-2 sm:px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 biography-content shadow-sm"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  spellCheck="true"
                  style={{
                    background: 'rgba(var(--surface), 0.8)',
                    outlineColor: 'rgb(var(--btn-bg))',
                    borderColor: 'rgba(var(--btn-bg), 0.3)',
                    color: 'rgb(var(--fg))'
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-3 sm:px-3 sm:py-2 rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-105 shadow-sm min-w-[44px] min-h-[44px]"
                  style={{
                    background: 'linear-gradient(135deg, rgb(var(--btn-bg)), rgb(var(--btn-bg-hover)))'
                  }}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              
              <div className="text-xs mt-2 text-center biography-content leading-relaxed" style={{ color: 'rgb(var(--fg))', opacity: 0.7 }}>
                <div className="hidden sm:inline">
                  Powered by Leo District 306 D7 •
                  <a
                    href="https://d7leos.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline ml-1"
                    style={{ color: 'rgb(var(--link))' }}
                  >
                    d7leos.org
                  </a>
                </div>
                <div className="sm:hidden">
                  <div>Powered by Leo District 306 D7</div>
                  <a
                    href="https://d7leos.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                    style={{ color: 'rgb(var(--link))' }}
                  >
                    d7leos.org
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AscentChatBot;