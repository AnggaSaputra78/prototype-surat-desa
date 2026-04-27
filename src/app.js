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
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ============ KONEKSI MONGODB ============
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/suratDB';

console.log('═══════════════════════════════════════════════════════════');
console.log('🔄 Menghubungkan ke MongoDB...');
console.log(`📡 URL: ${MONGODB_URI}`);
console.log('═══════════════════════════════════════════════════════════');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📁 Database Name: ${mongoose.connection.name}`);
    console.log(`🔌 Host: ${mongoose.connection.host}`);
    console.log(`📊 Port: ${mongoose.connection.port}`);
    console.log('═══════════════════════════════════════════════════════════');
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('\n📌 Solusi: Jalankan mongod --dbpath C:\\data\\db');
    console.log('═══════════════════════════════════════════════════════════');
  });

mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose terhubung ke MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

// ============ ROUTES API ============
app.use('/api', suratRoutes);

// ============ HALAMAN UTAMA - DASHBOARD ============
// Ini yang paling penting - arahkan root ke dashboard
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'index.html');
  console.log('📄 Mencari file:', indexPath);
  console.log('📄 File exists:', fs.existsSync(indexPath));
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Mengirim file index.html ke browser');
    res.sendFile(indexPath);
  } else {
    console.log('❌ File index.html TIDAK DITEMUKAN!');
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error - File Tidak Ditemukan</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ File Tidak Ditemukan</h1>
        <p>File <strong>index.html</strong> tidak ditemukan di folder <strong>src/views/</strong></p>
        <p>Silakan buat file tersebut terlebih dahulu.</p>
        <p>Path yang dicari: ${indexPath}</p>
      </body>
      </html>
    `);
  }
});

// ============ HALAMAN VERIFIKASI ============
app.get('/verify', (req, res) => {
  const id = req.query.id;
  console.log('🔍 Verifikasi diakses dengan ID:', id);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Verifikasi Surat - SIPVMS</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com/3.4.17"></script>
        <style>
            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #0EA5E9;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen">
        <div class="container mx-auto px-4 py-16">
            <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div id="loading" class="p-12 text-center">
                    <div class="spinner"></div>
                    <p class="mt-4 text-gray-600">Memverifikasi surat...</p>
                </div>
                <div id="result" class="hidden"></div>
            </div>
            <div class="text-center mt-8">
                <a href="/" class="inline-block px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">← Kembali ke Dashboard</a>
            </div>
        </div>
        <script>
            const id = '${id || ''}';
            if (!id) {
                showError('ID Surat tidak ditemukan');
            } else {
                fetch('/api/surat/verify?id=' + id)
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('loading').classList.add('hidden');
                        if (data.valid === true) {
                            showValid(data.data);
                        } else if (data.message === 'BELUM DIVALIDASI') {
                            showPending();
                        } else {
                            showInvalid(data.reason);
                        }
                    })
                    .catch(err => showError('Gagal terhubung ke server'));
            }
            
            function showValid(data) {
                document.getElementById('result').innerHTML = \`
                    <div class="bg-green-500 p-6 text-white text-center">
                        <h2 class="text-3xl font-bold">✅ SURAT VALID</h2>
                        <p>Surat ini ASLI dan telah diverifikasi</p>
                    </div>
                    <div class="p-6">
                        <div class="space-y-3">
                            <div class="border-b pb-2"><strong>Nomor Surat:</strong> \${data.nomor_surat || '-'}</div>
                            <div class="border-b pb-2"><strong>Jenis Surat:</strong> \${data.jenis_surat || '-'}</div>
                            <div class="border-b pb-2"><strong>Pemohon:</strong> \${data.nama_pemohon || '-'}</div>
                            <div class="border-b pb-2"><strong>Tanggal:</strong> \${data.tanggal_surat ? new Date(data.tanggal_surat).toLocaleDateString('id-ID') : '-'}</div>
                            <div><strong>Isi Surat:</strong><br><p class="mt-2 whitespace-pre-wrap">\${data.isi_surat || '-'}</p></div>
                        </div>
                    </div>
                \`;
                document.getElementById('result').classList.remove('hidden');
            }
            
            function showPending() {
                document.getElementById('result').innerHTML = \`
                    <div class="bg-yellow-500 p-6 text-white text-center">
                        <h2 class="text-3xl font-bold">⏳ BELUM DIVALIDASI</h2>
                        <p>Surat masih menunggu validasi</p>
                    </div>
                \`;
                document.getElementById('result').classList.remove('hidden');
            }
            
            function showInvalid(reason) {
                document.getElementById('result').innerHTML = \`
                    <div class="bg-red-500 p-6 text-white text-center">
                        <h2 class="text-3xl font-bold">❌ SURAT TIDAK VALID</h2>
                        <p>\${reason || 'Surat tidak ditemukan'}</p>
                    </div>
                \`;
                document.getElementById('result').classList.remove('hidden');
            }
            
            function showError(msg) {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('result').innerHTML = \`
                    <div class="bg-red-500 p-6 text-white text-center">
                        <h2 class="text-3xl font-bold">❌ ERROR</h2>
                        <p>\${msg}</p>
                    </div>
                \`;
                document.getElementById('result').classList.remove('hidden');
            }
        </script>
    </body>
    </html>
  `);
});

app.get('/verify-page/:id', (req, res) => {
  res.redirect(`/verify?id=${req.params.id}`);
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  console.log(`❌ 404 - Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.originalUrl
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: err.message
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   🚀 SIPVMS - Server Berhasil Dijalankan                           ║');
  console.log(`║   📍 URL: http://localhost:${PORT}                                   ║`);
  console.log(`║   📦 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Terhubung' : '❌ Tidak Terhubung'}                                    ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} sudah digunakan! Ganti PORT di file .env\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app;