<?php
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/../config/db.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha na conexão com o banco de dados. Verifique se o MySQL está ativo.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "SELECT i.id_item, i.nome, i.descricao, i.preco, i.url_imagem,
               i.id_categoria, i.recomendacao_dia,
               c.nome_categoria
        FROM itens_do_cardapio i
        INNER JOIN categorias c ON i.id_categoria = c.id_categoria
        WHERE i.ativo = 1 AND c.ativo = 1
        ORDER BY c.nome_categoria ASC, i.nome ASC";

$result = mysqli_query($conn, $sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar produtos: ' . mysqli_error($conn)], JSON_UNESCAPED_UNICODE);
    exit;
}

$produtos = [];
while ($row = mysqli_fetch_assoc($result)) {
    $row['id_item'] = (int) $row['id_item'];
    $row['id_categoria'] = (int) $row['id_categoria'];
    $row['recomendacao_dia'] = (int) $row['recomendacao_dia'];
    $row['preco'] = (float) $row['preco'];
    $produtos[] = $row;
}

echo json_encode($produtos, JSON_UNESCAPED_UNICODE);
