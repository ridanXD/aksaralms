const { spawn } = require('child_process');

console.log('[Runner] Starting Aksara LMS (API + Web)...');

function runProcess(name, command, args) {
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  proc.on('error', (err) => {
    console.error(`[${name}] Error:`, err);
  });

  proc.on('close', (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });

  return proc;
}

const api = runProcess('API', 'npm', ['run', 'start:api']);
const web = runProcess('WEB', 'npm', ['run', 'start:web']);

function shutdown() {
  console.log('[Runner] Shutting down processes...');
  try { api.kill('SIGTERM'); } catch {}
  try { web.kill('SIGTERM'); } catch {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
