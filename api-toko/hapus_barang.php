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

// Ambil ID
$id = $_POST['id'] ?? '';

if ($id == '') {
    echo json_encode(["error" => "ID tidak valid"]);
    exit;
}

// Query delete
$stmt = $conn->prepare("DELETE FROM barang WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Gagal menghapus"]);
}

$stmt->close();
$conn->close();
?>