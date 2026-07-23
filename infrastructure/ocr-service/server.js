const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/ocr', (req, res) => {
  const { base64Image } = req.body;
  if (!base64Image) return res.status(400).json({ error: 'no_image_data', text: '' });
  const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'invalid_data_uri', text: '' });
  const mime = match[1];
  const data = match[2];
  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/jpg': 'jpg' };
  const ext = extMap[mime] || 'png';
  const inputPath = '/tmp/ocr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext;
  fs.writeFileSync(inputPath, Buffer.from(data, 'base64'));
  execFile('tesseract', [inputPath, 'stdout', '-l', 'por', '--psm', '3'], { timeout: 30000 }, (err, stdout) => {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    if (err) return res.json({ error: err.message, text: '', engine: 'tesseract' });
    res.json({ text: stdout.trim(), engine: 'tesseract' });
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(3002, () => console.log('OCR service on :3002'));
