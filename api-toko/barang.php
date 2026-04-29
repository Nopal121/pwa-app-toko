<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = 'localhost';
$dbname = 'toko_barang';
$username = 'root';
$password = ''; // XAMPP default password kosong

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT id, nama, harga, stok FROM barang ORDER BY id");
    $barang = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($barang);
    
} catch(PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>