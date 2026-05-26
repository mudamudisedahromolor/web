/* ==========================================================================
   LOGIKA OPERASIONAL KEUANGAN & NAVBAR - MUDA MUDI SEDAHROMO LOR
   ========================================================================== */

// Amankan eksekusi hamburger menu setelah DOM selesai dimuat browser
document.addEventListener("DOMContentLoaded", () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.querySelector('.main-navbar').classList.toggle('aktif');
        });
    }
    
    // Jalankan penarikan database otomatis jika fungsi tersedia
    loadKeuanganDariDrive();
});

// Tautan database Google Sheets hasil Google Form (format TSV)
const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7JNQ9Rd19EmuN4V565QZqx9u-BhSx7LdUheBYE7MjRpZ046fkS97pX60GYDsZSAv84XP1gGisMMgm/pub?output=tsv";

let dataKeuanganGlobal = [];
const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

async function loadKeuanganDariDrive() {
    try {
        const response = await fetch(linkTsvKeuangan);
        const teksData = await response.text();
        
        const baris = teksData.split("\n").map(b => b.trim());
        dataKeuanganGlobal = [];
        let daftarTahun = new Set();
        let daftarBulan = new Set();

        // LOOP MEMBACA DATA SPREADSHEET SESUAI STRUKTUR FORM BARU
        for(let i = 1; i < baris.length; i++) {
            if (baris[i] === "") continue; 
            
            const kolom = baris[i].split("\t").map(k => k.trim());
            
            if(kolom.length >= 5) {
                let teksTanggal = kolom[1] || "";     // Kolom B: Tanggal Transaksi
                let keterangan = kolom[2] || "-";    // Kolom C: Keterangan Transaksi
                let jenisTransaksi = kolom[3] ? kolom[3].toLowerCase() : ""; // Kolom D: Jenis Transaksi
                let jumlahUang = kolom[4] || "0";     // Kolom E: Jumlah

                let statusTipe = "keluar"; 
                if (jenisTransaksi.includes("masuk") || jenisTransaksi === "pemasukkan") {
                    statusTipe = "masuk";
                } else if (jenisTransaksi.includes("keluar") || jenisTransaksi === "pengeluaran") {
                    statusTipe = "keluar";
                }

                let teksBulan = "Semua";
                let teksTahun = "Semua";

                let pemisah = teksTanggal.includes("-") ? "-" : "/";
                if (teksTanggal.includes(pemisah)) {
                    const partTanggal = teksTanggal.split(pemisah);
                    
                    if (pemisah === "-") {
                        let tahunExtracted = partTanggal[0];
                        let indeksBulan = parseInt(partTanggal[1], 10) - 1;
                        
                        if (indeksBulan >= 0 && indeksBulan <= 11) teksBulan = namaBulanIndo[indeksBulan];
                        if (tahunExtracted.length === 4) teksTahun = tahunExtracted;
                    } else {
                        let indeksBulan = parseInt(partTanggal[1], 10) - 1;
                        let tahunExtracted = partTanggal[2].split(" ")[0];
                        
                        if (indeksBulan >= 0 && indeksBulan <= 11) teksBulan = namaBulanIndo[indeksBulan];
                        if (tahunExtracted.length === 4) teksTahun = tahunExtracted;
                    }

                    if (teksBulan !== "Semua") daftarBulan.add(teksBulan);
                    if (teksTahun !== "Semua") daftarTahun.add(teksTahun);
                }

                dataKeuanganGlobal.push({
                    tanggal: teksTanggal,  
                    bulan: teksBulan,
                    tahun: teksTahun,
                    keterangan: keterangan,
                    tipe: statusTipe, 
                    jumlah: jumlahUang
                });
            }
        }

        // Cek keberadaan elemen filter agar tidak crash saat script dipanggil di halaman profile/beranda
        if (document.getElementById('filter-tahun') && document.getElementById('filter-bulan')) {
            isiDropdownFilter('filter-tahun', Array.from(daftarTahun).sort().reverse());
            const bulanTersedia = Array.from(daftarBulan).sort((a, b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b));
            isiDropdownFilter('filter-bulan', bulanTersedia);
        }

        terapkanFilter();

    } catch (error) {
        console.error("Detail Error:", error);
        const tBody = document.getElementById('data-tabel-keuangan');
        if (tBody) {
            tBody.innerHTML = "<tr><td colspan='4' style='text-align: center; color: #E53935;'>Gagal terhubung ke Google Drive.</td></tr>";
        }
    }
}

function isiDropdownFilter(idElemen, dataArray) {
    const elemen = document.getElementById(idElemen);
    if (!elemen) return;
    while (elemen.options.length > 1) { elemen.remove(1); }
    
    dataArray.forEach(item => {
        if(item) {
            let opsi = document.createElement("option");
            opsi.value = item; opsi.text = item;
            elemen.appendChild(opsi);
        }
    });
}

function terapkanFilter() {
    const elTahun = document.getElementById('filter-tahun');
    const elBulan = document.getElementById('filter-bulan');
    const elCari = document.getElementById('input-cari');

    const tahunDipilih = elTahun ? elTahun.value : "Semua";
    const bulanDipilih = elBulan ? elBulan.value : "Semua";
    const keywordCari = elCari ? elCari.value.toLowerCase() : "";

    const dataTersaring = dataKeuanganGlobal.filter(item => {
        const cocokTahun = (tahunDipilih === "Semua") || (item.tahun === tahunDipilih);
        const cocokBulan = (bulanDipilih === "Semua") || (item.bulan === bulanDipilih);
        const cocokKetikan = item.keterangan.toLowerCase().includes(keywordCari) || 
                             item.tanggal.toLowerCase().includes(keywordCari);
        return cocokTahun && cocokBulan && cocokKetikan;
    });

    hitungDanTampilkanUang(dataTersaring);
    renderTabelKeuangan(dataTersaring);
}

function hitungDanTampilkanUang(data) {
    let totalMasuk = 0; let totalKeluar = 0;
    data.forEach(item => {
        let angkaBersih = parseInt(item.jumlah.replace(/[^0-9]/g, '')) || 0;
        if(item.tipe === 'masuk') { totalMasuk += angkaBersih; } 
        else if(item.tipe === 'keluar') { totalKeluar += angkaBersih; }
    });

    const elTotalMasuk = document.getElementById('total-masuk');
    const elTotalKeluar = document.getElementById('total-keluar');
    const elSaldoAkhir = document.getElementById('saldo-akhir');

    if (elTotalMasuk) elTotalMasuk.innerText = formatRupiah(totalMasuk);
    if (elTotalKeluar) elTotalKeluar.innerText = formatRupiah(totalKeluar);
    if (elSaldoAkhir) elSaldoAkhir.innerText = formatRupiah(totalMasuk - totalKeluar);
}

function renderTabelKeuangan(data) {
    const tbody = document.getElementById('data-tabel-keuangan');
    if (!tbody) return; 

    if(data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px;'>Data tidak ditemukan atau tidak cocok dengan filter.</td></tr>";
        return;
    }

    let html = "";
    data.forEach(item => {
        const isMasuk = (item.tipe === 'masuk');
        const warnaKategori = isMasuk ? 'color: #2e7d32; font-weight:bold;' : 'color: #E53935; font-weight:bold;';
        const iconKategori = isMasuk ? '<i class="fa-solid fa-arrow-down"></i> Pemasukkan' : '<i class="fa-solid fa-arrow-up"></i> Pengeluaran';
        
        let tanggalTampil = item.tanggal;
        if (tanggalTampil.includes("-")) {
            const p = tanggalTampil.split("-");
            if(p[0].length === 4) tanggalTampil = `${p[2]}-${p[1]}-${p[0]}`; 
        }

        let angkaTampil = item.jumlah.includes("Rp") ? item.jumlah : formatRupiah(parseInt(item.jumlah) || 0);

        html += `
            <tr>
                <td>${tanggalTampil}</td>
                <td>${item.keterangan}</td>
                <td style="${warnaKategori}">${iconKategori}</td>
                <td><strong>${angkaTampil}</strong></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function formatRupiah(angka) { 
    if (angka < 0) {
        return '-Rp ' + Math.abs(angka).toLocaleString('id-ID');
    }
    return 'Rp ' + angka.toLocaleString('id-ID'); 
}
