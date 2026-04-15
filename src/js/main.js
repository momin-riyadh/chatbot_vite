// ── gPlex Webchat · main.js ──────────────────────────────────────────────────
// Vite 8+ / Tailwind CSS v4 | Login → Chat → Feedback → Thank You

import logoUrl from '../assets/images/logo.png';
import userAvatarUrl from '../assets/images/user.png';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/styles';

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
const attachmentThumbs  = document.getElementById('attachment-thumbs');
const closeBtn          = document.getElementById('close-btn');
const minimizeBtn       = document.getElementById('minimize-btn');
const chatWidget        = document.getElementById('chat-widget');
const expandWidgetBtn   = document.getElementById('expand-widget-btn');
const starBtns          = document.querySelectorAll('.star-btn');
const feedbackText      = document.getElementById('feedback-text');
const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
const continueChatBtn   = document.getElementById('continue-chat-btn');
const phoneIti = loginPhoneEl
  ? intlTelInput(loginPhoneEl, {
      initialCountry: 'bd',
      preferredCountries: ['bd', 'in', 'pk', 'us', 'gb'],
      separateDialCode: true,
      strictMode: true,
      formatAsYouType: true,
      loadUtils: () => import('intl-tel-input/utils'),
    })
  : null;

/**
 * Pending images before send. Used for UI preview and for building the outbound user turn.
 *
 * Shape (each item):
 * - id: string — stable client key (name + size + lastModified); not a server id.
 * - file: File — native File object; use for FormData if you POST multipart to your backend.
 * - name, type, size: from File — mirror these in your API/metadata.
 * - previewUrl: string (data URL) — browser-only; large strings; do not persist or send to LLM as base64 unless you intentionally support vision/multipart. Current callClaude() only sends text metadata.
 *
 * @type {Array<{ id: string, file: File, name: string, type: string, size: number, previewUrl: string }>}
 */
let selectedAttachments = [];

/** Pixels: parsed once from `#chat-widget` inline width (see index.html). Expanded state uses `× 1.5`. */
let widgetBaseWidthPx = (() => {
  if (!chatWidget) return 380;
  const w = chatWidget.style.width || '';
  const m = /^(\d+(?:\.\d+)?)px$/.exec(w.trim());
  if (m) return Math.round(parseFloat(m[1]));
  const px = parseFloat(getComputedStyle(chatWidget).width);
  return Number.isFinite(px) ? Math.round(px) : 380;
})();
let widgetWidthExpanded = false;

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
  if (!phone) {
    loginPhoneEl.classList.add('error');
    showError('Please enter your phone number.');
    return false;
  }
  if (!phoneIti || !phoneIti.isValidNumber()) {
    loginPhoneEl.classList.add('error');
    showError('Enter a valid international phone number.');
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
  userPhone    = phoneIti?.getNumber() || loginPhoneEl.value.trim();
  userInitials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  showScreen('chat');
  appendMessage(
    'assistant',
    `Hi ${userName}! 👋 Greetings from Apex Footwear Limited. How may I help you today? For any inquiries you may also contact our Customer Care at 09617223344 (Service hours: 10:00 AM – 8:00 PM).`
  );
  msgInput.focus();
}

function applyWidgetWidthExpanded(expanded) {
  if (!chatWidget) return;
  widgetWidthExpanded = expanded;
  chatWidget.style.width = `${widgetBaseWidthPx * (expanded ? 1.5 : 1)}px`;
  if (expandWidgetBtn) {
    expandWidgetBtn.setAttribute('aria-expanded', String(expanded));
    expandWidgetBtn.setAttribute('aria-label', expanded ? 'Shrink chat to default width' : 'Expand chat width');
    expandWidgetBtn.querySelector('.expand-icon-out')?.classList.toggle('hidden', expanded);
    expandWidgetBtn.querySelector('.expand-icon-in')?.classList.toggle('hidden', !expanded);
  }
}

expandWidgetBtn?.addEventListener('click', () => applyWidgetWidthExpanded(!widgetWidthExpanded));

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

/**
 * Human-readable local date/time for bubbles. `time[datetime]` uses ISO-8601 (UTC) for APIs, analytics, and tests.
 * Format: YYYY-MM-DD HH:mm:ss (24h, local timezone).
 *
 * @param {Date} [date]
 */
function formatChatTimestamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * Renders a chat bubble. For the user role, `attachments` may contain image previews (`previewUrl` data URLs)
 * for display only; they are not automatically uploaded anywhere.
 *
 * @param {'assistant'|'user'} role
 * @param {string} text
 * @param {Array<{ name: string, previewUrl: string }>} [attachments]
 * @param {Date} [at] — wall time for this message (defaults to now); pass when replaying history from a backend.
 */
function appendMessage(role, text, attachments = [], at = new Date()) {
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

  if (attachments.length) {
    if (text) {
      const spacer = document.createElement('div');
      spacer.className = 'h-2';
      bubble.appendChild(spacer);
    }

    const imageGrid = document.createElement('div');
    imageGrid.className = `grid gap-1 ${attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} max-w-[220px]`;
    attachments.forEach((attachment) => {
      const img = document.createElement('img');
      img.src = attachment.previewUrl;
      img.alt = attachment.name || 'Attachment';
      img.className = `${attachments.length === 1 ? 'w-[180px] h-[180px]' : 'w-[106px] h-[106px]'} rounded-lg border border-white/30 object-cover`;
      imageGrid.appendChild(img);
    });
    bubble.appendChild(imageGrid);
  }

  const timeEl = document.createElement('time');
  timeEl.dateTime = at.toISOString();
  timeEl.className = `block text-[10px] mt-2 tabular-nums tracking-tight ${isBot ? 'text-gray-400' : 'text-white/75'}`;
  timeEl.textContent = formatChatTimestamp(at);
  bubble.appendChild(timeEl);

  if (isBot) {
    row.innerHTML = BOT_AVATAR;
    row.appendChild(bubble);
  } else {
    row.innerHTML = bubble.outerHTML + USER_AVATAR;
  }

  chatBody.appendChild(row);
  scrollBottom();
}

/** Rebuilds the compose-area thumbnail grid from `selectedAttachments` (event: remove uses delegation on #attachment-thumbs). */
function showAttachmentPreview() {
  if (!attachmentPreview || !attachmentThumbs) return;
  attachmentThumbs.innerHTML = '';
  selectedAttachments.forEach((attachment) => {
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'relative w-12 h-12 shrink-0';
    thumbWrap.innerHTML = `
      <img src="${attachment.previewUrl}" alt="${attachment.name}" class="w-12 h-12 rounded-md object-cover border border-amber-200">
      <button type="button" data-attachment-id="${attachment.id}" class="absolute cursor-pointer top-0 right-0 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] leading-none">x</button>
    `;
    attachmentThumbs.appendChild(thumbWrap);
  });
  attachmentPreview.classList.remove('hidden');
  attachmentPreview.classList.add('inline-flex');
}

/** Clears pending files and hides the preview panel. Safe to call after sending or on cancel. */
function clearAttachments() {
  selectedAttachments = [];
  if (attachmentInput) attachmentInput.value = '';
  if (attachmentThumbs) attachmentThumbs.innerHTML = '';
  if (attachmentPreview) {
    attachmentPreview.classList.add('hidden');
    attachmentPreview.classList.remove('inline-flex');
  }
}

function removeAttachment(attachmentId) {
  selectedAttachments = selectedAttachments.filter((attachment) => attachment.id !== attachmentId);
  if (!selectedAttachments.length) {
    clearAttachments();
    return;
  }
  showAttachmentPreview();
}

/** Client-side preview only. Backend: prefer streams, object storage URLs, or multipart — not inline base64 in chat history. */
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
/**
 * Sends the conversation to Anthropic. Attachments are appended as plain-text metadata only (filename, MIME, size).
 *
 * Backend integration notes:
 * - Replace this with your own route that accepts multipart/form-data or signed upload URLs, then store file refs.
 * - If you need true image understanding, use the provider’s vision/content blocks or your server-side pipeline;
 *   do not rely on base64 in `history` unless you control limits and costs.
 * - `history` is the full message array posted as JSON; keep attachment summaries short if you add many images.
 *
 * @param {string} userMessage
 * @param {Array<{ name: string, type: string, size: number }>} attachments
 */
async function callClaude(userMessage, attachments = []) {
  const attachmentBlock = attachments.length
    ? `\n\n[Attachments]\n${attachments.map((attachment, idx) => `${idx + 1}. Name: ${attachment.name}, Type: ${attachment.type || 'unknown'}, Size: ${attachment.size} bytes`).join('\n')}`
    : '';
  const messageContent = `${userMessage || (attachments.length ? 'User shared images.' : '')}${attachmentBlock}`.trim();
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
/**
 * User send path: snapshot `selectedAttachments` before clearing so the bubble and API both see the same list.
 * Hook for backend: after `appendMessage('user', ...)`, upload `attachments[].file` (or your FormData) to your API,
 * then call the assistant with stored attachment ids/URLs instead of embedding data URLs in prompts.
 */
async function sendMessage() {
  const text = msgInput.value.trim();
  const attachments = [...selectedAttachments];
  if (!text && !attachments.length) return;
  msgInput.value = '';
  msgInput.disabled = true;
  sendBtn.disabled  = true;
  if (attachmentBtn) attachmentBtn.disabled = true;

  if (attachments.length) {
    appendMessage('user', text || '', attachments);
  } else {
    appendMessage('user', text);
  }
  clearAttachments();
  showTyping();
  try {
    hideTyping();
    appendMessage('assistant', await callClaude(text, attachments));
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
// Multiple picks: merge new files, skip duplicates by `id`, reset input so the same file can be re-selected later.
attachmentInput?.addEventListener('change', async () => {
  const files = Array.from(attachmentInput.files || []);
  if (!files.length) {
    return;
  }
  const existingIds = new Set(selectedAttachments.map((attachment) => attachment.id));
  const previews = await Promise.all(files.map(async (file) => {
    try {
      const previewUrl = await readFileAsDataUrl(file);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
      };
    } catch {
      return null;
    }
  }));
  previews.forEach((preview) => {
    if (preview && !existingIds.has(preview.id)) selectedAttachments.push(preview);
  });
  if (selectedAttachments.length) {
    showAttachmentPreview();
  }
  attachmentInput.value = '';
});
attachmentThumbs?.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const attachmentId = target.dataset.attachmentId;
  if (attachmentId) removeAttachment(attachmentId);
});
