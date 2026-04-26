const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const suratRoutes = require('./routes/suratRoutes');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Koneksi ke MongoDB (opsional - jika pakai MongoDB)
// Koment jika tidak pakai MongoDB
/*
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/suratDB')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));
*/

// Routes API
app.use('/api', suratRoutes);

// Halaman verifikasi QR Code
app.get('/verify', (req, res) => {
  const verifyPath = path.join(__dirname, 'views', 'verify.html');
  if (fs.existsSync(verifyPath)) {
    res.sendFile(verifyPath);
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head><title>404 - Halaman Tidak Ditemukan</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Halaman Verifikasi Tidak Ditemukan</h1>
        <p>File verify.html tidak ditemukan. Silakan buat file tersebut di folder src/views/</p>
        <a href="/">Kembali ke Beranda</a>
      </body>
      </html>
    `);
  }
});

app.get('/verify-page/:id', (req, res) => {
  res.redirect(`/verify?id=${req.params.id}`);
});

// ✅ HOMEPAGE - kirim file HTML dengan error handling
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SIPVMS - Setup Required</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .container { background: white; color: #333; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 SIPVMS - Setup Required</h1>
          <p>File <strong>index.html</strong> tidak ditemukan di folder <strong>src/views/</strong></p>
          <p>Silakan buat file tersebut dengan kode yang sudah disediakan.</p>
          <button onclick="window.location.href='/api/surat/create-test'">Buat Data Demo</button>
        </div>
      </body>
      </html>
    `);
  }
});

// Endpoint untuk membuat data demo (jika belum ada data)
app.post('/api/surat/create-test', (req, res) => {
  res.json({
    success: true,
    message: 'Silakan buat surat melalui form di halaman utama setelah file index.html tersedia',
    instructions: 'Buat file src/views/index.html dengan kode yang sudah disediakan'
  });
});

// Error handling untuk route yang tidak ditemukan (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.originalUrl
  });
});

// Error handling global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: err.message
  });
});

// Error handling untuk port already in use
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 SIPVMS - Server Berhasil Dijalankan                 ║
║                                                          ║
║   📍 URL Aplikasi: http://localhost:${PORT}                ║
║   📍 Halaman Utama: http://localhost:${PORT}/              ║
║   📍 Verifikasi: http://localhost:${PORT}/verify?id=1      ║
║                                                          ║
║   💾 Data tersimpan di LocalStorage Browser              ║
║   🔑 Login: username & password apapun                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ❌ ERROR: Port ${PORT} sudah digunakan!                   ║
║                                                          ║
║   📌 SOLUSI:                                             ║
║   1. Ganti PORT di file .env (contoh: PORT=3002)        ║
║   2. Matikan program yang menggunakan port ${PORT}         ║
║   3. Restart komputer Anda                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app;