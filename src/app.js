const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
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
    console.log('═══════════════════════════════════════════════════════════');
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// ============ MODEL SURAT ============
const suratSchema = new mongoose.Schema({
  nomor_surat: { type: String, required: true },
  jenis_surat: { type: String, required: true },
  nama_pemohon: { type: String, required: true },
  tanggal_surat: { type: Date, required: true },
  isi_surat: { type: String, required: true },
  status_validasi: { type: String, enum: ['Pending', 'Valid', 'Rejected'], default: 'Pending' },
  catatan_validasi: { type: String, default: '' },
  tanggal_validasi: { type: Date },
  validator_name: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

const Surat = mongoose.model('Surat', suratSchema);

// ============ ROUTES API ============

// GET ALL SURAT
app.get('/api/surat/all', async (req, res) => {
  try {
    const surat = await Surat.find().sort({ created_at: -1 });
    console.log(`📋 Mengambil ${surat.length} surat dari database`);
    res.json({ success: true, data: surat });
  } catch (error) {
    console.error('Error mengambil surat:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE SURAT
app.post('/api/surat/create', async (req, res) => {
  try {
    const { nomor_surat, jenis_surat, nama_pemohon, tanggal_surat, isi_surat } = req.body;
    
    const newSurat = new Surat({
      nomor_surat,
      jenis_surat,
      nama_pemohon,
      tanggal_surat,
      isi_surat,
      status_validasi: 'Pending'
    });
    
    const savedSurat = await newSurat.save();
    console.log('✅ Surat berhasil dibuat:', savedSurat._id);
    res.json({ success: true, data: savedSurat });
  } catch (error) {
    console.error('Error membuat surat:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 PERBAIKAN UTAMA - UPDATE SURAT (Menggunakan PUT)
app.put('/api/surat/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Update surat ID:', id);
    console.log('📦 Data update:', req.body);
    
    // Validasi ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ ID tidak valid:', id);
      return res.status(400).json({ success: false, message: 'ID surat tidak valid' });
    }
    
    // Cari surat berdasarkan ID
    const surat = await Surat.findById(id);
    
    if (!surat) {
      console.log('❌ Surat tidak ditemukan dengan ID:', id);
      return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' });
    }
    
    // Update data
    const updateData = {};
    if (req.body.nomor_surat !== undefined) updateData.nomor_surat = req.body.nomor_surat;
    if (req.body.jenis_surat !== undefined) updateData.jenis_surat = req.body.jenis_surat;
    if (req.body.nama_pemohon !== undefined) updateData.nama_pemohon = req.body.nama_pemohon;
    if (req.body.tanggal_surat !== undefined) updateData.tanggal_surat = req.body.tanggal_surat;
    if (req.body.isi_surat !== undefined) updateData.isi_surat = req.body.isi_surat;
    if (req.body.status_validasi !== undefined) updateData.status_validasi = req.body.status_validasi;
    if (req.body.catatan_validasi !== undefined) updateData.catatan_validasi = req.body.catatan_validasi;
    if (req.body.tanggal_validasi !== undefined) updateData.tanggal_validasi = req.body.tanggal_validasi;
    if (req.body.validator_name !== undefined) updateData.validator_name = req.body.validator_name;
    
    const updatedSurat = await Surat.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('✅ Surat berhasil diupdate. Status baru:', updatedSurat.status_validasi);
    res.json({ success: true, data: updatedSurat });
    
  } catch (error) {
    console.error('Error update surat:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE SURAT
app.delete('/api/surat/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID surat tidak valid' });
    }
    
    const deletedSurat = await Surat.findByIdAndDelete(id);
    
    if (!deletedSurat) {
      return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' });
    }
    
    console.log('🗑️ Surat berhasil dihapus:', id);
    res.json({ success: true, message: 'Surat berhasil dihapus' });
    
  } catch (error) {
    console.error('Error delete surat:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// VERIFY SURAT (untuk QR Code)
app.get('/api/surat/verify', async (req, res) => {
  try {
    const { id } = req.query;
    console.log('🔍 Verifikasi surat dengan ID:', id);
    
    if (!id) {
      return res.json({ success: false, valid: false, message: 'ID tidak ditemukan' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, valid: false, message: 'ID tidak valid' });
    }
    
    const surat = await Surat.findById(id);
    
    if (!surat) {
      return res.json({ success: false, valid: false, message: 'TIDAK VALID', reason: 'Surat tidak ditemukan' });
    }
    
    if (surat.status_validasi === 'Valid') {
      return res.json({ 
        success: true, 
        valid: true, 
        data: {
          _id: surat._id,
          nomor_surat: surat.nomor_surat,
          jenis_surat: surat.jenis_surat,
          nama_pemohon: surat.nama_pemohon,
          tanggal_surat: surat.tanggal_surat,
          isi_surat: surat.isi_surat,
          status_validasi: surat.status_validasi,
          validator_name: surat.validator_name,
          tanggal_validasi: surat.tanggal_validasi
        }
      });
    } else if (surat.status_validasi === 'Pending') {
      return res.json({ 
        success: true, 
        valid: false, 
        message: 'BELUM DIVALIDASI',
        data: surat
      });
    } else if (surat.status_validasi === 'Rejected') {
      return res.json({ 
        success: true, 
        valid: false, 
        message: 'DITOLAK',
        data: surat
      });
    }
    
  } catch (error) {
    console.error('Error verifikasi:', error);
    res.status(500).json({ success: false, valid: false, message: error.message });
  }
});

// ============ HALAMAN UTAMA ============
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'views', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>SIPVMS</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>🗂️ SIPVMS - Sistem Surat Desa</h1>
        <p>File index.html tidak ditemukan. Pastikan file berada di folder <strong>src/views/</strong></p>
        <p>API Server berjalan di port 3001</p>
      </body>
      </html>
    `);
  }
});

// HALAMAN VERIFIKASI
app.get('/verify', (req, res) => {
  const verifyPath = path.join(__dirname, 'views', 'verify.html');
  if (fs.existsSync(verifyPath)) {
    res.sendFile(verifyPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Verifikasi Surat</title></head>
      <body>
        <h1>Verifikasi Surat</h1>
        <p>Halaman verifikasi tidak ditemukan.</p>
      </body>
      </html>
    `);
  }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   🚀 SIPVMS - Server Berhasil Dijalankan                           ║');
  console.log(`║   📍 URL: http://localhost:${PORT}                                   ║`);
  console.log(`║   📦 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Terhubung' : '❌ Tidak Terhubung'}                                    ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
});