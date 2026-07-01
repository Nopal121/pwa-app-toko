<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(0);
ini_set('display_errors', 0);

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

// ========== AMBIL 5 BARANG TERMAHAL ==========
$query = "SELECT nama, harga FROM barang ORDER BY harga DESC LIMIT 5";
$hasil = mysqli_query($koneksi, $query);

if (!$hasil) {
    echo json_encode([
        "status" => "error",
        "message" => "Query gagal: " . mysqli_error($koneksi)
    ]);
    mysqli_close($koneksi);
    exit;
}

$labels = []; // Sumbu X (Nama Barang)
$values = []; // Sumbu Y (Harga)

while ($row = mysqli_fetch_assoc($hasil)) {
    $labels[] = $row['nama'];
    $values[] = (int)$row['harga'];
}

mysqli_close($koneksi);

echo json_encode([
    "status" => "success",
    "chart_data" => [
        "labels" => $labels,
        "values" => $values
    ]
]);
?>