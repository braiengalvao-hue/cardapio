-- =============================================================================
-- SCHEMA COMPLETO — Sistema Cardápio (MySQL 8+ / MariaDB 10.3+)
-- Arquivo final: banco de dados inteiro em um único arquivo.
-- Nomenclatura: tabelas e colunas em português, padrão snake_case.
-- Inclui: criação do banco, tabelas, índices, integridade referencial e dados iniciais.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS cardapio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cardapio;

-- ---------------------------------------------------------------------------
-- Usuários do painel administrativo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_administradores (
  id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  login VARCHAR(120) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nivel VARCHAR(32) NOT NULL DEFAULT 'comum',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  url_imagem VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_login_usuario (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Senha inicial: "password" (troque imediatamente em produção).
INSERT IGNORE INTO usuarios_administradores (nome, login, senha, nivel, ativo)
VALUES (
  'Administrador',
  'admin@cardapio.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  1
);

-- ---------------------------------------------------------------------------
-- Configurações da loja (cardápio cliente)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config (
  chave VARCHAR(64) NOT NULL,
  valor TEXT NOT NULL,
  PRIMARY KEY (chave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO config (chave, valor) VALUES
('nome_loja', 'Burguer & Cia'),
('boas_vindas', 'Olá! Seja bem-vindo!'),
('subtexto', 'Monte seu pedido com acréscimos.'),
('foto_loja', 'https://placehold.co/150x150/png?text=BC'),
('taxa_entrega', '7.00'),
('whatsapp', '5511999999999'),
('instagram', 'https://instagram.com');

-- ---------------------------------------------------------------------------
-- Cardápio: categorias, itens e adicionais
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_categoria VARCHAR(120) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS itens_do_cardapio (
  id_item INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  url_imagem VARCHAR(255) DEFAULT NULL,
  id_categoria INT UNSIGNED NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  recomendacao_dia TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id_item),
  KEY fk_item_categoria (id_categoria),
  CONSTRAINT fk_item_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Mesas e Balcões Fixos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mesas (
  id_mesa INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero_mesa VARCHAR(32) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_mesa),
  UNIQUE KEY uq_numero_mesa (numero_mesa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO mesas (numero_mesa) VALUES 
('Mesa 1'), ('Mesa 2'), ('Mesa 3'), ('Mesa 4'), ('Mesa 5'), 
('Mesa 6'), ('Mesa 7'), ('Mesa 8'), ('Mesa 9'), ('Mesa 10');

CREATE TABLE IF NOT EXISTS balcoes (
  id_balcao INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_balcao VARCHAR(32) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_balcao),
  UNIQUE KEY uq_nome_balcao (nome_balcao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO balcoes (nome_balcao) VALUES 
('Balcão 1'), ('Balcão 2'), ('Balcão 3'), ('Balcão 4'), ('Balcão 5');

-- ---------------------------------------------------------------------------
-- Clientes e pedidos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  telefone VARCHAR(45) DEFAULT NULL,
  rua VARCHAR(120) DEFAULT NULL,
  numero VARCHAR(45) DEFAULT NULL,
  bairro VARCHAR(120) DEFAULT NULL,
  complemento VARCHAR(255) DEFAULT NULL,
  referencia VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED DEFAULT NULL,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  origem VARCHAR(32) NOT NULL DEFAULT 'balcao',
  identificador_mesa VARCHAR(60) DEFAULT NULL,
  id_mesa INT UNSIGNED DEFAULT NULL,
  id_balcao INT UNSIGNED DEFAULT NULL,
  forma_pagamento VARCHAR(60) DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pendente',
  data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  id_usuario INT UNSIGNED DEFAULT NULL,
  taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observacoes VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (id_pedido),
  KEY fk_pedido_cliente (id_cliente),
  KEY fk_pedido_usuario (id_usuario),
  KEY fk_pedido_mesa (id_mesa),
  KEY fk_pedido_balcao (id_balcao),
  KEY idx_pedido_status (status),
  KEY idx_pedido_origem (origem),
  KEY idx_pedido_data (data_pedido),
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE SET NULL,
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios_administradores (id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_pedido_mesa FOREIGN KEY (id_mesa) REFERENCES mesas (id_mesa) ON DELETE SET NULL,
  CONSTRAINT fk_pedido_balcao FOREIGN KEY (id_balcao) REFERENCES balcoes (id_balcao) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS itens_do_pedido (
  id_item_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_pedido INT UNSIGNED NOT NULL,
  id_item INT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observacoes VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id_item_pedido),
  KEY fk_linha_pedido (id_pedido),
  KEY fk_linha_item (id_item),
  CONSTRAINT fk_linha_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_linha_item FOREIGN KEY (id_item) REFERENCES itens_do_cardapio (id_item)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- ---------------------------------------------------------------------------
-- Financeiro, caixa e auditoria
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despesas (
  id_despesa INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fornecedor VARCHAR(160) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_lancamento DATE NOT NULL,
  tipo ENUM('fixa','variavel') NOT NULL DEFAULT 'variavel',
  observacao TEXT,
  id_usuario INT UNSIGNED DEFAULT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_despesa),
  KEY fk_despesa_usuario (id_usuario),
  CONSTRAINT fk_despesa_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios_administradores (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessoes_do_caixa (
  id_sessao INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario INT UNSIGNED DEFAULT NULL,
  aberto_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechado_em DATETIME DEFAULT NULL,
  saldo_informado_abertura DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  saldo_informado_fechamento DECIMAL(12,2) DEFAULT NULL,
  observacao_abertura VARCHAR(500) DEFAULT NULL,
  observacao_fechamento VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (id_sessao),
  KEY idx_sessao_aberta (fechado_em),
  KEY fk_sessao_usuario (id_usuario),
  CONSTRAINT fk_sessao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios_administradores (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimentacoes_do_caixa (
  id_movimentacao INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo ENUM('entrada','saida') NOT NULL,
  origem VARCHAR(64) DEFAULT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao VARCHAR(255) DEFAULT NULL,
  id_pedido INT UNSIGNED DEFAULT NULL,
  id_despesa INT UNSIGNED DEFAULT NULL,
  id_usuario INT UNSIGNED DEFAULT NULL,
  id_sessao_do_caixa INT UNSIGNED DEFAULT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_movimentacao),
  KEY fk_mov_pedido (id_pedido),
  KEY fk_mov_despesa (id_despesa),
  KEY fk_mov_usuario (id_usuario),
  KEY idx_mov_sessao (id_sessao_do_caixa),
  CONSTRAINT fk_mov_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido) ON DELETE SET NULL,
  CONSTRAINT fk_mov_despesa FOREIGN KEY (id_despesa) REFERENCES despesas (id_despesa) ON DELETE SET NULL,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios_administradores (id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_mov_sessao_caixa FOREIGN KEY (id_sessao_do_caixa) REFERENCES sessoes_do_caixa (id_sessao) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria_de_exclusoes (
  id_auditoria BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_entidade VARCHAR(64) NOT NULL,
  id_registro INT UNSIGNED NOT NULL,
  id_usuario INT UNSIGNED DEFAULT NULL,
  motivo VARCHAR(255) DEFAULT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_auditoria),
  KEY fk_auditoria_usuario (id_usuario),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios_administradores (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- FIM DO SCHEMA
-- =============================================================================
