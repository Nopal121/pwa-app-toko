<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'auth.php';

$host = "sql113.infinityfree.com";
$user = "if0_41677217";
$pass = "webnopal12345";
$db   = "if0_41677217_nopal_toko";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]);
    exit;
}

$id = $_POST['id'] ?? '';

if (empty($id) || !is_numeric($id)) {
    echo json_encode([
        "success" => false,
        "message" => "ID tidak valid"
    ]);
    $conn->close();
    exit;
}

// Ambil nama file gambar
$stmt = $conn->prepare("SELECT gambar FROM barang WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$data = $result->fetch_assoc();
$gambar = $data['gambar'] ?? '';
$stmt->close();

// Hapus file gambar
if (!empty($gambar)) {
    $file = __DIR__ . "/uploads/" . $gambar;
    if (file_exists($file)) {
        unlink($file);
    }
}

// Hapus data
$stmt = $conn->prepare("DELETE FROM barang WHERE id=?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Barang berhasil dihapus"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Gagal menghapus: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>