<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = 'localhost';
$dbname = 'toko_barang';
$username = 'root';
$password = '';

try {
    // 🔥 Tambahkan port MySQL kamu di sini juga
    $pdo = new PDO("mysql:host=$host;port=3307;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ambil ID dari POST
    $id = $_POST['id'] ?? 0;

    if ($id <= 0) {
        echo json_encode(["error" => "ID tidak valid"]);
        exit;
    }

    // Hapus data
    $stmt = $pdo->prepare("DELETE FROM barang WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        "success" => true,
        "message" => "Barang berhasil dihapus"
    ]);

} catch(PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>