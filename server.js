// ── gPlex Webchat · Local API Server ─────────────────────────────────────────
// Node.js backend for chat storage and retrieval

import { createServer } from 'http';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const CHAT_STORE = join(DATA_DIR, 'chat-store.json');
const PORT = 3000;

// ── Storage helpers ───────────────────────────────────────────────────────────
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadConversations() {
  try {
    if (!existsSync(CHAT_STORE)) return [];
    const data = await readFile(CHAT_STORE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveConversations(conversations) {
  await ensureDataDir();
  await writeFile(CHAT_STORE, JSON.stringify(conversations, null, 2), 'utf-8');
}

// ── HTTP handler ──────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /api/chat - receive and store chat messages
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { userName, userPhone, message, attachments, history } = payload;

        // Load existing conversations
        const conversations = await loadConversations();

        // Create conversation entry
        const conversation = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          userName: userName || 'Unknown',
          userPhone: userPhone || 'N/A',
          message: message || '',
          attachments: attachments || [],
          history: history || []
        };

        // Store conversation
        conversations.push(conversation);
        await saveConversations(conversations);

        // Generate simple reply (placeholder - can be enhanced later)
        const reply = `Thank you for your message! I received: "${message || 'your attachments'}"`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        console.error('Error processing chat:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to process message' }));
      }
    });
    return;
  }

  // GET /api/history?phone=... - retrieve chat history for a specific user
  if (req.method === 'GET' && req.url?.startsWith('/api/history')) {
    try {
      const phone = new URL(req.url, 'http://localhost').searchParams.get('phone') || '';
      const conversations = await loadConversations();
      const userConvs = conversations.filter(c => c.userPhone === phone);
      const history = userConvs.length ? userConvs[userConvs.length - 1].history : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history }));
    } catch (err) {
      console.error('Error loading history:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history: [] }));
    }
    return;
  }

  // GET /api/conversations - retrieve stored conversations
  if (req.method === 'GET' && req.url === '/api/conversations') {
    try {
      const conversations = await loadConversations();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ conversations }));
    } catch (err) {
      console.error('Error loading conversations:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to load conversations' }));
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ── Start server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✓ gPlex Chat API server running at http://localhost:${PORT}`);
  console.log(`  POST /api/chat - Send chat messages`);
  console.log(`  GET  /api/conversations - Retrieve conversations`);
});
