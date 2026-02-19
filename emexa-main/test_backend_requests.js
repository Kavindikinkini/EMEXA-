(async () => {
  const base = 'http://localhost:5000/api';
  try {
    console.log('POST /api/users -> create user');
    let res = await fetch(`${base}/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Test User', email: `e2e+${Date.now()}@example.com`, password: 'secret' }),
    });
    console.log('POST status', res.status);
    const postBody = await res.text();
    try { console.log('POST body', JSON.parse(postBody)); } catch { console.log('POST body (raw)', postBody); }

    console.log('\nGET /api/users -> list users (with Authorization header)');
    res = await fetch(`${base}/users`, { headers: { authorization: 'Bearer dummy-token' } });
    console.log('GET status', res.status);
    const getBody = await res.text();
    try { console.log('GET body', JSON.parse(getBody)); } catch { console.log('GET body (raw)', getBody); }
  } catch (err) {
    console.error('Request error', err);
    process.exit(1);
  }
})();
