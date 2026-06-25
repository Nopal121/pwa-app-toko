<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Matikan error biar JSON bersih
error_reporting(0);
ini_set('display_errors', 0);

// 1. KONEKSI DATABASE (InfinityFree)
$host = "sql113.infinityfree.com";
$user = "if0_41677217";
$pass = "webnopal12345";
$db   = "if0_41677217_nopal_toko";

$koneksi = mysqli_connect($host, $user, $pass, $db);

if (!$koneksi) {
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database gagal: " . mysqli_connect_error()
    ]);
    exit;
}

mysqli_set_charset($koneksi, "utf8mb4");

// 2. TANGKAP PARAMETER DARI URL (GET)
$cari = isset($_GET['cari']) ? trim($_GET['cari']) : '';
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

// Validasi halaman minimal 1
if ($page < 1) $page = 1;

$limit = 5; // Tampilkan 5 data per halaman (bisa diubah sesuai kebutuhan)
$offset = ($page - 1) * $limit;

// 3. HITUNG TOTAL DATA (untuk mengetahui jumlah halaman)
// Gunakan prepared statement untuk keamanan dari SQL Injection
if (!empty($cari)) {
    $stmt_total = mysqli_prepare($koneksi, "SELECT COUNT(id) FROM barang WHERE nama LIKE CONCAT('%', ?, '%')");
    mysqli_stmt_bind_param($stmt_total, "s", $cari);
} else {
    $stmt_total = mysqli_prepare($koneksi, "SELECT COUNT(id) FROM barang");
}

mysqli_stmt_execute($stmt_total);
mysqli_stmt_bind_result($stmt_total, $total_data);
mysqli_stmt_fetch($stmt_total);
mysqli_stmt_close($stmt_total);

$total_page = ceil($total_data / $limit);

// 4. AMBIL DATA SESUAI PENCARIAN & HALAMAN
if (!empty($cari)) {
    $query = "SELECT id, nama, harga, stok, gambar 
              FROM barang 
              WHERE nama LIKE CONCAT('%', ?, '%') 
              ORDER BY id DESC 
              LIMIT ? OFFSET ?";
    $stmt = mysqli_prepare($koneksi, $query);
    mysqli_stmt_bind_param($stmt, "sii", $cari, $limit, $offset);
} else {
    $query = "SELECT id, nama, harga, stok, gambar 
              FROM barang 
              ORDER BY id DESC 
              LIMIT ? OFFSET ?";
    $stmt = mysqli_prepare($koneksi, $query);
    mysqli_stmt_bind_param($stmt, "ii", $limit, $offset);
}

mysqli_stmt_execute($stmt);
$hasil = mysqli_stmt_get_result($stmt);

$data_barang = [];
while ($row = mysqli_fetch_assoc($hasil)) {
    $data_barang[] = $row;
}

mysqli_stmt_close($stmt);
mysqli_close($koneksi);

// 5. KIRIM RESPONSE JSON + METADATA HALAMAN
echo json_encode([
    "status" => "success",
    "data" => $data_barang,
    "total_halaman" => $total_page,
    "halaman_saat_ini" => $page,
    "total_data" => $total_data
]);
?>