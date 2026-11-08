import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';

const child = spawn('C:/Users/usuario/AppData/Local/Programs/OpenAI/Codex/bin/codex.exe', ['app-server'], { stdio: ['pipe', 'pipe', 'pipe'] });
const pending = new Map(); let seq = 0;
const lines = readline.createInterface({ input: child.stdout });
lines.on('line', line => { try { const m = JSON.parse(line); if (pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } } catch {} });
function rpc(method, params = {}) { return new Promise((resolve, reject) => { const id = ++seq; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 25000); pending.set(id, { resolve, reject, timer }); child.stdin.write(JSON.stringify({ id, method, params }) + '\n'); }); }
try {
  await rpc('initialize', { clientInfo: { name: 'english_learning_feasibility', title: 'English Learning Feasibility', version: '0.1.0' } });
  child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
  const account = await rpc('account/read', { refreshToken: false });
  const limits = await rpc('account/rateLimits/read');
  const models = await rpc('model/list', { limit: 50, includeHidden: false });
  const safe = { checkedAt: new Date().toISOString(), account: { type: account.account?.type, plan: account.account?.planType }, limits: limits.rateLimits, models: models.data.map(m => ({ model: m.model, default: m.isDefault, efforts: m.supportedReasoningEfforts, inputModalities: m.inputModalities })) };
  await mkdir('output/feasibility', { recursive: true });
  await writeFile('output/feasibility/account-check.json', JSON.stringify(safe, null, 2));
  console.log(JSON.stringify(safe, null, 2));
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { for (const p of pending.values()) clearTimeout(p.timer); child.stdin.end(); child.kill(); }
