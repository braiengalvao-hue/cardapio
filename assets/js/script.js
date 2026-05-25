/**

 * CARDÁPIO DIGITAL — consome APIs em /api/

 */



const API = {

    config: 'api/config.php',

    produtos: 'api/produtos.php',

    opcoes: 'api/opcoes.php',

    pedidos: 'api/pedidos.php',

    status: 'api/atualizar_status.php',

};



let lojaConfig = null;

let categoriasGlobais = [];

let produtosGlobais = [];

let mesasGlobais = [];

let balcoesGlobais = [];

let carrinho = [];

let produtoSelecionado = null;

let qtySelecionada = 1;



const el = {

    fotoLoja: document.getElementById('foto-loja'),

    nomeLoja: document.getElementById('nome-loja'),

    boasVindas: document.getElementById('boas-vindas'),

    subtexto: document.getElementById('subtexto'),

    infoEntrega: document.getElementById('infoEntrega'),

    footerNome: document.getElementById('footerNome'),

    redesSociais: document.getElementById('redesSociais'),

    listaCategorias: document.getElementById('listaCategorias'),

    produtoDestaque: document.getElementById('produtoDestaque'),

    tituloProdutos: document.getElementById('tituloProdutos'),

    listaProdutos: document.getElementById('listaProdutos'),

    btnAbrirCarrinho: document.getElementById('abrirCarrinho'),

    badgeCarrinho: document.getElementById('badgeCarrinho'),

    carrinhoOverlay: document.getElementById('carrinhoOverlay'),

    btnFecharCarrinho: document.getElementById('fecharCarrinho'),

    tipoPedido: document.getElementById('tipoPedido'),

    camposMesa: document.getElementById('camposMesa'),

    numeroMesa: document.getElementById('numeroMesa'),

    camposDelivery: document.getElementById('camposDelivery'),

    clienteNome: document.getElementById('clienteNome'),

    clienteTelefone: document.getElementById('clienteTelefone'),

    clienteRua: document.getElementById('clienteRua'),

    clienteNumero: document.getElementById('clienteNumero'),

    clienteBairro: document.getElementById('clienteBairro'),

    clienteComplemento: document.getElementById('clienteComplemento'),

    itensCarrinho: document.getElementById('itensCarrinho'),

    totalCarrinho: document.getElementById('totalCarrinho'),

    btnFinalizar: document.getElementById('btnFinalizar'),

    modalProduto: document.getElementById('modalProduto'),

    btnFecharModal: document.getElementById('fecharModal'),

    modalImg: document.getElementById('modalImg'),

    modalNome: document.getElementById('modalNome'),

    modalPreco: document.getElementById('modalPreco'),

    modalDescricao: document.getElementById('modalDescricao'),

    modalAdicionaisWrap: document.getElementById('modalAdicionaisWrap'),

    listaAdicionaisModal: document.getElementById('listaAdicionaisModal'),

    btnDiminuirQty: document.getElementById('diminuirQty'),

    btnAumentarQty: document.getElementById('aumentarQty'),

    quantidadeProduto: document.getElementById('quantidadeProduto'),

    btnAddCarrinho: document.getElementById('btnAddCarrinho'),

    modalPedido: document.getElementById('modalPedido'),

    btnFecharPedido: document.getElementById('fecharPedido'),

    pedidoNumero: document.getElementById('pedidoNumero'),

    pedidoResumo: document.getElementById('pedidoResumo'),

    btnCopiarPedido: document.getElementById('btnCopiarPedido'),

};



document.addEventListener('DOMContentLoaded', () => {

    inicializarApp();

    configurarEventos();

});



async function fetchJson(url, options = {}) {

    const res = await fetch(url, options);

    let dados;

    try {

        dados = await res.json();

    } catch {

        throw new Error('Resposta inválida do servidor.');

    }

    if (!res.ok) {

        throw new Error(dados.error || dados.message || 'Erro na requisição.');

    }

    if (dados && dados.error) {

        throw new Error(dados.error);

    }

    return dados;

}



function normalizarConfig(raw) {

    const nome = raw.nome_estabelecimento || raw.nome_loja || 'Restaurante';

    const foto = raw.url_imagem || raw.foto_loja || '';

    const aberto = (raw.status_funcionamento || 'aberto') === 'aberto';

    return {

        nome_estabelecimento: nome,

        url_imagem: foto,

        boas_vindas: raw.boas_vindas || `Bem-vindo ao ${nome}`,

        subtexto: raw.subtexto || (aberto ? 'Faça seu pedido.' : 'Estamos fechados no momento.'),

        taxa_entrega: raw.taxa_entrega ?? '0',

        whatsapp: raw.whatsapp || '',

        instagram: raw.instagram || '',

        status_funcionamento: aberto ? 'aberto' : 'fechado',

    };

}



function lojaEstaAberta() {

    return lojaConfig && lojaConfig.status_funcionamento === 'aberto';

}



function escHtml(texto) {

    const d = document.createElement('div');

    d.textContent = texto ?? '';

    return d.innerHTML;

}



function formatarMoeda(valor) {

    return parseFloat(valor || 0).toFixed(2).replace('.', ',');

}



function precoUnitarioComAdicionais(item) {

    let preco = item.preco_unitario;

    (item.adicionais || []).forEach((ad) => {

        preco += parseFloat(ad.valor_adicional) || 0;

    });

    return preco;

}



function observacaoItemParaApi(item) {

    let obs = item.observacoes || '';

    if (item.adicionais && item.adicionais.length > 0) {

        const txt = item.adicionais.map((a) => a.nome_adicional).join(', ');

        obs = obs ? `${obs} | Adicionais: ${txt}` : `Adicionais: ${txt}`;

    }

    return obs;

}



function resolverIdMesa(numeroInformado) {

    const texto = String(numeroInformado || '').trim().toLowerCase();

    if (!texto) return null;



    const mesa = mesasGlobais.find((m) => {

        const rotulo = String(m.numero_mesa || '').toLowerCase();

        return rotulo === texto

            || rotulo.replace(/\D/g, '') === texto.replace(/\D/g, '')

            || rotulo.includes(texto);

    });

    return mesa ? parseInt(mesa.id_mesa, 10) : null;

}



async function inicializarApp() {

    try {

        const rawConfig = await fetchJson(API.config);

        lojaConfig = normalizarConfig(rawConfig);



        produtosGlobais = await fetchJson(API.produtos);

        if (!Array.isArray(produtosGlobais)) {

            throw new Error('Lista de produtos inválida.');

        }



        await carregarMesasEBalcoes();

        extrairCategoriasDosProdutos();



        renderizarDadosLoja();

        renderizarCategorias();

        renderizarProdutos();

        renderizarDestaque();

        aplicarEstadoLojaFechada();

    } catch (erro) {

        console.error(erro);

        alert(erro.message || 'Não foi possível carregar o cardápio. Verifique o MySQL e o banco cardapio.');

    }

}



async function carregarMesasEBalcoes() {

    try {

        mesasGlobais = await fetchJson(`${API.opcoes}?tipo=mesas`);

        if (!Array.isArray(mesasGlobais)) mesasGlobais = [];

    } catch (e) {

        console.warn('Mesas não carregadas:', e);

        mesasGlobais = [];

    }

    try {

        balcoesGlobais = await fetchJson(`${API.opcoes}?tipo=balcoes`);

        if (!Array.isArray(balcoesGlobais)) balcoesGlobais = [];

    } catch (e) {

        console.warn('Balcões não carregados:', e);

        balcoesGlobais = [];

    }

}



function extrairCategoriasDosProdutos() {

    const mapeado = {};

    produtosGlobais.forEach((p) => {

        const id = Number(p.id_categoria);

        if (!mapeado[id]) {

            mapeado[id] = { id_categoria: id, nome_categoria: p.nome_categoria };

        }

    });

    categoriasGlobais = Object.values(mapeado);

}



function renderizarDadosLoja() {

    const cfg = lojaConfig;

    if (!cfg) return;



    el.nomeLoja.innerText = cfg.nome_estabelecimento;

    el.footerNome.innerText = cfg.nome_estabelecimento;

    el.boasVindas.innerText = cfg.boas_vindas;

    el.subtexto.innerText = cfg.status_funcionamento === 'aberto'

        ? `🟢 ${cfg.subtexto}`

        : `🔴 ${cfg.subtexto}`;



    if (cfg.url_imagem) {

        el.fotoLoja.src = cfg.url_imagem;

        el.fotoLoja.hidden = false;

    } else {

        el.fotoLoja.removeAttribute('src');

        el.fotoLoja.hidden = true;

    }



    const taxa = parseFloat(cfg.taxa_entrega || 0);

    el.infoEntrega.innerHTML = `
        <div class="info-box">
            <i class="bi bi-truck info-icon"></i>
            <div class="info-text">
                <span class="info-titulo">Delivery</span>
                <span class="info-sub">R$ ${formatarMoeda(taxa)}</span>
            </div>
        </div>
    `;



    let redesHtml = '';

    if (cfg.instagram) {

        const ig = String(cfg.instagram).trim();

        const urlIg = ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace(/^@/, '')}`;

        redesHtml += `<a href="${encodeURI(urlIg)}" target="_blank" rel="noopener" aria-label="Instagram" class="rede"><i class="bi bi-instagram"></i></a>`;

    }

    if (cfg.whatsapp) {

        const tel = String(cfg.whatsapp).replace(/\D/g, '');

        redesHtml += `<a href="https://wa.me/${tel}" target="_blank" rel="noopener" aria-label="WhatsApp" class="rede"><i class="bi bi-whatsapp"></i></a>`;

    }

    el.redesSociais.innerHTML = redesHtml || '<span class="footer-sem-redes">Siga-nos nas redes em breve</span>';

}



function aplicarEstadoLojaFechada() {

    const fechado = !lojaEstaAberta();

    el.btnFinalizar.disabled = fechado || carrinho.length === 0;

    if (fechado) {

        el.btnFinalizar.title = 'Loja fechada no momento';

    } else {

        el.btnFinalizar.removeAttribute('title');

    }

}



function renderizarCategorias() {

    let html = `<button type="button" class="btn-categoria ativa" data-id="0">Todos</button>`;

    categoriasGlobais.forEach((cat) => {

        html += `<button type="button" class="btn-categoria" data-id="${cat.id_categoria}">${escHtml(cat.nome_categoria)}</button>`;

    });

    el.listaCategorias.innerHTML = html;



    el.listaCategorias.querySelectorAll('.btn-categoria').forEach((btn) => {

        btn.addEventListener('click', () => {

            el.listaCategorias.querySelectorAll('.btn-categoria').forEach((b) => b.classList.remove('ativa'));

            btn.classList.add('ativa');

            const id = Number(btn.dataset.id);

            const nome = id === 0 ? 'Todos os Produtos' : categoriasGlobais.find((c) => c.id_categoria === id)?.nome_categoria || 'Produtos';

            el.tituloProdutos.innerText = nome;

            if (id === 0) {

                renderizarProdutos(produtosGlobais);

            } else {

                renderizarProdutos(produtosGlobais.filter((p) => Number(p.id_categoria) === id));

            }

        });

function renderizarProdutos(produtosFiltrados = produtosGlobais) {

    if (!produtosFiltrados.length) {

        el.listaProdutos.innerHTML = '<p class="aviso-vazio">Nenhum produto encontrado.</p>';

        return;

    }



    let html = '';

    produtosFiltrados.forEach((p) => {

        const preco = formatarMoeda(p.preco);

        const imgUrl = p.url_imagem ? p.url_imagem : 'assets/exemplo.jpeg';

        html += `

            <div class="produto-card" data-id="${p.id_item}" role="button" tabindex="0">

                <div class="produto-card-img-wrap">

                    <img src="${escHtml(imgUrl)}" class="produto-img" alt="${escHtml(p.nome)}">

                </div>

                <div class="produto-info">

                    <h4 class="produto-nome">${escHtml(p.nome)}</h4>

                    <div class="produto-rodape">

                        <span class="produto-preco">R$ ${preco}</span>

                        <button type="button" class="btn-add" aria-label="Adicionar ao carrinho">

                            <i class="bi bi-plus-lg"></i>

                        </button>

                    </div>

                </div>

            </div>

        `;

    });

    el.listaProdutos.innerHTML = html;



    el.listaProdutos.querySelectorAll('.produto-card').forEach((card) => {

        const id = Number(card.dataset.id);

        const abrir = () => abrirDetalhesProduto(id);

        card.addEventListener('click', abrir);

        card.addEventListener('keydown', (ev) => {

            if (ev.key === 'Enter' || ev.key === ' ') {

                ev.preventDefault();

                abrir();

            }

        });

    });

}



function renderizarDestaque() {

    const secao = document.getElementById('destaque');

    const destacado = produtosGlobais.find((p) => Number(p.recomendacao_dia) === 1);

    if (!destacado) {

        secao.style.display = 'none';

        return;

    }

    secao.style.display = '';

    const imgUrl = destacado.url_imagem ? destacado.url_imagem : 'assets/exemplo.jpeg';

    el.produtoDestaque.innerHTML = `

        <div class="destaque-item-click" data-id="${destacado.id_item}" role="button" tabindex="0" style="display: flex; align-items: center; gap: 16px; width: 100%; cursor: pointer;">

            <img src="${escHtml(imgUrl)}" class="img-sujestao" alt="${escHtml(destacado.nome)}">

            <div class="texto-sujestao">

                <h6>${escHtml(destacado.nome)}</h6>

                <p style="font-size: 13px; color: #6b7280; margin-bottom: 6px; line-height: 1.4;">${escHtml(destacado.descricao || '')}</p>

                <div class="preco">R$ ${formatarMoeda(destacado.preco)}</div>

            </div>

        </div>

    `;

    const clickEl = el.produtoDestaque.querySelector('.destaque-item-click');

    clickEl.addEventListener('click', () => abrirDetalhesProduto(Number(destacado.id_item)));

}



async function abrirDetalhesProduto(id_item) {

    if (!lojaEstaAberta()) {

        alert('No momento a loja está fechada para novos pedidos.');

        return;

    }



    produtoSelecionado = produtosGlobais.find((p) => Number(p.id_item) === Number(id_item));

    if (!produtoSelecionado) return;



    qtySelecionada = 1;

    el.quantidadeProduto.value = qtySelecionada;



    el.modalNome.innerText = produtoSelecionado.nome;

    el.modalDescricao.innerText = produtoSelecionado.descricao || '';



    if (produtoSelecionado.url_imagem) {

        el.modalImg.src = produtoSelecionado.url_imagem;

        el.modalImg.style.display = 'block';

    } else {

        el.modalImg.removeAttribute('src');

        el.modalImg.style.display = 'none';

    }



    el.modalAdicionaisWrap.style.display = 'none';

    el.listaAdicionaisModal.innerHTML = '';



    try {

        const adicionais = await fetchJson(`${API.opcoes}?id_categoria=${produtoSelecionado.id_categoria}`);

        if (Array.isArray(adicionais) && adicionais.length > 0) {

            el.modalAdicionaisWrap.style.display = 'block';

            adicionais.forEach((ad) => {

                const precoAd = formatarMoeda(ad.valor_adicional);

                const label = document.createElement('label');

                label.className = 'adicional-checkbox-label';

                const input = document.createElement('input');

                input.type = 'checkbox';

                input.className = 'chk-adicional';

                input.dataset.id = String(ad.id_adicional);

                input.dataset.nome = ad.nome_adicional;

                input.dataset.preco = String(ad.valor_adicional);

                input.addEventListener('change', atualizarTotalModal);

                const span = document.createElement('span');

                span.textContent = `${ad.nome_adicional} (+ R$ ${precoAd})`;

                label.append(input, span);

                el.listaAdicionaisModal.appendChild(label);

            });

        }

    } catch (e) {

        console.error('Erro ao carregar adicionais:', e);

    }



    atualizarTotalModal();

    el.modalProduto.classList.add('ativo');

}



function atualizarTotalModal() {

    if (!produtoSelecionado) return;

    let total = parseFloat(produtoSelecionado.preco);

    el.listaAdicionaisModal.querySelectorAll('.chk-adicional:checked').forEach((chk) => {

        total += parseFloat(chk.dataset.preco);

    });

    total *= qtySelecionada;

    el.modalPreco.innerText = `R$ ${formatarMoeda(total)}`;

}



function adicionarAoCarrinho() {

    if (!lojaEstaAberta()) {

        alert('No momento a loja está fechada para novos pedidos.');

        return;

    }



    const adicionaisSelecionados = [];

    el.listaAdicionaisModal.querySelectorAll('.chk-adicional:checked').forEach((chk) => {

        adicionaisSelecionados.push({

            id_adicional: parseInt(chk.dataset.id, 10),

            nome_adicional: chk.dataset.nome,

            valor_adicional: parseFloat(chk.dataset.preco),

        });

    });



    carrinho.push({

        id_timestamp: Date.now(),

        id_item: produtoSelecionado.id_item,

        nome: produtoSelecionado.nome,

        preco_unitario: parseFloat(produtoSelecionado.preco),

        quantidade: qtySelecionada,

        observacoes: '',

        adicionais: adicionaisSelecionados,

        url_imagem: produtoSelecionado.url_imagem,

    });



    atualizarBadgeCarrinho();

    el.modalProduto.classList.remove('ativo');

    renderizarItensCarrinho();

}



function atualizarBadgeCarrinho() {

    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

    if (totalItens > 0) {

        el.badgeCarrinho.innerText = totalItens;

        el.badgeCarrinho.className = 'badge-visivel';

    } else {

        el.badgeCarrinho.innerText = '0';

        el.badgeCarrinho.className = 'badge-oculto';

    }

    aplicarEstadoLojaFechada();

    if (lojaEstaAberta()) {

        el.btnFinalizar.disabled = totalItens === 0;

    }

}



function renderizarItensCarrinho() {

    el.itensCarrinho.innerHTML = '';

    if (carrinho.length === 0) {

        el.itensCarrinho.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';

        calcularTotalCarrinho();

        return;

    }



    carrinho.forEach((item) => {

        const unitario = precoUnitarioComAdicionais(item);

        const subtotal = unitario * item.quantidade;

        let txtAdicionais = '';

        (item.adicionais || []).forEach((ad) => {

            txtAdicionais += `<small style="display: block; font-size: 12px; color: #6b7280; margin-top: 2px;">+ ${escHtml(ad.nome_adicional)}</small>`;

        });



        const imgUrl = item.url_imagem ? item.url_imagem : 'assets/exemplo.jpeg';



        const div = document.createElement('div');

        div.className = 'item-carrinho';

        div.innerHTML = `

            <img src="${escHtml(imgUrl)}" class="item-thumb" alt="${escHtml(item.nome)}">

            <div class="item-info">

                <span class="item-nome">${escHtml(item.nome)} (x${item.quantidade})</span>

                ${txtAdicionais}

                <span class="item-preco">R$ ${formatarMoeda(subtotal)}</span>

            </div>

            <button type="button" class="btn-remover" aria-label="Remover"><i class="bi bi-trash"></i></button>

        `;

        div.querySelector('.btn-remover').addEventListener('click', () => removerDoCarrinho(item.id_timestamp));

        el.itensCarrinho.appendChild(div);

    });



    calcularTotalCarrinho();

}



function removerDoCarrinho(id_timestamp) {

    carrinho = carrinho.filter((item) => item.id_timestamp !== id_timestamp);

    atualizarBadgeCarrinho();

    renderizarItensCarrinho();

}



function calcularTotalCarrinho() {

    let totalItens = 0;

    carrinho.forEach((item) => {

        totalItens += precoUnitarioComAdicionais(item) * item.quantidade;

    });



    const tipo = el.tipoPedido.value;

    let taxa = 0;



    if (tipo === 'delivery' && lojaConfig) {

        taxa = parseFloat(lojaConfig.taxa_entrega || 0);

    }



    el.totalCarrinho.innerText = formatarMoeda(totalItens + taxa);

}



async function enviarPedidoAoBanco() {

    if (carrinho.length === 0) return;

    if (!lojaEstaAberta()) {

        alert('No momento a loja está fechada para novos pedidos.');

        return;

    }



    const tipo = el.tipoPedido.value;



    if (tipo === 'delivery') {

        if (!el.clienteNome.value.trim() || !el.clienteTelefone.value.trim() || !el.clienteRua.value.trim() || !el.clienteNumero.value.trim() || !el.clienteBairro.value.trim()) {

            alert('Por favor, preencha todos os campos obrigatórios para o Delivery!');

            return;

        }

    } else if (tipo === 'mesa' && !el.numeroMesa.value.trim()) {

        alert('Por favor, informe o número da mesa!');

        return;

    }



    const snapshotCarrinho = carrinho.map((c) => ({ ...c, adicionais: [...(c.adicionais || [])] }));



    el.btnFinalizar.disabled = true;

    el.btnFinalizar.innerText = 'Enviando...';



    let totalItens = 0;

    snapshotCarrinho.forEach((item) => {

        totalItens += precoUnitarioComAdicionais(item) * item.quantidade;

    });

    const taxa = tipo === 'delivery' ? parseFloat(lojaConfig.taxa_entrega || 0) : 0;

    const valorGeralCalculado = totalItens + taxa;



    let obsGeralStr = `Tipo de Pedido: ${tipo.toUpperCase()}. `;

    let id_mesa = null;

    let id_balcao = null;



    if (tipo === 'delivery') {

        obsGeralStr += `Endereço: ${el.clienteRua.value}, Nº ${el.clienteNumero.value}, ${el.clienteBairro.value}`;

        if (el.clienteComplemento.value.trim()) obsGeralStr += ` - Comp: ${el.clienteComplemento.value}`;

        obsGeralStr += ` | Tel: ${el.clienteTelefone.value} | Nome: ${el.clienteNome.value}`;

    } else if (tipo === 'mesa') {

        const num = el.numeroMesa.value.trim();

        id_mesa = resolverIdMesa(num);

        obsGeralStr += `Mesa: ${num}`;

        if (!id_mesa && mesasGlobais.length) {

            obsGeralStr += ' (mesa não vinculada ao cadastro)';

        }

    } else if (tipo === 'retirada' && balcoesGlobais.length > 0) {

        id_balcao = parseInt(balcoesGlobais[0].id_balcao, 10);

        obsGeralStr += `Retirada no balcão: ${balcoesGlobais[0].nome_balcao}`;

    }



    const payload = {

        origem: tipo,

        id_mesa,

        id_balcao,

        forma_pagamento: tipo === 'delivery' ? 'A combinar na Entrega' : 'A pagar no Caixa',

        valor_total: valorGeralCalculado,

        taxa_entrega: taxa,

        observacoes: obsGeralStr,

        id_cliente: null,

        itens: snapshotCarrinho.map((c) => ({

            id_item: c.id_item,

            quantidade: c.quantidade,

            preco_unitario: precoUnitarioComAdicionais(c),

            observacoes: observacaoItemParaApi(c),

        })),

    };



    try {

        const resultado = await fetchJson(API.pedidos, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json; charset=utf-8' },

            body: JSON.stringify(payload),

        });



        if (resultado.success) {

            abrirModalSucessoPedido(resultado.id_pedido, payload, snapshotCarrinho);

            carrinho = [];

            atualizarBadgeCarrinho();

            renderizarItensCarrinho();

            el.carrinhoOverlay.classList.remove('ativo');

        } else {

            alert('Não foi possível registrar o pedido.');

        }

    } catch (e) {

        console.error(e);

        alert(e.message || 'Erro de conexão ao tentar enviar o pedido.');

    } finally {

        aplicarEstadoLojaFechada();

        if (lojaEstaAberta()) {

            el.btnFinalizar.innerText = 'Finalizar Pedido';

        }

    }

}



function rotuloStatus(status) {
    const rotulos = {
        pendente: 'Pendente',
        em_preparo: 'Em preparo',
        saiu_para_entrega: 'Saiu para entrega',
        concluido: 'Concluído',
        cancelado: 'Cancelado',
    };
    return rotulos[status] || status;
}

async function atualizarStatusPedidoNoModal(id_pedido) {
    try {
        const dados = await fetchJson(`${API.status}?id_pedido=${id_pedido}`);
        el.pedidoNumero.innerText = `Nº do Pedido: ${id_pedido} — Status: ${rotuloStatus(dados.status)}`;
    } catch (e) {
        console.warn('Status do pedido:', e);
    }
}

function abrirModalSucessoPedido(id_pedido, payload, itensPedido) {

    el.pedidoNumero.innerText = `Nº do Pedido: ${id_pedido}`;
    atualizarStatusPedidoNoModal(id_pedido);

    let resumoText = `=== RESUMO DO PEDIDO #${id_pedido} ===\n`;

    itensPedido.forEach((c) => {

        const unit = precoUnitarioComAdicionais(c);

        resumoText += `${c.quantidade}x ${c.nome} - R$ ${formatarMoeda(unit * c.quantidade)}\n`;

        (c.adicionais || []).forEach((a) => {

            resumoText += `  + ${a.nome_adicional}\n`;

        });

    });

    resumoText += `\nTOTAL: R$ ${formatarMoeda(payload.valor_total)}\n`;

    resumoText += `-------------------------------\n`;

    resumoText += payload.observacoes;



    el.pedidoResumo.innerText = resumoText;

    el.modalPedido.classList.add('ativo');

}



function configurarEventos() {

    el.btnAbrirCarrinho.addEventListener('click', () => el.carrinhoOverlay.classList.add('ativo'));

    el.btnFecharCarrinho.addEventListener('click', () => el.carrinhoOverlay.classList.remove('ativo'));

    el.carrinhoOverlay.addEventListener('click', (ev) => {

        if (ev.target === el.carrinhoOverlay) el.carrinhoOverlay.classList.remove('ativo');

    });



    el.tipoPedido.addEventListener('change', (e) => {

        const val = e.target.value;

        el.camposDelivery.style.display = val === 'delivery' ? 'block' : 'none';

        el.camposMesa.style.display = val === 'mesa' ? 'block' : 'none';

        calcularTotalCarrinho();

    });



    el.btnDiminuirQty.addEventListener('click', () => {

        if (qtySelecionada > 1) {

            qtySelecionada--;

            el.quantidadeProduto.value = qtySelecionada;

            atualizarTotalModal();

        }

    });

    el.btnAumentarQty.addEventListener('click', () => {

        qtySelecionada++;

        el.quantidadeProduto.value = qtySelecionada;

        atualizarTotalModal();

    });

    el.quantidadeProduto.addEventListener('change', (e) => {

        let val = parseInt(e.target.value, 10);

        if (isNaN(val) || val < 1) val = 1;

        qtySelecionada = val;

        e.target.value = qtySelecionada;

        atualizarTotalModal();

    });



    el.btnFecharModal.addEventListener('click', () => el.modalProduto.classList.remove('ativo'));

    el.modalProduto.addEventListener('click', (ev) => {

        if (ev.target === el.modalProduto) el.modalProduto.classList.remove('ativo');

    });

    el.btnAddCarrinho.addEventListener('click', adicionarAoCarrinho);

    el.btnFecharPedido.addEventListener('click', () => el.modalPedido.classList.remove('ativo'));

    el.btnFinalizar.addEventListener('click', enviarPedidoAoBanco);



    el.btnCopiarPedido.addEventListener('click', () => {

        navigator.clipboard.writeText(el.pedidoResumo.innerText);

        alert('Resumo copiado com sucesso!');

    });

}


