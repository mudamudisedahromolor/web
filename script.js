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
});

document.querySelectorAll('.trigger-layer2').forEach(tombol => {
    tombol.addEventListener('click', (efek) => {
        // Mencegah link me-refresh halaman saat diklik
        efek.preventDefault(); 
        
        // Mencari kotak sub-submenu-dalam yang berada tepat di bawah tulisan yang diklik
        const layer3 = tombol.nextElementSibling;
        
        if (layer3) {
            // Togle class 'buka' (kalau diklik muncul, diklik lagi sembunyi)
            layer3.classList.toggle('buka');
        }
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
    // Jika tidak ada tahun dipilih ("Semua"), maka hitung total keseluruhan seperti di foto.
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
    }
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);

    // 3. Render Tabel (Update UI)
    halamanSaatIni = 1;
    renderTabel();
}

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
function formatRupiah(a) { return 'Rp ' + Math.abs(a).toLocaleString('id-ID'); }