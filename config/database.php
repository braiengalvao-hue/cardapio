<?php
/**
 * Configuracao de conexao com o banco de dados
 * Prioridade: variaveis de ambiente > valores padrao
 *
 * Para conexao via socket (Docker/producao):
 *   DB_SOCKET=/var/run/mysqld/mysqld.sock
 */

return [
    'host'    => getenv('DB_HOST')   ?: 'mysql',
    'port'    => getenv('DB_PORT')   ?: '3306',
    'socket'  => getenv('DB_SOCKET') ?: null,
    'dbname'  => getenv('DB_NAME')   ?: 'cardapio',
    'user'    => getenv('DB_USER')   ?: 'cardapio',
    'pass'    => getenv('DB_PASS')   ?: 'cardapio123',
    'charset' => 'utf8mb4',
];
