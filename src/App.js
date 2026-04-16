import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import GlobeScene from './Globe';
import Weather from './Weather';
import NewsTicker from './NewsTicker';
import { detectMood, getSystemPrompt, MOOD_LABELS } from './moodEngine';
import { incrementSession, updateMemory, addFact, getGreeting, buildMemoryContext } from './memoryEngine';





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
  const [currentMood, setCurrentMood] = useState('default');
  const [memory, setMemory] = useState(() => incrementSession());
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

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const response = await fetch(
      `/api/speak`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.75,
            speed: 1.1,
          },
        }),
      }
    );

    if (!response.ok) throw new Error('ElevenLabs stream failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    // Preload before playing
    audio.preload = 'auto';
    audio.onended = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
    };

    await audio.play();

  } catch (error) {
    console.error('ElevenLabs error, using browser fallback:', error);
    setIsSpeaking(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.15;
    utterance.pitch = 0.85;
    utterance.volume = 1;
    utterance.onend = () => setIsSpeaking(false);
    // Pick best available voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Daniel') ||
      v.name.includes('Google UK') ||
      v.name.includes('Alex')
    );
    if (preferred) utterance.voice = preferred;
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
    const mood = detectMood(text);
    setCurrentMood(mood);
    updateMemory({ lastMood: mood, lastTopic: text.substring(0, 80) });
    if (!text) return;
    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          messages: [
            {
             role: 'system',
             content: getSystemPrompt(mood) + buildMemoryContext(memory),
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
      // Auto-extract facts from user input
const lower = text.toLowerCase();
let updatedMemory = null;
if (lower.includes('my name is')) {
  const match = text.match(/my name is ([A-Za-z]+)/i);
  if (match) updatedMemory = addFact('name', match[1]);
}
if (lower.includes('i work at') || lower.includes('i work in')) {
  const match = text.match(/i work (?:at|in) ([^,.]+)/i);
  if (match) updatedMemory = addFact('workplace', match[1].trim());
}
if (lower.includes('i use ')) {
  const match = text.match(/i use ([^,.]+)/i);
  if (match) updatedMemory = addFact('tool', match[1].trim());
}
if (lower.includes('i am a') || lower.includes("i'm a")) {
  const match = text.match(/i(?:'m| am) a?n? ([^,.]+)/i);
  if (match) updatedMemory = addFact('role', match[1].trim());
}
if (updatedMemory) setMemory({ ...updatedMemory });
      const speakText = assistantMessage.content.length > 400
  ? assistantMessage.content.substring(0, 400) + '...'
  : assistantMessage.content;
    speak(speakText);
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
      {Object.keys(memory.facts).length > 0 && (
  <div className="memory-panel">
    <div className="memory-title">⬡ MEMORY ACTIVE</div>
    {Object.entries(memory.facts).map(([k, v]) => (
      <div key={k} className="memory-item">
        <span className="memory-key">{k.toUpperCase()}</span>
        <span className="memory-val">{v}</span>
      </div>
    ))}
    <div className="memory-meta">SESSION {memory.sessionCount}</div>
  </div>
)}

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
<div className={`mood-badge mood-${currentMood}`}>
  {MOOD_LABELS[currentMood]}
</div>
          <Clock />
        </div>
      </header>

      <Weather />
      {/* Chat */}
        <div className="chat-wrapper">

        <div className="chat-window">
          {messages.length === 0 && (
  <div className="boot-message">
    {getGreeting(memory)}
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
        <NewsTicker />
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