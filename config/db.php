<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$host = 'localhost';
$user = 'root';
$pass = '';
$db   = 'cardapio';

$conn = mysqli_connect($host, $user, $pass, $db);


$GLOBALS['conn'] = $conn;

mysqli_set_charset($conn, 'utf8mb4');