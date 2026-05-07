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

$id    = $_POST['id'] ?? '';
$nama  = $_POST['nama'] ?? '';
$harga = $_POST['harga'] ?? '';
$stok  = $_POST['stok'] ?? '';

if ($id == '' || $nama == '' || $harga == '' || $stok == '') {
    echo json_encode(["error" => "Data tidak lengkap"]);
    exit;
}

$stmt = $conn->prepare(
    "UPDATE barang SET nama=?, harga=?, stok=? WHERE id=?"
);

$stmt->bind_param("siii", $nama, $harga, $stok, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Gagal update"]);
}

$stmt->close();
$conn->close();
?>