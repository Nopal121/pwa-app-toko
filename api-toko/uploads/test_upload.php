<?php

$folder = __DIR__ . '/uploads/';

echo json_encode([
    "exists" => is_dir($folder),
    "writable" => is_writable($folder),
    "path" => $folder
]);