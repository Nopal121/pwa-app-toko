<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Auth-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(0);
ini_set('display_errors', 0);

// ========== KONEKSI DATABASE ==========
$host = "sql113.infinityfree.com";
$user = "if0_41677217";
$pass = "webnopal12345";
$db   = "if0_41677217_nopal_toko";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]);
    exit;
}

mysqli_set_charset($conn, "utf8mb4");

// ========== AUTO-MIGRATE: CEK KOLOM P14 ==========
function ensureP14Columns($conn) {
    $columns = ['kode_qr', 'latitude', 'longitude'];
    foreach ($columns as $col) {
        $check = $conn->query("SHOW COLUMNS FROM barang LIKE '$col'");
        if ($check->num_rows === 0) {
            $type = $col === 'kode_qr' ? "VARCHAR(255) NULL" : "VARCHAR(50) NULL";
            $conn->query("ALTER TABLE barang ADD COLUMN $col $type");
            error_log("✅ Kolom $col ditambahkan");
        }
    }
}
ensureP14Columns($conn);

// ========== VALIDASI TOKEN ==========
$token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_GET['token'] ?? '';

if (empty($token)) {
    echo json_encode([
        "status" => "error",
        "message" => "Akses Ditolak! Token tidak ditemukan."
    ]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("SELECT id, username FROM users WHERE token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Token tidak valid. Silakan login kembali."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}
$user_data = $result->fetch_assoc();
$stmt->close();

// ========== HANDLE REQUEST METHOD ==========
$method = $_SERVER['REQUEST_METHOD'];
$response = [];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $kodeQr = $_GET['kode_qr'] ?? null;
        $search = $_GET['search'] ?? '';
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = 5;
        $offset = ($page - 1) * $limit;

        // GET by ID
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM barang WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result->fetch_assoc();
            echo json_encode([
                "status" => "success",
                "data" => $data
            ]);
            $stmt->close();
            break;
        }

        // GET by QR Code (Smart Gateway)
        if ($kodeQr) {
            $stmt = $conn->prepare("SELECT * FROM barang WHERE kode_qr = ? LIMIT 1");
            $stmt->bind_param("s", trim($kodeQr));
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result->fetch_assoc();
            
            if ($data) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Barang ditemukan",
                    "data" => $data
                ]);
            } else {
                echo json_encode([
                    "status" => "not_found",
                    "message" => "Barang belum terdaftar"
                ]);
            }
            $stmt->close();
            break;
        }

        // GET All (dengan search & pagination)
        $where = "";
        $params = [];
        $types = "";

        if (!empty($search)) {
            $where = " WHERE nama LIKE ? OR kode_qr LIKE ?";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $types = "ss";
        }

        // Hitung total
        $sqlCount = "SELECT COUNT(*) as total FROM barang $where";
        $stmt = $conn->prepare($sqlCount);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $totalResult = $stmt->get_result();
        $totalRow = $totalResult->fetch_assoc();
        $totalData = $totalRow['total'];
        $totalPages = ceil($totalData / $limit);
        $stmt->close();

        // Ambil data
        $sql = "SELECT id, nama, harga, stok, gambar, kode_qr, latitude, longitude 
                FROM barang $where ORDER BY id DESC LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($sql);
        
        $bindParams = array_merge($params, [$limit, $offset]);
        $bindTypes = $types . "ii";
        
        if (!empty($params)) {
            $stmt->bind_param($bindTypes, ...$bindParams);
        } else {
            $stmt->bind_param("ii", $limit, $offset);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        $stmt->close();

        echo json_encode([
            "status" => "success",
            "data" => $data,
            "total_halaman" => $totalPages,
            "halaman_saat_ini" => $page,
            "total_data" => $totalData
        ]);
        break;

    case 'POST':
        $nama = trim($_POST['nama'] ?? '');
        $harga = $_POST['harga'] ?? 0;
        $stok = $_POST['stok'] ?? 0;
        $kodeQr = trim($_POST['kode_qr'] ?? '');
        $latitude = trim($_POST['latitude'] ?? '');
        $longitude = trim($_POST['longitude'] ?? '');
        $gambar = '';

        if (empty($nama) || $harga <= 0) {
            echo json_encode([
                "status" => "error",
                "message" => "Nama dan harga harus diisi"
            ]);
            break;
        }

        // Upload gambar
        if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === 0) {
            $folder = __DIR__ . '/uploads/';
            if (!is_dir($folder)) mkdir($folder, 0755, true);
            
            $ext = strtolower(pathinfo($_FILES['gambar']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            
            if (in_array($ext, $allowed)) {
                $namaFile = time() . '_' . uniqid() . '.' . $ext;
                if (move_uploaded_file($_FILES['gambar']['tmp_name'], $folder . $namaFile)) {
                    $gambar = $namaFile;
                }
            }
        }

        $stmt = $conn->prepare(
            "INSERT INTO barang (nama, harga, stok, gambar, kode_qr, latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("siissss", $nama, $harga, $stok, $gambar, $kodeQr, $latitude, $longitude);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Barang berhasil ditambahkan",
                "id" => $stmt->insert_id
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Gagal menambahkan: " . $stmt->error
            ]);
        }
        $stmt->close();
        break;

    case 'PUT':
        parse_str(file_get_contents("php://input"), $putData);
        $id = $putData['id'] ?? 0;
        $nama = trim($putData['nama'] ?? '');
        $harga = $putData['harga'] ?? 0;
        $stok = $putData['stok'] ?? 0;
        $kodeQr = trim($putData['kode_qr'] ?? '');
        $latitude = trim($putData['latitude'] ?? '');
        $longitude = trim($putData['longitude'] ?? '');

        if (empty($id) || empty($nama) || $harga <= 0) {
            echo json_encode([
                "status" => "error",
                "message" => "Data tidak lengkap"
            ]);
            break;
        }

        $stmt = $conn->prepare(
            "UPDATE barang SET nama=?, harga=?, stok=?, kode_qr=?, latitude=?, longitude=? WHERE id=?"
        );
        $stmt->bind_param("siisssi", $nama, $harga, $stok, $kodeQr, $latitude, $longitude, $id);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Barang berhasil diupdate"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Gagal update: " . $stmt->error
            ]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        parse_str(file_get_contents("php://input"), $deleteData);
        $id = $deleteData['id'] ?? 0;

        if (empty($id)) {
            echo json_encode([
                "status" => "error",
                "message" => "ID tidak valid"
            ]);
            break;
        }

        // Ambil gambar untuk dihapus
        $stmt = $conn->prepare("SELECT gambar FROM barang WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        if (!empty($data['gambar'])) {
            $file = __DIR__ . "/uploads/" . $data['gambar'];
            if (file_exists($file)) unlink($file);
        }
        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM barang WHERE id=?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Barang berhasil dihapus"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Gagal hapus: " . $stmt->error
            ]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode([
            "status" => "error",
            "message" => "Method tidak diizinkan"
        ]);
}

$conn->close();
?>