// CONFIGURAÇÃO DA API
const API_BASE_URL = "http://localhost:3000";
let umidadeChartInstance = null; // Guarda a instância do gráfico para evitar duplicações ao atualizar

// Estado global para reter os filtros selecionados na tabela e não resetar ao atualizar
let filtrosTabela = {
    deviceID: "",
    propriedade: "",
    status: "",
    data:""
};

// Estado global para reter os filtros selecionados na tabela de histórico
let filtrosHistorico = {
    deviceID: "",
    propriedade: "",
    status: "",
    data: ""
};

// Função que define as cores baseada nas diretrizes visuais do projeto
function getStatusConfig(item) {
    const prop = item.propriedade ? item.propriedade.toLowerCase() : '';
    
    // Converte o valor para número limpo eliminando o '%' se ele existir
    const valNumerico = parseFloat(String(item.valor).replace('%', ''));
    const valTexto = item.valor;

    if (prop.includes("bomba")) {
        return {
            label: valTexto,
            color: valTexto === "Ligada" ? "#2E7D32" : "#D32F2F",
            isNumeric: false
        };
    }

    if (valNumerico <= 20) return { label: "Crítico", color: "#D32F2F", isNumeric: true };
    if (valNumerico <= 40) return { label: "Atenção", color: "#F9A825", isNumeric: true };
    return { label: "Ideal", color: "#2E7D32", isNumeric: true };
}

// 1. Renderização do Dashboard com Carrossel Horizontal Expandido (Últimos 10 registros do S001)
function renderizarDashboard(listaSensores) {
    const grid = document.getElementById('sensor-grid');
    const alertArea = document.getElementById('alerts-area');

    if (!grid) return;

    // --- BLINDAGEM CONTRA SUMIÇO DE DADOS ---
    if (!listaSensores || listaSensores.length === 0) {
        grid.removeAttribute('style'); // Reseta estilos para não travar o flex
        grid.innerHTML = `
            <div style="background: #fff3cd; border-left: 5px solid #ffc107; color: #856404; padding: 20px; border-radius: 8px; margin: 15px 0; font-weight: 500; width: 100%;">
                📭 Aguardando leituras do dispositivo ou nenhuma informação foi encontrada.
            </div>
        `;
        if (alertArea) alertArea.innerHTML = '';
        return;
    }

    grid.innerHTML = '';
    
    // Configura o contêiner original para permitir o deslize horizontal suave de vários cards
    grid.style.display = 'flex';
    grid.style.flexWrap = 'nowrap';
    grid.style.overflowX = 'auto';
    grid.style.scrollBehavior = 'smooth';
    grid.style.gap = '20px';
    grid.style.padding = '10px 5px';
    grid.style.webkitOverflowScrolling = 'touch'; // Rolagem suave em telas de toque

    // Oculta de forma limpa a barra de rolagem padrão do navegador para não estragar o design
    if (!document.getElementById('estilo-carrossel-grid')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'estilo-carrossel-grid';
        styleSheet.innerText = `#sensor-grid::-webkit-scrollbar { display: none; } #sensor-grid { -ms-overflow-style: none; scrollbar-width: none; }`;
        document.head.appendChild(styleSheet);
    }
    
    if (alertArea) alertArea.innerHTML = '';

    // Filtra para garantir que estamos lidando apenas com o S001
    const leiturasS001 = listaSensores.filter(sensor => (sensor.deviceID || 'S001') === 'S001');
    
    // Define a exibição de até as últimas 10 leituras no carrossel horizontal
    const ultimasLeituras = leiturasS001.slice(0, 10); 

    const dispositivosComAlerta = new Set();

    ultimasLeituras.forEach((sensor, index) => {
        const config = getStatusConfig(sensor);
        const valorLimpo = String(sensor.valor).replace('%', '');
        const idDispositivo = sensor.deviceID || 'S001';

        const valNumerico = parseFloat(valorLimpo) || 0;
        const porcentagemBarra = Math.min(Math.max(valNumerico, 0), 100);

        // Formatação do carimbo de data/hora para as etiquetas
        const dataObj = sensor.timestamp ? new Date(sensor.timestamp) : new Date();
        const horaMinuto = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Identificadores de tempo dinâmicos
        let labelTempoCard = "Última Leitura";
        if (index === 1) labelTempoCard = "Leitura Anterior";
        if (index === 2) labelTempoCard = "Antepenúltima Leitura";
        if (index > 2)  labelTempoCard = `Histórico às ${horaMinuto}`;

        // Lógica de Alertas Temporários (apenas para a última leitura real)
        if (config.label === "Crítico" && alertArea && index === 0) {
            if (!dispositivosComAlerta.has(idDispositivo)) {
                dispositivosComAlerta.add(idDispositivo);

                const caixaAlerta = document.createElement('div');
                caixaAlerta.style = "display:block; background:#ffebee; border-left:5px solid #D32F2F; padding:15px; margin-bottom:15px; border-radius:8px; color:#D32F2F; font-size:0.9rem; transition: opacity 0.5s ease;";
                caixaAlerta.innerHTML = `<strong>⚠️ Alerta:</strong> Irrigação necessária no dispositivo ${idDispositivo}!`;
                
                alertArea.appendChild(caixaAlerta);

                setTimeout(() => {
                    caixaAlerta.style.opacity = '0';
                    setTimeout(() => {
                        if (caixaAlerta.parentNode === alertArea) alertArea.removeChild(caixaAlerta);
                    }, 500);
                }, 6000);
            }
        }

        // Construção do Card Element
        const card = document.createElement('div');
        card.className = 'card';
        
        // Mantém a largura confortável de cada card no carrossel horizontal
        card.style.flex = '0 0 320px'; 
        card.style.cursor = 'pointer'; 
        card.style.transition = 'transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease';
        
        // Destaca o card mais recente e suaviza os históricos
        card.style.opacity = index === 0 ? "1" : "0.75";

        // Efeitos de Hover
        card.onmouseenter = () => {
            card.style.transform = 'translateY(-5px) scale(1.01)';
            card.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
            card.style.opacity = '1'; 
        };
        card.onmouseleave = () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = 'none';
            card.style.opacity = index === 0 ? "1" : "0.75"; 
        };

        // EVENTO DE CLIQUE RESTAURADO: Abre o Pop-up com as informações do card clicado
        card.onclick = () => {
            abrirModalDetalhes(sensor, labelTempoCard);
        };

        card.innerHTML = `
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:#6D4C41; font-weight:bold; font-size:0.75rem;">${idDispositivo} (${labelTempoCard})</span>
                <span style="background:${config.color}22; color:${config.color}; padding:2px 10px; border-radius:12px; font-size:0.7rem; font-weight:bold;">
                    ${config.label}
                </span>
            </div>
            <h3 style="margin:5px 0; color:#333; font-size:1rem;">${sensor.propriedade || 'Umidade'}</h3>
            <div style="font-size:2.5rem; font-weight:bold; color:#2c3e50; margin:10px 0;">
                ${valorLimpo}${config.isNumeric ? '%' : ''}
            </div>
            ${config.isNumeric ? `
                <div style="background:#eee; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="width:${porcentagemBarra}%; background:${config.color}; height:100%;"></div>
                </div>
            ` : ''}
            <div style="font-size:0.65rem; color:#aaa; margin-top:15px;">
                🕒 Sincronizado: ${sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')}
            </div>
        `;
        grid.appendChild(card);
    });

    // Ativa a função de clique e arraste lateral do mouse
    ativarArrastarParaMover(grid);

    inicializarGrafico(listaSensores);
}

// Função Auxiliar: Ativa o arrastar horizontal do carrossel usando o mouse
function ativarArrastarParaMover(slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'pointer';
    });
    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'pointer';
    });
    slider.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5; 
        slider.scrollLeft = scrollLeft - walk;
    });
}

// Função do Pop-up: Monta e gerencia a janela flutuante na tela
function abrirModalDetalhes(sensor, labelTempoCard) {
    // Remove modais antigos abertos para evitar duplicidade
    const modalExistente = document.getElementById('modal-detalhes-sensor');
    if (modalExistente) modalExistente.remove();

    const config = getStatusConfig(sensor);
    const valorLimpo = String(sensor.valor).replace('%', '');
    const idDispositivo = sensor.deviceID || 'S001';
    
    const dataObj = sensor.timestamp ? new Date(sensor.timestamp) : new Date();
    const dataCompleta = dataObj.toLocaleDateString('pt-BR');
    const horaCompleta = dataObj.toLocaleTimeString('pt-BR');

    // Container de fundo escurecido (Overlay)
    const overlay = document.createElement('div');
    overlay.id = 'modal-detalhes-sensor';
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.5); display: flex; align-items: center;
        justify-content: center; z-index: 10000; animation: fadeIn 0.2s ease-out;
    `;

    // Painel Central Branco com as informações
    overlay.innerHTML = `
        <div style="background: white; width: 90%; max-width: 500px; border-radius: 12px; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.25); padding: 25px; 
                    position: relative; animation: slideUp 0.2s ease-out; font-family: inherit;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 1.25rem; color: #2c3e50;">Detalhes do Registro</h2>
                <button id="fechar-modal-btn" style="background: none; border: none; font-size: 1.5rem; color: #aaa; cursor: pointer; line-height: 1;">&times;</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 8px;">
                    <span style="color: #777; font-weight: 500;">Identificador:</span>
                    <span style="font-weight: bold; color: #6D4C41;">${idDispositivo} (${labelTempoCard})</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 8px;">
                    <span style="color: #777; font-weight: 500;">Tipo de Métrica:</span>
                    <span style="font-weight: 600; color: #333;">${sensor.propriedade || 'Umidade do Solo'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 8px; align-items: center;">
                    <span style="color: #777; font-weight: 500;">Valor Coletado:</span>
                    <span style="font-size: 1.3rem; font-weight: bold; color: #2c3e50;">${valorLimpo}${config.isNumeric ? '%' : ''}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 8px; align-items: center;">
                    <span style="color: #777; font-weight: 500;">Status da Zona:</span>
                    <span style="background:${config.color}22; color:${config.color}; padding:4px 12px; border-radius:12px; font-size:0.75rem; font-weight:bold;">
                        ${config.label}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 8px;">
                    <span style="color: #777; font-weight: 500;">Data da Leitura:</span>
                    <span style="color: #555;">${dataCompleta}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding-bottom: 8px;">
                    <span style="color: #777; font-weight: 500;">Horário de Sincronismo:</span>
                    <span style="color: #555;">${horaCompleta}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-bottom: 8px;">
                    <span style="color: #777; font-weight: 500;">Ação Recomendada:</span>
                    <span style="font-weight: 600; color: ${config.label === 'Crítico' ? '#D32F2F' : '#2E7D32'};">
                        ${config.label === "Crítico" ? "⚠️ Ativar Linha de Irrigação" : "✅ Sistema Operando Normalmente"}
                    </span>
                </div>
            </div>

            <div style="text-align: right;">
                <button id="fechar-modal-btn-sec" style="background: #6D4C41; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                    Entendido
                </button>
            </div>
        </div>
    `;

    // Estilos internos de transição CSS para o Pop-up
    const estiloAnimacao = document.createElement('style');
    estiloAnimacao.innerHTML = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    overlay.appendChild(estiloAnimacao);
    document.body.appendChild(overlay);

    // Lógica para fechamento prático da janela
    const fecharModal = () => overlay.remove();
    document.getElementById('fechar-modal-btn').onclick = fecharModal;
    document.getElementById('fechar-modal-btn-sec').onclick = fecharModal;
    overlay.onclick = (e) => {
        if (e.target === overlay) fecharModal();
    };
}

// 2. Renderização da Tabela Geral de Sensores com Filtros Elegantes e Filtro de Data
function renderizarTabelaSensores(listaSensores) {
    const container = document.getElementById('sensores-table-container');
    if (!container) return;

    // Extração dinâmica de opções únicas para os menus drop-down
    const IDsUnicos = [...new Set(listaSensores.map(s => s.deviceID || 'S001'))];
    const propriedadesUnicas = [...new Set(listaSensores.map(s => s.propriedade || 'Umidade'))];
    const statusUnicos = [...new Set(listaSensores.map(s => getStatusConfig(s).label))];

    // Aplicação dos filtros cumulativos
    const listaFiltrada = listaSensores.filter(sensor => {
        const config = getStatusConfig(sensor);
        
        const matchID = filtrosTabela.deviceID === "" || (sensor.deviceID || 'S001') === filtrosTabela.deviceID;
        const matchProp = filtrosTabela.propriedade === "" || (sensor.propriedade || 'Umidade') === filtrosTabela.propriedade;
        const matchStatus = filtrosTabela.status === "" || config.label === filtrosTabela.status;
        
        // Validação da Data (compara o ano-mês-dia do timestamp com o valor do input)
        let matchData = true;
        if (filtrosTabela.data) {
            const dataSensor = sensor.timestamp ? new Date(sensor.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            matchData = dataSensor === filtrosTabela.data;
        }

        return matchID && matchProp && matchStatus && matchData;
    });

    // Estilo inline comum para os selects de cabeçalho parecerem botões discretos com setas
    const estiloSelectHead = `
        appearance: none; -webkit-appearance: none; -moz-appearance: none;
        background: transparent; border: none; font-size: 0.9rem; font-weight: bold; 
        color: #6D4C41; cursor: pointer; padding-right: 15px; outline: none;
    `;

    let htmlTabela = `
        <div style="overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #eeeeee;">
                        
                        <th style="padding: 15px; min-width: 160px; vertical-align: middle;">
                            <div style="position: relative; display: inline-block;">
                                <select id="filtro-id" style="${estiloSelectHead}">
                                    <option value="" style="color:#333; font-weight:normal;">ID do Dispositivo ▼</option>
                                    ${IDsUnicos.map(id => `<option value="${id}" ${filtrosTabela.deviceID === id ? 'selected' : ''} style="color:#333; font-weight:normal;">${id}</option>`).join('')}
                                </select>
                            </div>
                        </th>

                        <th style="padding: 15px; min-width: 160px; vertical-align: middle;">
                            <div style="position: relative; display: inline-block;">
                                <select id="filtro-prop" style="${estiloSelectHead} color: #333;">
                                    <option value="" style="color:#333; font-weight:normal;">Tipo de Medição ▼</option>
                                    ${propriedadesUnicas.map(p => `<option value="${p}" ${filtrosTabela.propriedade === p ? 'selected' : ''} style="color:#333; font-weight:normal;">${p}</option>`).join('')}
                                </select>
                            </div>
                        </th>

                        <th style="padding: 15px; color: #333; font-weight: bold; vertical-align: middle;">Último Valor</th>

                        <th style="padding: 15px; min-width: 130px; vertical-align: middle;">
                            <div style="position: relative; display: inline-block;">
                                <select id="filtro-status" style="${estiloSelectHead} color: #333;">
                                    <option value="" style="color:#333; font-weight:normal;">Status ▼</option>
                                    ${statusUnicos.map(st => `<option value="${st}" ${filtrosTabela.status === st ? 'selected' : ''} style="color:#333; font-weight:normal;">${st}</option>`).join('')}
                                </select>
                            </div>
                        </th>

                        <th style="padding: 15px; min-width: 200px; vertical-align: middle; color: #333; font-weight: bold;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span>Última Atualização</span>
                                <input type="date" id="filtro-data" value="${filtrosTabela.data || ''}" 
                                       style="padding: 2px 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.75rem; font-family: inherit; color: #555; cursor: pointer; outline: none;">
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaFiltrada.length === 0) {
        htmlTabela += `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #888; font-weight: 500;">
                    🔍 Nenhum registro corresponde aos filtros selecionados.
                </td>
            </tr>
        `;
    } else {
        listaFiltrada.forEach(sensor => {
            const config = getStatusConfig(sensor);
            const valorLimpo = String(sensor.valor).replace('%', '');
            const valorFormatado = valorLimpo + (config.isNumeric ? '%' : '');
            
            // Exibição amigável de Data e Hora na linha
            const dataObj = sensor.timestamp ? new Date(sensor.timestamp) : new Date();
            const dataFormatada = dataObj.toLocaleDateString('pt-BR');
            const horaFormatada = dataObj.toLocaleTimeString('pt-BR');

            htmlTabela += `
                <tr style="border-bottom: 1px solid #eeeeee;">
                    <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${sensor.deviceID || 'S001'}</td>
                    <td style="padding: 15px; color: #555;">${sensor.propriedade || 'Umidade'}</td>
                    <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${valorFormatado}</td>
                    <td style="padding: 15px;">
                        <span style="background:${config.color}22; color:${config.color}; padding:4px 12px; border-radius:12px; font-size:0.75rem; font-weight:bold; display: inline-block;">
                            ${config.label}
                        </span>
                    </td>
                    <td style="padding: 15px; color: #666; font-size: 0.85rem;">${dataFormatada} às ${horaFormatada}</td>
                </tr>
            `;
        });
    }

    htmlTabela += `</tbody></table></div>`;
    container.innerHTML = htmlTabela;

    // --- EVENT LISTENERS DOS FILTROS ---
    document.getElementById('filtro-id').addEventListener('change', (e) => {
        filtrosTabela.deviceID = e.target.value;
        renderizarTabelaSensores(listaSensores);
    });

    document.getElementById('filtro-prop').addEventListener('change', (e) => {
        filtrosTabela.propriedade = e.target.value;
        renderizarTabelaSensores(listaSensores);
    });

    document.getElementById('filtro-status').addEventListener('change', (e) => {
        filtrosTabela.status = e.target.value;
        renderizarTabelaSensores(listaSensores);
    });

    // Novo Event Listener para capturar a data escolhida
    document.getElementById('filtro-data').addEventListener('change', (e) => {
        filtrosTabela.data = e.target.value; // Retorna "AAAA-MM-DD" ou vazio
        renderizarTabelaSensores(listaSensores);
    });
}

// 3. Renderização da Tabela de Logs Históricos com Filtros Elegantes nos Títulos
function renderizarHistorico(listaHistorico) {
    const container = document.getElementById('historico-container');
    if (!container) return;

    const obterCorStatus = (status) => {
        if (status === "Crítico" || status === "Ligada") return "#D32F2F";
        if (status === "Atenção") return "#F9A825";
        if (status === "Ideal" || status === "Desligada") return "#2E7D32";
        return "#555";
    };

    // Extração dinâmica de opções baseadas no histórico de logs recebido
    const IDsUnicos = [...new Set(listaHistorico.map(log => log.deviceID || 'S001'))];
    const propriedadesUnicas = [...new Set(listaHistorico.map(log => log.propriedade || 'Umidade'))];
    
    // Mapeia os status reais para preencher o filtro do histórico
    const statusUnicos = [...new Set(listaHistorico.map(log => {
        const configProvisoria = getStatusConfig({ propriedade: log.propriedade, valor: log.valor });
        return configProvisoria.label;
    }))];

    // Aplicação dos filtros cumulativos na lista de histórico
    const listaFiltrada = listaHistorico.filter(log => {
        const configProvisoria = getStatusConfig({ propriedade: log.propriedade, valor: log.valor });
        const statusTexto = configProvisoria.label;

        const matchID = filtrosHistorico.deviceID === "" || (log.deviceID || 'S001') === filtrosHistorico.deviceID;
        const matchProp = filtrosHistorico.propriedade === "" || (log.propriedade || 'Umidade') === filtrosHistorico.propriedade;
        const matchStatus = filtrosHistorico.status === "" || statusTexto === filtrosHistorico.status;
        
        let matchData = true;
        if (filtrosHistorico.data) {
            const dataLog = log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            matchData = dataLog === filtrosHistorico.data;
        }

        return matchID && matchProp && matchStatus && matchData;
    });

    // Estilo comum para camuflar os selects como títulos com setas
    const estiloSelectHead = `
        appearance: none; -webkit-appearance: none; -moz-appearance: none;
        background: transparent; border: none; font-size: 0.9rem; font-weight: bold; 
        color: #333; cursor: pointer; padding-right: 15px; outline: none; font-family: inherit;
    `;

    let htmlHistorico = `
        <div style="overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #eeeeee;">
                        
                        <th style="padding: 15px; min-width: 220px; vertical-align: middle; color: #333; font-weight: bold;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span>Data / Hora</span>
                                <input type="date" id="filtro-hist-data" value="${filtrosHistorico.data || ''}" 
                                       style="padding: 2px 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.75rem; font-family: inherit; color: #555; cursor: pointer; outline: none;">
                            </div>
                        </th>

                        <th style="padding: 15px; min-width: 150px; vertical-align: middle;">
                            <div style="position: relative; display: inline-block;">
                                <select id="filtro-hist-id" style="${estiloSelectHead} color: #6D4C41;">
                                    <option value="" style="color:#333; font-weight:normal;">Dispositivo ▼</option>
                                    ${IDsUnicos.map(id => `<option value="${id}" ${filtrosHistorico.deviceID === id ? 'selected' : ''} style="color:#333; font-weight:normal;">${id}</option>`).join('')}
                                </select>
                            </div>
                        </th>

                        <th style="padding: 15px; min-width: 150px; vertical-align: middle;">
                            <div style="position: relative; display: inline-block;">
                                <select id="filtro-hist-prop" style="${estiloSelectHead}">
                                    <option value="" style="color:#333; font-weight:normal;">Propriedade ▼</option>
                                    ${propriedadesUnicas.map(p => `<option value="${p}" ${filtrosHistorico.propriedade === p ? 'selected' : ''} style="color:#333; font-weight:normal;">${p}</option>`).join('')}
                                </select>
                            </div>
                        </th>

                        <th style="padding: 15px; color: #333; font-weight: bold; vertical-align: middle;">Valor Registrado</th>

                        <th style="padding: 15px; min-width: 130px; vertical-align: middle;">
                            <div style="position: relative; display: inline-block;">
                                <select id="filtro-hist-status" style="${estiloSelectHead}">
                                    <option value="" style="color:#333; font-weight:normal;">Status ▼</option>
                                    ${statusUnicos.map(st => `<option value="${st}" ${filtrosHistorico.status === st ? 'selected' : ''} style="color:#333; font-weight:normal;">${st}</option>`).join('')}
                                </select>
                            </div>
                        </th>

                        <th style="padding: 15px; color: #333; font-weight: bold; vertical-align: middle;">Ação do Sistema</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (listaFiltrada.length === 0) {
        htmlHistorico += `
            <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #888; font-weight: 500;">
                    🔍 Nenhum registro histórico encontrado para os filtros selecionados.
                </td>
            </tr>
        `;
    } else {
        listaFiltrada.forEach(log => {
            const configProvisoria = getStatusConfig({ propriedade: log.propriedade, valor: log.valor });
            const statusTexto = configProvisoria.label;
            const corStatus = obterCorStatus(statusTexto);
            const dataFormatada = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
            const valorLimpo = String(log.valor).replace('%', '');

            htmlHistorico += `
                <tr style="border-bottom: 1px solid #eeeeee;">
                    <td style="padding: 15px; color: #666; font-size: 0.85rem;">${dataFormatada}</td>
                    <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${log.deviceID || 'S001'}</td>
                    <td style="padding: 15px; color: #555;">${log.propriedade || 'Umidade'}</td>
                    <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${valorLimpo}${configProvisoria.isNumeric ? '%' : ''}</td>
                    <td style="padding: 15px;">
                        <span style="background:${corStatus}22; color:${corStatus}; padding:2px 10px; border-radius:12px; font-size:0.7rem; font-weight:bold;">
                            ${statusTexto}
                        </span>
                    </td>
                    <td style="padding: 15px; color: #5d4037; font-weight: 500;">${statusTexto === "Crítico" ? "Ativar Irrigação" : "Monitorando"}</td>
                </tr>
            `;
        });
    }

    htmlHistorico += `</tbody></table></div>`;
    container.innerHTML = htmlHistorico;

    // --- EVENT LISTENERS PARA INTERATIVIDADE ---
    document.getElementById('filtro-hist-id').addEventListener('change', (e) => {
        filtrosHistorico.deviceID = e.target.value;
        renderizarHistorico(listaHistorico);
    });

    document.getElementById('filtro-hist-prop').addEventListener('change', (e) => {
        filtrosHistorico.propriedade = e.target.value;
        renderizarHistorico(listaHistorico);
    });

    document.getElementById('filtro-hist-status').addEventListener('change', (e) => {
        filtrosHistorico.status = e.target.value;
        renderizarHistorico(listaHistorico);
    });

    document.getElementById('filtro-hist-data').addEventListener('change', (e) => {
        filtrosHistorico.data = e.target.value;
        renderizarHistorico(listaHistorico);
    });
}

// 4. Função para renderizar o Gráfico Dinamicamente
function inicializarGrafico(listaSensores) {
    const canvas = document.getElementById('historicoGrafico');
    if (!canvas) return;

    const dadosUmidade = listaSensores.filter(s => s.propriedade && s.propriedade.toLowerCase().includes('umidade'));
    const rotasHoras = dadosUmidade.map(s => s.deviceID ? s.deviceID : 'Sensor');
    const valoresNumericos = dadosUmidade.map(s => parseFloat(String(s.valor).replace('%', '')));

    construirGraficoEfetivo(canvas, rotasHoras, valoresNumericos);
}

function construirGraficoEfetivo(canvas, labels, dados) {
    if (umidadeChartInstance) umidadeChartInstance.destroy();

    umidadeChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['S001', 'S002', 'S003'],
            datasets: [{
                label: 'Umidade do Solo (%)',
                data: dados.length ? dados : [45, 35, 18],
                borderColor: '#2E7D32',
                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    min: 0, 
                    max: 100,
                    ticks: {
                        callback: function(value) { return value + '%'; }
                    }
                }
            }
        }
    });
}

// --- FUNÇÕES ASYNC PARA CHAMADAS DE API ---
async function buscarDadosSensores() {
    try {
        const response = await fetch(`${API_BASE_URL}/leituras`);
        if (!response.ok) throw new Error("Erro na requisição dos sensores");

        const dados = await response.json();
        renderizarDashboard(dados);
        renderizarTabelaSensores(dados);
    } catch (error) {
        console.error("Falha ao carregar sensores do back-end:", error);
        exibirMensagemErro('sensor-grid', 'Não foi possível conectar ao servidor de sensores.');
        exibirMensagemErro('sensores-table-container', 'Não foi possível carregar a tabela de sensores.');
    }
}

async function buscarDadosHistorico() {
    try {
        const response = await fetch(`${API_BASE_URL}/leituras`);
        if (!response.ok) throw new Error("Erro na requisição do histórico");

        const dados = await response.json();
        renderizarHistorico(dados);
    } catch (error) {
        console.error("Falha ao carregar histórico do back-end:", error);
        exibirMensagemErro('historico-container', 'Não foi possível carregar o histórico do servidor.');
    }
}

function exibirMensagemErro(elementId, message) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.innerHTML = `
            <div style="padding: 20px; color: #c62828; background: #ffebee; border-radius: 8px; font-weight: 500; text-align: center; margin-top: 20px;">
                🔌 ${message} Verifique se o back-end está rodando.
            </div>`;
    }
}

// Inicialização do ecossistema SPA
document.addEventListener('DOMContentLoaded', () => {
    buscarDadosSensores();
    buscarDadosHistorico();

    const navLinks = document.querySelectorAll(".nav-links a");
    const sections = document.querySelectorAll(".tab-content");

    navLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const targetId = link.getAttribute("data-target");
            if (!targetId) return;

            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.remove("hidden");
                    if (targetId === "dashboard" || targetId === "sensores") buscarDadosSensores();
                    if (targetId === "historico") buscarDadosHistorico();
                } else {
                    section.classList.add("hidden");
                }
            });
        });
    });
});