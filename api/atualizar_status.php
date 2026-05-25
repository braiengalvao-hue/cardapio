<?php
/**
 * GET  ?id_pedido=N  — consulta status (cardápio do cliente)
 * POST { id_pedido, status } — atualiza status (painel administrativo)
 */
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function jsonResposta(array $dados, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

switch ($method) {
    case 'GET':
        $id_pedido = isset($_GET['id_pedido']) ? (int) $_GET['id_pedido'] : 0;
        if ($id_pedido <= 0) {
            jsonResposta(['error' => 'Informe um id_pedido válido'], 400);
        }

        $stmt = mysqli_prepare($conn, 'SELECT id_pedido, status, data_atualizacao, data_pedido FROM pedidos WHERE id_pedido = ?');
        mysqli_stmt_bind_param($stmt, 'i', $id_pedido);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $pedido = mysqli_fetch_assoc($result);

        if (!$pedido) {
            jsonResposta(['error' => 'Pedido não localizado'], 404);
        }

        $atualizado = $pedido['data_atualizacao'] ?? $pedido['data_pedido'] ?? null;
        jsonResposta([
            'id_pedido' => (int) $pedido['id_pedido'],
            'status' => $pedido['status'],
            'atualizado_em' => $atualizado,
        ]);

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input) || empty($input['id_pedido']) || empty($input['status'])) {
            jsonResposta(['error' => 'id_pedido e status são obrigatórios'], 400);
        }

        $validos = ['pendente', 'em_preparo', 'saiu_para_entrega', 'concluido', 'cancelado'];
        if (!in_array($input['status'], $validos, true)) {
            jsonResposta(['error' => 'Status inválido'], 400);
        }

        $id = (int) $input['id_pedido'];
        $status = $input['status'];

        $stmt = mysqli_prepare($conn, 'UPDATE pedidos SET status = ? WHERE id_pedido = ?');
        mysqli_stmt_bind_param($stmt, 'si', $status, $id);
        mysqli_stmt_execute($stmt);

        if (mysqli_stmt_affected_rows($stmt) === 0) {
            jsonResposta(['error' => 'Pedido não encontrado'], 404);
        }

        jsonResposta(['success' => true, 'mensagem' => "Status atualizado para {$status}"]);

    default:
        jsonResposta(['error' => 'Método não permitido'], 405);
}
