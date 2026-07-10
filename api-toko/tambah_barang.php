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

$nama = trim($_POST['nama'] ?? '');
$harga = $_POST['harga'] ?? '';
$stok = $_POST['stok'] ?? '';

if (empty($nama) || empty($harga) || empty($stok)) {
    echo json_encode([
        "success" => false,
        "message" => "Data tidak lengkap"
    ]);
    $conn->close();
    exit;
}

// Upload gambar
$gambar = '';
if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === 0 && $_FILES['gambar']['size'] > 0) {
    $folder = __DIR__ . '/uploads/';
    if (!is_dir($folder)) {
        mkdir($folder, 0755, true);
    }
    
    $ext = strtolower(pathinfo($_FILES['gambar']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!in_array($ext, $allowed)) {
        echo json_encode([
            "success" => false,
            "message" => "Format gambar tidak didukung"
        ]);
        $conn->close();
        exit;
    }
    
    $namaFile = time() . '_' . uniqid() . '.' . $ext;
    $tujuan = $folder . $namaFile;
    
    if (move_uploaded_file($_FILES['gambar']['tmp_name'], $tujuan)) {
        $gambar = $namaFile;
    }
}

$stmt = $conn->prepare("INSERT INTO barang (nama, harga, stok, gambar) VALUES (?, ?, ?, ?)");
$stmt->bind_param("siis", $nama, $harga, $stok, $gambar);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Barang berhasil ditambahkan"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Gagal menyimpan: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>