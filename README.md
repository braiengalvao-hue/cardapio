# Cardapio Digital

Sistema de cardapio digital com pedidos via Delivery, Retirada e Mesa.

## Estrutura

```
cardapio/
├── api/                    # Endpoints PHP
│   ├── listar_produtos.php
│   ├── cadastrar_pedido.php
│   ├── listar_pedidos.php
│   └── atualizar_status.php
├── config/
│   ├── database.php        # Configuracao do banco
│   └── bootstrap.php       # Conexao PDO + helpers
├── assets/
│   ├── css/style.css
│   └── js/script.js
├── docker/
│   ├── apache.conf
│   └── init.sql            # Schema + dados iniciais
├── docker-compose.yml
├── Dockerfile
└── index.html
```

## Rodando com Docker

```bash
# 1. Subir containers
docker-compose up -d

# 2. Acessar
# Cardapio:    http://localhost:8080
# phpMyAdmin:  http://localhost:8081
# MySQL:       localhost:3307
```

O banco e criado automaticamente com dados de exemplo.

## Rodando com XAMPP

1. Copie a pasta para `htdocs`
2. Importe `docker/init.sql` no MySQL
3. Ajuste `config/database.php`:
   ```php
   'host' => 'localhost',
   'user' => 'root',
   'pass' => '',
   ```
4. Acesse `http://localhost/cardapio/`

## Tipos de Pedido

- **Delivery**: Campos obrigatorios - Nome, Telefone, Rua, Numero, Bairro
- **Retirada**: Sem campos obrigatorios
- **Mesa**: Campo obrigatorio - Numero da Mesa

## APIs

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/listar_produtos.php` | Categorias, itens e adicionais |
| POST | `/api/cadastrar_pedido.php` | Cria pedido |
| GET | `/api/listar_pedidos.php` | Lista pedidos (filtros: status, id, limit) |
| POST | `/api/atualizar_status.php` | Atualiza status do pedido |

### Exemplo: Cadastrar Pedido

```json
POST /api/cadastrar_pedido.php
{
  "origem": "delivery",
  "cliente": {
    "nome": "Joao",
    "telefone": "11999998888",
    "rua": "Rua A",
    "numero": "123",
    "bairro": "Centro",
    "complemento": "Apto 101"
  },
  "itens": [
    { "id_item": 1, "quantidade": 2 }
  ],
  "taxa_entrega": 7.00
}
```

### Status do Pedido

`pendente` → `em_preparo` → `saiu_para_entrega` → `concluido`

Ou: `pendente` → `cancelado`
