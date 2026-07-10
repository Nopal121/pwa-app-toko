<?php

error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

// ========== KONEKSI INFINITYFREE ==========
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

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Username dan password harus diisi"
    ]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("SELECT * FROM users WHERE username=? AND password=?");
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $token = bin2hex(random_bytes(32));
    
    $update = $conn->prepare("UPDATE users SET token=? WHERE username=?");
    $update->bind_param("ss", $token, $username);
    
    if ($update->execute()) {
        echo json_encode([
            "success" => true,
            "token" => $token,
            "message" => "Login berhasil"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Gagal generate token"
        ]);
    }
    $update->close();
} else {
    echo json_encode([
        "success" => false,
        "message" => "Username atau Password salah"
    ]);
}

$stmt->close();
$conn->close();
?>