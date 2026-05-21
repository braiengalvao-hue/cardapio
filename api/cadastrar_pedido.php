<?php
/**
 * POST /api/cadastrar_pedido.php
 * Cria um novo pedido com itens e adicionais
 *
 * Body JSON:
 * {
 *   "origem": "delivery|retirada|mesa",
 *   "mesa": "5",
 *   "cliente": { "nome": "...", "telefone": "...", "rua": "...", "numero": "...", "bairro": "...", "complemento": "..." },
 *   "itens": [ { "id_item": 1, "quantidade": 2 } ],
 *   "taxa_entrega": 7.00,
 *   "desconto": 0.00,
 *   "observacoes": ""
 * }
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['sucesso' => false, 'erro' => 'Metodo nao permitido'], 405);
}

require_once __DIR__ . '/../config/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['itens']) || !is_array($input['itens'])) {
    jsonResponse(['sucesso' => false, 'erro' => 'Dados invalidos: itens obrigatorios'], 400);
}

// Validar origem
$origensValidas = ['delivery', 'retirada', 'mesa'];
$origem = in_array(($input['origem'] ?? ''), $origensValidas) ? $input['origem'] : 'retirada';

// Validacao especifica por origem
if ($origem === 'mesa' && empty(trim($input['mesa'] ?? ''))) {
    jsonResponse(['sucesso' => false, 'erro' => 'Numero da mesa obrigatorio'], 400);
}

if ($origem === 'delivery') {
    $cliente = $input['cliente'] ?? [];
    if (empty(trim($cliente['nome'] ?? ''))) {
        jsonResponse(['sucesso' => false, 'erro' => 'Nome obrigatorio para delivery'], 400);
    }
    if (empty(trim($cliente['telefone'] ?? ''))) {
        jsonResponse(['sucesso' => false, 'erro' => 'Telefone obrigatorio para delivery'], 400);
    }
    if (empty(trim($cliente['rua'] ?? ''))) {
        jsonResponse(['sucesso' => false, 'erro' => 'Rua obrigatoria para delivery'], 400);
    }
    if (empty(trim($cliente['numero'] ?? ''))) {
        jsonResponse(['sucesso' => false, 'erro' => 'Numero obrigatorio para delivery'], 400);
    }
    if (empty(trim($cliente['bairro'] ?? ''))) {
        jsonResponse(['sucesso' => false, 'erro' => 'Bairro obrigatorio para delivery'], 400);
    }
}

try {
    $pdo = getConnection();
    $pdo->beginTransaction();

    // 1. Buscar ou criar cliente (apenas para delivery)
    $idCliente = null;
    if ($origem === 'delivery') {
        $cliente = $input['cliente'];

        // Verificar se ja existe pelo telefone
        $stmt = $pdo->prepare('SELECT id_cliente FROM clientes WHERE telefone = ? LIMIT 1');
        $stmt->execute([trim($cliente['telefone'])]);
        $row = $stmt->fetch();

        if ($row) {
            $idCliente = $row['id_cliente'];
            // Atualizar dados do cliente
            $stmtUpd = $pdo->prepare(
                'UPDATE clientes SET nome = ?, rua = ?, numero = ?, bairro = ?, complemento = ? WHERE id_cliente = ?'
            );
            $stmtUpd->execute([
                trim($cliente['nome']),
                trim($cliente['rua']),
                trim($cliente['numero']),
                trim($cliente['bairro']),
                trim($cliente['complemento'] ?? ''),
                $idCliente,
            ]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO clientes (nome, telefone, rua, numero, bairro, complemento) VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                trim($cliente['nome']),
                trim($cliente['telefone']),
                trim($cliente['rua']),
                trim($cliente['numero']),
                trim($cliente['bairro']),
                trim($cliente['complemento'] ?? ''),
            ]);
            $idCliente = $pdo->lastInsertId();
        }
    }

    // 2. Calcular valor total dos itens
    $valorTotal = 0.00;
    $itensValidados = [];

    foreach ($input['itens'] as $item) {
        if (empty($item['id_item'])) continue;

        $stmtItem = $pdo->prepare('SELECT id_item, nome, preco FROM itens_do_cardapio WHERE id_item = ? AND ativo = 1');
        $stmtItem->execute([(int)$item['id_item']]);
        $produto = $stmtItem->fetch();

        if (!$produto) {
            $pdo->rollBack();
            jsonResponse(['sucesso' => false, 'erro' => "Item ID {$item['id_item']} nao encontrado ou inativo"], 400);
        }

        $qtd = max(1, (int)($item['quantidade'] ?? 1));
        $precoUnit = (float)$produto['preco'];
        $subtotal = $precoUnit * $qtd;
        $valorTotal += $subtotal;

        $itensValidados[] = [
            'id_item'        => (int)$produto['id_item'],
            'nome'           => $produto['nome'],
            'quantidade'     => $qtd,
            'preco_unitario' => $precoUnit,
            'subtotal'       => $subtotal,
        ];
    }

    if (empty($itensValidados)) {
        $pdo->rollBack();
        jsonResponse(['sucesso' => false, 'erro' => 'Nenhum item valido no pedido'], 400);
    }

    // 3. Aplicar taxa e desconto
    $taxaEntrega = max(0, (float)($input['taxa_entrega'] ?? 0));
    $desconto    = max(0, (float)($input['desconto'] ?? 0));
    $valorTotal  = $valorTotal + $taxaEntrega - $desconto;
    if ($valorTotal < 0) $valorTotal = 0;

    // 4. Sanitizar observacoes
    $observacoes = mb_substr(trim($input['observacoes'] ?? ''), 0, 500);

    // 5. Inserir pedido
    $stmtPedido = $pdo->prepare(
        'INSERT INTO pedidos
            (id_cliente, valor_total, origem, identificador_mesa, status, taxa_entrega, desconto, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmtPedido->execute([
        $idCliente,
        $valorTotal,
        $origem,
        $origem === 'mesa' ? trim($input['mesa']) : null,
        'pendente',
        $taxaEntrega,
        $desconto,
        $observacoes ?: null,
    ]);
    $idPedido = $pdo->lastInsertId();

    // 6. Inserir itens do pedido
    foreach ($itensValidados as $item) {
        $stmtItemPed = $pdo->prepare(
            'INSERT INTO itens_do_pedido (id_pedido, id_item, quantidade, preco_unitario, subtotal)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmtItemPed->execute([
            $idPedido,
            $item['id_item'],
            $item['quantidade'],
            $item['preco_unitario'],
            $item['subtotal'],
        ]);
    }

    $pdo->commit();

    jsonResponse([
        'sucesso'    => true,
        'mensagem'   => 'Pedido cadastrado com sucesso',
        'id_pedido'  => (int)$idPedido,
        'valor_total'=> (float)$valorTotal,
    ], 201);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['sucesso' => false, 'erro' => 'Erro ao cadastrar pedido'], 500);
}
