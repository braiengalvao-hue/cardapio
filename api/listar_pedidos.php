<?php
/**
 * GET /api/listar_pedidos.php
 * Retorna pedidos com detalhes
 *
 * Parametros opcionais:
 *   ?status=pendente
 *   ?limit=50
 *   ?id=123
 */

require_once __DIR__ . '/../config/bootstrap.php';

try {
    $pdo = getConnection();

    $where = [];
    $params = [];

    if (!empty($_GET['id'])) {
        $where[] = 'p.id_pedido = ?';
        $params[] = (int)$_GET['id'];
    }

    if (!empty($_GET['status'])) {
        $where[] = 'p.status = ?';
        $params[] = $_GET['status'];
    }

    $limit = isset($_GET['limit']) ? min(500, max(1, (int)$_GET['limit'])) : 100;

    $sql = 'SELECT p.id_pedido, p.valor_total, p.origem, p.identificador_mesa,
                   p.status, p.data_pedido, p.data_atualizacao,
                   p.taxa_entrega, p.desconto, p.observacoes,
                   c.nome AS nome_cliente, c.telefone AS telefone_cliente,
                   c.rua, c.numero, c.bairro, c.complemento
            FROM pedidos p
            LEFT JOIN clientes c ON c.id_cliente = p.id_cliente';

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY p.data_pedido DESC LIMIT ?';
    $params[] = $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $pedidos = $stmt->fetchAll();

    // Buscar itens de cada pedido
    $stmtItens = $pdo->prepare(
        'SELECT ip.id_item_pedido, ip.quantidade, ip.preco_unitario, ip.subtotal,
                i.nome, i.url_imagem
         FROM itens_do_pedido ip
         JOIN itens_do_cardapio i ON i.id_item = ip.id_item
         WHERE ip.id_pedido = ?'
    );

    $stmtAdicionais = $pdo->prepare(
        'SELECT aip.quantidade, aip.valor_unitario, aip.subtotal,
                a.nome_adicional
         FROM adicionais_do_item_do_pedido aip
         JOIN adicionais a ON a.id_adicional = aip.id_adicional
         WHERE aip.id_item_pedido = ?'
    );

    foreach ($pedidos as &$ped) {
        $stmtItens->execute([$ped['id_pedido']]);
        $itens = $stmtItens->fetchAll();

        foreach ($itens as &$it) {
            $stmtAdicionais->execute([$it['id_item_pedido']]);
            $it['adicionais'] = $stmtAdicionais->fetchAll();
            unset($it['id_item_pedido']);
        }

        $ped['itens'] = $itens;

        // Montar endereco completo se delivery
        if ($ped['origem'] === 'delivery' && $ped['rua']) {
            $ped['endereco'] = trim(
                $ped['rua'] . ', ' . $ped['numero'] .
                ($ped['bairro'] ? ' - ' . $ped['bairro'] : '') .
                ($ped['complemento'] ? ' (' . $ped['complemento'] . ')' : '')
            );
        }

        unset($ped['rua'], $ped['numero'], $ped['bairro'], $ped['complemento']);
    }

    jsonResponse([
        'sucesso' => true,
        'pedidos' => $pedidos,
        'total'   => count($pedidos),
    ]);

} catch (PDOException $e) {
    jsonResponse(['sucesso' => false, 'erro' => 'Erro ao buscar pedidos'], 500);
}
