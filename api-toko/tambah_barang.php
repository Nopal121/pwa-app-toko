<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = 'localhost';
$dbname = 'toko_barang';
$username = 'root';
$password = '';

try {
    // 🔥 Tambahkan port MySQL kamu di sini
    $pdo = new PDO("mysql:host=$host;port=3307;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ambil data dari POST
    $nama = $_POST['nama'] ?? '';
    $harga = $_POST['harga'] ?? 0;
    $stok = $_POST['stok'] ?? 0;

    // Validasi sederhana
    if ($nama == '' || $harga <= 0 || $stok < 0) {
        echo json_encode(["error" => "Data tidak valid"]);
        exit;
    }

    // Insert ke database
    $stmt = $pdo->prepare("INSERT INTO barang (nama, harga, stok) VALUES (?, ?, ?)");
    $stmt->execute([$nama, $harga, $stok]);

    echo json_encode([
        "success" => true,
        "message" => "Barang berhasil ditambahkan"
    ]);

} catch(PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>