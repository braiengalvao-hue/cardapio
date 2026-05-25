<?php
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/../config/db.php';
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha na conexão com o banco de dados. Verifique se o MySQL está ativo.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        global $conn;

        $padrao = [
            'nome_loja' => 'Restaurante',
            'boas_vindas' => 'Olá! Seja bem-vindo!',
            'subtexto' => 'Monte seu pedido com acréscimos.',
            'foto_loja' => '',
            'taxa_entrega' => '0',
            'whatsapp' => '',
            'instagram' => '',
            'status_funcionamento' => 'aberto',
        ];

        $temTabela = mysqli_query($conn, "SHOW TABLES LIKE 'config'");
        if (!$temTabela || mysqli_num_rows($temTabela) === 0) {
            echo json_encode($padrao, JSON_UNESCAPED_UNICODE);
            break;
        }

        $sql = "SELECT chave, valor FROM config";
        $result = mysqli_query($conn, $sql);

        if ($result) {
            $config_formatada = $padrao;
            while ($row = mysqli_fetch_assoc($result)) {
                $config_formatada[$row['chave']] = $row['valor'];
            }
            if (empty($config_formatada['status_funcionamento'])) {
                $config_formatada['status_funcionamento'] = 'aberto';
            }
            echo json_encode($config_formatada, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao buscar configurações: ' . mysqli_error($conn)]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}