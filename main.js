// ── gPlex Webchat · main.js ──────────────────────────────────────────────────
// Vite 8+ / Tailwind CSS v4  |  Login → Chat flow

// ── Avatars ───────────────────────────────────────────────────────────────────
const BOT_AVATAR = `
  <div class="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
       style="background:#16a34a;">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  </div>`;

function userAvatar(initials) {
  return `<div class="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-white text-xs font-bold"
       style="background:#4f46e5;">${initials}</div>`;
}

// ── State ──────────────────────────────────────────────────────────────────────
let userName    = '';
let userPhone   = '';
let userInitials = 'U';
const history   = [];

// ── DOM ────────────────────────────────────────────────────────────────────────
const screenLogin    = document.getElementById('screen-login');
const screenChat     = document.getElementById('screen-chat');
const loginNameEl    = document.getElementById('login-name');
const loginPhoneEl   = document.getElementById('login-phone');
const loginErrorEl   = document.getElementById('login-error');
const startChatBtn   = document.getElementById('start-chat-btn');
const chatBody       = document.getElementById('chat-body');
const msgInput       = document.getElementById('msg-input');
const sendBtn        = document.getElementById('send-btn');
const closeBtn       = document.getElementById('close-btn');

// ── Validation ─────────────────────────────────────────────────────────────────
function validate() {
  const name  = loginNameEl.value.trim();
  const phone = loginPhoneEl.value.trim();

  loginNameEl.classList.remove('error');
  loginPhoneEl.classList.remove('error');
  loginErrorEl.classList.add('hidden');

  if (!name) {
    loginNameEl.classList.add('error');
    showError('Please enter your name.');
    return false;
  }
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    loginPhoneEl.classList.add('error');
    showError('Enter a valid BD phone number (e.g. 01712345678).');
    return false;
  }
  return true;
}

function showError(msg) {
  loginErrorEl.textContent = msg;
  loginErrorEl.classList.remove('hidden');
}

// ── Login → Chat transition ────────────────────────────────────────────────────
function startChat() {
  if (!validate()) return;

  userName     = loginNameEl.value.trim();
  userPhone    = loginPhoneEl.value.trim();
  userInitials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  // Swap screens
  screenLogin.classList.add('hidden');
  screenChat.classList.remove('hidden');
  screenChat.classList.add('screen-fade-in');

  // Greeting
  appendMessage(
    'assistant',
    `Hi ${userName}! 👋 Greetings from Apex Footwear Limited. How may I help you today? For any inquiries you may also contact our Customer Care at 09617223344 (Service hours: 10:00 AM – 8:00 PM).`
  );

  msgInput.focus();
}

// ── Chat helpers ───────────────────────────────────────────────────────────────
function scrollBottom() {
  requestAnimationFrame(() => { chatBody.scrollTop = chatBody.scrollHeight; });
}

function appendMessage(role, text) {
  const isBot = role === 'assistant';
  const row   = document.createElement('div');
  row.className = `flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'} bubble-in-${isBot ? 'left' : 'right'}`;

  const bubble = document.createElement('div');
  bubble.className = 'max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm';
  bubble.style.cssText = isBot
    ? 'background:#ffffff; color:#374151; border-bottom-left-radius:4px;'
    : 'background:var(--brand); color:#fff; border-bottom-right-radius:4px;';
  bubble.textContent = text;

  row.innerHTML = isBot ? BOT_AVATAR : userAvatar(userInitials);
  isBot ? row.appendChild(bubble) : row.insertBefore(bubble, row.firstChild);

  chatBody.appendChild(row);
  scrollBottom();
}

function showTyping() {
  const row = document.createElement('div');
  row.id = 'typing-indicator';
  row.className = 'flex items-end gap-2 bubble-in-left';
  row.innerHTML = `${BOT_AVATAR}
    <div class="px-4 py-3 rounded-2xl bg-white shadow-sm flex gap-1 items-center" style="border-bottom-left-radius:4px;">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  chatBody.appendChild(row);
  scrollBottom();
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

// ── Claude API ─────────────────────────────────────────────────────────────────
async function callClaude(userMessage) {
  history.push({ role: 'user', content: userMessage });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a helpful customer service assistant for Apex Footwear Limited, 
               operating via gPlex Webchat. The customer's name is ${userName} and phone is ${userPhone}.
               Be friendly, concise, and helpful. 
               Customer Care: 09617223344 (10:00 AM – 8:00 PM).`,
      messages: history,
    }),
  });

  if (!resp.ok) throw new Error(`API ${resp.status}`);
  const data  = await resp.json();
  const reply = data.content?.find(b => b.type === 'text')?.text || 'Sorry, I could not respond right now.';
  history.push({ role: 'assistant', content: reply });
  return reply;
}

// ── Send flow ──────────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  msgInput.value    = '';
  msgInput.disabled = true;
  sendBtn.disabled  = true;

  appendMessage('user', text);
  showTyping();

  try {
    const reply = await callClaude(text);
    hideTyping();
    appendMessage('assistant', reply);
  } catch (err) {
    hideTyping();
    appendMessage('assistant', '⚠️ Something went wrong. Please try again.');
    console.error(err);
  } finally {
    msgInput.disabled = false;
    sendBtn.disabled  = false;
    msgInput.focus();
  }
}

// ── Events ─────────────────────────────────────────────────────────────────────
startChatBtn.addEventListener('click', startChat);

[loginNameEl, loginPhoneEl].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') startChat(); });
});

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

closeBtn.addEventListener('click', () => {
  document.getElementById('chat-widget').style.display = 'none';
});
