import tls from 'node:tls';

const domains = (process.env.CERT_DOMAINS || 'api.gxkjy.com,admin.gxkjy.com,cert.gxkjy.com')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function getCertificate(domain) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        timeout: 10000,
      },
      () => {
        const certificate = socket.getPeerCertificate();
        socket.end();
        resolve(certificate);
      },
    );

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('connection timeout'));
    });
    socket.on('error', reject);
  });
}

let failed = false;
for (const domain of domains) {
  try {
    const certificate = await getCertificate(domain);
    const expiresAt = new Date(certificate.valid_to);
    const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86400000);
    console.log(`${domain} expires at ${expiresAt.toISOString()} (${daysLeft} days left)`);
    if (daysLeft < 15) failed = true;
  } catch (error) {
    failed = true;
    console.error(`${domain} check failed: ${error.message}`);
  }
}

if (failed) process.exit(1);
