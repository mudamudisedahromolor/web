/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS UTAMA    : SCRIPT.JS (LOGIKA INTERAKTIF & DATABASE REAL-TIME)
   ========================================================================== */

// Konstanta Global yang dipakai bersama oleh seluruh modul halaman
const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "December"];

/* ==========================================================================
   1. SISTEM INISIALISASI UTAMA
   --------------------------------------------------------------------------
   Instruksi: Menjalankan berbagai fungsi ketika halaman web selesai dimuat.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    initNavigasiMobile();
    initCarouselOrganisasi();
    initHeroSlider(); // Inisialisasi slider untuk halaman beranda (index.html)
    
    // Memuat database eksternal berdasarkan halaman yang sedang dibuka
    if (document.getElementById('data-tabel-keuangan')) loadKeuanganDariDrive();
    if (document.getElementById('data-tabel-rapat')) loadRapatDariDrive();
    if (document.getElementById('data-tabel-dokumentasi')) loadDokumentasiDariDrive();
});

/* ==========================================================================
   2. SISTEM NAVIGASI & MENU DROPDOWN MOBILE (HP)
   --------------------------------------------------------------------------
   Instruksi: Mengatur fungsi buka-tutup menu utama dan sub-menu untuk HP.
   ========================================================================== */
function initNavigasiMobile() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navBar = document.querySelector('.main-navbar');
    
    // A. Tombol Hamburger (Buka/Tutup Navigasi Utama)
    if (menuBtn && navBar) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navBar.classList.toggle('aktif'); 
        });
    }

    // B. Trigger Dropdown Kegiatan (Bulanan & Tahunan)
    const btnBulanan = document.getElementById('btn-bulanan');
    const menuRapat = document.getElementById('menu-rapat');
    const btnTahunan = document.getElementById('btn-tahunan');
    const menu17an = document.getElementById('menu-17an');

    if (btnBulanan && menuRapat) {
        btnBulanan.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (menu17an) menu17an.classList.remove('buka'); // Tutup menu lain agar tidak bertumpuk
            menuRapat.classList.toggle('buka');
        });
    }

    if (btnTahunan && menu17an) {
        btnTahunan.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (menuRapat) menuRapat.classList.remove('buka'); // Tutup menu lain agar tidak bertumpuk
            menu17an.classList.toggle('buka');
        });
    }
}

/* ==========================================================================
   3. SISTEM CAROUSEL & SLIDER GAMBAR
   ========================================================================== */

// --- A. Carousel Struktur Organisasi (Swiper.js) ---
function initCarouselOrganisasi() {
    if (document.querySelector('.mySwiper') && typeof Swiper !== 'undefined') {
        new Swiper(".mySwiper", {
            slidesPerView: 1, 
            spaceBetween: 15,
            centeredSlides: true, 
            loop: true,
            initialSlide: 2, // Fokus awal ke Ketua
            observer: true,
            observeParents: true,
            breakpoints: {
                768: { slidesPerView: 3, spaceBetween: 30 } // Tampilan 3 kolom di Desktop
            }
        });
    }
}

// --- B. Slider Otomatis Halaman Beranda (index.html) ---
// Data untuk slider halaman utama (edit isi di sini tiap minggu/kegiatan baru)
const kegiatanData = [
    {
        gambar: "images/foto-tirakatan.jpg", 
        judul: "Malam Tirakatan 17 Agustus 2025",
        deskripsi: "Kegiatan rutin tahunan untuk memperingati Hari Kemerdekaan Indonesia. Warga berkumpul di madrasah dinniyah untuk doa bersama, refleksi perjuangan para pahlawan bangsa."
    },
    {
        gambar: "images/foto-lomba.jpg",
        judul: "Lomba Agustusan Tahun 2025",
        deskripsi: "Salah satu lomba anak yaitu pindah air dengan sendok untuk memperingati hari ulang tahun kemerdekaan Indonesia.yang ke-80 Tahun"
    },
    {
        gambar: "images/momen-kebersamaan.jpg",
        judul: "Momen Kebersamaan di Evaluasi Kegiatan",
        deskripsi: "Momen indah di mana seluruh anggota organisasi berkumpul untuk mengevaluasi kegiatan dalam memperingati HUT-RI yang ke 80 tahun dari persiapan, eksekusi acara, serta harapan kedepannya"
    }
];

let slideIndex = 1, slideTimer;

function initHeroSlider() {
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('dots-container');
    
    // Jika elemen slider tidak ditemukan (bukan di halaman index), batalkan fungsi ini
    if (!sliderContainer || !dotsContainer) return;

    // 1. Merakit HTML untuk gambar slide dan titik navigasi (dots)
    let slidesHTML = "", dotsHTML = "";
    kegiatanData.forEach((item, index) => {
        slidesHTML += `
            <div class="slide ${index === 0 ? 'aktif' : ''}">
                <img src="${item.gambar}" alt="${item.judul}" class="slide-img">
                <div class="slide-content">
                    <h3>${item.judul}</h3><p>${item.deskripsi}</p>
                </div>
            </div>`;
        dotsHTML += `<span class="dot ${index === 0 ? 'aktif' : ''}" onclick="currentSlide(${index + 1})"></span>`;
    });
    
    sliderContainer.innerHTML = slidesHTML;
    dotsContainer.innerHTML = dotsHTML;

    // Jalankan animasi slide otomatis
    showSlides(slideIndex);
    autoSlide();
}

function showSlides(n) {
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");
    
    if (slides.length === 0) return; // Pengaman jika tidak ada slide

    if (n > slides.length) slideIndex = 1;    
    if (n < 1) slideIndex = slides.length;
    
    // Reset semua kelas 'aktif'
    Array.from(slides).forEach(s => s.classList.remove("aktif"));
    Array.from(dots).forEach(d => d.classList.remove("aktif"));
    
    // Tampilkan slide yang sedang aktif
    slides[slideIndex-1].classList.add("aktif");  
    dots[slideIndex-1].classList.add("aktif");
}

function autoSlide() {
    slideTimer = setInterval(() => { slideIndex++; showSlides(slideIndex); }, 5000); // Ganti gambar tiap 5 detik
}

// Terpicu ketika user mengeklik titik navigasi manual
window.currentSlide = function(n) { 
    showSlides(slideIndex = n); 
    clearInterval(slideTimer); // Hentikan timer otomatis sementara
    autoSlide(); // Mulai ulang timer otomatis
}


/* ==========================================================================
   4. SISTEM TRANSPARANSI KAS KEUANGAN (GOOGLE SHEETS TSV)
   ========================================================================== */
const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHz5_a7dbmp1ujG-mDiWyf6paJIEvbvdm2FrdCvwfCDo9iAu_WDA2Cf-TvddO5S8oU-AvJ19dkBVS3/pub?gid=988078683&single=true&output=tsv";
let dataKeuanganGlobal = [];
let dataTersaringGlobal = [];
let halamanSaatIni = 1;
const barisPerHalaman = 10;

// Mengambil Data dari Live Google Spreadsheet
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

        // Auto-fill dropdown filter
        isiDropdown('filter-tahun', Array.from(daftarTahun).sort().reverse());
        isiDropdown('filter-bulan', Array.from(daftarBulan).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        
        terapkanFilter();
    } catch (e) {
        console.error("Gagal memuat data keuangan", e);
        const tBody = document.getElementById('data-tabel-keuangan');
        if (tBody) tBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data dari database. Pastikan koneksi internet stabil.</td></tr>`;
    }
}

// Proses Filter & Penjumlahan Kartu Saldo
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

    // Saring data berdasarkan input user
    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (kat === "Semua" || item.tipe === kat) && 
               (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    // Hitung nominal Pemasukan, Pengeluaran, Saldo
    let m = 0, k = 0;
    let dataUntukKartu = thn === "Semua" ? dataKeuanganGlobal : dataKeuanganGlobal.filter(item => item.tahun === thn);

    dataUntukKartu.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });

    // Render hasil kalkulasi ke HTML
    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
    
    const saldoCardTitle = document.querySelector('.card-box.saldo h4');
    if (saldoCardTitle) saldoCardTitle.innerHTML = `<i class="fa-solid fa-wallet"></i> Saldo Kas ${thn === "Semua" ? "Keseluruhan" : "(" + thn + ")"}`;
    
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);

    halamanSaatIni = 1; // Reset halaman saat filter diubah
    renderTabel();
}

// Rendering Baris Tabel Keuangan
function renderTabel() {
    const tbody = document.getElementById('data-tabel-keuangan');
    if (!tbody) return;

    if (dataTersaringGlobal.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Data transaksi tidak ditemukan.</td></tr>`;
        return;
    }

    // Pagination Limit
    const start = (halamanSaatIni - 1) * barisPerHalaman;
    const pageData = dataTersaringGlobal.slice(start, start + barisPerHalaman);
    
    let html = pageData.map(i => `
        <tr>
            <td>${i.tanggal}</td>
            <td>${i.keterangan}</td>
            <td style="font-weight:bold;">
                ${i.tipe==='masuk' ? '<span style="color:#2e7d32;"><i class="fa-solid fa-arrow-down"></i> Pemasukan</span>' : '<span style="color:#E53935;"><i class="fa-solid fa-arrow-up"></i> Pengeluaran</span>'}
            </td>
            <td><strong>${formatRupiah(parseInt(i.jumlah)||0)}</strong></td>
        </tr>
    `).join('');

    // Tambah Tombol Navigasi Halaman jika data melebihi limit
    const totalHal = Math.ceil(dataTersaringGlobal.length / barisPerHalaman);
    if (totalHal > 1) {
        let tombolNav = "";
        const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer;";
        
        if (halamanSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="nav(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halamanSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="nav(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

// Aksi Tombol Navigasi Keuangan
window.nav = (dir) => { 
    halamanSaatIni += dir; 
    renderTabel(); 
};


/* ==========================================================================
   5. SISTEM NOTULEN & HASIL MUSYAWARAH RAPAT BULANAN
   ========================================================================== */
const linkTsvRapat = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRq9to0l-2kWwtGcTvwY70z_Ga8NAVmI-C_k4LYoDgTxGhqPY954gdkuRGmqRYe3wP-zSd6M9cUz-qC/pub?gid=1613608992&single=true&output=tsv";
let dataRapatGlobal = [];
let dataRapatTersaring = [];
let halRapatSaatIni = 1;
const barisRapatPerHal = 5; 

// Mengambil Arsip Berita Acara dari Drive
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
        if (tBodyRapat) tBodyRapat.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat database rapat. Pastikan spreadsheet telah dipublikasikan ke web.</td></tr>`;
    }
}

// Fungsi Filter Notulen Rapat
window.terapkanFilterRapat = function() {
    const thn = document.getElementById('filter-rapat-tahun').value;
    const bln = document.getElementById('filter-rapat-bulan').value;
    const cari = document.getElementById('input-cari-rapat').value.toLowerCase();

    dataRapatTersaring = dataRapatGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (item.agenda.toLowerCase().includes(cari) || item.hasil.toLowerCase().includes(cari) || item.lokasi.toLowerCase().includes(cari));
    });

    halRapatSaatIni = 1; // Reset halaman
    renderTabelRapat();
}

// Rendering Tabel Notulen Rapat
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
            tombolNav = `<div style="text-align:right;"><button onclick="navRapat(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halRapatSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="navRapat(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

// Aksi Tombol Navigasi Rapat
window.navRapat = (dir) => { 
    halRapatSaatIni += dir; 
    renderTabelRapat(); 
    setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
};


/* ==========================================================================
   6. SISTEM DOKUMENTASI & GALERI KEGIATAN
   --------------------------------------------------------------------------
   Instruksi: Sistem cerdas yang mengurutkan data dokumentasi otomatis
   berdasarkan Tanggal Nyata Kegiatan, menangani upload lebih dari 1 file 
   sekaligus, dan memecah tautan Google Drive agar rapi berjajar vertikal.
   ========================================================================== */
const linkTsvDokumentasi = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGNBxjdguHX3DyMAm4824Cw9Nv6t83MDuqojSZUcwftKAKyuC2jRLtPGId7FdK7w1asPeEVVtdSqqN/pub?gid=600804245&single=true&output=tsv";
let dataDokumentasiGlobal = [];
let dataDokumentasiTersaring = [];

let halDokSaatIni = 1;
const barisDokPerHal = 5; // Batas galeri per halaman

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
            if (kolom.length < 5) continue; 

            // Penataan Indeks Kolom Tabel Dokumentasi
            let tglRaw = kolom[1] ? kolom[1].trim() : ""; 
            let agendaRaw = kolom[2] ? kolom[2].trim() : "-";
            let kegiatanRaw = kolom[3] ? kolom[3].trim() : "-";
            let subjekRaw = kolom[4] ? kolom[4].trim() : "-";
            let linkFotoAsli = kolom[5] ? kolom[5].trim() : ""; 
            
            if (!tglRaw) continue;

            let tglSplit = tglRaw.includes("/") ? tglRaw.split("/") : tglRaw.split("-");
            let thn = tglSplit[2] ? tglSplit[2].trim() : "2026";
            if(thn.length > 4) thn = thn.substring(0,4);
            
            let indexBulan = parseInt(tglSplit[1], 10) - 1;
            let bln = namaBulanIndo[indexBulan] || "Semua";

            if(thn && thn.trim() !== "") daftarTahunDok.add(thn);
            if(bln && bln !== "Semua") daftarBulanDok.add(bln);

            dataDokumentasiGlobal.push({ 
                tanggal: tglRaw, 
                bulan: bln, 
                tahun: thn, 
                agenda: agendaRaw, 
                kegiatan: kegiatanRaw, 
                subjek: subjekRaw, 
                linkAsli: linkFotoAsli 
            });
        }

        // Pengurutan Otomatis (Dari Terbaru ke Terlama)
        dataDokumentasiGlobal.sort((itemA, itemB) => {
            let splitA = itemA.tanggal.includes("/") ? itemA.tanggal.split("/") : itemA.tanggal.split("-");
            let splitB = itemB.tanggal.includes("/") ? itemB.tanggal.split("/") : itemB.tanggal.split("-");
            let dateA = new Date(splitA[2], splitA[1] - 1, splitA[0]);
            let dateB = new Date(splitB[2], splitB[1] - 1, splitB[0]);
            return dateB - dateA;
        });

        isiDropdown('filter-dok-tahun', Array.from(daftarTahunDok).sort().reverse());
        isiDropdown('filter-dok-bulan', Array.from(daftarBulanDok).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));

        terapkanFilterDokumentasi();
    } catch (e) {
        console.error("Gagal memuat data dokumentasi", e);
        document.getElementById('data-tabel-dokumentasi').innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">Gagal terhubung ke database dokumentasi.</td></tr>`;
    }
}

window.terapkanFilterDokumentasi = function() {
    const thn = document.getElementById('filter-dok-tahun').value;
    const bln = document.getElementById('filter-dok-bulan').value;
    const cari = document.getElementById('input-cari-dok').value.toLowerCase();

    dataDokumentasiTersaring = dataDokumentasiGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (item.agenda.toLowerCase().includes(cari) || item.kegiatan.toLowerCase().includes(cari) || item.subjek.toLowerCase().includes(cari));
    });

    halDokSaatIni = 1; // Reset halaman
    renderTabelDokumentasi();
}

function renderTabelDokumentasi() {
    const tbody = document.getElementById('data-tabel-dokumentasi');
    if (!tbody) return;

    if (dataDokumentasiTersaring.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#666;">Tidak ditemukan rekaman kegiatan yang cocok.</td></tr>`;
        return;
    }

    const start = (halDokSaatIni - 1) * barisDokPerHal;
    const pageData = dataDokumentasiTersaring.slice(start, start + barisDokPerHal);

    let html = pageData.map(i => {
        let kolomMedia = "";
        
        // Logika Multi-Gambar (Memotong string tautan ganda)
        if (i.linkAsli) {
            let daftarLink = i.linkAsli.split(",").map(link => link.trim());
            kolomMedia = `<div style="display: flex; flex-direction: column; gap: 14px; align-items: center;">`;
            
            daftarLink.forEach((linkSingle, index) => {
                if (!linkSingle) return;
                
                let renderUrl = linkSingle;
                let isImg = false;
                
                // Konversi URL Drive
                if (linkSingle.includes("id=")) {
                    let idFile = linkSingle.split("id=")[1].split("&")[0];
                    renderUrl = `https://lh3.googleusercontent.com/d/${idFile}`;
                    isImg = true;
                } else if (linkSingle.includes("/d/")) {
                    let idFile = linkSingle.split("/d/")[1].split("/")[0];
                    renderUrl = `https://lh3.googleusercontent.com/d/${idFile}`;
                    isImg = true;
                } else if (linkSingle.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    isImg = true;
                }

                if (isImg) {
                    kolomMedia += `
                        <div style="text-align:center; margin-bottom: 5px;">
                            <a href="${linkSingle}" target="_blank">
                                <img src="${renderUrl}" alt="${i.agenda}" style="max-width:260px; max-height:200px; object-fit:contain; background-color:#fafafa; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.12); border:1px solid #ddd;">
                            </a>
                            <br>
                            <a href="${linkSingle}" target="_blank" style="font-size:11px; color:#E53935; text-decoration:none; display:inline-block; margin-top:4px; font-weight:600;"><i class="fa-solid fa-magnifying-glass-plus"></i> Foto ${index + 1} (Penuh)</a>
                        </div>`;
                } else {
                    kolomMedia += `
                        <a href="${linkSingle}" target="_blank" style="padding:6px 12px; background:#f5f5f5; border:1px solid #ccc; border-radius:4px; text-decoration:none; color:#333; font-size:11px; display:inline-block; font-weight:bold;">
                            <i class="fa-solid fa-paperclip" style="color:#E53935;"></i> Buka Berkas ${index + 1}
                        </a>`;
                }
            });
            kolomMedia += `</div>`;
        } else {
            kolomMedia = `<div style="text-align:center; color:#999; font-style:italic; font-size:12px;">Tidak ada file</div>`;
        }

        return `
            <tr>
                <td style="font-weight:500; color:#444; vertical-align:top;"><i class="fa-regular fa-calendar" style="color:#E53935; margin-right:4px;"></i> ${i.tanggal}</td>
                <td style="vertical-align:top; padding-top:15px;">${kolomMedia}</td>
                <td style="font-weight:bold; color:#E53935; vertical-align:top; line-height:1.4;">${i.agenda}</td>
                <td style="font-weight:600; color:#555; vertical-align:top;">${i.subjek}</td>
                <td style="line-height:1.6; text-align:justify; white-space:pre-line; vertical-align:top; padding-right:10px;">${i.kegiatan}</td>
            </tr>
        `;
    }).join('');

    // Navigasi Pagination Dokumentasi
    const totalHal = Math.ceil(dataDokumentasiTersaring.length / barisDokPerHal);
    if (totalHal > 1) {
        let tombolNav = "";
        const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;";
        
        if (halDokSaatIni === 1) {
            tombolNav = `<div style="text-align:right;"><button onclick="navDok(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halDokSaatIni === totalHal) {
            tombolNav = `<div style="text-align:left;"><button onclick="navDok(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        } else {
            tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navDok(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="navDok(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        }
        html += `<tr><td colspan="5" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }

    tbody.innerHTML = html;
}

// Aksi Tombol Navigasi Dokumentasi
window.navDok = (dir) => { 
    halDokSaatIni += dir; 
    renderTabelDokumentasi(); 
    setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
};

/* ==========================================================================
   7. FUNGSI UTILITAS & PEMBANTU UMUM
   ========================================================================== */
function isiDropdown(id, dataArray) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = el.options[0].outerHTML; // Simpan opsi default "Semua"
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