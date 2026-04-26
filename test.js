// test.js
const axios = require('axios');

async function testCreateSurat() {
  try {
    const response = await axios.post('http://localhost:3000/api/surat/create', {
      nama: 'Ahmad Fauzi',
      nik: '3273010101900001',
      jenisSurat: 'SKTM',
      alamat: 'Jl. Merdeka No. 123, Jakarta',
      keperluan: 'Pengajuan beasiswa pendidikan'
    });
    
    console.log('✅ Surat berhasil dibuat!');
    console.log('📄 PDF URL:', response.data.data.pdfUrl);
    console.log('🔗 QR URL:', response.data.data.qrUrl);
    console.log('🔐 Hash:', response.data.data.hash);
    console.log('📱 Link verifikasi:', `http://localhost:3000/verify-page/${response.data.data.id}`);
    
  } catch (error) {
    console.error('❌ Gagal:', error.response?.data || error.message);
  }
}

testCreateSurat();