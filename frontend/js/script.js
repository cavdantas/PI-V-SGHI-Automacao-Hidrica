// CONFIGURAÇÃO DA API: Substitua pela URL real do seu Back-end se mudar de porta
const API_BASE_URL = "http://localhost:3000/api"; 

// Função que define as cores baseada nas diretrizes visuais do projeto
function getStatusConfig(item) {
    const prop = item.propriedade.toLowerCase();
    const val = item.valor;

    if (prop.includes("bomba")) {
        return { 
            label: val, 
            color: val === "Ligada" ? "#2E7D32" : "#D32F2F", 
            isNumeric: false 
        };
    }

    if (val <= 20) return { label: "Crítico", color: "#D32F2F", isNumeric: true }; 
    if (val <= 40) return { label: "Atenção", color: "#F9A825", isNumeric: true }; 
    return { label: "Ideal", color: "#2E7D32", isNumeric: true }; 
}

// 1. Renderização dos cards dinâmicos do Dashboard
function renderizarDashboard(listaSensores) {
    const grid = document.getElementById('sensor-grid');
    const alertArea = document.getElementById('alerts-area');
    
    if (!grid) return;
    grid.innerHTML = '';
    if (alertArea) alertArea.innerHTML = '';

    listaSensores.forEach(sensor => {
        const config = getStatusConfig(sensor);

        // Se o sensor estiver crítico, adiciona o alerta sem apagar alertas de outros sensores
        if (config.label === "Crítico" && alertArea) {
            const caixaAlerta = document.createElement('div');
            caixaAlerta.className = "alert-box";
            caixaAlerta.style = "display:block; background:#ffebee; border-left:5px solid #D32F2F; padding:15px; margin-bottom:15px; border-radius:8px; color:#D32F2F; font-size:0.9rem;";
            caixaAlerta.innerHTML = `<strong>⚠️ Alerta:</strong> Irrigação necessária em ${sensor.deviceID}!`;
            alertArea.appendChild(caixaAlerta);
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:#6D4C41; font-weight:bold; font-size:0.75rem;">${sensor.deviceID}</span>
                <span style="background:${config.color}22; color:${config.color}; padding:2px 10px; border-radius:12px; font-size:0.7rem; font-weight:bold;">
                    ${config.label}
                </span>
            </div>
            <h3 style="margin:5px 0; color:#333; font-size:1rem;">${sensor.propriedade}</h3>
            <div style="font-size:2.5rem; font-weight:bold; color:#2c3e50; margin:10px 0;">
                ${sensor.valor}${config.isNumeric ? '%' : ''}
            </div>
            ${config.isNumeric ? `
                <div style="background:#eee; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="width:${sensor.valor}%; background:${config.color}; height:100%;"></div>
                </div>
            ` : ''}
            <div style="font-size:0.65rem; color:#aaa; margin-top:15px;">
                🕒 Sincronizado: ${new Date(sensor.timestamp).toLocaleTimeString('pt-BR')}
            </div>
        `;
        grid.appendChild(card);
    });
}

// 2. Renderização da Tabela Geral de Sensores
function renderizarTabelaSensores(listaSensores) {
    const container = document.getElementById('sensores-table-container');
    if (!container) return;

    let htmlTabela = `
        <div style="overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #eeeeee;">
                        <th style="padding: 15px; color: #6D4C41; font-weight: bold;">ID do Dispositivo</th>
                        <th style="padding: 15px; color: #333;">Tipo de Medição</th>
                        <th style="padding: 15px; color: #333;">Último Valor</th>
                        <th style="padding: 15px; color: #333;">Status</th>
                        <th style="padding: 15px; color: #333;">Última Atualização</th>
                    </tr>
                </thead>
                <tbody>
    `;

    listaSensores.forEach(sensor => {
        const config = getStatusConfig(sensor);
        const valorFormatado = sensor.valor + (config.isNumeric ? '%' : '');
        const horaFormatada = new Date(sensor.timestamp).toLocaleTimeString('pt-BR');

        htmlTabela += `
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${sensor.deviceID}</td>
                <td style="padding: 15px; color: #555;">${sensor.propriedade}</td>
                <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${valorFormatado}</td>
                <td style="padding: 15px;">
                    <span style="background:${config.color}22; color:${config.color}; padding:4px 12px; border-radius:12px; font-size:0.75rem; font-weight:bold; display: inline-block;">
                        ${config.label}
                    </span>
                </td>
                <td style="padding: 15px; color: #888; font-size: 0.85rem;">Hoje às ${horaFormatada}</td>
            </tr>
        `;
    });

    htmlTabela += `</tbody></table></div>`;
    container.innerHTML = htmlTabela;
}

// 3. Renderização da Tabela de Logs Históricos
function renderizarHistorico(listaHistorico) {
    const container = document.getElementById('historico-container');
    if (!container) return;

    const obterCorStatus = (status) => {
        if (status === "Crítico" || status === "Ligada") return "#D32F2F";
        if (status === "Atenção") return "#F9A825";
        if (status === "Ideal" || status === "Desligada") return "#2E7D32";
        return "#555";
    };

    let htmlHistorico = `
        <div style="overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #eeeeee;">
                        <th style="padding: 15px; color: #333; font-weight: bold;">Data / Hora</th>
                        <th style="padding: 15px; color: #6D4C41; font-weight: bold;">Dispositivo</th>
                        <th style="padding: 15px; color: #333;">Propriedade</th>
                        <th style="padding: 15px; color: #333;">Valor Registrado</th>
                        <th style="padding: 15px; color: #333;">Status</th>
                        <th style="padding: 15px; color: #333;">Ação do Sistema</th>
                    </tr>
                </thead>
                <tbody>
    `;

    listaHistorico.forEach(log => {
        const corStatus = obterCorStatus(log.status);
        htmlHistorico += `
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 15px; color: #666; font-size: 0.85rem;">${log.dataHora}</td>
                <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${log.dispositivo}</td>
                <td style="padding: 15px; color: #555;">${log.propriedade}</td>
                <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${log.valor}</td>
                <td style="padding: 15px;">
                    <span style="background:${corStatus}22; color:${corStatus}; padding:2px 10px; border-radius:12px; font-size:0.7rem; font-weight:bold;">
                        ${log.status}
                    </span>
                </td>
                <td style="padding: 15px; color: #5d4037; font-weight: 500;">${log.acao}</td>
            </tr>
        `;
    });

    htmlHistorico += `</tbody></table></div>`;
    container.innerHTML = htmlHistorico;
}

// --- FUNÇÕES ASYNC PARA CHAMADAS DE API ---

async function buscarDadosSensores() {
    try {
        const response = await fetch(`${API_BASE_URL}/sensores`);
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
        const response = await fetch(`${API_BASE_URL}/historico`);
        if (!response.ok) throw new Error("Erro na requisição do histórico");
        
        const dados = await response.json();
        renderizarHistorico(dados);
    } catch (error) {
        console.error("Falha ao carregar histórico do back-end:", error);
        exibirMensagemErro('historico-container', 'Não foi possível carregar o histórico do servidor.');
    }
}

// Função auxiliar para avisar visualmente na tela se a API estiver inacessível
function exibirMensagemErro(elementId, mensagem) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.innerHTML = `
            <div style="padding: 20px; color: #c62828; background: #ffebee; border-radius: 8px; font-weight: 500; text-align: center; margin-top: 20px;">
                🔌 ${mensagem} Verifique se o back-end está rodando.
            </div>`;
    }
}

// Inicialização da aplicação SPA
document.addEventListener('DOMContentLoaded', () => {
    // Carga inicial dos dados
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
                    
                    // Atualiza dinamicamente dependendo da aba selecionada
                    if (targetId === "dashboard" || targetId === "sensores") buscarDadosSensores();
                    if (targetId === "historico") buscarDadosHistorico();
                } else {
                    section.classList.add("hidden");
                }
            });
        });
    });
});