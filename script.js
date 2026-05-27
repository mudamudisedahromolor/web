/* ==========================================================================
   1. FUNGSI NAVBAR / MENU MOBILE (Ditaruh Paling Atas Agar Selalu Jalan)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navBar = document.querySelector('.main-navbar');
    
    if (menuBtn && navBar) {
        // Trik reset tombol agar selalu responsif
        const newMenuBtn = menuBtn.cloneNode(true);
        menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
        
        newMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navBar.classList.toggle('aktif');
        });
    }
});

/* ==========================================================================
   SISTEM KEUANGAN FINAL - TOTAL FIX (ID HTML: total-keluar)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadKeuanganDariDrive();
});

const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHz5_a7dbmp1ujG-mDiWyf6paJIEvbvdm2FrdCvwfCDo9iAu_WDA2Cf-TvddO5S8oU-AvJ19dkBVS3/pub?gid=988078683&single=true&output=tsv";

let dataKeuanganGlobal = [];
let dataTersaringGlobal = [];
let halamanSaatIni = 1;
const barisPerHalaman = 10;
const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

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

        isiDropdown('filter-tahun', Array.from(daftarTahun).sort().reverse());
        isiDropdown('filter-bulan', Array.from(daftarBulan).sort((a,b)=>namaBulanIndo.indexOf(a)-namaBulanIndo.indexOf(b)));

        hitungTotalKeseluruhan();
        terapkanFilter();
    } catch (e) {
        console.error("Gagal memuat data", e);
    }
}

function isiDropdown(id, dataArray) {
    const el = document.getElementById(id);
    if (!el) return;
    dataArray.forEach(item => {
        let opt = document.createElement("option");
        opt.value = item; opt.text = item;
        el.appendChild(opt);
    });
}

function hitungTotalKeseluruhan() {
    let m = 0, k = 0;
    dataKeuanganGlobal.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });
    // Menggunakan ID HTML: 'total-masuk' dan 'total-keluar'
    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
}

// ... (Bagian atas file tetap sama) ...

// Fungsi untuk menghitung angka berdasarkan filter tahun
function updateKartuAngka(dataFilter) {
    let m = 0, k = 0;
    dataFilter.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });

    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);
}

window.terapkanFilter = function() {
    const thn = document.getElementById('filter-tahun').value;
    const bln = document.getElementById('filter-bulan').value;
    const kat = document.getElementById('filter-kategori').value;
    const cari = document.getElementById('input-cari').value.toLowerCase();

    // Filter untuk isi tabel
    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (kat === "Semua" || item.tipe === kat) && 
               (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    // --- LOGIKA BARU: Update Kartu Atas ---
    // Jika filter tahun = "Semua", gunakan seluruh data. Jika tidak, filter berdasarkan tahun.
    let dataUntukKartu = (thn === "Semua") 
                         ? dataKeuanganGlobal 
                         : dataKeuanganGlobal.filter(item => item.tahun === thn);
    
    updateKartuAngka(dataUntukKartu);
    // -------------------------------------

    halamanSaatIni = 1;
    renderTabel();
}

// Saat pertama kali load, jalankan perhitungan total keseluruhan
async function loadKeuanganDariDrive() {
    // ... (kode loading Anda sebelumnya sampai isiDropdown) ...

    // Hitung total awal saat load pertama
    updateKartuAngka(dataKeuanganGlobal); 
    renderTabel();
}

window.nav = (dir) => { halamanSaatIni += dir; renderTabel(); };
function formatRupiah(a) { return 'Rp ' + Math.abs(a).toLocaleString('id-ID'); }

// --- KODE UNTUK TOMBOL MENU MOBILE ---
document.addEventListener("DOMContentLoaded", () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNavbar = document.querySelector('.main-navbar');

    if (mobileMenuBtn && mainNavbar) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNavbar.classList.toggle('aktif');
        });
    }
});

// ==========================================================================
// SCRIPT KHUSUS CAROUSEL STRUKTUR (SWIPER)
// ==========================================================================
document.addEventListener("DOMContentLoaded", function() {
    // Pastikan swiper hanya dijalankan jika ada elemen .mySwiper di halaman tersebut
    if (document.querySelector('.mySwiper')) {
        var swiper = new Swiper(".mySwiper", {
            slidesPerView: 1, 
            spaceBetween: 15,
            centeredSlides: true, 
            loop: true,
            
            // Fokus ke elemen dengan Index 2 (Ketua)
            initialSlide: 2, 
            
            // Tambahan konfigurasi agar perhitungan tengahnya lebih stabil
            observer: true,
            observeParents: true,
            
            breakpoints: {
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30
                }
            }
        });
    }

    // Script Menu Mobile
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.querySelector('.main-navbar').classList.toggle('aktif');
        });
    }
});