/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS UTAMA    : SCRIPT.JS (LOGIKA INTERAKTIF & DATABASE REAL-TIME)
   ========================================================================== */

// Konstanta Global yang dipakai bersama oleh seluruh modul halaman (Keuangan, Rapat, Dokumentasi)
const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "December"];


/* ==========================================================================
   1. SISTEM NAVIGASI & MENU DROPDOWN MOBILE (HP)
   --------------------------------------------------------------------------
   Instruksi: Mengatur fungsi buka-tutup menu utama (gorden) serta sub-menu 
   tingkat 2 (Bulanan & Tahunan) agar berjalan responsif di layar handphone.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    
    // --- A. TOMBOL HAMBURGER (STRIP 3) ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navBar = document.querySelector('.main-navbar');
    
    if (menuBtn && navBar) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navBar.classList.toggle('aktif'); // Memicu class gorden muncul di CSS
        });
    }

    // --- B. TRIGGER DROPDOWN KEGIATAN (BULANAN) ---
    const btnBulanan = document.getElementById('btn-bulanan');
    const menuRapat = document.getElementById('menu-rapat');
    const menu17an = document.getElementById('menu-17an');

    if (btnBulanan && menuRapat) {
        btnBulanan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Tutup menu tahunan terlebih dahulu agar tidak bertumpuk di HP
            if (menu17an) menu17an.classList.remove('buka');
            menuRapat.classList.toggle('buka');
        });
    }

    // --- C. TRIGGER DROPDOWN KEGIATAN (TAHUNAN) ---
    const btnTahunan = document.getElementById('btn-tahunan');

    if (btnTahunan && menu17an) {
        btnTahunan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Tutup menu bulanan terlebih dahulu agar tidak bertumpuk di HP
            if (menuRapat) menuRapat.classList.remove('buka');
            menu17an.classList.toggle('buka');
        });
    }

    /* ==========================================================================
       2. CAROUSEL STRUKTUR ORGANISASI (SWIPER)
       --------------------------------------------------------------------------
       Instruksi: Mengaktifkan mode geser (swipe) interaktif kartu pengurus inti.
       Sistem hanya akan berjalan jika elemen '.mySwiper' terdeteksi di halaman.
       ========================================================================== */
    if (document.querySelector('.mySwiper') && typeof Swiper !== 'undefined') {
        new Swiper(".mySwiper", {
            slidesPerView: 1, 
            spaceBetween: 15,
            centeredSlides: true, 
            loop: true,
            initialSlide: 2, // Fokus awal card di browser langsung ke indeks 2 (Ketua)
            observer: true,
            observeParents: true,
            breakpoints: {
                768: { slidesPerView: 3, spaceBetween: 30 } // Tampilan otomatis melebar jadi 3 kolom di PC
            }
        });
    }

    /* ==========================================================================
       3. INISIALISASI PEMUATAN DATABASE OTOMATIS
       --------------------------------------------------------------------------
       Instruksi: Memicu fungsi fetch data database eksternal sesaat setelah 
       struktur halaman selesai dimuat sempurna oleh browser.
       ========================================================================== */
    // Jalankan mesin Kas Keuangan jika elemen tabel keuangan terdeteksi
    if (document.getElementById('data-tabel-keuangan')) {
        loadKeuanganDariDrive();
    }

    // Jalankan mesin Notulen Rapat jika elemen tabel rapat terdeteksi
    if (document.getElementById('data-tabel-rapat')) {
        loadRapatDariDrive();
    }

    // Jalankan mesin Galeri Dokumentasi jika elemen tabel dokumentasi terdeteksi
    if (document.getElementById('data-tabel-dokumentasi')) {
        loadDokumentasiDariDrive();
    }
});


/* ==========================================================================
   4. SISTEM TRANSPARANSI KAS KEUANGAN (GOOGLE SHEETS TSV)
   --------------------------------------------------------------------------
   Instruksi: Menarik data kas, menghitung otomatis total kalkulasi nominal pada
   kartu ringkasan (Pemasukan, Pengeluaran, Saldo), serta melakukan pemfilteran.
   ========================================================================== */
const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHz5_a7dbmp1ujG-mDiWyf6paJIEvbvdm2FrdCvwfCDo9iAu_WDA2Cf-TvddO5S8oU-AvJ19dkBVS3/pub?gid=988078683&single=true&output=tsv";
let dataKeuanganGlobal = [];
let dataTersaringGlobal = [];
let halamanSaatIni = 1;
const barisPerHalaman = 10;

// --- MEMBACA LIVE DATA SPREADSHEET KEUANGAN ---
async function loadKeuanganDariDrive() {
    try {
        const response = await fetch(`${linkTsvKeuangan}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        const baris = teksData.split("\n");
        
        dataKeuanganGlobal = [];
        let daftarTahun = new Set();
        let daftarBulan = new Set();

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim();
            if (!barisBersih) continue;
            
            const kolom = barisBersih.split("\t");
            if (kolom.length < 5) continue;

            let statusTipe = kolom[1].toLowerCase().includes("masuk") ? "masuk" : "keluar";
            let tglRaw = kolom[2]; 
            let tglSplit = tglRaw.split("/");
            let thn = tglSplit[2] || "2026";
            let bln = namaBulanIndo[parseInt(tglSplit[1], 10) - 1] || "Semua";

            daftarTahun.add(thn);
            daftarBulan.add(bln);

            dataKeuanganGlobal.push({ 
                tanggal: tglRaw, bulan: bln, tahun: thn, keterangan: kolom[3], tipe: statusTipe, jumlah: kolom[4] || "0" 
            });
        }

        // Isi data saringan dropdown filter secara dinamis sesuai isi kas nyata
        isiDropdown('filter-tahun', Array.from(daftarTahun).sort().reverse());
        isiDropdown('filter-bulan', Array.from(daftarBulan).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        
        terapkanFilter();
    } catch (e) {
        console.error("Gagal memuat data keuangan", e);
        const tBody = document.getElementById('data-tabel-keuangan');
        if (tBody) {
            tBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data dari database. Pastikan koneksi internet stabil.</td></tr>`;
        }
    }
}

// --- PEMPROSESAN ARSIP FILTER & AKUMULASI NOMINAL KARTU ---
window.terapkanFilter = function() {
    const thnInput = document.getElementById('filter-tahun');
    const blnInput = document.getElementById('filter-bulan');
    const katInput = document.getElementById('filter-kategori');
    const cariInput = document.getElementById('input-cari');

    if(!thnInput || !blnInput || !katInput || !cariInput) return;

    const thn = thnInput.value;
    const bln = blnInput.value;
    const kat = katInput.value;
    const cari = cariInput.value.toLowerCase();

    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (kat === "Semua" || item.tipe === kat) && 
               (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    let m = 0, k = 0;
    let dataUntukKartu = thn === "Semua" ? dataKeuanganGlobal : dataKeuanganGlobal.filter(item => item.tahun === thn);

    dataUntukKartu.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });

    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
    
    const saldoCardTitle = document.querySelector('.card-box.saldo h4');
    if (saldoCardTitle) {
        saldoCardTitle.innerHTML = `<i class="fa-solid fa-wallet"></i> Saldo Kas ${thn === "Semua" ? "Keseluruhan" : "(" + thn + ")"}`;
    }
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);

    halamanSaatIni = 1;
    renderTabel();
}

// --- MOUNTING ELEMEN DATA KE TABEL KEUANGAN ---
function renderTabel() {
    const tbody = document.getElementById('data-tabel-keuangan');
    if (!tbody) return;

    if (dataTersaringGlobal.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Data transaksi tidak ditemukan.</td></tr>`;
        return;
    }

    const start = (halamanSaatIni - 1) * barisPerHalaman;
    const pageData = dataTersaringGlobal.slice(start, start + barisPerHalaman);
    
    let html = pageData.map(i => `
        <tr>
            <td>${i.tanggal}</td>
            <td>${i.keterangan}</td>
            <td style="font-weight:bold;">
                ${i.tipe==='masuk' ? '<span style="color:#2e7d32;"><i class="fa-solid fa-arrow-down"></i> Pemasukan</span>' 
                                  : '<span style="color:#E53935;"><i class="fa-solid fa-arrow-up"></i> Pengeluaran</span>'}
            </td>
            <td><strong>${formatRupiah(parseInt(i.jumlah)||0)}</strong></td>
        </tr>
    `).join('');

    const totalHal = Math.ceil(dataTersaringGlobal.length / barisPerHalaman);
    if (totalHal > 1) {
        let tombolNav = "";
        const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer;";
        if (halamanSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="nav(1)" style="${styleBtn}">Sebelumnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halamanSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Selanjutnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Selanjutnya</button><button onclick="nav(1)" style="${styleBtn}">Sebelumnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

window.nav = (dir) => { halamanSaatIni += dir; renderTabel(); };


/* ==========================================================================
   5. SISTEM NOTULEN & HASIL MUSYAWARAH RAPAT BULANAN
   --------------------------------------------------------------------------
   Instruksi: Sinkronisasi lembar berita acara rapat bulanan yang diinput oleh 
   sekretaris via Google Form dan merendernya rapi ke dalam urutan baris tabel.
   ========================================================================== */
const linkTsvRapat = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRq9to0l-2kWwtGcTvwY70z_Ga8NAVmI-C_k4LYoDgTxGhqPY954gdkuRGmqRYe3wP-zSd6M9cUz-qC/pub?gid=1613608992&single=true&output=tsv";
let dataRapatGlobal = [];
let dataRapatTersaring = [];
let halRapatSaatIni = 1;
const barisRapatPerHal = 5; 

// --- MEMBACA LIVE DATA BERITA ACARA RAPAT ---
async function loadRapatDariDrive() {
    try {
        const response = await fetch(`${linkTsvRapat}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        const baris = teksData.split("\n");
        
        dataRapatGlobal = [];
        let daftarTahunRapat = new Set();
        let daftarBulanRapat = new Set();

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim();
            if (!barisBersih) continue;
            
            const kolom = barisBersih.split("\t");
            if (kolom.length < 5) continue;

            let tglRaw = kolom[1]; 
            let tglSplit = tglRaw.includes("/") ? tglRaw.split("/") : tglRaw.split("-");
            
            let thn = tglSplit[2] || tglSplit[0] || "2026";
            if(thn.length > 4) thn = thn.substring(0,4); 
            
            let indexBulan = parseInt(tglSplit[1], 10) - 1;
            let bln = namaBulanIndo[indexBulan] || "Semua";

            if(thn && thn !== "") daftarTahunRapat.add(thn);
            if(bln && bln !== "Semua") daftarBulanRapat.add(bln);

            dataRapatGlobal.push({ 
                tanggal: tglRaw, bulan: bln, tahun: thn, agenda: kolom[2], hasil: kolom[3], lokasi: kolom[4] 
            });
        }

        isiDropdown('filter-rapat-tahun', Array.from(daftarTahunRapat).sort().reverse());
        isiDropdown('filter-rapat-bulan', Array.from(daftarBulanRapat).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));

        terapkanFilterRapat();
    } catch (e) {
        console.error("Gagal memuat arsip rapat", e);
        const tBodyRapat = document.getElementById('data-tabel-rapat');
        if (tBodyRapat) {
            tBodyRapat.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat database rapat. Pastikan spreadsheet telah dipublikasikan ke web.</td></tr>`;
        }
    }
}

// --- EKSEKUSI FILTER PENCARIAN NOTULEN ---
window.terapkanFilterRapat = function() {
    const thn = document.getElementById('filter-rapat-tahun').value;
    const bln = document.getElementById('filter-rapat-bulan').value;
    const cari = document.getElementById('input-cari-rapat').value.toLowerCase();

    dataRapatTersaring = dataRapatGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (item.agenda.toLowerCase().includes(cari) || item.hasil.toLowerCase().includes(cari) || item.lokasi.toLowerCase().includes(cari));
    });

    halRapatSaatIni = 1;
    renderTabelRapat();
}

// --- MOUNTING DATA NOTULEN KE TABEL RAPAT ---
function renderTabelRapat() {
    const tbody = document.getElementById('data-tabel-rapat');
    if (!tbody) return;

    if (dataRapatTersaring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Tidak ada arsip hasil rapat yang cocok.</td></tr>`;
        return;
    }

    const start = (halRapatSaatIni - 1) * barisRapatPerHal;
    const pageData = dataRapatTersaring.slice(start, start + barisRapatPerHal);
    
    let html = pageData.map(i => `
        <tr>
            <td style="font-weight: 500; color: #333;"><i class="fa-regular fa-calendar-days" style="color:#E53935; margin-right:5px;"></i> ${i.tanggal}</td>
            <td style="font-weight: bold; color: #E53935; vertical-align: top;">${i.agenda}</td>
            <td style="line-height: 1.6; white-space: pre-line; text-align: justify; padding-right:20px;">${i.hasil}</td>
            <td><i class="fa-solid fa-location-dot" style="color: #666; margin-right:4px;"></i> ${i.lokasi}</td>
        </tr>
    `).join('');

    const totalHal = Math.ceil(dataRapatTersaring.length / barisRapatPerHal);
    if (totalHal > 1) {
        let tombolNav = "";
        const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;";
        
        if (halRapatSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="navRapat(1)" style="${styleBtn}">Sebelumnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halRapatSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Selanjutnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Selanjutnya</button><button onclick="navRapat(1)" style="${styleBtn}">Sebelumnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

window.navRapat = (dir) => { halRapatSaatIni += dir; renderTabelRapat(); };


/* ==========================================================================
   6. FUNGSI UTILITAS & PEMBANTU (HELPERS)
   --------------------------------------------------------------------------
   Instruksi: Fungsi pendukung mekanis untuk menyisipkan data teks ke elemen 
   opsi select option (dropdown) serta mengubah angka nominal biasa menjadi 
   format mata uang Rupiah Indonesia (Rp 000.000).
   ========================================================================== */
function isiDropdown(id, dataArray) {
    const el = document.getElementById(id);
    if (!el) return;
    
    el.innerHTML = el.options[0].outerHTML; // Amankan baris pertama select bawaan ("Semua")
    
    dataArray.forEach(item => {
        let opt = document.createElement("option");
        opt.value = item; 
        opt.text = item;
        el.appendChild(opt);
    });
}

function formatRupiah(angka) { 
    return 'Rp ' + Math.abs(angka).toLocaleString('id-ID'); 
}


/* ==========================================================================
   7. SISTEM DOKUMENTASI & GALERI KEGIATAN (DENGAN KOLOM SUBJEK BARU)
   --------------------------------------------------------------------------
   Instruksi: Menarik data dokumentasi dari form, membaca kolom Subjek (Kolom E)
   dan menggeser pembacaan Link Foto ke urutan indeks Kolom F secara aman.
   ========================================================================== */
const linkTsvDokumentasi = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGNBxjdguHX3DyMAm4824Cw9Nv6t83MDuqojSZUcwftKAKyuC2jRLtPGId7FdK7w1asPeEVVtdSqqN/pub?gid=246001796&single=true&output=tsv";
let dataDokumentasiGlobal = [];
let dataDokumentasiTersaring = [];

// --- MEMBACA LIVE DATA SPREADSHEET GALERI DOKUMENTASI ---
async function loadDokumentasiDariDrive() {
    try {
        const response = await fetch(`${linkTsvDokumentasi}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        const baris = teksData.split("\n");
        
        dataDokumentasiGlobal = [];
        let daftarTahunDok = new Set();
        let daftarBulanDok = new Set();

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim();
            if (!barisBersih) continue;
            
            const kolom = barisBersih.split("\t");
            // Mengamankan pembacaan data minimal 5 indeks array kolom karena adanya data Subjek Baru
            if (kolom.length < 5) continue; 

            let tglRaw = kolom[1] ? kolom[1].trim() : "";
            if (!tglRaw) continue;

            let tglSplit = tglRaw.includes("/") ? tglRaw.split("/") : tglRaw.split("-");
            let thn = tglSplit[2] || tglSplit[0] || "2026";
            if(thn.length > 4) thn = thn.substring(0,4);
            
            let indexBulan = parseInt(tglSplit[1], 10) - 1;
            let bln = namaBulanIndo[indexBulan] || "Semua";

            if(thn && thn.trim() !== "") daftarTahunDok.add(thn);
            if(bln && bln !== "Semua") daftarBulanDok.add(bln);

            // PENATAAN MAP INDEKS BARU:
            // kolom[2] = Agenda | kolom[3] = Kegiatan | kolom[4] = Subjek Baru | kolom[5] = Link Drive Foto
            let subjekRaw = kolom[4] ? kolom[4].trim() : "-";
            let linkFotoAsli = kolom[5] ? kolom[5].trim() : ""; 
            let linkGambarRender = "";
            let isImage = false;

            // Memilah token ID file Drive agar lolos dari blokir sistem keamanan web browser
            if (linkFotoAsli) {
                if (linkFotoAsli.includes("id=")) {
                    let idFile = linkFotoAsli.split("id=")[1].split("&")[0];
                    linkGambarRender = `https://lh3.googleusercontent.com/d/${idFile}`;
                    isImage = true;
                } else if (linkFotoAsli.includes("/d/")) {
                    let idFile = linkFotoAsli.split("/d/")[1].split("/")[0];
                    linkGambarRender = `https://lh3.googleusercontent.com/d/${idFile}`;
                    isImage = true;
                } else {
                    linkGambarRender = linkFotoAsli;
                }
            }

            dataDokumentasiGlobal.push({ 
                tanggal: tglRaw, 
                bulan: bln, 
                tahun: thn, 
                agenda: kolom[2], 
                kegiatan: kolom[3], 
                subjek: subjekRaw, // Menyisipkan variabel subjek baru
                fotoUrl: linkGambarRender, 
                linkAsli: linkFotoAsli, 
                isImage: isImage
            });
        }

        isiDropdown('filter-dok-tahun', Array.from(daftarTahunDok).sort().reverse());
        isiDropdown('filter-dok-bulan', Array.from(daftarBulanDok).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));

        terapkanFilterDokumentasi();
    } catch (e) {
        console.error("Gagal memuat data dokumentasi", e);
        // CRITICAL: Diubah menjadi colspan="5" agar sinkron menutup batas tepi horizontal kanan tabel
        document.getElementById('data-tabel-dokumentasi').innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Gagal terhubung ke database dokumentasi.</td></tr>`;
    }
}

// --- EKSEKUSI FILTER TOPIK GALERI DOKUMENTASI ---
window.terapkanFilterDokumentasi = function() {
    const thn = document.getElementById('filter-dok-tahun').value;
    const bln = document.getElementById('filter-dok-bulan').value;
    const cari = document.getElementById('input-cari-dok').value.toLowerCase();

    dataDokumentasiTersaring = dataDokumentasiGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (item.agenda.toLowerCase().includes(cari) || item.kegiatan.toLowerCase().includes(cari) || item.subjek.toLowerCase().includes(cari));
    });

    renderTabelDokumentasi();
}

// --- MOUNTING DATA BERKAS & GAMBAR KE TABEL GALERI DOKUMENTASI ---
function renderTabelDokumentasi() {
    const tbody = document.getElementById('data-tabel-dokumentasi');
    if (!tbody) return;

    if (dataDokumentasiTersaring.length === 0) {
        // CRITICAL: Diubah menjadi colspan="5" agar sinkron menutup batas tepi horizontal kanan tabel
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#666;">Tidak ditemukan rekaman kegiatan yang cocok.</td></tr>`;
        return;
    }

    tbody.innerHTML = dataDokumentasiTersaring.map(i => {
        let kolomMedia = "";
        if (i.fotoUrl && i.isImage) {
            kolomMedia = `
                <div style="text-align:center;">
                    <a href="${i.linkAsli}" target="_blank">
                        <img src="${i.fotoUrl}" alt="${i.agenda}" style="max-width:260px; max-height:160px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.12); border:1px solid #ddd;">
                    </a>
                    <br>
                    <a href="${i.linkAsli}" target="_blank" style="font-size:11px; color:#E53935; text-decoration:none; display:inline-block; margin-top:5px; font-weight:600;"><i class="fa-solid fa-magnifying-glass-plus"></i> Lihat Ukuran Penuh</a>
                </div>`;
        } else if (i.linkAsli) {
            kolomMedia = `
                <div style="text-align:center;">
                    <a href="${i.linkAsli}" target="_blank" style="padding:6px 12px; background:#f5f5f5; border:1px solid #ccc; border-radius:4px; text-decoration:none; color:#333; font-size:12px; display:inline-block; font-weight:bold;">
                        <i class="fa-solid fa-paperclip" style="color:#E53935;"></i> Buka Berkas
                    </a>
                </div>`;
        } else {
            kolomMedia = `<div style="text-align:center; color:#999; font-style:italic; font-size:12px;">Tidak ada file</div>`;
        }

        // Menyisipkan kolom baru ${i.subjek} tepat di urutan kolom ke-3 (tengah) tabel
        return `
            <tr>
                <td style="font-weight:500; color:#444; vertical-align:top;"><i class="fa-regular fa-calendar" style="color:#E53935; margin-right:4px;"></i> ${i.tanggal}</td>
                <td style="font-weight:bold; color:#E53935; vertical-align:top; line-height:1.4;">${i.agenda}</td>
                <td style="font-weight:600; color:#555; vertical-align:top;">${i.subjek}</td>
                <td style="line-height:1.6; text-align:justify; white-space:pre-line; vertical-align:top; padding-right:10px;">${i.kegiatan}</td>
                <td style="vertical-align:middle;">${kolomMedia}</td>
            </tr>
        `;
    }).join('');
}