/* ==========================================================================
   LOGIKA OPERASIONAL KEUANGAN DINAMIS (ANTI GAGAL & AUTO-DETEKSI)
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

// Link Google Sheets dari Web Share Anda (Biarkan Utuh)
const linkTsvKeuangan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHz5_a7dbmp1ujG-mDiWyf6paJIEvbvdm2FrdCvwfCDo9iAu_WDA2Cf-TvddO5S8oU-AvJ19dkBVS3/pub?gid=2096971781&single=true&output=tsv";

let dataKeuanganGlobal = [];
const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

async function loadKeuanganDariDrive() {
    const tbody = document.getElementById('data-tabel-keuangan');
    if (!tbody) return;

    try {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align: center; padding: 30px; color: #1565c0;'><i class='fa-solid fa-spinner fa-spin'></i> Sinkronisasi dengan Google Sheets...</td></tr>";

        // Bypass cache super kuat
        const realTimeLink = linkTsvKeuangan + "&_cb=" + new Date().getTime();
        const response = await fetch(realTimeLink);
        
        if (!response.ok) throw new Error("Gagal mengambil data. Status HTTP: " + response.status);
        
        const teksData = await response.text();

        if (teksData.trim().startsWith("<") || teksData.toLowerCase().includes("<!doctype html>")) {
            throw new Error("Format salah: Google mengirim halaman HTML. Pastikan Anda sudah mempublikasikan sebagai TSV/CSV.");
        }

        // Memecah baris data dan membuang baris kosong
        const baris = teksData.split("\n").map(b => b.trim()).filter(b => b !== "");
        
        if (baris.length < 2) {
            throw new Error("Spreadsheet terhubung, tapi tidak ada data transaksi (kosong).");
        }

        // --- 1. FITUR AUTO-DETEKSI PEMISAH KARAKTER DARI GOOGLE ---
        let delimiter = "\t"; // Default Tab
        if (!baris[0].includes("\t") && baris[0].includes(",")) delimiter = ",";
        else if (!baris[0].includes("\t") && baris[0].includes(";")) delimiter = ";";

        // --- 2. FITUR AUTO-PENCARIAN NAMA KOLOM ---
        const headers = baris[0].split(delimiter).map(h => h.trim().toLowerCase());
        
        let cJenis = headers.findIndex(h => h.includes("salah satu") || h.includes("jenis") || h.includes("tipe"));
        let cTanggal = headers.findIndex(h => h.includes("tanggal") || h.includes("waktu"));
        let cKeterangan = headers.findIndex(h => h.includes("keterangan") || h.includes("deskripsi"));
        let cJumlah = headers.findIndex(h => h.includes("jumlah") || h.includes("nominal") || h.includes("uang"));

        // Jika judul kolom diganti dan tidak ketemu, gunakan urutan default foto spreadsheet
        if (cJenis === -1) cJenis = 1;
        if (cTanggal === -1) cTanggal = 2;
        if (cKeterangan === -1) cKeterangan = 3;
        if (cJumlah === -1) cJumlah = 4;

        dataKeuanganGlobal = [];
        let daftarTahun = new Set();
        let daftarBulan = new Set();

        for (let i = 1; i < baris.length; i++) {
            const kolom = baris[i].split(delimiter).map(k => k.trim());
            
            // Hapus syarat panjang kolom. Ambil data secara paksa apa adanya!
            let teksTanggal = kolom[cTanggal] || "";     
            let keterangan = kolom[cKeterangan] || "-";    
            let jenisTransaksi = (kolom[cJenis] || "").toLowerCase(); 
            let jumlahUang = kolom[cJumlah] || "0";     

            // Lewati baris yang benar-benar tidak ada tanggal dan deskripsinya
            if (!teksTanggal && keterangan === "-") continue;

            let statusTipe = "keluar"; 
            if (jenisTransaksi.includes("masuk") || jenisTransaksi.includes("pemasukkan")) {
                statusTipe = "masuk";
            } else if (jenisTransaksi.includes("keluar") || jenisTransaksi.includes("pengeluaran")) {
                statusTipe = "keluar";
            }

            let teksBulan = "Semua";
            let teksTahun = "Semua";

            let pemisahTanggal = teksTanggal.includes("-") ? "-" : (teksTanggal.includes("/") ? "/" : "");
            if (pemisahTanggal !== "") {
                const partTanggal = teksTanggal.split(pemisahTanggal);
                if (pemisahTanggal === "-") {
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

        // --- 3. SISTEM INTELIJEN: DETEKSI AKAR MASALAH JIKA MASIH KOSONG ---
        if (dataKeuanganGlobal.length === 0) {
            throw new Error(`Koneksi Sukses, tetapi data Anda tidak terbaca oleh script.<br><br><b>INFO DIAGNOSA UNTUK DEVELOPER:</b><br>Pemisah terdeteksi: <b>[ ${delimiter === "\t" ? "TAB" : delimiter} ]</b><br>Cuplikan Baris 1: <i style="color:#555;">${baris[1]}</i>`);
        }

        if (document.getElementById('filter-tahun') && document.getElementById('filter-bulan')) {
            isiDropdownFilter('filter-tahun', Array.from(daftarTahun).sort().reverse());
            const bulanTersedia = Array.from(daftarBulan).sort((a, b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b));
            isiDropdownFilter('filter-bulan', bulanTersedia);
        }

        terapkanFilter();

    } catch (error) {
        console.error("Detail Error:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan='4' style='text-align: center; padding: 30px; color: #E53935; font-weight: normal; line-height:1.6;'>
                <i class='fa-solid fa-triangle-exclamation' style='font-size: 24px; margin-bottom: 10px; display: block;'></i> 
                ${error.message}
            </td></tr>`;
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
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:30px; color: #666;'>Tidak ada data transaksi kas yang cocok dengan filter tersebut.</td></tr>";
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
