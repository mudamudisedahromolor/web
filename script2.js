function doGet() {
  return HtmlService.createHtmlOutputFromFile('FormUndangan')
      .setTitle('Panel Undangan Muda Mudi')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fungsi mengambil data Nama, WA, dan Email dari tab "Broadcast WA"
function ambilDataAnggota() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Pastikan nama tab sesuai dengan tab khusus broadcast yang kita buat sebelumnya
  const sheet = ss.getSheetByName("Broadcast WA"); 
  const data = sheet.getDataRange().getValues();
  
  let listAnggota = [];
  // Mulai dari indeks 1 (melewati baris judul/header)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // Jika nama tidak kosong
      listAnggota.push({
        nama: data[i][0],
        linkWa: data[i][1],
        email: data[i][2]
      });
    }
  }
  return listAnggota;
}

// Fungsi kirim email massal otomatis di latar belakang
function kirimEmailMassal(subjek, pesan, listEmail) {
  let jumlahTerkirim = 0;
  listEmail.forEach(function(email) {
    if (email && email.includes("@")) {
      try {
        MailApp.sendEmail({
          to: email,
          subject: subjek,
          htmlBody: pesan.replace(/\n/g, "<br>")
        });
        jumlahTerkirim++;
      } catch (e) {
        console.error("Gagal mengirim ke: " + email);
      }
    }
  });
  return jumlahTerkirim;
}
