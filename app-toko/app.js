// ============================================
// APP.JS - DENGAN LIVE SEARCH & PAGINATION
// ============================================

// ========== CEK LOGIN ==========
const token = localStorage.getItem('token');

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

if (!token || token === "null") {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// ========== KONFIGURASI ==========
const API_URL = 'https://pwa-naufal.infinityfreeapp.com/api-toko';

// ========== DOM ELEMENTS ==========
const tbody = document.getElementById('daftar-barang');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const form = document.getElementById('form-barang');
const btnSubmit = document.getElementById('btn-submit');

// Element untuk Search & Pagination
const inputCari = document.getElementById('inputCari');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const infoHalaman = document.getElementById('infoHalaman');
const infoTotalData = document.getElementById('infoTotalData');
const infoShowing = document.getElementById('infoShowing');

// ========== STATE ==========
let editMode = false;
let currentPage = 1;
let totalPages = 1;
let currentKeyword = '';
let totalData = 0;
let debounceTimer = null;

// ========== FUNGSI UTILITY ==========
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isInfinityFreeResponse(text) {
    return (text.includes('__test') || text.includes('aes.js') || text.startsWith('<html'));
}

function updatePaginationInfo(page, total, dataCount) {
    const limit = 5;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    infoHalaman.textContent = `Halaman ${page} / ${total || 1}`;
    btnPrev.disabled = (page <= 1);
    btnNext.disabled = (page >= total || total === 0);

    if (totalData !== undefined) {
        infoTotalData.textContent = `Total data: ${total}`;
    }

    if (dataCount !== undefined && total > 0) {
        infoShowing.textContent = `Menampilkan ${start}-${end} dari ${total}`;
    } else {
        infoShowing.textContent = `Menampilkan 0-0 dari 0`;
    }
}

// ========== FETCH DATA (DENGAN SEARCH & PAGE) ==========
async function fetchData(keyword = '', page = 1) {
    try {
        loading.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        tbody.innerHTML = '';

        // Bangun URL dengan parameter
        const url = new URL(`${API_URL}/get_barang.php`);
        if (keyword) url.searchParams.append('cari', keyword);
        if (page) url.searchParams.append('page', page);
        url.searchParams.append('t', Date.now()); // Anti cache

        console.log('🔄 Fetching:', url.toString());

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        console.log('📦 Response:', text.substring(0, 300));

        // Cek apakah response HTML (error hosting)
        if (isInfinityFreeResponse(text)) {
            alert('Hosting sedang melakukan verifikasi browser. Refresh halaman lalu coba lagi.');
            loading.classList.add('hidden');
            return;
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ Parse JSON gagal:', text);
            throw new Error('Response bukan JSON: ' + e.message);
        }

        loading.classList.add('hidden');

        // Cek status dari API
        if (result.status === 'error') {
            throw new Error(result.message || 'Terjadi kesalahan pada server');
        }

        // Update state
        currentPage = result.halaman_saat_ini || 1;
        totalPages = result.total_halaman || 1;
        totalData = result.total_data || 0;
        currentKeyword = keyword;

        // Update info halaman
        const data = result.data || [];
        updatePaginationInfo(currentPage, totalPages, data.length);

        // Render data
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-gray-400 py-6">
                        ${keyword ? '🔍 Tidak ada barang dengan kata "' + escapeHtml(keyword) + '"' : '📭 Belum ada data barang'}
                    </td>
                </tr>
            `;
            return;
        }

        renderData(data);

    } catch (error) {
        console.error('❌ Error fetchData:', error);
        loading.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        errorDiv.innerHTML = `
            <div class="bg-red-100 text-red-700 p-4 rounded-xl">
                <strong>❌ Error:</strong> ${error.message}
                <br><br>
                <details class="text-sm mt-2">
                    <summary class="cursor-pointer">🔍 Detail Debug</summary>
                    <p class="mt-2 font-mono text-xs bg-red-50 p-2 rounded">
                        URL: ${API_URL}/get_barang.php?cari=${keyword}&page=${page}
                        <br>
                        Token: ${token ? token.substring(0, 20) + '...' : 'Tidak ada'}
                    </p>
                </details>
                <button onclick="fetchData('${currentKeyword}', ${currentPage})" 
                        class="mt-3 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition">
                    🔄 Coba Lagi
                </button>
            </div>
        `;
    }
}

// ========== RENDER DATA KE TABEL ==========
function renderData(data) {
    tbody.innerHTML = '';

    data.forEach((barang, index) => {
        const stokClass = barang.stok > 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500';
        const gambarUrl = barang.gambar ? `${API_URL}/uploads/${barang.gambar}` : '';
        const nomorUrut = (currentPage - 1) * 5 + index + 1;

        tbody.innerHTML += `
            <tr class="bg-white shadow-md hover:shadow-xl transition rounded-2xl">
                <td class="px-4 py-4 rounded-l-2xl text-gray-500 font-medium">${nomorUrut}</td>
                <td class="px-4 py-4 font-semibold text-gray-700">${escapeHtml(barang.nama)}</td>
                <td class="px-4 py-4">
                    ${gambarUrl ?
                `<img src="${gambarUrl}" class="w-16 h-16 object-cover rounded-lg border" alt="${escapeHtml(barang.nama)}" onerror="this.src='https://placehold.co/400x400/teal/white?text=Error'">` :
                `<span class="text-gray-400 text-sm"><i class="fas fa-image mr-1"></i>Tidak ada</span>`
            }
                </td>
                <td class="px-4 py-4 text-cyan-600 font-semibold">Rp ${formatRupiah(barang.harga)}</td>
                <td class="px-4 py-4">
                    <span class="px-3 py-1 rounded-full text-xs ${stokClass}">
                        ${barang.stok} unit
                    </span>
                </td>
                <td class="px-4 py-4 rounded-r-2xl flex gap-3">
                    <button onclick='editBarang(${barang.id}, ${JSON.stringify(escapeHtml(barang.nama))}, ${barang.harga}, ${barang.stok}, ${JSON.stringify(barang.gambar || "")})' 
                            class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded-lg transition">
                        ✏️ Edit
                    </button>
                    <button onclick="hapusBarang(${barang.id})" 
                            class="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-lg transition">
                        🗑 Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}

// ========== EVENT LISTENER ==========

// 1. Live Search (onkeyup dengan debounce)
inputCari.addEventListener('keyup', function () {
    const keyword = this.value.trim();
    currentKeyword = keyword;

    // Debounce: tunggu 300ms setelah selesai mengetik
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        console.log('🔍 Searching:', keyword);
        fetchData(keyword, 1);
    }, 300);
});

// 2. Navigasi Halaman
btnPrev.addEventListener('click', function () {
    if (currentPage > 1) {
        console.log('⬅ Prev page:', currentPage - 1);
        fetchData(currentKeyword, currentPage - 1);
    }
});

btnNext.addEventListener('click', function () {
    if (currentPage < totalPages) {
        console.log('➡ Next page:', currentPage + 1);
        fetchData(currentKeyword, currentPage + 1);
    }
});

// 3. Edit Barang
function editBarang(id, nama, harga, stok, gambar) {
    document.getElementById('barang-id').value = id;
    document.getElementById('nama').value = nama;
    document.getElementById('harga').value = harga;
    document.getElementById('stok').value = stok;

    editMode = true;
    btnSubmit.innerHTML = '<i class="fas fa-edit mr-2"></i> Update Barang';
    btnSubmit.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition text-white font-semibold px-5 py-3 rounded-xl shadow-lg';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. Submit Form (Tambah/Update)
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append('token', token);

    let url = `${API_URL}/tambah_barang.php`;

    if (editMode) {
        url = `${API_URL}/update_barang.php`;
        formData.append('id', document.getElementById('barang-id').value);
    }

    // Disable submit button
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log('📨 Response:', text.substring(0, 200));

        if (isInfinityFreeResponse(text)) {
            alert('Hosting sedang melakukan verifikasi browser. Refresh halaman lalu coba lagi.');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = editMode ? '<i class="fas fa-edit mr-2"></i> Update Barang' : '<i class="fas fa-save mr-2"></i> Simpan';
            return;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Parse JSON gagal:', text);
            throw new Error('Response bukan JSON');
        }

        if (data.message === 'Token tidak valid' || data.message === 'Akses Ditolak! Token tidak ditemukan.') {
            localStorage.removeItem('token');
            alert('Session login sudah tidak valid. Silakan login kembali.');
            window.location.href = 'login.html';
            return;
        }

        if (data.success) {
            alert(editMode ? '✅ Barang berhasil diupdate' : '✅ Barang berhasil ditambahkan');
            form.reset();
            document.getElementById('barang-id').value = '';
            editMode = false;
            btnSubmit.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan';
            btnSubmit.className = 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:scale-105 transition text-white font-semibold px-5 py-3 rounded-xl shadow-lg';

            // Refresh data dengan keyword dan halaman saat ini
            fetchData(currentKeyword, currentPage);
        } else {
            alert('❌ ' + (data.error || data.message || 'Gagal menyimpan data'));
        }

    } catch (error) {
        console.error('❌ Submit error:', error);
        alert('❌ Koneksi gagal: ' + error.message);
    } finally {
        btnSubmit.disabled = false;
        if (!editMode) {
            btnSubmit.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan';
        }
    }
});

// 5. Hapus Barang
async function hapusBarang(id) {
    if (!confirm('⚠️ Yakin ingin menghapus barang ini?\nGambar juga akan terhapus permanen.')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('token', token);

        const response = await fetch(`${API_URL}/hapus_barang.php`, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log('🗑 Hapus Response:', text.substring(0, 200));

        if (isInfinityFreeResponse(text)) {
            alert('Hosting sedang melakukan verifikasi browser. Refresh halaman lalu coba lagi.');
            return;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Parse JSON gagal:', text);
            throw new Error('Response bukan JSON');
        }

        if (data.message === 'Token tidak valid') {
            localStorage.removeItem('token');
            alert('Session login sudah tidak valid. Silakan login kembali.');
            window.location.href = 'login.html';
            return;
        }

        if (data.success) {
            alert('✅ Barang berhasil dihapus');
            fetchData(currentKeyword, currentPage);
        } else {
            alert('❌ ' + (data.error || data.message || 'Gagal menghapus'));
        }

    } catch (error) {
        console.error('❌ Hapus error:', error);
        alert('❌ Koneksi gagal: ' + error.message);
    }
}

// 6. Handle Enter key di search (agar tidak submit form)
inputCari.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('✅ Service Worker aktif'))
        .catch(err => console.log('❌ Service Worker gagal', err));
}

// ========== LOAD PERTAMA ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 App Toko loaded!');
    fetchData('', 1);
});

// ========== EXPOSE FUNCTIONS ==========
// Untuk digunakan di HTML (onclick)
window.logout = logout;
window.fetchData = fetchData;
window.editBarang = editBarang;
window.hapusBarang = hapusBarang;
window.currentKeyword = currentKeyword;
window.currentPage = currentPage;