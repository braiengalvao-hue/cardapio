<?php
/**
 * POST /api/atualizar_status.php
 * Atualiza o status de um pedido
 *
 * Body JSON: { "id_pedido": 1, "status": "em_preparo" }
 *
 * Status validos: pendente, em_preparo, saiu_para_entrega, concluido, cancelado
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['sucesso' => false, 'erro' => 'Metodo nao permitido'], 405);
}

require_once __DIR__ . '/../config/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['id_pedido']) || empty($input['status'])) {
    jsonResponse(['sucesso' => false, 'erro' => 'id_pedido e status obrigatorios'], 400);
}

$statusValidos = ['pendente', 'em_preparo', 'saiu_para_entrega', 'concluido', 'cancelado'];

if (!in_array($input['status'], $statusValidos)) {
    jsonResponse(['sucesso' => false, 'erro' => 'Status invalido. Use: ' . implode(', ', $statusValidos)], 400);
}

try {
    $pdo = getConnection();

    $stmt = $pdo->prepare('UPDATE pedidos SET status = ? WHERE id_pedido = ?');
    $stmt->execute([$input['status'], $input['id_pedido']]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['sucesso' => false, 'erro' => 'Pedido nao encontrado'], 404);
    }

    jsonResponse([
        'sucesso'  => true,
        'mensagem' => "Status atualizado para {$input['status']}",
    ]);

} catch (PDOException $e) {
    jsonResponse(['sucesso' => false, 'erro' => 'Erro ao atualizar: ' . $e->getMessage()], 500);
}
