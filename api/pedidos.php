<?php
require_once '../config/db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    
    // -------------------------------------------------------------------------
    // GET: Listar pedidos (Geralmente usado para o cliente acompanhar os dele)
    // -------------------------------------------------------------------------
    case 'GET':
        global $conn;
        // Corrigido os JOINs baseando-se estritamente nas tabelas reais do banco
        $sql = "SELECT p.*, 
                       c.nome AS nome_cliente, c.telefone,
                       m.numero_mesa, 
                       b.nome_balcao
                FROM pedidos p
                LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
                LEFT JOIN mesas m ON p.id_mesa = m.id_mesa
                LEFT JOIN balcoes b ON p.id_balcao = b.id_balcao
                ORDER BY p.id_pedido DESC";
        
        $result = mysqli_query($conn, $sql);

        if ($result) {
            $pedidos = array();
            while($row = mysqli_fetch_assoc($result)) {
                $pedidos[] = $row;
            }
            echo json_encode($pedidos, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao buscar pedidos: ' . mysqli_error($conn)]);
        }
        break;

    // -------------------------------------------------------------------------
    // POST: Criar um novo pedido com seus respectivos itens
    // -------------------------------------------------------------------------
    case 'POST':
        global $conn;
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados inválidos ou JSON malformado']);
            break;
        }

        $origem = isset($data['origem']) ? trim($data['origem']) : 'balcao';
        if ($origem === 'retirada') {
            $origem = 'balcao';
        }
        $origem = mysqli_real_escape_string($conn, $origem);

        $forma_pagamento = isset($data['forma_pagamento']) ? mysqli_real_escape_string($conn, $data['forma_pagamento']) : null;
        $observacoes     = isset($data['observacoes']) ? mysqli_real_escape_string($conn, $data['observacoes']) : null;
        $valor_total     = isset($data['valor_total']) ? (float) $data['valor_total'] : 0.00;
        $taxa_entrega    = isset($data['taxa_entrega']) ? (float) $data['taxa_entrega'] : 0.00;

        $id_cliente = !empty($data['id_cliente']) ? (int) $data['id_cliente'] : null;
        $id_mesa    = !empty($data['id_mesa']) ? (int) $data['id_mesa'] : null;
        $id_balcao  = !empty($data['id_balcao']) ? (int) $data['id_balcao'] : null;
        
        // O carrinho com a lista de itens comprados
        $itens = isset($data['itens']) ? $data['itens'] : [];

        if (empty($itens)) {
            http_response_code(400);
            echo json_encode(['error' => 'Não é possível criar um pedido sem itens no carrinho']);
            break;
        }

        // Inicia uma transação no MySQLi para garantir segurança total dos dados
        mysqli_begin_transaction($conn);

        try {
            // 2. Insere o registro principal na tabela 'pedidos'
            $sqlPedido = "INSERT INTO pedidos (id_cliente, origem, id_mesa, id_balcao, forma_pagamento, valor_total, taxa_entrega, observacoes, status) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')";

            $stmtPedido = mysqli_prepare($conn, $sqlPedido);
            mysqli_stmt_bind_param($stmtPedido, "isiisdds", $id_cliente, $origem, $id_mesa, $id_balcao, $forma_pagamento, $valor_total, $taxa_entrega, $observacoes);
            
            if (!mysqli_stmt_execute($stmtPedido)) {
                throw new Exception("Erro ao inserir na tabela pedidos");
            }

            // Captura o ID do pedido que acabou de ser gerado pelo auto_increment
            $id_pedido_gerado = mysqli_insert_id($conn);

            // 3. Loop pelos itens do carrinho para salvar na tabela 'itens_do_pedido'
            $sqlItem = "INSERT INTO itens_do_pedido (id_pedido, id_item, quantidade, preco_unitario, subtotal, observacoes) 
                        VALUES (?, ?, ?, ?, ?, ?)";
            $stmtItem = mysqli_prepare($conn, $sqlItem);

            foreach ($itens as $item) {
                $id_item        = (int) $item['id_item'];
                $quantidade     = max(1, (int) $item['quantidade']);
                $preco_unitario = (float) $item['preco_unitario'];
                $subtotal       = round($quantidade * $preco_unitario, 2);
                $obs_item       = isset($item['observacoes']) ? $item['observacoes'] : null;
                if ($obs_item !== null) {
                    $obs_item = mysqli_real_escape_string($conn, $obs_item);
                }

                mysqli_stmt_bind_param($stmtItem, "iiidds", $id_pedido_gerado, $id_item, $quantidade, $preco_unitario, $subtotal, $obs_item);
                
                if (!mysqli_stmt_execute($stmtItem)) {
                    throw new Exception("Erro ao inserir o item ID $id_item no pedido");
                }
            }

            // Se tudo correu bem, confirma as inserções definitivamente no banco
            mysqli_commit($conn);

            echo json_encode([
                'success' => true,
                'message' => 'Pedido criado com sucesso!',
                'id_pedido' => $id_pedido_gerado
            ], JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            // Se qualquer insert falhar, desfaz tudo o que foi feito na requisição para não gerar dados órfãos
            mysqli_rollback($conn);
            
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}