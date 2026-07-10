// ============================================
// APP.JS - PWA TOKO DENGAN SMART QR GATEWAY (P14)
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

// ========== STATE QR GATEWAY ==========
let _mainQrScanner = null;
let _qrLastResult = null;

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

// ========== FETCH DATA ==========
async function fetchData(keyword = '', page = 1) {
    try {
        if (loading) loading.classList.remove('hidden');
        if (errorDiv) errorDiv.classList.add('hidden');
        if (tbody) tbody.innerHTML = '';

        const url = new URL(`${API_URL}/barang.php`);
        if (keyword) url.searchParams.append('search', keyword);
        if (page) url.searchParams.append('page', page);
        url.searchParams.append('t', Date.now());

        console.log('🔄 Fetching:', url.toString());

        const response = await fetch(url, {
            headers: { 'X-Auth-Token': token }
        });

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
                        <td colspan="7" class="text-center text-gray-400 py-6">
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
                    <button onclick="fetchData('${currentKeyword}', ${currentPage})" 
                            class="mt-3 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition">
                        🔄 Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

// ========== RENDER DATA KE TABEL (PERBAIKAN GAMBAR) ==========
function renderData(data) {
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach((barang, index) => {
        // ✅ PASTIKAN MENGGUNAKAN ID DARI DATABASE, BUKAN INDEX!
        const id = barang.id;
        const stokClass = barang.stok > 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500';
        const nomorUrut = (currentPage - 1) * 5 + index + 1;

        // ===== PERBAIKAN GAMBAR =====
        let gambarHtml = '';
        if (barang.gambar) {
            const gambarUrl = `${API_URL}/uploads/${barang.gambar}`;
            // Tambahkan onerror untuk fallback jika gambar tidak ditemukan
            gambarHtml = `
                <img src="${gambarUrl}" 
                     class="w-16 h-16 object-cover rounded-lg border" 
                     alt="${escapeHtml(barang.nama)}" 
                     onerror="this.onerror=null; this.src='https://placehold.co/400x400/teal/white?text=No+Image'; this.classList.add('opacity-50');">
            `;
        } else {
            gambarHtml = `
                <span class="text-gray-400 text-sm">
                    <i class="fas fa-image mr-1"></i>Tidak ada
                </span>
            `;
        }

        // Badge QR (P14)
        const badgeQr = barang.kode_qr
            ? `<span class="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">${escapeHtml(barang.kode_qr)}</span>`
            : '<span class="text-xs text-gray-400">-</span>';

        // Link Maps (P14)
        let linkMaps = '<span class="text-xs text-gray-400">-</span>';
        if (barang.latitude && barang.longitude) {
            const url = `https://maps.google.com/?q=${barang.latitude},${barang.longitude}`;
            linkMaps = `
                <div class="text-xs text-gray-500">
                    ${parseFloat(barang.latitude).toFixed(4)}, ${parseFloat(barang.longitude).toFixed(4)}
                </div>
                <a href="${url}" target="_blank" 
                   class="text-blue-600 hover:text-blue-800 text-xs font-semibold">
                    🗺️ Buka Map
                </a>
            `;
        }

        tbody.innerHTML += `
            <tr class="bg-white shadow-md hover:shadow-xl transition rounded-2xl" id="row-${id}">
                <td class="px-4 py-4 rounded-l-2xl text-gray-500 font-medium">${nomorUrut}</td>
                <td class="px-4 py-4">
                    <div class="font-semibold text-gray-700">${escapeHtml(barang.nama)}</div>
                    <div class="mt-1">${badgeQr}</div>
                </td>
                <td class="px-4 py-4">
                    ${gambarHtml}
                </td>
                <td class="px-4 py-4 text-cyan-600 font-semibold">Rp ${formatRupiah(barang.harga)}</td>
                <td class="px-4 py-4">
                    <span class="px-3 py-1 rounded-full text-xs ${stokClass}">
                        ${barang.stok} unit
                    </span>
                </td>
                <td class="px-4 py-4 text-center">${linkMaps}</td>
                <td class="px-4 py-4 rounded-r-2xl flex gap-3">
                    <button onclick='editBarang(${id}, ${JSON.stringify(escapeHtml(barang.nama))}, ${barang.harga}, ${barang.stok}, ${JSON.stringify(barang.gambar || "")})' 
                            class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded-lg transition">
                        ✏️ Edit
                    </button>
                    <button onclick="hapusBarang(${id})" 
                            class="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-lg transition">
                        🗑 Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}

// ============================================
// DASHBOARD CHART
// ============================================

async function renderDashboard() {
    try {
        console.log('📊 Fetching chart data...');

        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js belum di-load!');
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
                            font: { size: 12, weight: 'bold' },
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
                            }
                        },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
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
    }
}

function refreshChart() {
    console.log('🔄 Refresh chart...');
    renderDashboard();
}

// ========== FUNGSI CETAK LAPORAN ==========
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
// SMART QR GATEWAY - P14
// ============================================

// 1. BUKA MODAL SCANNER
function bukaModalQrScan(mode) {
    _qrLastResult = null;

    const modal = document.getElementById('modal-qr-scan');
    const title = document.getElementById('qr-modal-title');
    const hint = document.getElementById('qr-modal-hint');

    if (mode === 'tambah') {
        title.textContent = '📷 Scan QR -> Tambah Barang';
        hint.textContent = 'Jika belum ada, form tambah akan terbuka otomatis.';
    } else {
        title.textContent = '📷 Scan QR -> Cari Barang';
        hint.textContent = 'Jika ada di database, barang langsung ditampilkan.';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    document.getElementById('qr-status-box').style.display = 'none';
    document.getElementById('qr-reader-main').innerHTML = '';

    setTimeout(initMainQrScanner, 300);
}

// 2. INIT SCANNER
function initMainQrScanner() {
    if (_mainQrScanner) {
        _mainQrScanner.clear();
        _mainQrScanner = null;
    }

    const readerElement = document.getElementById('qr-reader-main');
    readerElement.innerHTML = '';

    _mainQrScanner = new Html5QrcodeScanner(
        'qr-reader-main',
        { fps: 10, qrbox: { width: 240, height: 240 } },
        false
    );

    _mainQrScanner.render(
        async function (decodedText) {
            console.log('📱 QR Terbaca:', decodedText);
            _mainQrScanner.pause(true);

            tampilQrStatus(decodedText, 'loading');

            try {
                const response = await fetch(`${API_URL}/barang.php?kode_qr=${encodeURIComponent(decodedText)}`, {
                    headers: { 'X-Auth-Token': token }
                });
                const hasil = await response.json();

                if (hasil.status === 'success' && hasil.data) {
                    _qrLastResult = { kodeQr: decodedText, barang: hasil.data };
                    tampilQrStatus(decodedText, 'found', hasil.data);
                } else {
                    _qrLastResult = { kodeQr: decodedText, barang: null };
                    tampilQrStatus(decodedText, 'notfound');
                }
            } catch (error) {
                console.error('❌ Error cek QR:', error);
                _qrLastResult = { kodeQr: decodedText, barang: null };
                tampilQrStatus(decodedText, 'notfound');
            }
        },
        function (error) { }
    );
}

// 3. TAMPILKAN STATUS
function tampilQrStatus(kode, state, barang) {
    const box = document.getElementById('qr-status-box');
    box.style.display = 'block';
    document.getElementById('qr-scanned-text').textContent = '📱 ' + kode;

    ['qr-state-loading', 'qr-state-found', 'qr-state-notfound'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    if (state === 'loading') {
        document.getElementById('qr-state-loading').style.display = 'block';
    } else if (state === 'found' && barang) {
        document.getElementById('qr-found-nama').textContent = barang.nama;
        document.getElementById('qr-found-harga').textContent = 'Rp ' + formatRupiah(barang.harga);
        document.getElementById('qr-state-found').style.display = 'block';
    } else {
        document.getElementById('qr-state-notfound').style.display = 'block';
    }
}

// 4. EKSEKUSI: FOUND
function eksekusiQrFound() {
    if (!_qrLastResult) return;

    const kode = _qrLastResult.kodeQr;
    const barang = _qrLastResult.barang;

    if (inputCari) {
        inputCari.value = kode;
        inputCari.dispatchEvent(new Event('keyup', { bubbles: true }));
    }

    tutupModalQrScan();

    setTimeout(() => {
        if (barang && barang.id) {
            const rows = document.querySelectorAll('#daftar-barang tr');
            rows.forEach(row => {
                if (row.innerHTML.includes(`row-${barang.id}`)) {
                    row.style.transition = 'background 2.5s';
                    row.style.background = '#d1fae5';
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => row.style.background = '', 2500);
                }
            });
        }
    }, 600);

    alert('✅ Barang ditemukan: ' + barang.nama);
}

// 5. EKSEKUSI: TAMBAH BARU
function eksekusiQrTambah() {
    if (!_qrLastResult) return;

    const kode = _qrLastResult.kodeQr;
    tutupModalQrScan();

    const qrInput = document.getElementById('form-kode-qr');
    if (qrInput) {
        qrInput.value = kode;
        qrInput.style.borderColor = '#059669';
        qrInput.style.borderWidth = '2px';
        setTimeout(() => {
            qrInput.style.borderColor = '';
            qrInput.style.borderWidth = '';
        }, 2000);
    }

    setTimeout(() => {
        const namaInput = document.getElementById('nama');
        if (namaInput) namaInput.focus();
    }, 300);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('📦 Kode QR terisi. Silakan lengkapi nama dan harga!');
}

// 6. RESET SCANNER
function resetQrScanner() {
    if (_mainQrScanner) {
        _mainQrScanner.clear();
        _mainQrScanner = null;
    }
    document.getElementById('qr-reader-main').innerHTML = '';
    document.getElementById('qr-status-box').style.display = 'none';
    setTimeout(initMainQrScanner, 300);
}

// 7. TUTUP MODAL
function tutupModalQrScan() {
    if (_mainQrScanner) {
        _mainQrScanner.clear();
        _mainQrScanner = null;
    }
    document.getElementById('qr-reader-main').innerHTML = '';
    document.getElementById('qr-status-box').style.display = 'none';
    document.getElementById('modal-qr-scan').classList.add('hidden');
    document.getElementById('modal-qr-scan').classList.remove('flex');
}

// 8. GEOLOKASI GPS
function dapatkanLokasi() {
    const btnGps = document.getElementById('btn-lacak-gps');
    const inputLat = document.getElementById('form-latitude');
    const inputLng = document.getElementById('form-longitude');

    if (!navigator.geolocation) {
        alert('❌ Browser tidak mendukung Geolocation.');
        return;
    }

    btnGps.disabled = true;
    btnGps.innerHTML = '⏳ Melacak...';

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const lat = position.coords.latitude.toFixed(7);
            const lng = position.coords.longitude.toFixed(7);
            if (inputLat) inputLat.value = lat;
            if (inputLng) inputLng.value = lng;
            btnGps.innerHTML = '✅ Lokasi Terkunci';
            btnGps.className = 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition mb-2';
            btnGps.disabled = false;
            alert('📍 GPS berhasil dikunci!\nLatitude: ' + lat + '\nLongitude: ' + lng);
        },
        function (error) {
            console.error('❌ GPS Error:', error);
            let msg = 'Gagal mendapatkan lokasi. ';
            if (error.code === 1) msg += 'Izin ditolak. Berikan izin lokasi.';
            else if (error.code === 2) msg += 'Sinyal GPS lemah. Coba di luar ruangan.';
            else if (error.code === 3) msg += 'Waktu habis. Coba lagi.';
            alert('❌ ' + msg);
            btnGps.innerHTML = '🛰️ Lacak GPS Saya';
            btnGps.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition mb-2';
            btnGps.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
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
    // Fetch data lengkap dari API untuk mendapatkan QR dan GPS
    fetch(`${API_URL}/barang.php?id=${id}`, {
        headers: { 'X-Auth-Token': token }
    })
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success' && result.data) {
                const data = result.data;
                document.getElementById('barang-id').value = data.id;
                document.getElementById('nama').value = data.nama;
                document.getElementById('harga').value = data.harga;
                document.getElementById('stok').value = data.stok;
                document.getElementById('form-kode-qr').value = data.kode_qr || '';
                document.getElementById('form-latitude').value = data.latitude || '';
                document.getElementById('form-longitude').value = data.longitude || '';

                editMode = true;
                if (btnSubmit) {
                    btnSubmit.innerHTML = '<i class="fas fa-edit mr-2"></i> Update Barang';
                    btnSubmit.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition text-white font-semibold px-5 py-3 rounded-xl shadow-lg';
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('❌ Gagal mengambil data barang untuk diedit');
            }
        })
        .catch(error => {
            console.error('❌ Error fetch detail:', error);
            alert('❌ Gagal mengambil data barang');
        });
}

// 4. Submit Form
if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        formData.append('token', token);

        let url = `${API_URL}/barang.php`;
        let method = 'POST';

        if (editMode) {
            method = 'PUT';
            const idField = document.getElementById('barang-id');
            if (idField) formData.append('id', idField.value);
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
        }

        try {
            let response;
            if (method === 'POST') {
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'X-Auth-Token': token },
                    body: formData
                });
            } else {
                // PUT: convert FormData to URLSearchParams
                const params = new URLSearchParams();
                for (let [key, value] of formData.entries()) {
                    params.append(key, value);
                }
                response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'X-Auth-Token': token,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params
                });
            }

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

            if (data.status === 'error' && data.message === 'Token tidak valid') {
                localStorage.removeItem('token');
                alert('Session login sudah tidak valid. Silakan login kembali.');
                window.location.href = 'login.html';
                return;
            }

            if (data.status === 'success') {
                alert(editMode ? '✅ Barang berhasil diupdate' : '✅ Barang berhasil ditambahkan');
                form.reset();
                document.getElementById('barang-id').value = '';
                document.getElementById('form-kode-qr').value = '';
                document.getElementById('form-latitude').value = '';
                document.getElementById('form-longitude').value = '';
                editMode = false;
                if (btnSubmit) {
                    btnSubmit.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan';
                    btnSubmit.className = 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:scale-105 transition text-white font-semibold px-5 py-3 rounded-xl shadow-lg';
                }
                fetchData(currentKeyword, currentPage);
                setTimeout(renderDashboard, 500);
            } else {
                alert('❌ ' + (data.message || 'Gagal menyimpan data'));
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
            const response = await fetch(`${API_URL}/barang.php`, {
                method: 'DELETE',
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `id=${id}`
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

            if (data.status === 'success') {
                alert('✅ Barang berhasil dihapus');
                fetchData(currentKeyword, currentPage);
                setTimeout(renderDashboard, 500);
            } else {
                alert('❌ ' + (data.message || 'Gagal menghapus'));
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

// P14 Functions
window.bukaModalQrScan = bukaModalQrScan;
window.tutupModalQrScan = tutupModalQrScan;
window.initMainQrScanner = initMainQrScanner;
window.tampilQrStatus = tampilQrStatus;
window.eksekusiQrFound = eksekusiQrFound;
window.eksekusiQrTambah = eksekusiQrTambah;
window.resetQrScanner = resetQrScanner;
window.dapatkanLokasi = dapatkanLokasi;

window.formatRupiah = formatRupiah;
window.currentKeyword = currentKeyword;
window.currentPage = currentPage;

console.log('✅ App.js loaded successfully!');
console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'Tidak ada');
console.log('🌐 API_URL:', API_URL);
console.log('✅ Smart QR Gateway ready!');