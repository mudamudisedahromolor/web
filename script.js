/* ==========================================================================
   SISTEM KEUANGAN: PAGINATION + ICON + LABEL TEKS
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
    const tbody = document.getElementById('data-tabel-keuangan');
    if (!tbody) return;

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

        dataKeuanganGlobal.reverse();
        terapkanFilter();
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='4' style='color:red;'>Gagal memuat.</td></tr>";
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

window.terapkanFilter = function() {
    // ... (kode filter sama seperti sebelumnya) ...

    // Hitung total keseluruhan (TETAP)
    hitungTotalKeseluruhan(); 
    
    // Hitung saldo filter (DINAMIS)
    hitungSaldoFilter(dataTersaringGlobal); 

    halamanSaatIni = 1;
    renderTabel();
}
// Fungsi ini menghitung total dari SEMUA data (tidak terpengaruh filter)
function hitungTotalKeseluruhan() {
    let m = 0, k = 0;
    dataKeuanganGlobal.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });
    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-pengeluaran').innerText = formatRupiah(k);
    // Jika ingin Saldo Kas (Filter) tetap dinamis, bisa buat fungsi terpisah
}

// Fungsi ini untuk menghitung saldo filter (yang muncul di tabel)
function hitungSaldoFilter(data) {
    let m = 0, k = 0;
    data.forEach(i => {
        let n = parseInt(i.jumlah.replace(/[^0-9]/g, '')) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });
    // Jika kolom Saldo Kas ingin tetap dinamis mengikuti filter:
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);
}
function renderTabel() {
    const tbody = document.getElementById('data-tabel-keuangan');
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
            // Halaman 1: Tombol ke data lebih lama di KANAN
            tombolNav = `<div style="text-align:right;"><button onclick="nav(1)" style="${styleBtn}">Sebelumnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        } else if (halamanSaatIni === totalHal) {
            // Halaman Terakhir: Tombol ke data lebih baru di KIRI
            tombolNav = `<div style="text-align:left;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Selanjutnya</button></div>`;
        } else {
            // Halaman Tengah: Keduanya
            tombolNav = `<div style="display:flex; justify-content:space-between;">
                            <button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Selanjutnya</button>
                            <button onclick="nav(1)" style="${styleBtn}">Sebelumnya <i class="fa-solid fa-chevron-right"></i></button>
                         </div>`;
        }

        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

window.nav = (dir) => { halamanSaatIni += dir; renderTabel(); };
function formatRupiah(a) { return 'Rp ' + Math.abs(a).toLocaleString('id-ID'); }
