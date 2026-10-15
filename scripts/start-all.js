const { spawn } = require('child_process');

console.log('[Runner] Starting Aksara LMS (API on :8080 + Web on :3000)...');

const api = spawn('npm', ['run', 'start:api'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '8080' },
});

const web = spawn('npm', ['run', 'start:web'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' },
});

api.on('error', (err) => console.error('[API] Error:', err));
web.on('error', (err) => console.error('[WEB] Error:', err));

api.on('close', (code) => {
  console.log(`[API] Exited with code ${code}`);
});

web.on('close', (code) => {
  console.log(`[WEB] Exited with code ${code}`);
  process.exit(code || 0);
});

function shutdown() {
  console.log('[Runner] Shutting down processes...');
  try { api.kill('SIGTERM'); } catch {}
  try { web.kill('SIGTERM'); } catch {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Keep event loop alive
setInterval(() => {}, 60000);
