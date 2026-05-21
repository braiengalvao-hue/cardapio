-- =============================================================================
-- SCHEMA FINAL - Cardapio Digital
-- Banco: cardapio | Engine: InnoDB | Charset: utf8mb4
-- Executado automaticamente pelo Docker na inicializacao
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Categorias do cardapio
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_categoria VARCHAR(120) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Adicionais vinculados a categorias
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS adicionais (
  id_adicional INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_adicional VARCHAR(120) NOT NULL,
  valor_adicional DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  id_categoria INT UNSIGNED NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_adicional),
  KEY fk_adicional_categoria (id_categoria),
  CONSTRAINT fk_adicional_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Itens do cardapio
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_do_cardapio (
  id_item INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  url_imagem VARCHAR(255) DEFAULT NULL,
  id_categoria INT UNSIGNED NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_item),
  KEY fk_item_categoria (id_categoria),
  CONSTRAINT fk_item_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  telefone VARCHAR(45) DEFAULT NULL,
  rua VARCHAR(200) DEFAULT NULL,
  numero VARCHAR(45) DEFAULT NULL,
  bairro VARCHAR(120) DEFAULT NULL,
  complemento VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED DEFAULT NULL,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  origem VARCHAR(32) NOT NULL DEFAULT 'retirada',
  identificador_mesa VARCHAR(60) DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pendente',
  data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observacoes VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (id_pedido),
  KEY fk_pedido_cliente (id_cliente),
  KEY idx_pedido_status (status),
  KEY idx_pedido_data (data_pedido),
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Itens de cada pedido
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_do_pedido (
  id_item_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_pedido INT UNSIGNED NOT NULL,
  id_item INT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id_item_pedido),
  KEY fk_linha_pedido (id_pedido),
  KEY fk_linha_item (id_item),
  CONSTRAINT fk_linha_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_linha_item FOREIGN KEY (id_item) REFERENCES itens_do_cardapio (id_item)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Adicionais de cada item do pedido
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS adicionais_do_item_do_pedido (
  id_adicional_item_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_item_pedido INT UNSIGNED NOT NULL,
  id_adicional INT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id_adicional_item_pedido),
  KEY fk_aip_item_pedido (id_item_pedido),
  KEY fk_aip_adicional (id_adicional),
  CONSTRAINT fk_aip_item_pedido FOREIGN KEY (id_item_pedido) REFERENCES itens_do_pedido (id_item_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_aip_adicional FOREIGN KEY (id_adicional) REFERENCES adicionais (id_adicional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- DADOS INICIAIS
-- =============================================================================

-- Categorias
INSERT INTO categorias (nome_categoria, ativo) VALUES
('Hamburgueres', 1),
('Bebidas', 1),
('Porcoes', 1),
('Sobremesas', 1),
('Pizzas', 1);

-- Adicionais
INSERT INTO adicionais (nome_adicional, valor_adicional, id_categoria, ativo) VALUES
('Bacon Extra',         4.50, 1, 1),
('Cheddar Fatiado',     3.00, 1, 1),
('Ovo Frito',           2.50, 1, 1),
('Cebola Caramelizada', 3.50, 1, 1),
('Maionese da Casa',    2.00, 1, 1),
('Gelo',                0.00, 2, 1),
('Leite Condensado',    2.00, 3, 1),
('Chantilly',           3.00, 3, 1);

-- Itens do cardapio
INSERT INTO itens_do_cardapio (nome, descricao, preco, url_imagem, id_categoria, ativo) VALUES
('Monster Burger Duplo',  'Dois hamburgueres artesanais de 150g, muito queijo cheddar, bacon crocante e molho da casa.', 34.90, 'https://placehold.co/400x250/png?text=Monster', 1, 1),
('Classic Cheeseburger',  'Hamburguer de 150g, queijo prato derretido, alface, tomate e maionese artesanal.', 24.90, 'https://placehold.co/400x250/png?text=Classic', 1, 1),
('X-Burger Especial',     'Pao brioche, carne 180g, queijo cheddar, alface, tomate e molho especial.', 28.90, 'https://placehold.co/400x250/png?text=XBurger', 1, 1),
('Bacon Monster',          'Hamburguer artesanal 200g, muito bacon crocante, queijo e molho barbecue.', 32.00, 'https://placehold.co/400x250/png?text=Bacon', 1, 1),
('Coca-Cola Lata',         'Lata de 350ml trincando de gelada.', 6.00, 'https://placehold.co/400x250/png?text=Coca', 2, 1),
('Suco de Laranja 500ml',  'Suco natural de laranja, sem acucar adicionado.', 12.00, 'https://placehold.co/400x250/png?text=Suco', 2, 1),
('Agua Mineral 500ml',     'Agua mineral sem gas.', 4.00, 'https://placehold.co/400x250/png?text=Agua', 2, 1),
('Batata Frita com Bacon', 'Batatas rusticas fritas cobertas com cheddar cremoso e farofa de bacon.', 18.50, 'https://placehold.co/400x250/png?text=Batata', 3, 1),
('Onion Rings',            'Aneis de cebola empanados e crocantes. Porcao com 12 unidades.', 15.00, 'https://placehold.co/400x250/png?text=Onion', 3, 1),
('Petit Gateau',           'Bolo de chocolate com centro derretido, acompanhado de sorvete de creme.', 22.00, 'https://placehold.co/400x250/png?text=Petit', 4, 1),
('Milkshake de Morango',   'Milkshake cremoso de morango com chantilly.', 16.00, 'https://placehold.co/400x250/png?text=Shake', 4, 1);
