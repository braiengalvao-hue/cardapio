<?php
// Inclui a conexão (certifique-se de que em db.php a variável seja $conn)
require_once '../config/db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    
    // -------------------------------------------------------------------------
    // GET: Carrega as opções de adicionais para o cliente montar o prato
    // -------------------------------------------------------------------------
    case 'GET':
        global $conn;
        $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'adicionais';

        if ($tipo === 'mesas') {
            $sql = "SELECT id_mesa, numero_mesa FROM mesas WHERE ativo = 1 ORDER BY numero_mesa ASC";
            $result = mysqli_query($conn, $sql);
            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => mysqli_error($conn)]);
                break;
            }
            $lista = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $lista[] = $row;
            }
            echo json_encode($lista, JSON_UNESCAPED_UNICODE);
            break;
        }

        if ($tipo === 'balcoes') {
            $sql = "SELECT id_balcao, nome_balcao FROM balcoes WHERE ativo = 1 ORDER BY nome_balcao ASC";
            $result = mysqli_query($conn, $sql);
            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => mysqli_error($conn)]);
                break;
            }
            $lista = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $lista[] = $row;
            }
            echo json_encode($lista, JSON_UNESCAPED_UNICODE);
            break;
        }

        $id_categoria = isset($_GET['id_categoria']) ? (int) $_GET['id_categoria'] : 0;

        $sql = "SELECT a.*, c.nome_categoria 
                FROM adicionais a
                INNER JOIN categorias c ON a.id_categoria = c.id_categoria
                WHERE a.ativo = 1";

        if ($id_categoria > 0) {
            $sql .= " AND a.id_categoria = " . $id_categoria;
        }

        $sql .= " ORDER BY a.nome_adicional ASC";

        $result = mysqli_query($conn, $sql);

        if ($result) {
            $adicionais = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $adicionais[] = $row;
            }
            echo json_encode($adicionais, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao buscar adicionais: ' . mysqli_error($conn)]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}