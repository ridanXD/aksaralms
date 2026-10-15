const { spawn } = require('child_process');

console.log('[Runner] Starting Aksara LMS (API on :8080 + Web on :3000)...');

function runProcess(name, command, args, customEnv) {
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...customEnv },
  });

  proc.on('error', (err) => {
    console.error(`[${name}] Error:`, err);
  });

  proc.on('close', (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });

  return proc;
}

const api = runProcess('API', 'npm', ['run', 'start:api'], {
  PORT: process.env.API_PORT || '8080',
});

const web = runProcess('WEB', 'npm', ['run', 'start:web'], {
  PORT: process.env.WEB_PORT || '3000',
  HOSTNAME: '0.0.0.0',
});

function shutdown() {
  console.log('[Runner] Shutting down processes...');
  try { api.kill('SIGTERM'); } catch {}
  try { web.kill('SIGTERM'); } catch {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
