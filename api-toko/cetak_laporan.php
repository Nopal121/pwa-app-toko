<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Headers: X-Auth-Token, Content-Type");

error_reporting(0);
ini_set('display_errors', 0);

$host = "sql113.infinityfree.com";
$user = "if0_41677217";
$pass = "webnopal12345";
$db   = "if0_41677217_nopal_toko";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]);
    exit;
}

mysqli_set_charset($conn, "utf8mb4");

// ========== VALIDASI TOKEN (DARI HEADER ATAU GET) ==========
$token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_GET['token'] ?? '';

if (empty($token)) {
    echo json_encode([
        "status" => "error",
        "message" => "Akses Ditolak! Token tidak ditemukan."
    ]);
    $conn->close();
    exit;
}

// Cek token di database
$stmt = $conn->prepare("SELECT id, username FROM users WHERE token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Token tidak valid. Silakan login kembali."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$user_data = $result->fetch_assoc();
$stmt->close();

// ========== AMBIL SEMUA DATA BARANG ==========
$query = "SELECT id, nama, harga, stok FROM barang ORDER BY nama ASC";
$result = $conn->query($query);

if (!$result) {
    echo json_encode([
        "status" => "error",
        "message" => "Query gagal: " . $conn->error
    ]);
    $conn->close();
    exit;
}

$data_laporan = [];
$total_aset = 0;

while ($row = $result->fetch_assoc()) {
    $data_laporan[] = $row;
    $total_aset += (int)$row['harga'] * (int)$row['stok'];
}

$conn->close();

// ========== KIRIM RESPONSE ==========
echo json_encode([
    "status" => "success",
    "data" => $data_laporan,
    "total_aset_rupiah" => $total_aset,
    "total_item" => count($data_laporan),
    "user" => $user_data['username']
]);
?>