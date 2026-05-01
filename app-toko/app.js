// ===============================
// KONFIGURASI API
// ===============================
const API_URL = 'http://localhost/api-toko';

// ===============================
// DOM ELEMENT
// ===============================
const tbody = document.getElementById('daftar-barang');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// ===============================
// FORMAT RUPIAH
// ===============================
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

// ===============================
// FETCH DATA (READ)
// ===============================
async function fetchData() {
    try {
        loading.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        tbody.innerHTML = '';

        const response = await fetch(`${API_URL}/barang.php`);
        const data = await response.json();

        loading.classList.add('hidden');

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-gray-400 py-4">
                        Tidak ada data
                    </td>
                </tr>
            `;
            return;
        }

        // LOOP DATA
        data.forEach((barang, index) => {

            const stokClass = barang.stok > 0
                ? 'bg-teal-100 text-teal-700'
                : 'bg-gray-200 text-gray-500';

            const row = `
                <tr class="bg-white/80 hover:bg-blue-50 transition rounded-xl shadow-sm">

                    <td class="px-4 py-3 text-gray-500 font-medium">
                        ${index + 1}
                    </td>

                    <td class="px-4 py-3 font-semibold text-gray-700">
                        ${barang.nama}
                    </td>

                    <td class="px-4 py-3 text-blue-600 font-medium">
                        Rp ${formatRupiah(barang.harga)}
                    </td>

                    <td class="px-4 py-3">
                        <span class="px-3 py-1 rounded-full text-xs ${stokClass}">
                            ${barang.stok} unit
                        </span>
                    </td>

                    <td class="px-4 py-3">
                        <button onclick="hapusBarang(${barang.id})"
                            class="text-red-400 hover:text-red-600 transition">
                            Hapus
                        </button>
                    </td>

                </tr>
            `;

            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error('Error:', error);
        loading.classList.add('hidden');
        errorDiv.classList.remove('hidden');
    }
}

// ===============================
// TAMBAH DATA (CREATE)
// ===============================
document.getElementById('form-barang').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch(`${API_URL}/tambah_barang.php`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Barang berhasil ditambahkan');
            this.reset();
            fetchData();
        } else {
            alert('❌ ' + (data.error || 'Gagal menambahkan'));
        }

    } catch (error) {
        alert('❌ Koneksi ke server gagal');
        console.error(error);
    }
});

// ===============================
// HAPUS DATA (DELETE)
// ===============================
async function hapusBarang(id) {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;

    try {
        const formData = new FormData();
        formData.append('id', id);

        const response = await fetch(`${API_URL}/hapus_barang.php`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Barang berhasil dihapus');
            fetchData();
        } else {
            alert('❌ ' + (data.error || 'Gagal menghapus'));
        }

    } catch (error) {
        alert('❌ Koneksi gagal');
        console.error(error);
    }
}

// ===============================
// LOAD AWAL
// ===============================
document.addEventListener('DOMContentLoaded', fetchData);

// ===============================
// SERVICE WORKER (PWA)
// ===============================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker aktif'))
        .catch(err => console.log('Service Worker gagal', err));
}