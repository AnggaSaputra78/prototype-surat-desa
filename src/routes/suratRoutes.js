const express = require('express');
const router = express.Router();
const { createSurat, verifySurat } = require('../controllers/suratController');

// Endpoint membuat surat
router.post('/surat/create', createSurat);

// Endpoint verifikasi (via API)
router.get('/surat/verify', verifySurat);

// Endpoint untuk halaman verifikasi (HTML)
router.get('/verify-page/:id', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Verifikasi Surat</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
            }
            .valid {
                color: #10b981;
                font-size: 48px;
            }
            .invalid {
                color: #ef4444;
                font-size: 48px;
            }
            .loading {
                color: #6b7280;
            }
            button {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            }
            .data {
                text-align: left;
                margin-top: 20px;
                padding: 20px;
                background: #f3f4f6;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div id="status">
                <div class="loading">🔍 Memverifikasi surat...</div>
            </div>
            <button onclick="window.location.href='/'">Kembali ke Beranda</button>
        </div>
        
        <script>
            const id = window.location.pathname.split('/').pop();
            
            fetch('/api/surat/verify?id=' + id)
                .then(res => res.json())
                .then(data => {
                    const statusDiv = document.getElementById('status');
                    
                    if (data.valid) {
                        statusDiv.innerHTML = \`
                            <div class="valid">✅ VALID</div>
                            <p>Surat ini asli dan terdaftar secara resmi.</p>
                            <div class="data">
                                <strong>Nama:</strong> \${data.data.nama}<br>
                                <strong>NIK:</strong> \${data.data.nik}<br>
                                <strong>Jenis Surat:</strong> \${data.data.jenisSurat}<br>
                                <strong>Dibuat pada:</strong> \${new Date(data.data.createdAt).toLocaleDateString('id-ID')}
                            </div>
                        \`;
                    } else {
                        statusDiv.innerHTML = \`
                            <div class="invalid">❌ TIDAK VALID</div>
                            <p>\${data.reason || 'Surat ini tidak terdaftar atau telah dimanipulasi'}</p>
                        \`;
                    }
                })
                .catch(err => {
                    document.getElementById('status').innerHTML = \`
                        <div class="invalid">❌ ERROR</div>
                        <p>Gagal memverifikasi surat</p>
                    \`;
                });
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

module.exports = router;