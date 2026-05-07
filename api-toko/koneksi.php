<?php
// Mengizinkan akses dari domain luar (CORS) - Penting untuk API!
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Deklarasi parameter koneksi
$host = "localhost";
$user = "root";
$pass = ""; // Kosongkan jika XAMPP bawaan
$db   = "db_toko";

// Membuka jembatan koneksi
$koneksi = mysqli_connect($host, $user, $pass, $db);

// Cek jika koneksi gagal
if (!$koneksi) {
    die(json_encode(["status" => "error", "pesan" => "Koneksi Database Gagal!"]));
}
?>