/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS UTAMA    : SCRIPT.JS (LOGIKA INTERAKTIF & DATABASE REAL-TIME)
   ========================================================================== */

// Konstanta Global yang dipakai bersama oleh sistem Keuangan dan Rapat
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
            navBar.classList.toggle('aktif'); // Memicu class muncul di CSS
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
            
            // Tutup menu tahunan terlebih dahulu agar tidak bertumpuk
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
            
            // Tutup menu bulanan terlebih dahulu agar tidak bertumpuk
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
            initialSlide: 2, // Fokus awal langsung ke indeks 2 (Ketua)
            observer: true,
            observeParents: true,
            breakpoints: {
                768: { slidesPerView: 3, spaceBetween: 30 } // Tampilan 3 kolom di PC
            }
        });
    }

    /* ==========================================================================
       3. INISIALISASI PEMUATAN DATABASE OTOMATIS
       --------------------------------------------------------------------------
       Instruksi: Memicu fungsi fetch data database eksternal sesaat setelah 
       struktur halaman web selesai dimuat secara sempurna.
       ========================================================================== */
    // Jalankan database Keuangan jika berada di halaman Kas Keuangan
    if (document.getElementById('data-tabel-keuangan')) {
        loadKeuanganDariDrive();
    }

    // Jalankan database Rapat jika berada di halaman Hasil Rapat
    if (document.getElementById('data-tabel-rapat')) {
        loadRapatDariDrive();
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

// --- AMBIL DATA DARI LIVE GOOGLE SPREADSHEET ---
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

        // Isi pilihan filter dropdown secara otomatis berdasarkan isi database
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

// --- FUNGSI PROSES FILTER & PENJUMLAHAN KARTU SALDO ---
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

    // Jalankan penyaringan data tabel
    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (kat === "Semua" || item.tipe === kat) && 
               (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    // Hitung nominal uang masuk & keluar khusus tahun yang dipilih
    let m = 0, k = 0;
    let dataUntukKartu = thn === "Semua" ? dataKeuanganGlobal : dataKeuanganGlobal.filter(item => item.tahun === thn);

    dataUntukKartu.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });

    // Render hasil kalkulasi ke elemen kartu HTML atas
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

// --- RENDERING BARIS TABEL TRANSAKSI KEUANGAN ---
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

    // Tambahkan tombol navigasi halaman (Pagination) jika baris data melebihi limit kuota
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

// --- TOMBOL NAVIGASI HALAMAN (NEXT / PREV KEUANGAN) ---
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

// --- AMBIL DATA BERITA ACARA DARI LIVE SPREADSHEET ---
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

        // Isi pilihan filter arsip secara dinamis
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

// --- FUNGSI FILTER TOPIK / AGENDA MUSYAWARAH ---
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

// --- RENDERING BARIS TABEL NOTULEN HASIL RAPAT ---
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

    // Tambahkan tombol navigasi halaman (Pagination) khusus segmen rapat
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

// --- TOMBOL NAVIGASI HALAMAN (NEXT / PREV RAPAT) ---
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
    
    // Sisakan opsi baris pertama bawaan HTML asli ("Semua")
    el.innerHTML = el.options[0].outerHTML; 
    
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


