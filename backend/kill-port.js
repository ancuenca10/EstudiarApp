// kill-port.js
const { exec } = require('child_process');
const os = require('os');

const port = 3000;

if (os.platform() === 'win32') {
  // Windows
  exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
    if (stdout) {
      const lines = stdout.split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          exec(`taskkill /PID ${pid} /F`, (err) => {
            if (err) console.error('Error killing process:', err);
            else console.log(`Killed process ${pid} using port ${port}`);
          });
        }
      });
    }
  });
} else {
  // macOS/Linux
  exec(`lsof -ti:${port}`, (err, stdout) => {
    if (stdout) {
      const pids = stdout.trim().split('\n');
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (err) => {
          if (err) console.error('Error killing process:', err);
          else console.log(`Killed process ${pid} using port ${port}`);
        });
      });
    }
  });
}