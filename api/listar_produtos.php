<?php
/**
 * GET /api/listar_produtos.php
 * Retorna categorias, itens e adicionais ativos
 */

require_once __DIR__ . '/../config/bootstrap.php';

try {
    $pdo = getConnection();

    // Categorias ativas
    $stmtCat = $pdo->query(
        'SELECT id_categoria, nome_categoria FROM categorias WHERE ativo = 1 ORDER BY nome_categoria'
    );
    $categorias = $stmtCat->fetchAll();

    // Itens ativos
    $stmtItens = $pdo->query(
        'SELECT i.id_item, i.nome, i.descricao, i.preco, i.url_imagem, i.id_categoria,
                c.nome_categoria
         FROM itens_do_cardapio i
         JOIN categorias c ON c.id_categoria = i.id_categoria
         WHERE i.ativo = 1
         ORDER BY c.nome_categoria, i.nome'
    );
    $itens = $stmtItens->fetchAll();

    // Adicionais ativos
    $stmtAd = $pdo->query(
        'SELECT id_adicional, nome_adicional, valor_adicional, id_categoria
         FROM adicionais
         WHERE ativo = 1
         ORDER BY id_categoria, nome_adicional'
    );
    $adicionais = $stmtAd->fetchAll();

    jsonResponse([
        'sucesso'    => true,
        'categorias' => $categorias,
        'produtos'   => $itens,
        'adicionais' => $adicionais,
    ]);

} catch (PDOException $e) {
    jsonResponse(['sucesso' => false, 'erro' => 'Erro ao buscar produtos'], 500);
}
