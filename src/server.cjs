const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.PORT || 4000);
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'db.json');

if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/' || pathname === '/health') {
    sendJson(res, 200, { status: 'ok', message: 'JSON API is running' });
    return;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    sendJson(res, 404, { message: 'Not found' });
    return;
  }

  const collectionName = segments[0];
  const resourceId = segments[1];
  const collection = db[collectionName];

  if (!collection) {
    sendJson(res, 404, { message: `Collection not found: ${collectionName}` });
    return;
  }

  if (req.method === 'GET') {
    if (resourceId) {
      const item = collection.find((entry) => String(entry.id) === String(resourceId));
      if (!item) {
        sendJson(res, 404, { message: 'Item not found' });
        return;
      }
      sendJson(res, 200, item);
      return;
    }

    const query = Object.fromEntries(url.searchParams.entries());
    let items = [...collection];

    Object.entries(query).forEach(([key, value]) => {
      items = items.filter((item) => String(item[key]) === String(value));
    });

    sendJson(res, 200, items);
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const payload = body ? JSON.parse(body) : {};
      const newItem = {
        ...payload,
        id: payload.id || `${collectionName}-${Date.now()}`,
      };
      collection.push(newItem);
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      sendJson(res, 201, newItem);
    });
    return;
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!resourceId) {
      sendJson(res, 400, { message: 'Resource id is required' });
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const payload = body ? JSON.parse(body) : {};
      const index = collection.findIndex((entry) => String(entry.id) === String(resourceId));
      if (index === -1) {
        sendJson(res, 404, { message: 'Item not found' });
        return;
      }

      const updated = { ...collection[index], ...payload };
      collection[index] = updated;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      sendJson(res, 200, updated);
    });
    return;
  }

  if (req.method === 'DELETE') {
    if (!resourceId) {
      sendJson(res, 400, { message: 'Resource id is required' });
      return;
    }

    const index = collection.findIndex((entry) => String(entry.id) === String(resourceId));
    if (index === -1) {
      sendJson(res, 404, { message: 'Item not found' });
      return;
    }

    collection.splice(index, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    sendJson(res, 200, { success: true });
    return;
  }

  sendJson(res, 405, { message: 'Method not allowed' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`JSON API server running at http://localhost:${PORT}`);
});
