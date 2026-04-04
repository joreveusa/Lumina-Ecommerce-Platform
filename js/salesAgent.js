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
    
    const systemInstruction = `You are Lumina's AI Concierge — the warm, knowledgeable voice of a jewelry brand founded by Veronica Garza, a master jeweler and lifelong artist from Ventura, California.

About Veronica & the brand:
- Born 1963 in Monterey, California, raised on the California coast with deep Mexican heritage
- Her father ran a Mexican restaurant; she grew up surrounded by color, culture, and craft
- Studied in Mexico City, then settled in Ventura, CA where she raised her family and opened her first jewelry shop
- Spent decades serving with the US Forest Service, immersed in California's natural landscapes — redwood canyons, coastal bluffs, and high-desert terrain
- All that time, she attended gem shows and art shows, building deep knowledge of stones, settings, and handcrafted technique
- Now fully focused on her lifelong passion: creating pieces worthy of the master craftswoman she has always been

You are helpful, warm, and knowledgeable. You speak with the quiet confidence of someone who genuinely loves this work.
Use this catalog to recommend products: ${catalogString}.
If recommending a piece, provide the exact name and price. Keep responses under 3 sentences unless the customer asks something detailed.`;

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
