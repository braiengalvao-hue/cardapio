let produtosDados = [];
let lojaDados = null;
let categoriasDados = [];
let carrinho = [];
let produtoModalId = null;
let categoriaAtiva = "todos";

const ICONES_CATEGORIA = {
    todos: "bi-grid-fill",
};

const API_BASE = "api";

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    configurarEventos();
});

function carregarDados() {
    fetch(`${API_BASE}/listar_produtos.php`)
        .then((r) => {
            if (!r.ok) throw new Error("Erro ao carregar produtos");
            return r.json();
        })
        .then((data) => {
            if (!data.sucesso) throw new Error(data.erro || "Erro desconhecido");

            categoriasDados = data.categorias.map((c) => ({
                id: String(c.id_categoria),
                nome: c.nome_categoria,
                icon: obterIconeCategoria(c.nome_categoria),
            }));

            produtosDados = data.produtos.map((p) => ({
                id: p.id_item,
                categoria: String(p.id_categoria),
                nome: p.nome,
                preco: parseFloat(p.preco),
                descricao: p.descricao || "",
                imagem: p.url_imagem || "https://placehold.co/400x250/png?text=Produto",
            }));

            lojaDados = {
                nome: "Burguer & Cia",
                boas_vindas: "Ola! Seja muito bem-vindo!",
                subtexto: "Escolha seus produtos favoritos abaixo.",
                foto: "https://placehold.co/150x150/png?text=BC",
                info_entrega: [
                    { titulo: "Delivery", sub: "30 a 40 min", icon: "bi-truck" },
                    { titulo: "Retirada", sub: "15 min", icon: "bi-bag-check" },
                ],
                redes_sociais: [
                    { nome: "Instagram", url: "https://instagram.com", icon: "bi-instagram" },
                    { nome: "WhatsApp", url: "https://whatsapp.com", icon: "bi-whatsapp" },
                ],
            };

            inicializarCardapio({
                loja: lojaDados,
                categorias: categoriasDados,
                produtos: produtosDados,
                destaque: produtosDados.length > 0 ? produtosDados[0] : null,
            });
        })
        .catch((err) => {
            console.error(err);
            document.getElementById("listaProdutos").innerHTML =
                '<p class="lista-vazia">Erro ao carregar produtos. Verifique se o servidor esta rodando.</p>';
        });
}

function obterIconeCategoria(nome) {
    const icones = {
        "hamb\u00fargueres": "bi-fire",
        "hamburgueres": "bi-fire",
        "bebidas": "bi-cup-straw",
        "sobremesas": "bi-cake2",
        "por\u00e7\u00f5es": "bi-basket",
        "porcoes": "bi-basket",
        "pizzas": "bi-p-circle",
    };
    const chave = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return icones[chave] || "bi-tag";
}

function formatarPreco(valor) {
    return valor.toFixed(2).replace(".", ",");
}

function inicializarCardapio(data) {
    document.getElementById("foto-loja").src = data.loja.foto;
    document.getElementById("nome-loja").innerText = data.loja.nome;
    document.getElementById("boas-vindas").innerText = data.loja.boas_vindas;
    document.getElementById("subtexto").innerText = data.loja.subtexto;
    document.getElementById("footerNome").innerText = data.loja.nome;

    renderizarInfoEntrega(data.loja.info_entrega);

    const redesContainer = document.getElementById("redesSociais");
    data.loja.redes_sociais?.forEach((rede) => {
        const link = document.createElement("a");
        link.href = rede.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "rede";
        link.title = rede.nome;
        link.innerHTML = `<i class="bi ${rede.icon}"></i>`;
        redesContainer.appendChild(link);
    });

    if (data.destaque) {
        document.getElementById("produtoDestaque").innerHTML = htmlDestaque(data.destaque);
    }

    renderizarCategorias(data.categorias);
    renderizarProdutos(data.produtos);
    atualizarCarrinhoUI();
}

function renderizarInfoEntrega(info) {
    const container = document.getElementById("infoEntrega");
    container.innerHTML = "";

    if (Array.isArray(info)) {
        info.forEach((item) => {
            container.innerHTML += `
                <div class="info-box">
                    <i class="bi ${item.icon} info-icon"></i>
                    <div class="info-text">
                        <span class="info-titulo">${item.titulo}</span>
                        <span class="info-sub">${item.sub}</span>
                    </div>
                </div>`;
        });
        return;
    }

    container.innerHTML = `<p class="info-texto-simples">${info}</p>`;
}

function htmlDestaque(prod) {
    return `
        <img class="img-sujestao" src="${prod.imagem}" alt="${prod.nome}">
        <div class="texto-sujestao">
            <h6>${prod.nome}</h6>
            <p class="preco">R$ ${formatarPreco(prod.preco)}</p>
            <button type="button" class="btn btn-primario btn-sm adicionar"
                onclick="event.stopPropagation(); adicionarAoCarrinho(${prod.id}, 1)">
                <i class="bi bi-cart-plus"></i> Adicionar
            </button>
        </div>`;
}

function renderizarCategorias(categorias) {
    const container = document.getElementById("listaCategorias");
    container.innerHTML = "";

    const btnTodos = criarBotaoCategoria("todos", "Todos", ICONES_CATEGORIA.todos);
    container.appendChild(btnTodos);

    categorias.forEach((cat) => {
        const btn = criarBotaoCategoria(cat.id, cat.nome, cat.icon || "bi-tag");
        container.appendChild(btn);
    });

    atualizarCategoriaAtiva();
}

function criarBotaoCategoria(id, nome, icon) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-categoria";
    btn.dataset.categoria = id;
    btn.innerHTML = `<i class="bi ${icon}"></i><span>${nome}</span>`;
    btn.addEventListener("click", () => filtrarPorCategoria(id));
    return btn;
}

function atualizarCategoriaAtiva() {
    document.querySelectorAll(".btn-categoria").forEach((btn) => {
        btn.classList.toggle("ativa", btn.dataset.categoria === categoriaAtiva);
    });
}

function criarCardProduto(prod) {
    const card = document.createElement("article");
    card.className = "produto-card";
    card.innerHTML = `
        <div class="produto-card-img-wrap">
            <img class="produto-img" src="${prod.imagem}" alt="${prod.nome}" loading="lazy">
        </div>
        <div class="produto-info">
            <h4 class="produto-nome">${prod.nome}</h4>
            <div class="produto-rodape">
                <span class="produto-preco">R$ ${formatarPreco(prod.preco)}</span>
                <button type="button" class="btn-add" aria-label="Adicionar ${prod.nome}">
                    <i class="bi bi-plus-lg"></i>
                </button>
            </div>
        </div>`;

    card.querySelector(".produto-card-img-wrap").addEventListener("click", () => abrirModalProduto(prod.id));
    card.querySelector(".produto-nome").addEventListener("click", () => abrirModalProduto(prod.id));

    card.querySelector(".btn-add").addEventListener("click", (e) => {
        e.stopPropagation();
        adicionarAoCarrinho(prod.id, 1);
    });

    return card;
}

function renderizarProdutos(lista) {
    const container = document.getElementById("listaProdutos");
    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = `<p class="lista-vazia">Nenhum produto nesta categoria.</p>`;
        return;
    }

    lista.forEach((prod) => container.appendChild(criarCardProduto(prod)));
}

function filtrarPorCategoria(categoriaId) {
    categoriaAtiva = categoriaId;
    atualizarCategoriaAtiva();

    const titulo = document.getElementById("tituloProdutos");

    if (categoriaId === "todos") {
        titulo.textContent = "Todos os Produtos";
        renderizarProdutos(produtosDados);
        return;
    }

    const cat = categoriasDados.find((c) => c.id === categoriaId);
    titulo.textContent = cat ? cat.nome : "Produtos";
    renderizarProdutos(produtosDados.filter((p) => p.categoria === categoriaId));
}

function abrirModalProduto(id) {
    const produto = produtosDados.find((p) => p.id === id);
    if (!produto) return;

    produtoModalId = id;
    document.getElementById("modalImg").src = produto.imagem;
    document.getElementById("modalImg").alt = produto.nome;
    document.getElementById("modalNome").textContent = produto.nome;
    document.getElementById("modalPreco").textContent = `R$ ${formatarPreco(produto.preco)}`;
    document.getElementById("modalDescricao").textContent = produto.descricao;
    document.getElementById("quantidadeProduto").value = 1;

    document.getElementById("modalProduto").classList.add("ativo");
    document.body.style.overflow = "hidden";
}

function fecharModalProduto() {
    document.getElementById("modalProduto").classList.remove("ativo");
    produtoModalId = null;
    document.body.style.overflow = "";
}

function abrirModalPedido() {
    document.getElementById("modalPedido").classList.add("ativo");
    document.body.style.overflow = "hidden";
}

function fecharModalPedido() {
    document.getElementById("modalPedido").classList.remove("ativo");
    document.body.style.overflow = "";
}

function adicionarAoCarrinho(id, quantidade) {
    const produto = produtosDados.find((p) => p.id === id);
    if (!produto) return;

    const qtd = Math.max(1, parseInt(quantidade, 10) || 1);
    const existente = carrinho.find((item) => item.id === id);

    if (existente) {
        existente.quantidade += qtd;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            imagem: produto.imagem,
            quantidade: qtd,
        });
    }

    atualizarCarrinhoUI();
    mostrarToast(`${produto.nome} adicionado!`);
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter((item) => item.id !== id);
    atualizarCarrinhoUI();
}

function alterarQuantidadeCarrinho(id, delta) {
    const item = carrinho.find((i) => i.id === id);
    if (!item) return;

    item.quantidade += delta;
    if (item.quantidade <= 0) {
        removerDoCarrinho(id);
    } else {
        atualizarCarrinhoUI();
    }
}

function calcularTotal() {
    return carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
}

function atualizarCarrinhoUI() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const badge = document.getElementById("badgeCarrinho");

    badge.textContent = totalItens;
    badge.classList.toggle("badge-oculto", totalItens === 0);

    document.getElementById("totalCarrinho").textContent = formatarPreco(calcularTotal());

    const container = document.getElementById("itensCarrinho");

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-vazio">
                <i class="bi bi-cart"></i>
                <p>Seu carrinho esta vazio</p>
            </div>`;
        document.getElementById("btnFinalizar").disabled = true;
        return;
    }

    document.getElementById("btnFinalizar").disabled = false;
    container.innerHTML = carrinho
        .map(
            (item) => `
        <div class="item-carrinho">
            <img src="${item.imagem}" alt="" class="item-thumb">
            <div class="item-info">
                <span class="item-nome">${item.nome}</span>
                <span class="item-preco">R$ ${formatarPreco(item.preco * item.quantidade)}</span>
                <div class="item-qty">
                    <button type="button" class="btn-qty-sm" data-acao="menos" data-id="${item.id}">&minus;</button>
                    <span>${item.quantidade}</span>
                    <button type="button" class="btn-qty-sm" data-acao="mais" data-id="${item.id}">+</button>
                </div>
            </div>
            <button type="button" class="btn-remover" data-id="${item.id}" aria-label="Remover">
                <i class="bi bi-trash"></i>
            </button>
        </div>`
        )
        .join("");

    container.querySelectorAll(".btn-remover").forEach((btn) => {
        btn.addEventListener("click", () => removerDoCarrinho(Number(btn.dataset.id)));
    });

    container.querySelectorAll(".btn-qty-sm").forEach((btn) => {
        btn.addEventListener("click", () => {
            const delta = btn.dataset.acao === "mais" ? 1 : -1;
            alterarQuantidadeCarrinho(Number(btn.dataset.id), delta);
        });
    });
}

function alternarCamposPedido() {
    const tipo = document.getElementById("tipoPedido").value;
    const camposMesa = document.getElementById("camposMesa");
    const camposDelivery = document.getElementById("camposDelivery");

    camposMesa.style.display = tipo === "mesa" ? "block" : "none";
    camposDelivery.style.display = tipo === "delivery" ? "block" : "none";
}

function abrirCarrinho() {
    document.getElementById("carrinhoOverlay").classList.add("ativo");
    document.body.style.overflow = "hidden";
}

function fecharCarrinho() {
    document.getElementById("carrinhoOverlay").classList.remove("ativo");
    if (!document.getElementById("modalProduto").classList.contains("ativo")) {
        document.body.style.overflow = "";
    }
}

function montarResumoPedido(idPedido) {
    const tipo = document.getElementById("tipoPedido").value;
    const labels = { delivery: "Delivery", retirada: "Retirada no Balcao", mesa: "Mesa" };
    const labelTipo = labels[tipo] || tipo;

    let infoExtra = "";
    if (tipo === "mesa") {
        const mesa = document.getElementById("numeroMesa").value.trim();
        infoExtra = `Mesa: ${mesa}\n`;
    } else if (tipo === "delivery") {
        const rua = document.getElementById("clienteRua").value.trim();
        const num = document.getElementById("clienteNumero").value.trim();
        const bairro = document.getElementById("clienteBairro").value.trim();
        if (rua) infoExtra = `Endereco: ${rua}, ${num} - ${bairro}\n`;
    }

    const linhas = carrinho.map(
        (item) => `- ${item.quantidade}x ${item.nome} — R$ ${formatarPreco(item.preco * item.quantidade)}`
    );

    return `Pedido #${idPedido}\nTipo: ${labelTipo}\n${infoExtra}\nItens:\n${linhas.join("\n")}\n\nTotal: R$ ${formatarPreco(calcularTotal())}`;
}

function validarCampos() {
    const tipo = document.getElementById("tipoPedido").value;

    if (tipo === "mesa") {
        const mesa = document.getElementById("numeroMesa").value.trim();
        if (!mesa) {
            mostrarToast("Informe o numero da mesa");
            return false;
        }
    }

    if (tipo === "delivery") {
        const nome = document.getElementById("clienteNome").value.trim();
        const telefone = document.getElementById("clienteTelefone").value.trim();
        const rua = document.getElementById("clienteRua").value.trim();
        const numero = document.getElementById("clienteNumero").value.trim();
        const bairro = document.getElementById("clienteBairro").value.trim();

        if (!nome) { mostrarToast("Informe seu nome"); return false; }
        if (!telefone) { mostrarToast("Informe seu telefone"); return false; }
        if (!rua) { mostrarToast("Informe a rua"); return false; }
        if (!numero) { mostrarToast("Informe o numero"); return false; }
        if (!bairro) { mostrarToast("Informe o bairro"); return false; }
    }

    return true;
}

function finalizarPedido() {
    if (carrinho.length === 0) return;
    if (!validarCampos()) return;

    const tipo = document.getElementById("tipoPedido").value;

    const payload = {
        origem: tipo,
        itens: carrinho.map((item) => ({
            id_item: item.id,
            quantidade: item.quantidade,
        })),
        taxa_entrega: tipo === "delivery" ? 7.00 : 0.00,
        desconto: 0.00,
    };

    // Dados do cliente
    if (tipo === "delivery") {
        payload.cliente = {
            nome: document.getElementById("clienteNome").value.trim(),
            telefone: document.getElementById("clienteTelefone").value.trim(),
            rua: document.getElementById("clienteRua").value.trim(),
            numero: document.getElementById("clienteNumero").value.trim(),
            bairro: document.getElementById("clienteBairro").value.trim(),
            complemento: document.getElementById("clienteComplemento").value.trim(),
        };
    }

    // Mesa
    if (tipo === "mesa") {
        payload.mesa = document.getElementById("numeroMesa").value.trim();
    }

    const btnFinalizar = document.getElementById("btnFinalizar");
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Enviando...";

    fetch(`${API_BASE}/cadastrar_pedido.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
        .then((r) => r.json())
        .then((data) => {
            if (data.sucesso) {
                const resumo = montarResumoPedido(data.id_pedido);

                document.getElementById("pedidoNumero").textContent = `Pedido #${data.id_pedido}`;
                document.getElementById("pedidoResumo").textContent = resumo;

                fecharCarrinho();
                abrirModalPedido();

                // Limpar campos
                carrinho = [];
                atualizarCarrinhoUI();
                limparCamposPedido();
            } else {
                mostrarToast("Erro: " + (data.erro || "Tente novamente"));
            }
        })
        .catch((err) => {
            console.error(err);
            mostrarToast("Erro de conexao. Tente novamente.");
        })
        .finally(() => {
            btnFinalizar.disabled = false;
            btnFinalizar.textContent = "Finalizar Pedido";
        });
}

function limparCamposPedido() {
    document.getElementById("clienteNome").value = "";
    document.getElementById("clienteTelefone").value = "";
    document.getElementById("clienteRua").value = "";
    document.getElementById("clienteNumero").value = "";
    document.getElementById("clienteBairro").value = "";
    document.getElementById("clienteComplemento").value = "";
    document.getElementById("numeroMesa").value = "";
}

function mostrarToast(mensagem) {
    let toast = document.querySelector(".toast-msg");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast-msg";
        document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.classList.add("visivel");
    clearTimeout(mostrarToast._timer);
    mostrarToast._timer = setTimeout(() => toast.classList.remove("visivel"), 2200);
}

function configurarEventos() {
    // Modal produto
    document.getElementById("fecharModal").addEventListener("click", fecharModalProduto);
    document.getElementById("modalProduto").addEventListener("click", (e) => {
        if (e.target.id === "modalProduto") fecharModalProduto();
    });

    document.getElementById("btnAddCarrinho").addEventListener("click", () => {
        if (!produtoModalId) return;
        const qtd = document.getElementById("quantidadeProduto").value;
        adicionarAoCarrinho(produtoModalId, qtd);
        fecharModalProduto();
        abrirCarrinho();
    });

    document.getElementById("diminuirQty").addEventListener("click", () => {
        const input = document.getElementById("quantidadeProduto");
        input.value = Math.max(1, parseInt(input.value, 10) - 1);
    });

    document.getElementById("aumentarQty").addEventListener("click", () => {
        const input = document.getElementById("quantidadeProduto");
        input.value = Math.min(99, parseInt(input.value, 10) + 1);
    });

    // Carrinho
    document.getElementById("abrirCarrinho").addEventListener("click", abrirCarrinho);
    document.getElementById("fecharCarrinho").addEventListener("click", fecharCarrinho);
    document.getElementById("carrinhoOverlay").addEventListener("click", (e) => {
        if (e.target.id === "carrinhoOverlay") fecharCarrinho();
    });

    // Tipo de pedido - alternar campos
    document.getElementById("tipoPedido").addEventListener("change", alternarCamposPedido);

    // Finalizar
    document.getElementById("btnFinalizar").addEventListener("click", finalizarPedido);

    // Modal pedido confirmado
    document.getElementById("fecharPedido").addEventListener("click", fecharModalPedido);
    document.getElementById("modalPedido").addEventListener("click", (e) => {
        if (e.target.id === "modalPedido") fecharModalPedido();
    });

    document.getElementById("btnCopiarPedido").addEventListener("click", () => {
        const texto = document.getElementById("pedidoResumo").textContent;
        navigator.clipboard.writeText(texto).then(() => mostrarToast("Resumo copiado!"));
    });

    // Inicializar campos condicionais
    alternarCamposPedido();
}
