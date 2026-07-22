const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5678,
  path: '/rest/node-types?name=n8n-nodes-base.httpRequest&version=4.2',
  method: 'GET',
  headers: {
    'X-N8N-API-KEY': 'N8N_API_KEY_REMOVED'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const d = JSON.parse(data);
    const nodes = Array.isArray(d) ? d : [d];
    nodes.forEach(n => {
      console.log(`Node type: ${n.name}, version: ${n.version}`);
      (n.properties || []).forEach(p => {
        const name = p.name || '';
        if (name.includes('body') || name.includes('json') || name.includes('content') || name.includes('send')) {
          console.log(`  ${p.name}: type=${p.type} display="${p.displayName}"`);
        }
      });
    });
  });
});
req.end();
