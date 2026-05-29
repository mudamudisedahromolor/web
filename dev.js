/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS KHUSUS   : DEV.JS (DATABASE ANGGOTA & FOTO)
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

            // 1. Ekstrak 4 Digit Tahun Langsung dari Teks Tanggal (Paling Aman)
            let cariTahun = tglLahirRaw.match(/\b(19\d{2}|20\d{2})\b/);
            
            if (cariTahun) {
                thn = parseInt(cariTahun[0], 10);
            }

            // 2. Hitung Usia (Jika gagal ekstrak, pakai kolom Usia bawaan spreadsheet)
            if (thn > 0) {
                usiaTeks = (new Date().getFullYear() - thn) + " Tahun";
            } else if (usiaDariSheet && !isNaN(parseInt(usiaDariSheet, 10))) {
                usiaTeks = usiaDariSheet + " Tahun";
                thn = new Date().getFullYear() - parseInt(usiaDariSheet, 10); // Hitung mundur tahunnya
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
    if(!cariInput) return;

    const cari = cariInput.value.toLowerCase();

    dataAnggotaTersaring = dataAnggotaGlobal.filter(item => {
        return item.nama.toLowerCase().includes(cari) || item.nim.toLowerCase().includes(cari);
    });

    halAnggotaSaatIni = 1; 
    renderTabelAnggota();
}

function renderTabelAnggota() {
    const tbody = document.getElementById('data-tabel-anggota');
    if (!tbody) return;

    if (dataAnggotaTersaring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#666;"><strong>Data anggota tidak ditemukan.</strong></td></tr>`;
        return;
    }

    const start = (halAnggotaSaatIni - 1) * barisAnggotaPerHal;
    const dataPerHalaman = dataAnggotaTersaring.slice(start, start + barisAnggotaPerHal);
    
  
   
   let html = dataPerHalaman.map(i => {
        // DEFAULT FOTO: Avatar Inisial Nama
        let linkDefaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(i.nama)}&background=E53935&color=fff&size=150&bold=true`;
        let urlFotoTampil = linkDefaultAvatar; 
        
        // LOGIKA PENARIKAN FOTO ANTI-BLOKIR GOOGLE DRIVE
        if (i.foto && i.foto !== "" && i.foto !== "-") {
            let idFile = "";
            if (i.foto.includes("id=")) {
                idFile = i.foto.split("id=")[1].split("&")[0];
            } else if (i.foto.includes("/d/")) {
                idFile = i.foto.split("/d/")[1].split("/")[0];
            }
            
            if (idFile !== "") {
                // Menggunakan server thumbnail resmi Google (Dijamin muncul dan load lebih cepat)
                urlFotoTampil = `https://drive.google.com/thumbnail?id=${idFile}&sz=w400`;
            } else if (i.foto.startsWith("http")) {
                urlFotoTampil = i.foto;
            }
        }


      

        // Klasifikasi Generasi Sesuai Standard Internasional
        let generasi = "-";
        if (i.tahunLahirInt <= 1964) {
            generasi = '<span style="background-color: #5D4037; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Baby Boomer</span>';
        } else if (i.tahunLahirInt >= 1965 && i.tahunLahirInt <= 1980) {
            generasi = '<span style="background-color: #7B1FA2; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Gen X</span>';
        } else if (i.tahunLahirInt >= 1981 && i.tahunLahirInt <= 1996) {
            generasi = '<span style="background-color: #0288D1; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Millennial</span>';
        } else if (i.tahunLahirInt >= 1997 && i.tahunLahirInt <= 2012) {
            generasi = '<span style="background-color: #388E3C; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Gen Z</span>';
        } else if (i.tahunLahirInt >= 2013 && i.tahunLahirInt <= 2024) {
            generasi = '<span style="background-color: #F57C00; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Gen Alpha</span>';
        } else if (i.tahunLahirInt >= 2025) {
            generasi = '<span style="background-color: #D32F2F; color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; min-width: 85px; text-align: center;">Gen Beta</span>';
        }

                    <td style="padding: 10px 0;">
                    <img src="${urlFotoTampil}" alt="Foto ${i.nama}" 
                         style="width: 75px; height: 75px; object-fit: cover; border-radius: 50%; border: 3px solid #E53935; box-shadow: 0 4px 8px rgba(0,0,0,0.15); background-color: #fafafa; display: block; margin: 0 auto; cursor: pointer;" 
                         onerror="this.src='${linkDefaultAvatar}'"
                         onclick="bukaFotoFull('${urlFotoFull}')">
                </td>
                
                <td><span class="badge-usia" style="font-size: 13px; font-weight: 600; padding: 4px 10px;">${i.usia}</span></td>
                <td>${generasi}</td>
            </tr>
        `;
    }).join('');

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

window.navAnggota = (arah) => { 
    halAnggotaSaatIni += arah; 
    renderTabelAnggota(); 
    setTimeout(() => { document.querySelector('.finance-table').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
};

        // DEFAULT FOTO: Avatar Inisial Nama
        let linkDefaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(i.nama)}&background=E53935&color=fff&size=150&bold=true`;
        let urlFotoTampil = linkDefaultAvatar; 
        let urlFotoFull = linkDefaultAvatar; // <-- Siapkan link foto HD
        
        // LOGIKA PENARIKAN FOTO ANTI-BLOKIR
        if (i.foto && i.foto !== "" && i.foto !== "-") {
            let idFile = "";
            if (i.foto.includes("id=")) {
                idFile = i.foto.split("id=")[1].split("&")[0];
            } else if (i.foto.includes("/d/")) {
                idFile = i.foto.split("/d/")[1].split("/")[0];
            }
            
            if (idFile !== "") {
                urlFotoTampil = `https://drive.google.com/thumbnail?id=${idFile}&sz=w400`;
                urlFotoFull = `https://drive.google.com/thumbnail?id=${idFile}&sz=w1000`; // <-- Resolusi w1000 agar HD saat diklik
            } else if (i.foto.startsWith("http")) {
                urlFotoTampil = i.foto;
                urlFotoFull = i.foto;
            }
        }

        // Klasifikasi Generasi Sesuai Standard Internasional
        let generasi = "-";
        // ... (KODE GENERASI TETAP SAMA, BIARKAN SAJA) ...


// =========================================================
// FUNGSI KONTROL POPUP FOTO (LIGHTBOX)
// =========================================================
window.bukaFotoFull = function(url) {
    const modal = document.getElementById('modal-foto-full');
    const imgModal = document.getElementById('img-modal-tampil');
    if(modal && imgModal) {
        imgModal.src = url; // Masukkan foto kualitas tinggi
        modal.style.display = 'flex'; // Tampilkan layar gelap
    }
}

window.tutupFoto = function() {
    const modal = document.getElementById('modal-foto-full');
    if(modal) {
        modal.style.display = 'none'; // Sembunyikan layar gelap
    }
}
