const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.PORT || 4000);
const allowedOrigins = new Set([
  ' http://localhost:5173/',
  'http://localhost:5174',
  'attendence-status-cx54.vercel.app',
]);

const dbPath = path.join(__dirname, '..', 'db.json');

if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

let db;

try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (error) {
  console.error('Failed to read db.json:', error);
  process.exit(1);
}

function sendJson(req, res, statusCode, payload) {
  const body = JSON.stringify(payload);
  const origin = req.headers.origin;
  const corsHeaders = {
    'Access-Control-Allow-Methods':
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization',
    'Vary': 'Origin',
  };

  if (origin && allowedOrigins.has(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...corsHeaders,
    'Cache-Control': 'no-store',
  });

  res.end(body);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.has(origin)) {
    sendJson(req, res, 403, {
      message: 'Origin not allowed',
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods':
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization',
      'Vary': 'Origin',
    });

    res.end();
    return;
  }

  const url = new URL(
    req.url || '/',
    `http://${req.headers.host || 'localhost'}`
  );

  const pathname = url.pathname;

  if (pathname === '/' || pathname === '/health') {
    sendJson(req, res, 200, {
      status: 'ok',
      message: 'JSON API is running',
    });
    return;
  }

  const segments = pathname.split('/').filter(Boolean);

  const collectionName = segments[0];
  const resourceId = segments[1];

  const collection = db[collectionName];

  if (!collection || !Array.isArray(collection)) {
    sendJson(req, res, 404, {
      message: `Collection not found: ${collectionName}`,
    });
    return;
  }

  if (req.method === 'GET') {
    if (resourceId) {
      const item = collection.find(
        (entry) => String(entry.id) === String(resourceId)
      );

      if (!item) {
        sendJson(req, res, 404, {
          message: 'Item not found',
        });
        return;
      }

      sendJson(req, res, 200, item);
      return;
    }

    const query = Object.fromEntries(
      url.searchParams.entries()
    );

    let items = [...collection];

    Object.entries(query).forEach(([key, value]) => {
      items = items.filter(
        (item) => String(item[key]) === String(value)
      );
    });

    sendJson(req, res, 200, items);
    return;
  }

  if (req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};

        const newItem = {
          ...payload,
          id: payload.id || `${collectionName}-${Date.now()}`,
        };

        collection.push(newItem);

        fs.writeFileSync(
          dbPath,
          JSON.stringify(db, null, 2)
        );

        sendJson(req, res, 201, newItem);
      } catch {
        sendJson(req, res, 400, {
          message: 'Invalid JSON body',
        });
      }
    });

    return;
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!resourceId) {
      sendJson(req, res, 400, {
        message: 'Resource id is required',
      });
      return;
    }

    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};

        const index = collection.findIndex(
          (entry) =>
            String(entry.id) === String(resourceId)
        );

        if (index === -1) {
          sendJson(req, res, 404, {
            message: 'Item not found',
          });
          return;
        }

        const updated = {
          ...collection[index],
          ...payload,
        };

        collection[index] = updated;

        fs.writeFileSync(
          dbPath,
          JSON.stringify(db, null, 2)
        );

        sendJson(req, res, 200, updated);
      } catch {
        sendJson(req, res, 400, {
          message: 'Invalid JSON body',
        });
      }
    });

    return;
  }

  if (req.method === 'DELETE') {
    if (!resourceId) {
      sendJson(req, res, 400, {
        message: 'Resource id is required',
      });
      return;
    }

    const index = collection.findIndex(
      (entry) =>
        String(entry.id) === String(resourceId)
    );

    if (index === -1) {
      sendJson(req, res, 404, {
        message: 'Item not found',
      });
      return;
    }

    collection.splice(index, 1);

    fs.writeFileSync(
      dbPath,
      JSON.stringify(db, null, 2)
    );

    sendJson(req, res, 200, {
      success: true,
      message: 'Item deleted successfully',
    });

    return;
  }

  sendJson(req, res, 405, {
    message: 'Method not allowed',
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`JSON API server running on port ${PORT}`);
});