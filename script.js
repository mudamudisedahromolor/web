/* ==========================================================================
   1. FUNGSI NAVBAR / MENU MOBILE (Ditaruh Paling Atas Agar Selalu Jalan)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navBar = document.querySelector('.main-navbar');
    
    if (menuBtn && navBar) {
        // Trik reset tombol agar responsif di HP (khususnya iPhone)
        const newMenuBtn = menuBtn.cloneNode(true);
        menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
        
        newMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navBar.classList.toggle('aktif');
        });
    }

    // LOGIKA BARU: Klik urut bertahap dari Layer 2 (Bulanan/Tahunan) ke Layer 3 di layar HP
    document.querySelectorAll('.trigger-layer2').forEach(tombol => {
        tombol.addEventListener('click', function(efek) {
            // Hanya jalankan fungsi klik bertingkat ini jika di layar HP (lebar layar <= 768px)
            if (window.innerWidth <= 768) {
                efek.preventDefault(); // Mencegah halaman melompat atau refresh
                
                // Cari elemen pembungkus li terdekat (.submenu-item)
                const indukLi = this.closest('.submenu-item');
                // Temukan kotak sub-menu layer 3 khusus yang ada di dalam li tersebut
                const layer3 = indukLi ? indukLi.querySelector('.sub-submenu-dalam') : null;
                
                if (layer3) {
                    // Tutup dulu sub-menu layer 3 lainnya yang sedang terbuka agar rapi bergantian
                    document.querySelectorAll('.sub-submenu-dalam').forEach(menuLain => {
                        if (menuLain !== layer3) {
                            menuLain.classList.remove('buka');
                        }
                    });
                    
                    // Buka atau tutup sub-menu layer 3 yang sedang Anda ketuk
                    layer3.classList.toggle('buka');
                }
            }
        });
    });
});

/* ==========================================================================
   2. SCRIPT KHUSUS CAROUSEL STRUKTUR (SWIPER)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    // Pastikan swiper hanya dijalankan jika ada elemen .mySwiper (Halaman Struktur)
    if (document.querySelector('.mySwiper')) {
        const swiper = new Swiper(".mySwiper", {
            slidesPerView: 1, 
            spaceBetween: 15,
            centeredSlides: true, 
            loop: true,
            initialSlide: 2, // Fokus ke elemen dengan Index 2 (Ketua)
            observer: true,
            observeParents: true,
            breakpoints: {
                768: { slidesPerView: 3, spaceBetween: 30 }
            }
        });
    }
});

/* ==========================================================================
   3. SISTEM KEUANGAN (GOOGLE SHEETS)
   ========================================================================== */
// Hanya panggil fungsi Google Drive jika ada tabel keuangan di halaman tersebut
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('data-tabel-keuangan')) {
        loadKeuanganDariDrive();
    }
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

        terapkanFilter(); // Memanggil filter pertama kali
    } catch (e) {
        console.error("Gagal memuat data", e);
        document.getElementById('data-tabel-keuangan').innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data dari database. Pastikan koneksi internet stabil.</td></tr>`;
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

// FUNGSI FILTER UTAMA & PERUBAHAN ANGKA KARTU
window.terapkanFilter = function() {
    const thn = document.getElementById('filter-tahun').value;
    const bln = document.getElementById('filter-bulan').value;
    const kat = document.getElementById('filter-kategori').value;
    const cari = document.getElementById('input-cari').value.toLowerCase();

    // 1. Filter Data untuk Tabel (Berdasarkan SEMUA jenis filter)
    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && 
               (bln === "Semua" || item.bulan === bln) && 
               (kat === "Semua" || item.tipe === kat) && 
               (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    // 2. Hitung Angka Kartu Atas (HANYA BERDASARKAN FILTER TAHUN)
    let m = 0, k = 0;
    
    let dataUntukKartu = dataKeuanganGlobal; 
    if (thn !== "Semua") {
        dataUntukKartu = dataKeuanganGlobal.filter(item => item.tahun === thn);
    }

    dataUntukKartu.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });

    // Update tampilan kartu
    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
    
    // Khusus Saldo Kas (Filter), mari kita update text judulnya agar relevan
    const saldoCardTitle = document.querySelector('.card-box.saldo h4');
    if (saldoCardTitle) {
        saldoCardTitle.innerHTML = `<i class="fa-solid fa-wallet"></i> Saldo Kas ${thn === "Semua" ? "Keseluruhan" : "(" + thn + ")"}`;