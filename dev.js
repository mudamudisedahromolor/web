/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS KHUSUS   : DEV.JS (DATABASE ANGGOTA & FOTO & POPUP)
   ========================================================================== */

const linkTsvAnggota = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR45-ysPdK4uVibwJQbXKvaGGA2zlX3m2GnAS2392fiSDwENSz9ABffImneI-u4ZGmErvHbdM5RJoDi/pub?gid=992968433&single=true&output=tsv";

let dataAnggotaGlobal = [];
let dataAnggotaTersaring = [];
let halAnggotaSaatIni = 1;
const barisAnggotaPerHal = 7; 

document.addEventListener("DOMContentLoaded", function() {
    if (typeof initNavigasiMobile === 'function') initNavigasiMobile();
    loadAnggotaDariDrive();
});

async function loadAnggotaDariDrive() {
    try {
        const response = await fetch(`${linkTsvAnggota}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        const baris = teksData.split("\n");
        
        dataAnggotaGlobal = [];

        // Mulai baca dari baris ke-2 (melewati header)
        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim();
            if (!barisBersih) continue;
            
            const kolom = barisBersih.split("\t");
            
            let nama = kolom[2] ? kolom[2].trim() : "-";         
            let nim = kolom[4] ? kolom[4].trim() : "-";          
            let tglLahirRaw = kolom[6] ? kolom[6].trim() : "";   
            let usiaDariSheet = kolom[7] ? kolom[7].trim() : ""; // Backup dari kolom H
            let linkFotoRaw = kolom[13] ? kolom[13].trim() : ""; 
            
            let thn = 0;
            let usiaTeks = "-";

            // Ekstrak 4 Digit Tahun Langsung dari Teks Tanggal
            let cariTahun = tglLahirRaw.match(/\b(19\d{2}|20\d{2})\b/);
            
            if (cariTahun) {
                thn = parseInt(cariTahun[0], 10);
            }

            // Hitung Usia 
            if (thn > 0) {
                usiaTeks = (new Date().getFullYear() - thn) + " Tahun";
            } else if (usiaDariSheet && !isNaN(parseInt(usiaDariSheet, 10))) {
                usiaTeks = usiaDariSheet + " Tahun";
                thn = new Date().getFullYear() - parseInt(usiaDariSheet, 10); 
            }

            // Hanya masukkan ke tabel jika ada informasi tahun/usianya
            if (thn > 0) {
                dataAnggotaGlobal.push({ 
                    nim: nim, 
                    nama: nama, 
                    tahunLahirInt: thn, 
                    usia: usiaTeks,
                    foto: linkFotoRaw 
                });
            }
        }

        terapkanFilterAnggota();
    } catch (e) {
        console.error("Gagal memuat database anggota", e);
        const tBody = document.getElementById('data-tabel-anggota');
        if (tBody) tBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Gagal memuat data dari database.</td></tr>`;
    }
}

// Logika Filter (Hanya Berdasarkan Kolom Pencarian Nama / NIM)
window.terapkanFilterAnggota = function() {
    const cariInput = document.getElementById('input-cari-anggota');
    if(!cariInput) return
