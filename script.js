/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS UTAMA    : SCRIPT.JS (LOGIKA INTERAKTIF & DATABASE REAL-TIME)
   ========================================================================== */

const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "December"];

/* ==========================================================================
   1. SISTEM INISIALISASI UTAMA
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    initNavigasiMobile();
    initCarouselOrganisasi();
    initHeroSlider(); 
    
    if (document.getElementById('data-tabel-keuangan')) loadKeuanganDariDrive();
    if (document.getElementById('data-tabel-rapat')) loadRapatDariDrive();
    if (document.getElementById('data-tabel-dokumentasi')) loadDokumentasiDariDrive();
});

/* ==========================================================================
   2. NAVIGASI MOBILE (HP)
   ========================================================================== */
function initNavigasiMobile() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navBar = document.querySelector('.main-navbar');
    if (menuBtn && navBar) {
        menuBtn.addEventListener('click', (e) => { e.preventDefault(); navBar.classList.toggle('aktif'); });
    }
}

/* ==========================================================================
   3. SLIDER & CAROUSEL
   ========================================================================== */
function initCarouselOrganisasi() {
    if (document.querySelector('.mySwiper') && typeof Swiper !== 'undefined') {
        new Swiper(".mySwiper", { slidesPerView: 1, spaceBetween: 15, centeredSlides: true, loop: true, initialSlide: 2, breakpoints: { 768: { slidesPerView: 3, spaceBetween: 30 } } });
    }
}

function initHeroSlider() {
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('dots-container');
    if (!sliderContainer || !dotsContainer) return;

    let slidesHTML = "", dotsHTML = "";
    kegiatanData.forEach((item, index) => {
        slidesHTML += `<div class="slide ${index === 0 ? 'aktif' : ''}"><img src="${item.gambar}" class="slide-img"><div class="slide-content"><h3>${item.judul}</h3><p>${item.deskripsi}</p></div></div>`;
        dotsHTML += `<span class="dot ${index === 0 ? 'aktif' : ''}" onclick="currentSlide(${index + 1})"></span>`;
    });
    sliderContainer.innerHTML = slidesHTML;
    dotsContainer.innerHTML = dotsHTML;
    showSlides(1);
}

// Data Slider
const kegiatanData = [
    { gambar: "images/foto-tirakatan.jpg", judul: "Malam Tirakatan 17 Agustus 2025", deskripsi: "Kegiatan rutin tahunan memperingati kemerdekaan." },
    { gambar: "images/foto-lomba.jpg", judul: "Lomba Agustusan 2025", deskripsi: "Lomba anak-anak memperingati HUT RI ke-80." },
    { gambar: "images/momen-kebersamaan.jpg", judul: "Momen Evaluasi", deskripsi: "Evaluasi kegiatan HUT RI ke-80." }
];

function showSlides(n) {
    let slides = document.getElementsByClassName("slide"), dots = document.getElementsByClassName("dot");
    if (n > slides.length) n = 1; if (n < 1) n = slides.length;
    Array.from(slides).forEach(s => s.classList.remove("aktif"));
    Array.from(dots).forEach(d => d.classList.remove("aktif"));
    slides[n-1].classList.add("aktif"); dots[n-1].classList.add("aktif");
}

/* ==========================================================================
   4. KEUANGAN (TANPA AUTO-SCROLL)
   ========================================================================== */
const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHz5_a7dbmp1ujG-mDiWyf6paJIEvbvdm2FrdCvwfCDo9iAu_WDA2Cf-TvddO5S8oU-AvJ19dkBVS3/pub?gid=988078683&single=true&output=tsv";
let dataKeuanganGlobal = [], dataTersaringGlobal = [], halamanSaatIni = 1;
const barisPerHalaman = 10;

async function loadKeuanganDariDrive() {
    try {
        const res = await fetch(`${linkTsvKeuangan}&cache=${new Date().getTime()}`);
        const text = await res.text();
        const rows = text.split("\n");
        dataKeuanganGlobal = [];
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split("\t");
            if (cols.length < 5) continue;
            dataKeuanganGlobal.push({ tanggal: cols[2], keterangan: cols[3], tipe: cols[1].toLowerCase().includes("masuk") ? "masuk" : "keluar", jumlah: cols[4] || "0" });
        }
        renderTabel();
    } catch(e) { console.error(e); }
}

function renderTabel() {
    const tbody = document.getElementById('data-tabel-keuangan');
    const start = (halamanSaatIni - 1) * barisPerHalaman;
    const pageData = dataKeuanganGlobal.slice(start, start + barisPerHalaman);
    tbody.innerHTML = pageData.map(i => `<tr><td>${i.tanggal}</td><td>${i.keterangan}</td><td>${i.tipe}</td><td>${i.jumlah}</td></tr>`).join('');
}

window.nav = (dir) => { halamanSaatIni += dir; renderTabel(); };

/* ==========================================================================
   5. RAPAT (DENGAN AUTO-SCROLL)
   ========================================================================== */
const linkTsvRapat = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRq9to0l-2kWwtGcTvwY70z_Ga8NAVmI-C_k4LYoDgTxGhqPY954gdkuRGmqRYe3wP-zSd6M9cUz-qC/pub?gid=1613608992&single=true&output=tsv";
let dataRapatGlobal = [], halRapatSaatIni = 1;
const barisRapatPerHal = 5;

async function loadRapatDariDrive() {
    try {
        const res = await fetch(`${linkTsvRapat}&cache=${new Date().getTime()}`);
        const text = await res.text();
        const rows = text.split("\n");
        dataRapatGlobal = [];
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split("\t");
            if (cols.length < 5) continue;
            dataRapatGlobal.push({ tanggal: cols[1], agenda: cols[2], hasil: cols[3], lokasi: cols[4] });
        }
        renderTabelRapat();
    } catch(e) { console.error(e); }
}

function renderTabelRapat() {
    const tbody = document.getElementById('data-tabel-rapat');
    const start = (halRapatSaatIni - 1) * barisRapatPerHal;
    const pageData = dataRapatGlobal.slice(start, start + barisRapatPerHal);
    tbody.innerHTML = pageData.map(i => `<tr><td>${i.tanggal}</td><td>${i.agenda}</td><td>${i.hasil}</td><td>${i.lokasi}</td></tr>`).join('');
}

window.navRapat = (dir) => { 
    halRapatSaatIni += dir; 
    renderTabelRapat(); 
    setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
};

/* ==========================================================================
   6. DOKUMENTASI (DENGAN AUTO-SCROLL)
   ========================================================================== */
const linkTsvDokumentasi = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGNBxjdguHX3DyMAm4824Cw9Nv6t83MDuqojSZUcwftKAKyuC2jRLtPGId7FdK7w1asPeEVVtdSqqN/pub?gid=600804245&single=true&output=tsv";
let dataDokumentasiGlobal = [], halDokSaatIni = 1;
const barisDokPerHal = 5;

async function loadDokumentasiDariDrive() {
    try {
        const res = await fetch(`${linkTsvDokumentasi}&cache=${new Date().getTime()}`);
        const text = await res.text();
        const rows = text.split("\n");
        dataDokumentasiGlobal = [];
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split("\t");
            if (cols.length < 5) continue;
            dataDokumentasiGlobal.push({ tanggal: cols[1], agenda: cols[2], kegiatan: cols[3], subjek: cols[4], linkAsli: cols[5] });
        }
        renderTabelDokumentasi();
    } catch(e) { console.error(e); }
}

function renderTabelDokumentasi() {
    const tbody = document.getElementById('data-tabel-dokumentasi');
    const start = (halDokSaatIni - 1) * barisDokPerHal;
    const pageData = dataDokumentasiGlobal.slice(start, start + barisDokPerHal);
    
    tbody.innerHTML = pageData.map(i => {
        let media = i.linkAsli.split(",").map(l => `<img src="https://lh3.googleusercontent.com/d/$${l.includes("id=")?l.split("id=")[1].split("&")[0]:l.split("/d/")[1].split("/")[0]}" style="max-width:200px">`).join("<br>");
        return `<tr><td>${i.tanggal}</td><td>${media}</td><td>${i.agenda}</td><td>${i.subjek}</td><td>${i.kegiatan}</td></tr>`;
    }).join('');
}

window.navDok = (dir) => { 
    halDokSaatIni += dir; 
    renderTabelDokumentasi(); 
    setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
};

// Fungsi Helper
function isiDropdown(id, dataArray) { /* ... */ }
function formatRupiah(angka) { return 'Rp ' + Math.abs(angka).toLocaleString('id-ID'); }