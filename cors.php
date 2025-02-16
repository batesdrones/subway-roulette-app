<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: text/csv');

$file = 'MTA_Subway_stations.csv';
if (file_exists($file)) {
    readfile($file);
} else {
    http_response_code(404);
    echo "File not found";
}
?>