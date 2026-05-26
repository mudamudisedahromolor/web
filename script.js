/* ==========================================================================
   LOGIKA KEUANGAN: PAGINATION (10 BARIS) + DESAIN MERAH PROFESIONAL
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.querySelector('.main-navbar').classList.toggle('aktif');
        });
    }
    loadKeuanganDariDrive();
});

const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHz5_a7dbmp1ujG-mDiWyf6paJIEvbvdm2FrdCvwfCDo9iAu_WDA2Cf-TvddO5S8oU-AvJ19dkBVS3/pub?output=tsv";

let dataKeuanganGlobal = [];
let dataTersaringGlobal = [];
let halamanSaatIni = 1;
const barisPerHalaman = 10;
const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

async function loadKeuanganDariDrive() {
    const tbody = document.getElementById('data-tabel-keuangan');
    if (!tbody) return;

    try {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align: center; padding: 30px;'><i class='fa-solid fa-spinner fa-spin'></i> Memuat data...</td></tr>";
        const response = await fetch(linkTsvKeuangan + "&_cb=" + new Date().getTime());
        const teksData = await response.text();
        const baris = teksData.split("\n").map(b => b.trim()).filter(b => b !== "");
        
        const headers = baris[0].split("\t").map(h => h.trim().toLowerCase());
        const cJenis = 1; const cTanggal = 2; const cKeterangan = 3; const cJumlah = 4;

        dataKeuanganGlobal = [];
        for (let i = 1; i < baris.length; i++) {
            const kolom = baris[i].split("\t").map(k => k.trim());
            if (kolom.length < 5) continue;

            let statusTipe = kolom[cJenis].toLowerCase().includes("masuk") ? "masuk" : "keluar";
            let tgl = kolom[cTanggal].split("-");
            let thn = tgl[0];
            let bln = namaBulanIndo[parseInt(tgl[1], 10) - 1] || "Semua";

            dataKeuanganGlobal.push({ tanggal: kolom[cTanggal], bulan: bln, tahun: thn, keterangan: kolom[cKeterangan], tipe: statusTipe, jumlah: kolom[cJumlah] });
        }

        dataKeuanganGlobal.reverse(); // Data terbaru di atas
        terapkanFilter();
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align: center; color: #E53935;'>Gagal memuat data.</td></tr>";
    }
}

function terapkanFilter() {
    const thn = document.getElementById('filter-tahun').value;
    const bln = document.getElementById('filter-bulan').value;
    const cari = document.getElementById('input-cari').value.toLowerCase();

    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && (bln === "Semua" || item.bulan === bln) && 
               (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    halamanSaatIni = 1;
    hitungSaldo(dataTersaringGlobal);
    renderTabel();
}

function hitungSaldo(data) {
    let m = 0, k = 0;
    data.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });
    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);
}

function renderTabel() {
    const tbody = document.getElementById('data-tabel-keuangan');
    const start = (halamanSaatIni - 1) * barisPerHalaman;
    const pageData = dataTersaringGlobal.slice(start, start + barisPerHalaman);
    
    tbody.innerHTML = pageData.map(i => `
        <tr>
            <td>${i.tanggal}</td>
            <td>${i.keterangan}</td>
            <td style="color:${i.tipe==='masuk'?'#2e7d32':'#E53935'}; font-weight:bold;">
                ${i.tipe==='masuk'?'<i class="fa-solid fa-arrow-down"></i>':'<i class="fa-solid fa-arrow-up"></i>'}
            </td>
            <td><strong>${formatRupiah(parseInt(i.jumlah)||0)}</strong></td>
        </tr>
    `).join('');

    // Tombol Navigasi Merah
    const totalHal = Math.ceil(dataTersaringGlobal.length / barisPerHalaman);
    if (totalHal > 1) {
        tbody.innerHTML += `<tr><td colspan="4" style="text-align:center; padding:10px;">
            <button ${halamanSaatIni===1?'disabled':''} onclick="nav(-1)" style="padding:5px 15px; background:#E53935; color:white; border:none; border-radius:4px;">Sebelumnya</button>
            <span style="margin:0 15px;">${halamanSaatIni} / ${totalHal}</span>
            <button ${halamanSaatIni===totalHal?'disabled':''} onclick="nav(1)" style="padding:5px 15px; background:#E53935; color:white; border:none; border-radius:4px;">Selanjutnya</button>
        </td></tr>`;
    }
}

window.nav = (dir) => { halamanSaatIni += dir; renderTabel(); };
function formatRupiah(a) { return 'Rp ' + Math.abs(a).toLocaleString('id-ID'); }
