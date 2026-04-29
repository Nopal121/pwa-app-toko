// ===============================
// KONFIGURASI API
// ===============================
const API_URL = 'http://localhost/api-toko/barang.php';

// ===============================
// DOM
// ===============================
const tbody = document.getElementById('daftar-barang');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const form = document.getElementById('form-barang');

// ===============================
// FORMAT RUPIAH
// ===============================
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

// ===============================
// RENDER DATA
// ===============================
function renderData(data) {
    tbody.innerHTML = '';

    data.forEach(barang => {
        const row = `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${barang.id}</td>
            <td class="px-6 py-4">${barang.nama}</td>
            <td class="px-6 py-4">Rp ${formatRupiah(barang.harga)}</td>
            <td class="px-6 py-4">${barang.stok}</td>
            <td class="px-6 py-4">
                <button onclick="hapusBarang(${barang.id})"
                    class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    Hapus
                </button>
            </td>
        </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ===============================
// GET DATA
// ===============================
async function fetchData() {
    try {
        loading.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        const response = await fetch(API_URL);

        if (!response.ok) throw new Error();

        const data = await response.json();

        // simpan ke localStorage
        localStorage.setItem('dataBarang', JSON.stringify(data));

        renderData(data);

        loading.classList.add('hidden');

    } catch (error) {
        console.log("Offline mode aktif");

        loading.classList.add('hidden');

        const cached = localStorage.getItem('dataBarang');

        if (cached) {
            renderData(JSON.parse(cached));
            errorDiv.classList.remove('hidden');
            errorDiv.innerHTML = "📴 Mode offline - menampilkan data terakhir";
        } else {
            errorDiv.classList.remove('hidden');
            errorDiv.innerHTML = "❌ Tidak ada data";
        }
    }
}

// ===============================
// TAMBAH DATA
// ===============================
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nama = document.getElementById('nama').value;
    const harga = document.getElementById('harga').value;
    const stok = document.getElementById('stok').value;

    try {
        const response = await fetch('http://localhost/api-toko/tambah_barang.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `nama=${encodeURIComponent(nama)}&harga=${harga}&stok=${stok}`
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert("✅ Data berhasil ditambahkan");
            form.reset();
            fetchData();
        } else {
            alert("❌ " + result.message);
        }

    } catch (error) {
        alert("Terjadi kesalahan koneksi");
    }
});

// ===============================
// HAPUS DATA
// ===============================
async function hapusBarang(id) {
    if (!confirm("Yakin ingin menghapus?")) return;

    try {
        const response = await fetch('http://localhost/api-toko/hapus_barang.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `id=${id}`
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert("✅ Data dihapus");
            fetchData();
        } else {
            alert("❌ " + result.message);
        }

    } catch (error) {
        alert("Terjadi kesalahan koneksi");
    }
}

// ===============================
// INIT
// ===============================
document.addEventListener('DOMContentLoaded', fetchData);

// ===============================
// SERVICE WORKER
// ===============================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/app-toko/sw.js');
}