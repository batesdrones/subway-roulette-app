<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: text/csv');

$file = __DIR__ . '/data/MTA_Subway_stations.csv'; // Use __DIR__ to get the directory of the current file

if (file_exists($file) && is_readable($file)) {
    readfile($file);
} else {
    http_response_code(404);
    echo "File not found or not readable";
    error_log("File not found or not readable: " . $file); // Log the error
}
?>