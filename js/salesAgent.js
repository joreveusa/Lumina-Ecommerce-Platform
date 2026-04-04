import { db } from './db.js';

export function initSalesAgent() {
  const triggerBtn = document.getElementById('ai-trigger');
  const navAgentBtn = document.getElementById('nav-agent-btn');
  const panel = document.getElementById('ai-panel');
  const closeBtn = document.getElementById('ai-close');
  const chatForm = document.getElementById('ai-chat-form');
  const inputEl = document.getElementById('ai-input');
  const chatBody = document.getElementById('ai-chat-body');

  const togglePanel = () => {
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) {
      inputEl.focus();
    }
  };

  if(triggerBtn) triggerBtn.addEventListener('click', togglePanel);
  if(navAgentBtn) navAgentBtn.addEventListener('click', togglePanel);
  if(closeBtn) closeBtn.addEventListener('click', togglePanel);

  if(!chatForm) return;

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = inputEl.value.trim();
    if (!userText) return;

    addMessage(userText, 'user');
    inputEl.value = '';

    const typingId = 'typing-' + Date.now();
    addMessage('...', 'bot', typingId);

    try {
      const responseText = await callPollinationsAPI(userText);

      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();
      addMessage(responseText, 'bot');

    } catch (err) {
      console.error(err);
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();
      addMessage("I'm sorry, my systems are currently down. " + err.message, 'bot');
    }
  });

  function addMessage(text, role, id = '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${role}`;
    if (id) msgDiv.id = id;
    
    if (role === 'bot') {
       // Convert markdown bolding to HTML
       let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
       // Convert newlines to breaks
       html = html.replace(/\n/g, '<br/>');
       msgDiv.innerHTML = html;
    } else {
      msgDiv.textContent = text;
    }
    
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  async function callPollinationsAPI(prompt) {
    const products = db.getProducts();
    const catalogString = products.map(p => `[ID:${p.id}] ${p.name} - ${p.category} - ${p.priceStr}`).join(' | ');
    
    const systemInstruction = `You are Lumina's AI Concierge. We sell high-end jewelry blending Santa Fe traditional art with Santa Barbara coastal elegance. 
    You are helpful, luxurious, and concise. 
    Use this catalog to recommend products: ${catalogString}.
    If recommending a piece, provide the exact name and price. Format responses neatly. Keep your response under 3 sentences unless specifically asked a long question.`;

    const requestBody = {
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ]
    };

    const response = await fetch(`https://text.pollinations.ai/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if(!response.ok) throw new Error("API Connection Failed");

    const text = await response.text();
    return text;
  }
}
