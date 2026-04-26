const Surat = require('../models/Surat');
const { generateHash, generateQRCode } = require('../utils/generateQR');
const generatePDF = require('../utils/generatePDF');
const generateSuratHTML = require('../templates/suratTemplate');
const path = require('path');
const fs = require('fs');

// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Controller: Membuat surat
exports.createSurat = async (req, res) => {
  try {
    const { nama, nik, jenisSurat, alamat, keperluan } = req.body;
    
    // 1. Generate unique ID (gunakan timestamp + random)
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    
    // 2. Simpan ke database dulu untuk mendapatkan data lengkap
    const suratData = {
      nama,
      nik,
      jenisSurat,
      alamat,
      keperluan,
      uniqueId,
      verified: false
    };
    
    // 3. Generate hash dari data
    const hash = generateHash(suratData);
    suratData.hash = hash;
    
    // 4. Generate QR Code
    const baseUrl = process.env.BASE_URL;
    const qrResult = await generateQRCode(uniqueId, baseUrl);
    suratData.qrCode = qrResult.webPath;
    
    // 5. Simpan ke MongoDB
    const surat = new Surat(suratData);
    await surat.save();
    
    // 6. Generate HTML dengan path QR yang benar
    const htmlContent = generateSuratHTML({
      nama,
      nik,
      jenisSurat,
      alamat,
      keperluan,
      uniqueId,
      hash,
      qrCodePath: `http://localhost:3000${qrResult.webPath}` // URL absolut untuk PDF
    });
    
    // 7. Generate PDF
    const pdfPath = path.join(__dirname, '../../public/uploads', `${uniqueId}.pdf`);
    await generatePDF(htmlContent, pdfPath);
    
    // 8. Response success
    res.status(201).json({
      success: true,
      message: 'Surat berhasil dibuat',
      data: {
        id: uniqueId,
        pdfUrl: `/public/uploads/${uniqueId}.pdf`,
        qrUrl: qrResult.webPath,
        hash: hash
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat surat',
      error: error.message
    });
  }
};

// Controller: Verifikasi surat
exports.verifySurat = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID tidak ditemukan'
      });
    }
    
    // Cari surat di database
    const surat = await Surat.findOne({ uniqueId: id });
    
    if (!surat) {
      return res.status(404).json({
        success: false,
        message: 'TIDAK VALID',
        valid: false,
        reason: 'Surat tidak ditemukan dalam database'
      });
    }
    
    // Re-generate hash untuk verifikasi (cek keaslian)
    const currentHash = generateHash({
      nama: surat.nama,
      nik: surat.nik,
      jenisSurat: surat.jenisSurat,
      alamat: surat.alamat,
      keperluan: surat.keperluan,
      uniqueId: surat.uniqueId
    });
    
    const isValid = (currentHash === surat.hash);
    
    if (!isValid) {
      return res.json({
        success: false,
        message: 'TIDAK VALID',
        valid: false,
        reason: 'Data surat telah dimanipulasi'
      });
    }
    
    // Update status verifikasi
    surat.verified = true;
    await surat.save();
    
    // Return data valid
    res.json({
      success: true,
      message: 'VALID',
      valid: true,
      data: {
        nama: surat.nama,
        nik: surat.nik,
        jenisSurat: surat.jenisSurat,
        createdAt: surat.createdAt,
        verifiedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan verifikasi',
      error: error.message
    });
  }
};