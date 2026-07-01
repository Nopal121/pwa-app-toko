<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========== KONEKSI INFINITYFREE ==========
$host = "sql113.infinityfree.com";
$user = "if0_41677217";
$pass = "webnopal12345";
$db   = "if0_41677217_nopal_toko";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]));
}

$token = $_POST['token'] ?? '';

if (empty($token)) {
    echo json_encode([
        "success" => false,
        "message" => "Akses Ditolak! Token tidak ditemukan."
    ]);
    exit;
}

$stmt = $conn->prepare("SELECT id, username FROM users WHERE token=?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Token tidak valid. Silakan login kembali."
    ]);
    exit;
}

$user_data = $result->fetch_assoc();
$GLOBALS['current_user'] = $user_data;

$stmt->close();
?>