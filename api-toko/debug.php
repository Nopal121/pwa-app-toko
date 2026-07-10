<?php
// ============================================
// DEBUG.PHP - CEK ERROR DI INFINITYFREE
// ============================================

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Debug Info</h2>";

// Cek koneksi database
$host = "sql113.infinityfree.com";
$user = "if0_41677217";
$pass = "webnopal12345";
$db   = "if0_41677217_nopal_toko";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo "<p style='color:red'>❌ Koneksi gagal: " . $conn->connect_error . "</p>";
} else {
    echo "<p style='color:green'>✅ Koneksi database berhasil</p>";
    
    // Cek tabel barang
    $result = $conn->query("SHOW TABLES");
    echo "<h3>Daftar Tabel:</h3><ul>";
    while ($row = $result->fetch_array()) {
        echo "<li>" . $row[0] . "</li>";
    }
    echo "</ul>";
    
    $conn->close();
}

// Cek folder uploads
$upload_dir = __DIR__ . "/uploads/";
if (is_dir($upload_dir)) {
    echo "<p style='color:green'>✅ Folder uploads ditemukan</p>";
    echo "<p>Path: " . $upload_dir . "</p>";
    echo "<p>Permission: " . substr(sprintf('%o', fileperms($upload_dir)), -4) . "</p>";
} else {
    echo "<p style='color:red'>❌ Folder uploads TIDAK DITEMUKAN</p>";
    mkdir($upload_dir, 0755);
    echo "<p>Folder uploads telah dibuat</p>";
}

// Cek php.ini settings
echo "<h3>PHP Settings:</h3>";
echo "<p>post_max_size: " . ini_get('post_max_size') . "</p>";
echo "<p>upload_max_filesize: " . ini_get('upload_max_filesize') . "</p>";
echo "<p>max_file_uploads: " . ini_get('max_file_uploads') . "</p>";
?>