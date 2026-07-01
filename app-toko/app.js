// ============================================
// APP.JS - PWA TOKO DENGAN SEARCH, PAGINATION, CHART, CETAK
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

// Element untuk Chart
const chartTypeSelect = document.getElementById('chartType');

// ========== STATE ==========
let editMode = false;
let currentPage = 1;
let totalPages = 1;
let currentKeyword = '';
let totalData = 0;
let debounceTimer = null;
let chartInstance = null;

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

    if (infoHalaman) {
        infoHalaman.textContent = `Halaman ${page} / ${total || 1}`;
    }
    if (btnPrev) {
        btnPrev.disabled = (page <= 1);
    }
    if (btnNext) {
        btnNext.disabled = (page >= total || total === 0);
    }

    if (infoTotalData) {
        infoTotalData.textContent = `Total data: ${total}`;
    }

    if (infoShowing) {
        if (dataCount !== undefined && total > 0) {
            infoShowing.textContent = `Menampilkan ${start}-${end} dari ${total}`;
        } else {
            infoShowing.textContent = `Menampilkan 0-0 dari 0`;
        }
    }
}

// ========== FETCH DATA (DENGAN SEARCH & PAGE) ==========
async function fetchData(keyword = '', page = 1) {
    try {
        if (loading) loading.classList.remove('hidden');
        if (errorDiv) errorDiv.classList.add('hidden');
        if (tbody) tbody.innerHTML = '';

        // Bangun URL dengan parameter
        const url = new URL(`${API_URL}/get_barang.php`);
        if (keyword) url.searchParams.append('cari', keyword);
        if (page) url.searchParams.append('page', page);
        url.searchParams.append('t', Date.now());

        console.log('🔄 Fetching:', url.toString());

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        console.log('📦 Response:', text.substring(0, 300));

        if (isInfinityFreeResponse(text)) {
            alert('Hosting sedang melakukan verifikasi browser. Refresh halaman lalu coba lagi.');
            if (loading) loading.classList.add('hidden');
            return;
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ Parse JSON gagal:', text);
            throw new Error('Response bukan JSON: ' + e.message);
        }

        if (loading) loading.classList.add('hidden');

        if (result.status === 'error') {
            throw new Error(result.message || 'Terjadi kesalahan pada server');
        }

        currentPage = result.halaman_saat_ini || 1;
        totalPages = result.total_halaman || 1;
        totalData = result.total_data || 0;
        currentKeyword = keyword;

        const data = result.data || [];
        updatePaginationInfo(currentPage, totalPages, data.length);

        if (data.length === 0) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-gray-400 py-6">
                            ${keyword ? '🔍 Tidak ada barang dengan kata "' + escapeHtml(keyword) + '"' : '📭 Belum ada data barang'}
                        </td>
                    </tr>
                `;
            }
            return;
        }

        renderData(data);

    } catch (error) {
        console.error('❌ Error fetchData:', error);
        if (loading) loading.classList.add('hidden');
        if (errorDiv) {
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
}

// ========== RENDER DATA KE TABEL ==========
function renderData(data) {
    if (!tbody) return;
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

// ============================================
// DASHBOARD CHART - TOP 5 BARANG TERMAHAL
// ============================================

async function renderDashboard() {
    try {
        console.log('📊 Fetching chart data...');

        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js belum di-load!');
            const canvas = document.getElementById('myChart');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = '16px Arial';
                ctx.fillStyle = '#ef4444';
                ctx.textAlign = 'center';
                ctx.fillText('❌ Chart.js tidak ditemukan. Refresh halaman.', canvas.width / 2, canvas.height / 2);
            }
            return;
        }

        const response = await fetch(`${API_URL}/statistik.php?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        console.log('📦 Chart Response:', text.substring(0, 200));

        if (isInfinityFreeResponse(text)) {
            console.warn('⚠️ Hosting sedang verifikasi');
            return;
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('❌ Parse JSON gagal:', text);
            return;
        }

        if (result.status !== 'success') {
            throw new Error(result.message || 'Gagal mengambil data chart');
        }

        const labels = result.chart_data.labels || [];
        const values = result.chart_data.values || [];

        const totalBarangInfo = document.getElementById('totalBarangInfo');
        if (totalBarangInfo) {
            const totalValue = values.reduce((a, b) => a + b, 0);
            totalBarangInfo.textContent = `Total 5 barang: Rp ${formatRupiah(totalValue)}`;
        }

        const chartType = document.getElementById('chartType')?.value || 'bar';

        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        const canvas = document.getElementById('myChart');
        if (!canvas) {
            console.warn('⚠️ Canvas #myChart tidak ditemukan');
            return;
        }

        const ctx = canvas.getContext('2d');

        const colors = [
            'rgba(20, 184, 166, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(239, 68, 68, 0.8)'
        ];

        const borderColors = [
            'rgba(20, 184, 166, 1)',
            'rgba(14, 165, 233, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(239, 68, 68, 1)'
        ];

        let datasetConfig = {
            label: 'Harga (Rp)',
            data: values,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 6,
            maxBarThickness: 60
        };

        if (chartType === 'line') {
            datasetConfig = {
                ...datasetConfig,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 10,
                backgroundColor: 'rgba(20, 184, 166, 0.2)',
                borderColor: 'rgba(20, 184, 166, 1)',
                pointBackgroundColor: 'rgba(20, 184, 166, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            };
        }

        if (chartType === 'pie' || chartType === 'doughnut') {
            datasetConfig = {
                ...datasetConfig,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 3,
            };
        }

        chartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [datasetConfig]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                let value = context.parsed.y || context.parsed;
                                return label + ': Rp ' + formatRupiah(value);
                            }
                        }
                    }
                },
                scales: chartType === 'pie' || chartType === 'doughnut' ? undefined : {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return 'Rp ' + formatRupiah(value);
                            },
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11,
                                weight: 'bold'
                            },
                            maxRotation: 45,
                            minRotation: 30
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });

        console.log('✅ Chart berhasil dirender!');

    } catch (error) {
        console.error('❌ Error renderDashboard:', error);
        const canvas = document.getElementById('myChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('❌ ' + error.message, canvas.width / 2, canvas.height / 2);
        }
    }
}

// ========== REFRESH CHART ==========
function refreshChart() {
    console.log('🔄 Refresh chart...');
    renderDashboard();
}

// ============================================
// FUNGSI CETAK LAPORAN
// ============================================

function bukaCetakLaporan() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('❌ Anda harus login terlebih dahulu!');
        window.location.href = 'login.html';
        return;
    }
    window.open('cetak.html', '_blank');
}

// ============================================
// EVENT LISTENER
// ============================================

// 1. Live Search
if (inputCari) {
    inputCari.addEventListener('keyup', function () {
        const keyword = this.value.trim();
        currentKeyword = keyword;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log('🔍 Searching:', keyword);
            fetchData(keyword, 1);
        }, 300);
    });
}

// 2. Navigasi Halaman
if (btnPrev) {
    btnPrev.addEventListener('click', function () {
        if (currentPage > 1) {
            console.log('⬅ Prev page:', currentPage - 1);
            fetchData(currentKeyword, currentPage - 1);
        }
    });
}

if (btnNext) {
    btnNext.addEventListener('click', function () {
        if (currentPage < totalPages) {
            console.log('➡ Next page:', currentPage + 1);
            fetchData(currentKeyword, currentPage + 1);
        }
    });
}

// 3. Edit Barang
function editBarang(id, nama, harga, stok, gambar) {
    const idField = document.getElementById('barang-id');
    const namaField = document.getElementById('nama');
    const hargaField = document.getElementById('harga');
    const stokField = document.getElementById('stok');

    if (idField) idField.value = id;
    if (namaField) namaField.value = nama;
    if (hargaField) hargaField.value = harga;
    if (stokField) stokField.value = stok;

    editMode = true;
    if (btnSubmit) {
        btnSubmit.innerHTML = '<i class="fas fa-edit mr-2"></i> Update Barang';
        btnSubmit.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition text-white font-semibold px-5 py-3 rounded-xl shadow-lg';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. Submit Form
if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        formData.append('token', token);

        let url = `${API_URL}/tambah_barang.php`;

        if (editMode) {
            url = `${API_URL}/update_barang.php`;
            const idField = document.getElementById('barang-id');
            if (idField) formData.append('id', idField.value);
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const text = await response.text();
            console.log('📨 Response:', text.substring(0, 200));

            if (isInfinityFreeResponse(text)) {
                alert('Hosting sedang melakukan verifikasi browser. Refresh halaman lalu coba lagi.');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = editMode ? '<i class="fas fa-edit mr-2"></i> Update Barang' : '<i class="fas fa-save mr-2"></i> Simpan';
                }
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
                const idField = document.getElementById('barang-id');
                if (idField) idField.value = '';
                editMode = false;
                if (btnSubmit) {
                    btnSubmit.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan';
                    btnSubmit.className = 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:scale-105 transition text-white font-semibold px-5 py-3 rounded-xl shadow-lg';
                }

                fetchData(currentKeyword, currentPage);
                setTimeout(renderDashboard, 500);
            } else {
                alert('❌ ' + (data.error || data.message || 'Gagal menyimpan data'));
            }

        } catch (error) {
            console.error('❌ Submit error:', error);
            alert('❌ Koneksi gagal: ' + error.message);
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                if (!editMode) {
                    btnSubmit.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan';
                }
            }
        }
    });
}

// 5. Hapus Barang
function hapusBarang(id) {
    if (!confirm('⚠️ Yakin ingin menghapus barang ini?\nGambar juga akan terhapus permanen.')) {
        return;
    }

    (async function () {
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
                setTimeout(renderDashboard, 500);
            } else {
                alert('❌ ' + (data.error || data.message || 'Gagal menghapus'));
            }

        } catch (error) {
            console.error('❌ Hapus error:', error);
            alert('❌ Koneksi gagal: ' + error.message);
        }
    })();
}

// 6. Handle Enter key di search
if (inputCari) {
    inputCari.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
}

// 7. Event perubahan tipe chart
if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', function () {
        console.log('📊 Change chart type to:', this.value);
        renderDashboard();
    });
}

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(function () { console.log('✅ Service Worker aktif'); })
        .catch(function (err) { console.log('❌ Service Worker gagal', err); });
}

// ========== LOAD PERTAMA ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 App Toko loaded!');

    if (typeof Chart !== 'undefined') {
        console.log('✅ Chart.js tersedia!');
    } else {
        console.warn('⚠️ Chart.js TIDAK tersedia!');
    }

    fetchData('', 1);

    setTimeout(function () {
        renderDashboard();
    }, 500);
});

// ========== EXPOSE FUNCTIONS KE GLOBAL ==========
window.logout = logout;
window.fetchData = fetchData;
window.editBarang = editBarang;
window.hapusBarang = hapusBarang;
window.renderDashboard = renderDashboard;
window.refreshChart = refreshChart;
window.bukaCetakLaporan = bukaCetakLaporan;
window.formatRupiah = formatRupiah;

window.currentKeyword = currentKeyword;
window.currentPage = currentPage;

console.log('✅ App.js loaded successfully!');
console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'Tidak ada');
console.log('🌐 API_URL:', API_URL);