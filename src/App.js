import React, { useState } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          messages: [
            {
              role: 'system',
              content: `You are Z.E.U.S. — Zero-latency Executive Universal System. 
              You are Aditya Machiraju's personal Iron Man style AI assistant. 
              You are sharp, confident, and slightly futuristic in tone. 
              Keep responses concise and powerful. Address him as "Aditya" or "sir".`,
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
    } catch (error) {
      console.error('Error:', error);
    }
    setIsThinking(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="zeus-container">
      <div className="hud-header">
        <div className="arc-reactor">⬡</div>
        <h1 className="zeus-title">Z.E.U.S.</h1>
        <p className="zeus-subtitle">Zero-latency Executive Universal System</p>
      </div>

      <div className="chat-window">
        {messages.length === 0 && (
          <div className="boot-message">
            &gt; SYSTEM ONLINE. AWAITING INPUT, ADITYA.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="msg-label">{msg.role === 'user' ? 'ADITYA' : 'Z.E.U.S.'}</span>
            <p>{msg.content}</p>
          </div>
        ))}
        {isThinking && (
          <div className="message assistant">
            <span className="msg-label">Z.E.U.S.</span>
            <p className="thinking">PROCESSING...</p>
          </div>
        )}
      </div>

      <div className="input-row">
        <input
          className="zeus-input"
          type="text"
          placeholder="> ENTER COMMAND..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="zeus-btn" onClick={sendMessage}>SEND</button>
      </div>
    </div>
  );
}

export default App;