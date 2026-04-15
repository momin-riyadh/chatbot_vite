// ── gPlex Webchat · main.js ──────────────────────────────────────────────────
// Vite 8+ / Tailwind CSS v4 | Login → Chat → Feedback → Thank You

import logoUrl from '../assets/images/logo.png';
import userAvatarUrl from '../assets/images/user.png';

// ── Avatars ───────────────────────────────────────────────────────────────────
const BOT_AVATAR = `
  <div class="flex items-center justify-center w-9 h-9 rounded-full shrink-0 shadow-md"
       style="background:#ffffff;">
    <img src="${logoUrl}" alt="Bot" class="w-7 h-7 object-contain">
  </div>`;

const USER_AVATAR = `
  <div class="flex items-center justify-center w-9 h-9 rounded-full shrink-0 shadow-md overflow-hidden"
       style="background:#e5e7eb;">
    <img src="${userAvatarUrl}" alt="User" class="w-full h-full object-cover">
  </div>`;


// User Avatar Image
function userAvatar(initials) {
  return `<div class="flex items-center justify-center w-8 h-8 rounded-full shrink-0  text-xs font-bold bg-amber-50 text-black border border-amber-200 shadow-sm"
      >${initials}</div>`;
}

// ── State ──────────────────────────────────────────────────────────────────────
let userName     = '';
let userPhone    = '';
let userInitials = 'U';
let currentScreen = 'login';   // 'login' | 'chat' | 'feedback' | 'thankyou'
let selectedStars = 0;
const history = [];

// ── DOM ────────────────────────────────────────────────────────────────────────
const screens = {
  login    : document.getElementById('screen-login'),
  chat     : document.getElementById('screen-chat'),
  feedback : document.getElementById('screen-feedback'),
  thankyou : document.getElementById('screen-thankyou'),
};
console.log(typeof screens);
const loginNameEl       = document.getElementById('login-name');
const loginPhoneEl      = document.getElementById('login-phone');
const loginErrorEl      = document.getElementById('login-error');
const startChatBtn      = document.getElementById('start-chat-btn');
const chatBody          = document.getElementById('chat-body');
const msgInput          = document.getElementById('msg-input');
const sendBtn           = document.getElementById('send-btn');
const attachmentBtn     = document.getElementById('attachment-btn');
const attachmentInput   = document.getElementById('attachment-input');
const attachmentPreview = document.getElementById('attachment-preview');
const attachmentThumb   = document.getElementById('attachment-thumb');
const attachmentName    = document.getElementById('attachment-name');
const attachmentRemoveBtn = document.getElementById('attachment-remove-btn');
const closeBtn          = document.getElementById('close-btn');
const minimizeBtn       = document.getElementById('minimize-btn');
const chatWidget        = document.getElementById('chat-widget');
const starBtns          = document.querySelectorAll('.star-btn');
const feedbackText      = document.getElementById('feedback-text');
const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
const continueChatBtn   = document.getElementById('continue-chat-btn');
let selectedAttachment  = null; // { file, isImage, previewUrl }

// ── Screen switcher ────────────────────────────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    if (key === name) {
      el.classList.remove('hidden');
      el.classList.add('screen-fade-in');
    } else {
      el.classList.add('hidden');
      el.classList.remove('screen-fade-in');
    }
  });
  currentScreen = name;
}

// ── Login validation ───────────────────────────────────────────────────────────
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

// ── Login → Chat ───────────────────────────────────────────────────────────────
function startChat() {
  if (!validate()) return;
  userName     = loginNameEl.value.trim();
  userPhone    = loginPhoneEl.value.trim();
  userInitials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  showScreen('chat');
  appendMessage(
    'assistant',
    `Hi ${userName}! 👋 Greetings from Apex Footwear Limited. How may I help you today? For any inquiries you may also contact our Customer Care at 09617223344 (Service hours: 10:00 AM – 8:00 PM).`
  );
  msgInput.focus();
}

// ── Close button logic ─────────────────────────────────────────────────────────
minimizeBtn.addEventListener('click', () => {
  chatWidget.style.display = 'none';
});

closeBtn.addEventListener('click', () => {
  if (currentScreen === 'chat') {
    // Show feedback instead of closing
    showScreen('feedback');
    resetFeedback();
  } else if (currentScreen === 'feedback') {
    // Dismiss — actually close widget
    chatWidget.style.display = 'none';
  } else {
    // login / thankyou → just close
    chatWidget.style.display = 'none';
  }
});

// ── Star rating ────────────────────────────────────────────────────────────────
function resetFeedback() {
  selectedStars = 0;
  feedbackText.value = '';
  updateStars(0);
}

function updateStars(val) {
  starBtns.forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.val) <= val);
  });
}

starBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedStars = Number(btn.dataset.val);
    updateStars(selectedStars);
  });
  // Hover preview
  btn.addEventListener('mouseenter', () => updateStars(Number(btn.dataset.val)));
  btn.addEventListener('mouseleave', () => updateStars(selectedStars));
});

// ── Submit feedback ────────────────────────────────────────────────────────────
submitFeedbackBtn.addEventListener('click', () => {
  // Log/send feedback (extend with real API call as needed)
  console.log('Feedback submitted:', { stars: selectedStars, text: feedbackText.value.trim(), user: userName, phone: userPhone });
  showScreen('thankyou');

  // Auto-close after 3 s
  setTimeout(() => {
    chatWidget.style.display = 'none';
  }, 3000);
});

// ── Continue chat ──────────────────────────────────────────────────────────────
continueChatBtn.addEventListener('click', () => {
  showScreen('chat');
  msgInput.focus();
});

// ── Chat helpers ───────────────────────────────────────────────────────────────
function scrollBottom() {
  requestAnimationFrame(() => { chatBody.scrollTop = chatBody.scrollHeight; });
}

function appendMessage(role, text, attachment = null) {
  const isBot = role === 'assistant';
  const row   = document.createElement('div');
  row.className = `flex items-end gap-2 ${isBot ? '' : 'flex-row justify-end'} bubble-in-${isBot ? 'left' : 'right'}`;

  const bubble = document.createElement('div');
  bubble.className = 'max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm';
  bubble.style.cssText = isBot
    ? 'background:#ffffff; color:#374151; border-bottom-left-radius:4px;'
    : 'background:var(--brand); color:#fff; border-bottom-right-radius:4px;';

  if (text) {
    const textEl = document.createElement('div');
    textEl.className = 'whitespace-pre-wrap break-words';
    textEl.textContent = text;
    bubble.appendChild(textEl);
  }

  if (attachment) {
    if (text) {
      const spacer = document.createElement('div');
      spacer.className = 'h-2';
      bubble.appendChild(spacer);
    }

    if (attachment.isImage && attachment.previewUrl) {
      const img = document.createElement('img');
      img.src = attachment.previewUrl;
      img.alt = attachment.name || 'Attachment';
      img.className = 'max-w-[180px] max-h-[180px] rounded-lg border border-white/30 object-cover';
      bubble.appendChild(img);
    }

    const meta = document.createElement('div');
    meta.className = 'text-[11px] mt-1 opacity-85 break-all';
    meta.textContent = attachment.name || 'Attached file';
    bubble.appendChild(meta);
  }

  if (isBot) {
    row.innerHTML = BOT_AVATAR;
    row.appendChild(bubble);
  } else {
    row.innerHTML = bubble.outerHTML + USER_AVATAR;
  }

  chatBody.appendChild(row);
  scrollBottom();
}

function showAttachmentPreview(file) {
  if (!attachmentPreview || !attachmentName) return;
  attachmentName.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
  if (attachmentThumb) {
    if (selectedAttachment?.isImage && selectedAttachment.previewUrl) {
      attachmentThumb.src = selectedAttachment.previewUrl;
      attachmentThumb.classList.remove('hidden');
    } else {
      attachmentThumb.src = '';
      attachmentThumb.classList.add('hidden');
    }
  }
  attachmentPreview.classList.remove('hidden');
  attachmentPreview.classList.add('inline-flex');
}

function clearAttachment() {
  selectedAttachment = null;
  if (attachmentInput) attachmentInput.value = '';
  if (attachmentThumb) {
    attachmentThumb.src = '';
    attachmentThumb.classList.add('hidden');
  }
  if (attachmentPreview) {
    attachmentPreview.classList.add('hidden');
    attachmentPreview.classList.remove('inline-flex');
  }
  if (attachmentName) attachmentName.textContent = '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file preview'));
    reader.readAsDataURL(file);
  });
}

function showTyping() {
  const row = document.createElement('div');
  row.id = 'typing-indicator';
  row.className = 'flex items-end gap-2 bubble-in-left';
  row.innerHTML = `${BOT_AVATAR}
    <div class="px-4 py-3 rounded-2xl bg-white shadow-sm flex gap-1 items-center" style="border-bottom-left-radius:4px;">
      <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
    </div>`;
  chatBody.appendChild(row);
  scrollBottom();
}
function hideTyping() { document.getElementById('typing-indicator')?.remove(); }

// ── Claude API ─────────────────────────────────────────────────────────────────
async function callClaude(userMessage, attachment = null) {
  const messageContent = attachment
    ? `${userMessage || 'User sent an attachment.'}\n\n[Attachment]\nName: ${attachment.name}\nType: ${attachment.type || 'unknown'}\nSize: ${attachment.size} bytes`
    : userMessage;
  history.push({ role: 'user', content: messageContent });
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a helpful customer service assistant for Apex Footwear Limited via gPlex Webchat.
               Customer name: ${userName}, phone: ${userPhone}.
               Be friendly and concise. Customer Care: 09617223344 (10 AM–8 PM).`,
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
  const fileState = selectedAttachment;
  const file = fileState?.file || null;
  if (!text && !file) return;
  msgInput.value = '';
  msgInput.disabled = true;
  sendBtn.disabled  = true;
  if (attachmentBtn) attachmentBtn.disabled = true;

  if (file) {
    appendMessage('user', text || '', {
      name: file.name,
      isImage: fileState?.isImage,
      previewUrl: fileState?.previewUrl || '',
    });
  } else {
    appendMessage('user', text);
  }
  clearAttachment();
  showTyping();
  try {
    hideTyping();
    appendMessage('assistant', await callClaude(text, file));
  } catch (err) {
    hideTyping();
    appendMessage('assistant', '⚠️ Something went wrong. Please try again.');
    console.error(err);
  } finally {
    msgInput.disabled = false;
    sendBtn.disabled  = false;
    if (attachmentBtn) attachmentBtn.disabled = false;
    msgInput.focus();
  }
}

// ── Events ─────────────────────────────────────────────────────────────────────
startChatBtn.addEventListener('click', startChat);
[loginNameEl, loginPhoneEl].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') startChat(); })
);
sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
attachmentBtn?.addEventListener('click', () => attachmentInput?.click());
attachmentInput?.addEventListener('change', () => {
  const file = attachmentInput.files?.[0];
  if (!file) {
    clearAttachment();
    return;
  }
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    readFileAsDataUrl(file)
      .then((previewUrl) => {
        selectedAttachment = { file, isImage: true, previewUrl };
        showAttachmentPreview(file);
      })
      .catch(() => {
        selectedAttachment = { file, isImage: true, previewUrl: '' };
        showAttachmentPreview(file);
      });
    return;
  }
  selectedAttachment = { file, isImage: false, previewUrl: '' };
  showAttachmentPreview(file);
});
attachmentRemoveBtn?.addEventListener('click', clearAttachment);
