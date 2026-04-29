<?php
header("Content-Type: application/json");

// koneksi database (sesuaikan nama DB kamu)
$conn = new mysqli("localhost", "root", "", "toko_barang");

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Koneksi gagal"]);
    exit();
}

// ambil ID dari POST
$id = $_POST['id'] ?? 0;

if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "ID tidak valid"]);
    exit();
}

// query hapus
$sql = "DELETE FROM barang WHERE id = $id";

if ($conn->query($sql)) {
    echo json_encode(["status" => "success", "message" => "Data berhasil dihapus"]);
} else {
    echo json_encode(["status" => "error", "message" => "Gagal menghapus data"]);
}

$conn->close();
?>