<?php
header("Content-Type: application/json");

// koneksi database
$conn = new mysqli("localhost", "root", "", "toko_barang");

// cek koneksi
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Koneksi gagal"]);
    exit();
}

// ambil data dari POST
$nama = $_POST['nama'] ?? '';
$harga = $_POST['harga'] ?? 0;
$stok = $_POST['stok'] ?? 0;

// validasi sederhana
if ($nama == '' || $harga <= 0) {
    echo json_encode(["status" => "error", "message" => "Data tidak valid"]);
    exit();
}

// insert ke database
$sql = "INSERT INTO barang (nama, harga, stok) VALUES ('$nama', '$harga', '$stok')";

if ($conn->query($sql)) {
    echo json_encode(["status" => "success", "message" => "Barang berhasil ditambahkan"]);
} else {
    echo json_encode(["status" => "error", "message" => "Gagal menambahkan data"]);
}

$conn->close();
?>