<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// AKTIFKAN ERROR BIAR KELIHATAN
error_reporting(E_ALL);
ini_set('display_errors', 1);

// KONEKSI
$conn = new mysqli(
    "sql113.infinityfree.com",
    "if0_41677217",
    "webnopal12345",
    "if0_41677217_nopal_toko"
);

// CEK KONEKSI
if ($conn->connect_error) {
    die(json_encode([
        "error" => "Koneksi gagal",
        "detail" => $conn->connect_error
    ]));
}

// QUERY
$result = $conn->query("SELECT * FROM barang");

// CEK QUERY
if (!$result) {
    die(json_encode([
        "error" => "Query gagal",
        "detail" => $conn->error
    ]));
}

// AMBIL DATA
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// OUTPUT
echo json_encode($data);
?>