/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS KHUSUS   : DEV.JS (DATABASE ANGGOTA & FOTO)
   ========================================================================== */

// PENTING: Ganti dengan link publish TSV dari spreadsheet Biodata Anda
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
        let daftarTahunLahir = new Set();

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim();
            if (!barisBersih) continue;
            
            const kolom = barisBersih.split("\t");
            
            // HAPUS syarat batas kolom agar data warga yang isiannya kosong sebagian tetap masuk
            // if (kolom.length < 10) continue; 

            // INDEKS YANG BENAR BERDASARKAN SCREENSHOT SPREADSHEET ANDA:
            let nim = kolom[4] ? kolom[4].trim() : "-";          // Kolom E (Tempat Lahir) jadi NIM
            let nama = kolom[2] ? kolom[2].trim() : "-";         // Kolom C (Nama Lengkap)
            let tglLahirRaw = kolom[5] ? kolom[5].trim() : "";   // Kolom F (Tanggal Lahir)
            let linkFotoRaw = kolom[14] ? kolom[14].trim() : ""; // Kolom O (Upload Foto)
            
            if (!tglLahirRaw || tglLahirRaw === "-") continue;

            let thn = "Semua";
            let usia = "-";

            let partTgl = tglLahirRaw.split(/[\s/]+/);
            if (partTgl.length >= 3) {
                thn = partTgl[2].trim();
                if(thn.length === 2) thn = parseInt(thn, 10) < 30 ? "20" + thn : "19" + thn; 
                
                const tahunSekarang = new Date().getFullYear();
                usia = tahunSekarang - parseInt(thn, 10) + " Tahun";
            }

            dataAnggotaGlobal.push({ 
                nim: nim, 
                nama: nama, 
                tanggalLahir: tglLahirRaw, 
                tahun: thn, 
                usia: usia,
                foto: linkFotoRaw 
            });
            
            if (thn && thn !== "Semua") daftarTahunLahir.add(thn);
        }

        isiDropdownAdmin('filter-anggota-tahun', Array.from(daftarTahunLahir).sort());
        terapkanFilterAnggota();
    } catch (e) {
        console.error("Gagal memuat database anggota", e);
        const tBody = document.getElementById('data-tabel-anggota');
        if (tBody) tBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data dari database. Pastikan link TSV Google Sheets valid.</td></tr>`;
    }
}

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

    halAnggotaSaatIni = 1; 
    renderTabelAnggota();
}

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
        let urlFotoTampil = "images/mms.png"; 
        
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
