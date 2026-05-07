// ===============================
// KONFIGURASI API
// ===============================
const API_URL = 'https://pwa-naufal.infinityfreeapp.com/api-toko';

// ===============================
// DOM ELEMENT
// ===============================
const tbody = document.getElementById('daftar-barang');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

const form = document.getElementById('form-barang');
const btnSubmit = document.getElementById('btn-submit');

let editMode = false;

// ===============================
// FORMAT RUPIAH
// ===============================
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

// ===============================
// FETCH DATA
// ===============================
async function fetchData() {

    try {

        loading.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        tbody.innerHTML = '';

        const response = await fetch(`${API_URL}/barang.php`);

        const text = await response.text();

        console.log("Response API:", text);

        let data = [];

        try {

            data = JSON.parse(text);

        } catch (e) {

            throw new Error("Response bukan JSON");

        }

        loading.classList.add('hidden');

        // CEK JIKA DATA KOSONG
        if (data.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5"
                        class="text-center text-gray-400 py-6">
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
                <tr class="bg-white shadow-md hover:shadow-xl transition rounded-2xl">

                    <td class="px-4 py-4 rounded-l-2xl text-gray-500">
                        ${index + 1}
                    </td>

                    <td class="px-4 py-4 font-semibold text-gray-700">
                        ${barang.nama}
                    </td>

                    <td class="px-4 py-4 text-cyan-600 font-semibold">
                        Rp ${formatRupiah(barang.harga)}
                    </td>

                    <td class="px-4 py-4">

                        <span class="px-3 py-1 rounded-full text-xs ${stokClass}">
                            ${barang.stok} unit
                        </span>

                    </td>

                    <td class="px-4 py-4 rounded-r-2xl flex gap-3">

                        <button
                            onclick='editBarang(
                                ${barang.id},
                                ${JSON.stringify(barang.nama)},
                                ${barang.harga},
                                ${barang.stok}
                            )'
                            class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded-lg transition"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            onclick="hapusBarang(${barang.id})"
                            class="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-lg transition"
                        >
                            🗑 Hapus
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
// EDIT DATA
// ===============================
function editBarang(id, nama, harga, stok) {

    document.getElementById('barang-id').value = id;

    document.getElementById('nama').value = nama;

    document.getElementById('harga').value = harga;

    document.getElementById('stok').value = stok;

    editMode = true;

    btnSubmit.innerText = 'Update Barang';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}

// ===============================
// TAMBAH / UPDATE DATA
// ===============================
form.addEventListener('submit', async function (e) {

    e.preventDefault();

    const formData = new FormData(this);

    let url = `${API_URL}/tambah_barang.php`;

    // MODE EDIT
    if (editMode) {

        url = `${API_URL}/update_barang.php`;

        formData.append(
            'id',
            document.getElementById('barang-id').value
        );

    }

    try {

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();

        console.log("Response:", text);

        let data = {};

        try {

            data = JSON.parse(text);

        } catch (e) {

            throw new Error("Response bukan JSON");

        }

        if (data.success) {

            alert(
                editMode
                    ? '✅ Barang berhasil diupdate'
                    : '✅ Barang berhasil ditambahkan'
            );

            // RESET FORM
            form.reset();

            document.getElementById('barang-id').value = '';

            editMode = false;

            btnSubmit.innerText = 'Simpan';

            fetchData();

        } else {

            alert('❌ ' + (data.error || 'Gagal'));

        }

    } catch (error) {

        console.error(error);

        alert('❌ Koneksi gagal');

    }

});

// ===============================
// HAPUS DATA
// ===============================
async function hapusBarang(id) {

    if (!confirm('Yakin ingin menghapus barang ini?')) {
        return;
    }

    try {

        const formData = new FormData();

        formData.append('id', id);

        const response = await fetch(
            `${API_URL}/hapus_barang.php`,
            {
                method: 'POST',
                body: formData
            }
        );

        const text = await response.text();

        console.log("Hapus Response:", text);

        let data = {};

        try {

            data = JSON.parse(text);

        } catch (e) {

            throw new Error("Response bukan JSON");

        }

        if (data.success) {

            alert('✅ Barang berhasil dihapus');

            fetchData();

        } else {

            alert('❌ ' + (data.error || 'Gagal menghapus'));

        }

    } catch (error) {

        console.error(error);

        alert('❌ Koneksi gagal');

    }

}

// ===============================
// LOAD AWAL
// ===============================
document.addEventListener(
    'DOMContentLoaded',
    fetchData
);

// ===============================
// SERVICE WORKER
// ===============================
if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker aktif'))
        .catch(err => console.log('Service Worker gagal', err));

}