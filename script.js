const menuBtn = document.getElementById('mobile-menu-btn');
const mainNavbar = document.querySelector('.main-navbar');

// Ketika tombol hamburger diklik
menuBtn.addEventListener('click', () => {
    // Tambah atau hapus class 'aktif' pada navbar merah
    mainNavbar.classList.toggle('aktif');
});