import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import GlobeScene from './Globe';

const GROQ_API_KEY = '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';
const ELEVENLABS_API_KEY = 'sk_9ccc511836e8df18aad887784226e8c6df62d11f7730fd1d';
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="sys-time">{time}</span>;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatus = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isThinking) return 'processing';
    return 'online';
  };

  const getStatusLabel = () => {
    if (isListening) return 'LISTENING';
    if (isSpeaking) return 'SPEAKING';
    if (isThinking) return 'PROCESSING';
    return 'ONLINE';
  };

  const speak = async (text) => {
    try {
      setIsSpeaking(true);
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
      if (!response.ok) throw new Error('ElevenLabs failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (error) {
      console.error('ElevenLabs error, using browser fallback:', error);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Use Chrome for voice input.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const sendMessage = async (overrideInput) => {
    const text = (overrideInput || input).trim();
    if (!text) return;
    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          messages: [
            {
              role: 'system',
              content: `You are Z.E.U.S. — Zero-latency Executive Universal System. You are Aditya Machiraju's personal Iron Man style AI assistant. You are sharp, confident, and slightly futuristic in tone. Keep responses concise and powerful. Address him as "sir" or "Aditya".`,
            },
            ...newMessages,
          ],
        }),
      });
      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages([...newMessages, assistantMessage]);
      speak(assistantMessage.content);
    } catch (error) {
      console.error('Groq error:', error);
    }
    setIsThinking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage();
  };

  const status = getStatus();

  return (
    <div className="app-shell">
      <GlobeScene />

      {/* HUD corner brackets */}
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      {/* Header */}
      <header className="hud-header">
        <div className="hud-left">
          <div className={`arc-reactor ${isSpeaking ? 'speaking' : ''}`}>⬡</div>
          <div className="hud-title-block">
            <span className="zeus-title">Z.E.U.S.</span>
            <span className="zeus-subtitle">ZERO-LATENCY EXECUTIVE UNIVERSAL SYSTEM</span>
          </div>
        </div>
        <div className="hud-right">
          <div className={`status-pill ${status}`}>
            <div className="status-dot" />
            {getStatusLabel()}
          </div>
          <Clock />
        </div>
      </header>

      {/* Chat */}
      <div className="chat-wrapper">
        <div className="chat-window">
          {messages.length === 0 && (
            <div className="boot-message">
              ▸ SYSTEM ONLINE — AWAITING INPUT, ADITYA
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <span className="msg-label">
                {msg.role === 'user' ? '▸ ADITYA' : '⬡ Z.E.U.S.'}
              </span>
              <div className="msg-bubble">{msg.content}</div>
            </div>
          ))}
          {isThinking && (
            <div className="message assistant">
              <span className="msg-label">⬡ Z.E.U.S.</span>
              <div className="msg-bubble">
                <span className="thinking-dots">
                  <span>·</span><span>·</span><span>·</span>
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="input-section">
        <div className="input-bar">
          <button
            className={`mic-btn ${isListening ? 'active' : ''}`}
            onClick={startListening}
            title="Voice input"
          >
            {isListening ? '◉' : '🎤'}
          </button>
          <input
            className="zeus-input"
            type="text"
            placeholder="▸ ENTER COMMAND OR USE MIC..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={isThinking || !input.trim()}
          >
            SEND
          </button>
        </div>
        <p className="input-hint">ENTER TO SEND · MIC FOR VOICE · GEORGE VOICE ACTIVE</p>
      </div>
    </div>
  );
}

export default App;