<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(0);

$conn = new mysqli(
    "sql113.infinityfree.com",
    "if0_41677217",
    "webnopal12345",
    "if0_41677217_nopal_toko"
);

if ($conn->connect_error) {
    echo json_encode(["error" => "Koneksi gagal"]);
    exit;
}

// Ambil data dari form
$nama  = $_POST['nama'] ?? '';
$harga = $_POST['harga'] ?? '';
$stok  = $_POST['stok'] ?? '';

// Validasi
if ($nama == '' || $harga == '' || $stok == '') {
    echo json_encode(["error" => "Data tidak lengkap"]);
    exit;
}

// Query insert
$stmt = $conn->prepare("INSERT INTO barang (nama, harga, stok) VALUES (?, ?, ?)");
$stmt->bind_param("sii", $nama, $harga, $stok);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Gagal menambahkan"]);
}

$stmt->close();
$conn->close();
?>