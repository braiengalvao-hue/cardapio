<?php
/**
 * Bootstrap: inicializa conexao e helpers
 */

$config = require __DIR__ . '/database.php';

function getConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $config = require __DIR__ . '/database.php';

        // Se socket definido, usa socket; senao, usa host:port
        if (!empty($config['socket'])) {
            $dsn = sprintf(
                'mysql:unix_socket=%s;dbname=%s;charset=%s',
                $config['socket'],
                $config['dbname'],
                $config['charset']
            );
        } else {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['dbname'],
                $config['charset']
            );
        }

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
    }

    return $pdo;
}

function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
