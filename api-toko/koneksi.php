<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = "sql113.infinityfree.com";
$user = "if0_41677217";
$pass = "webnopal12345";
$db   = "if0_41677217_nopal_toko";

$koneksi = mysqli_connect($host, $user, $pass, $db);

if (!$koneksi) {
    die(json_encode([
        "status" => "error", 
        "pesan" => "Koneksi Database Gagal! " . mysqli_connect_error()
    ]));
}

mysqli_set_charset($koneksi, "utf8mb4");
?>