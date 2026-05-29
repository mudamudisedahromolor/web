/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS KHUSUS   : ADMIN.JS (DATABASE ANGGOTA & HITUNG USIA OTOMATIS)
   ========================================================================== */

// PENTING: Ganti dengan link publish TSV dari spreadsheet Biodata Anda
const linkTsvAnggota = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTn31ZnEFDoTQXbcyeXC3sPgMVurwUNcpiC7Oz3pz2gFEnlv1e0K9Q8SjY6PVL1tIsdTg_uc9z9Rk31/pub?gid=1024012993&single=true&output=tsv";

let dataAnggotaGlobal = [];
let dataAnggotaTersaring = [];
let halAnggotaSaatIni = 1;
const barisAnggotaPerHal = 7; // Batas sesuai instruksi: 7 baris per halaman

document.addEventListener("DOMContentLoaded", function() {
    // Jalankan navigasi mobile jika ada fungsi global bawaan template Anda
    if (typeof initNavigasiMobile === 'function') initNavigasiMobile();
    
    // Tarik data biodata dari cloud
    loadAnggotaDariDrive();
});

// 1. Mengambil Data Anggota & Menghitung Usia Real-time
async function loadAnggotaDariDrive() {
    try {
        const response = await fetch(`${linkTsvAnggota}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        const baris = teksData.split("\n");
        
        dataAnggotaGlobal = [];
        let daftarTahunLahir = new Set();

        // Membaca dari baris indeks ke-1 (melewati header spreadsheet)
        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim();
            if (!barisBersih) continue;
            
            const kolom = barisBersih.split("\t");
            // DIUBAH: Batas minimal panjang kolom dinaikkan jika ada penambahan kolom foto di kanan
            if (kolom.length < 10) continue; 

            let nim = kolom[4] ? kolom[4].trim() : "-";          // Kolom E (Nomer) digunakan sebagai NIM/ID
            let nama = kolom[2] ? kolom[2].trim() : "-";         // Kolom C (Nama Lengkap)
            let tglLahirRaw = kolom[6] ? kolom[6].trim() : "";   // Kolom G (Tanggal Lahir)
            
            // 📍 DI SINI POSISI UNTUK MEMASUKKAN LINK FOTO DRIVE:
            // Jika kolom foto berada di paling kanan (misal kolom N), gunakan indeks [13].
            // Jika posisinya bergeser, silakan ganti angka 13 di bawah ini sesuai urutan indeks kolom Anda (A=0, B=1, dst.)
            let linkFotoRaw = kolom[14] ? kolom[14].trim() : ""; 
            
            if (!tglLahirRaw || tglLahirRaw === "-") continue;

            let thn = "Semua";
            let usia = "-";

            // Deteksi format tanggal menggunakan pemisah spasi atau garis miring
            let partTgl = tglLahirRaw.split(/[\s/]+/);
            if (partTgl.length >= 3) {
                thn = partTgl[2].trim();
                // Normalisasi jika tahun diinput 2 digit (misal: 97 menjadi 1997)
                if(thn.length === 2) thn = parseInt(thn, 10) < 30 ? "20" + thn : "19" + thn; 
                
                // Kalkulasi usia dinamis berdasarkan tahun berjalan saat ini
                const tahunSekarang = new Date().getFullYear();
                usia = tahunSekarang - parseInt(thn, 10) + " Tahun";
            }

            // DIUBAH: Menyisipkan properti `foto` ke dalam objek global anggota
            dataAnggotaGlobal.push({ 
                nim: nim, 
                nama: nama, 
                tanggalLahir: tglLahirRaw, 
                tahun: thn, 
                usia: usia,
                foto: linkFotoRaw // <- Data foto masuk ke sini
            });
            
            if (thn && thn !== "Semua") daftarTahunLahir.add(thn);
        }

        // Isi elemen dropdown filter tahun otomatis
        isiDropdownAdmin('filter-anggota-tahun', Array.from(daftarTahunLahir).sort());
        
        terapkanFilterAnggota();
    } catch (e) {
        console.error("Gagal memuat database anggota", e);
        const tBody = document.getElementById('data-tabel-anggota');
        if (tBody) tBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data dari database. Pastikan link TSV Google Sheets valid.</td></tr>`;
    }
}

// 2. Logika Saring Data Pencarian Real-time
window.terapkanFilterAnggota = function() {
    const thnInput = document.getElementById('filter-anggota-tahun');
    const cariInput = document.getElementById('input-cari-anggota');

    if(!thnInput || !cariInput) return;

    const thn = thnInput.value;
    const cari = cariInput.value.toLowerCase();

    dataAnggotaTersaring = dataAnggotaGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (item.nama.toLowerCase().includes(cari) || item.nim.toLowerCase().includes(cari));
    });

    halAnggotaSaatIni = 1; // Kembalikan fokus ke halaman 1 saat pencarian berubah
    renderTabelAnggota();
}

// 3. Render Baris ke Struktur Tabel HTML (Versi Foto Dominan & Besar)
function renderTabelAnggota() {
    const tbody = document.getElementById('data-tabel-anggota');
    if (!tbody) return;

    if (dataAnggotaTersaring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">Data anggota tidak ditemukan.</td></tr>`;
        return;
    }

    const start = (halAnggotaSaatIni - 1) * barisAnggotaPerHal;
    const dataPerHalaman = dataAnggotaTersaring.slice(start, start + barisAnggotaPerHal);
    
    let html = dataPerHalaman.map(i => {
        // 1. Logika Konversi URL Google Drive ke URL Gambar Terbuka
        let urlFotoTampil = "images/mms.png"; // Foto default logo MMS jika kosong
        
        if (i.foto && i.foto !== "" && i.foto !== "-") {
            if (i.foto.includes("id=")) {
                let idFile = i.foto.split("id=")[1].split("&")[0];
                urlFotoTampil = `https://docs.google.com/uc?export=view&id=${idFile}`;
            } else if (i.foto.includes("/d/")) {
                let idFile = i.foto.split("/d/")[1].split("/")[0];
                urlFotoTampil = `https://docs.google.com/uc?export=view&id=${idFile}`;
            } else if (i.foto.startsWith("http")) {
                urlFotoTampil = i.foto;
            }
        }

        // 2. Logika Penentu Generasi (Kelahiran Gen Z sesuai database MMS)
        let generasi = "-";
        const thnLahir = parseInt(i.tahun, 10);
        if (!isNaN(thnLahir)) {
            if (thnLahir >= 1981 && thnLahir <= 1996) {
                generasi = '<span style="background-color: #0277bd; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 80px; text-align: center;">Millennial</span>';
            } else if (thnLahir >= 1997 && thnLahir <= 2009) {
                generasi = '<span style="background-color: #2e7d32; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 80px; text-align: center;">Gen Z</span>';
            } else if (thnLahir >= 2010 && thnLahir <= 2024) {
                generasi = '<span style="background-color: #ef6c00; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 80px; text-align: center;">Gen Alpha</span>';
            }
        }

        // 3. Susun Baris Tabel dengan Ukuran Foto yang Paling Besar & Jelas
        return `
            <tr style="height: 90px; vertical-align: middle;"> 
                <td style="font-size: 14px;"><strong>${i.nim}</strong></td>
                
                <td style="padding: 8px 0;">
                    <img src="${urlFotoTampil}" alt="Foto ${i.nama}" style="width: 75px; height: 75px; object-fit: cover; border-radius: 50%; border: 3px solid #E53935; box-shadow: 0 4px 8px rgba(0,0,0,0.15); background-color: #fafafa; display: block; margin: 0 auto;">
                </td>
                
                <td style="text-align: left; padding-left: 20px; font-size: 15px; font-weight: 600; color: #333;">
                    <i class="fa-solid fa-user" style="color:#E53935; margin-right:8px; font-size: 13px;"></i> ${i.nama}
                </td>
                
                <td><span class="badge-usia" style="font-size: 13px; padding: 4px 10px;">${i.usia}</span></td>
                <td>${generasi}</td>
            </tr>
        `;
    }).join('');

    // Bagian Logika Navigasi Halaman (Pagination 7 baris)
    const totalHal = Math.ceil(dataAnggotaTersaring.length / barisAnggotaPerHal);
    if (totalHal > 1) {
        let tombolNav = "";
        const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;";
        
        if (halAnggotaSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="navAnggota(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halAnggotaSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="navAnggota(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navAnggota(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="navAnggota(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="5" style="padding:12px; background:#f9f9f9; border-top:1px solid #eee;">${tombolNav}</td></tr>`;
    }
    
    tbody.innerHTML = html;
}

// 4. Trigger Aksi Pindah Halaman Manual
window.navAnggota = (arah) => { 
    halAnggotaSaatIni += arah; 
    renderTabelAnggota(); 
    setTimeout(() => { document.querySelector('.finance-table').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
};

// 5. Fungsi Penunjang Isian Dropdown
function isiDropdownAdmin(id, dataArray) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="Semua">All Tahun</option>`;
    dataArray.forEach(item => {
        let opt = document.createElement("option");
        opt.value = item; 
        opt.text = item;
        el.appendChild(opt);
    });
}
