import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Scale, Languages, Sparkles, ChevronDown, Mic, Compass } from 'lucide-react';
import { api } from '@/lib/api';

interface ChatbotWidgetProps {
  role?: string;
  activeCase?: any;
}

export function ChatbotWidget({ role, activeCase }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant'; content: string; timestamp: Date}[]>([
    { role: 'assistant', content: 'Magandang araw! I am your GabayMed AI Assistant. I can help you with medical assistance applications, Philippine laws & regulations, speech scripts, and tourism/hospital locality guides.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'assistant'|'laws'|'translate'|'speech'|'tourism'>('assistant');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isTyping) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text.trim(), timestamp: new Date() }]);
    setIsTyping(true);
    
    try {
      let response: any;
      switch (mode) {
        case 'laws':
          response = await api.generateLawsAndRegulations(text.trim(), 'PH');
          setMessages(prev => [...prev, { role: 'assistant', content: response.data, timestamp: new Date() }]);
          break;
        case 'translate':
          response = await api.translateText(text.trim(), 'en', 'fil');
          setMessages(prev => [...prev, { role: 'assistant', content: `**Translation (Filipino):**\n\n${response.translated_prompt || response.data}`, timestamp: new Date() }]);
          break;
        case 'speech':
          response = await api.generateSpeechMaker(text.trim(), 'PH');
          setMessages(prev => [...prev, { role: 'assistant', content: `**Generated Speech Script:**\n\n${response.data}`, timestamp: new Date() }]);
          break;
        case 'tourism':
          response = await api.generateTourism(text.trim(), 'PH');
          setMessages(prev => [...prev, { role: 'assistant', content: `**Locality & Tourism Guide:**\n\n${response.data}`, timestamp: new Date() }]);
          break;
        default:
          response = await api.generateAiAssistant(text.trim(), 'PH');
          setMessages(prev => [...prev, { role: 'assistant', content: response.data, timestamp: new Date() }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I am temporarily unavailable. Please try again shortly.', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const suggestions = [
    "How to apply for DSWD?",
    "What is RA 11032?",
    "Translate to Filipino",
    "Medical Speech Script",
    "Hospital Travel Guide"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.includes('Translate')) {
      setMode('translate');
    } else if (suggestion.includes('RA')) {
      setMode('laws');
    } else if (suggestion.includes('Speech')) {
      setMode('speech');
    } else if (suggestion.includes('Travel')) {
      setMode('tourism');
    } else {
      setMode('assistant');
    }
    sendMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4338ca)',
          color: 'white',
          border: '3px solid #1e1b4b',
          boxShadow: '0 4px 0 #1e1b4b',
          zIndex: 9999,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '5.5rem',
        right: '1.5rem',
        width: '400px',
        maxHeight: '540px',
        height: 'calc(100vh - 120px)',
        border: '2.5px solid #1e1b4b',
        borderRadius: '24px',
        background: '#ffffff',
        boxShadow: '0 6px 0 #1e1b4b, 0 20px 60px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
          color: 'white',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={24} />
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>eGov AI Assistant</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.25rem'
            }}
          >
            <ChevronDown size={24} />
          </button>
        </div>
        
        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
          {[
            { id: 'assistant', label: 'General', icon: MessageSquare },
            { id: 'laws', label: 'Laws', icon: Scale },
            { id: 'translate', label: 'Translate', icon: Languages },
            { id: 'speech', label: 'Speech', icon: Mic },
            { id: 'tourism', label: 'Travel', icon: Compass }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as any)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.35rem 0.45rem',
                borderRadius: '99px',
                border: tab.id === mode ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
                background: tab.id === mode ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: '#f8fafc'
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              background: msg.role === 'user' ? '#4338ca' : '#ffffff',
              color: msg.role === 'user' ? 'white' : '#1e1b4b',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '0.75rem 1rem',
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: msg.role === 'user' ? 'none' : '1.5px solid #e2e8f0',
              boxShadow: msg.role === 'user' ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap'
            }}
          >
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div
            style={{
              background: '#ffffff',
              color: '#1e1b4b',
              borderRadius: '18px 18px 18px 4px',
              padding: '0.75rem 1rem',
              maxWidth: '85%',
              alignSelf: 'flex-start',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              gap: '4px',
              alignItems: 'center'
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', animation: 'bounce 1.4s infinite ease-in-out both' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
            <style>{`
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
              }
            `}</style>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '0.75rem 1rem', background: 'white', borderTop: '2px solid #e2e8f0' }}>
        {messages.length <= 2 && !isTyping && (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', scrollbarWidth: 'none' }}>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(sug)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.4rem 0.75rem',
                  background: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '99px',
              fontSize: '0.85rem',
              fontWeight: 500,
              outline: 'none',
              background: '#f8fafc',
              color: '#1e1b4b'
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: input.trim() && !isTyping ? '#4338ca' : '#cbd5e1',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !isTyping ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}
          >
            <Send size={18} style={{ marginLeft: '2px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
