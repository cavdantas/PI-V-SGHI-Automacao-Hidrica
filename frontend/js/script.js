// CONFIGURAÇÃO DA API
const API_BASE_URL = "http://localhost:3000";
let umidadeChartInstance = null; // Guarda a instância do gráfico para evitar duplicações ao atualizar

// Função que define as cores baseada nas diretrizes visuais do projeto
function getStatusConfig(item) {
    const prop = item.propriedade.toLowerCase();
    
    // Converte o valor para número limpo eliminando o '%' se ele existir, para a validação funcionar corretamente
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

// 1. Renderização dos cards dinâmicos do Dashboard
function renderizarDashboard(listaSensores) {
    const grid = document.getElementById('sensor-grid');
    const alertArea = document.getElementById('alerts-area');

    if (!grid) return;
    grid.innerHTML = '';
    if (alertArea) alertArea.innerHTML = '';

    listaSensores.forEach(sensor => {
        const config = getStatusConfig(sensor);
        // Garante que o valor exibido não duplique o sinal de % na tela
        const valorLimpo = String(sensor.valor).replace('%', '');

        // Dispara o alerta visual se o estado for crítico
        if (config.label === "Crítico" && alertArea) {
            const caixaAlerta = document.createElement('div');
            caixaAlerta.className = "alert-box";
            caixaAlerta.style = "display:block; background:#ffebee; border-left:5px solid #D32F2F; padding:15px; margin-bottom:15px; border-radius:8px; color:#D32F2F; font-size:0.9rem;";
            caixaAlerta.innerHTML = `<strong>⚠️ Alerta:</strong> Irrigação necessária no dispositivo ${sensor.sensor_id || 'S001'}!`;
            alertArea.appendChild(caixaAlerta);
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:#6D4C41; font-weight:bold; font-size:0.75rem;">${sensor.sensor_id || 'S001'}</span>
                <span style="background:${config.color}22; color:${config.color}; padding:2px 10px; border-radius:12px; font-size:0.7rem; font-weight:bold;">
                    ${config.label}
                </span>
            </div>
            <h3 style="margin:5px 0; color:#333; font-size:1rem;">${sensor.propriedade}</h3>
            <div style="font-size:2.5rem; font-weight:bold; color:#2c3e50; margin:10px 0;">
                ${valorLimpo}${config.isNumeric ? '%' : ''}
            </div>
            ${config.isNumeric ? `
                <div style="background:#eee; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="width:${valorLimpo}%; background:${config.color}; height:100%;"></div>
                </div>
            ` : ''}
            <div style="font-size:0.65rem; color:#aaa; margin-top:15px;">
                🕒 Sincronizado: ${sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')}
            </div>
        `;
        grid.appendChild(card);
    });

    // Chama a montagem do gráfico passando os dados atualizados do banco
    inicializarGrafico(listaSensores);
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
        const valorLimpo = String(sensor.valor).replace('%', '');
        const valorFormatado = valorLimpo + (config.isNumeric ? '%' : '');
        const horaFormatada = sensor.timestamp ? new Date(sensor.timestamp).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR');

        htmlTabela += `
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${sensor.sensor_id || 'S001'}</td>
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
        const configProvisoria = getStatusConfig({ propriedade: log.propriedade, valor: log.valor });
        const statusTexto = configProvisoria.label;
        const corStatus = obterCorStatus(statusTexto);
        const dataFormatada = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
        const valorLimpo = String(log.valor).replace('%', '');

        htmlHistorico += `
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 15px; color: #666; font-size: 0.85rem;">${dataFormatada}</td>
                <td style="padding: 15px; font-weight: bold; color: #2c3e50;">${log.sensor_id || 'S001'}</td>
                <td style="padding: 15px; color: #555;">${log.propriedade}</td>
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

    htmlHistorico += `</tbody></table></div>`;
    container.innerHTML = htmlHistorico;
}

// 4. Função para renderizar o Gráfico Dinamicamente (Vinculada ao ID historicoGrafico do HTML)
function inicializarGrafico(listaSensores) {
    const canvas = document.getElementById('historicoGrafico');
    if (!canvas) return;

    // Filtra para pegar no gráfico apenas as leituras de umidade do solo
    const dadosUmidade = listaSensores.filter(s => s.propriedade.toLowerCase().includes('umidade'));
    
    // Mapeia os identificadores dos sensores para o eixo X e valores numéricos puros para o eixo Y
    const rotasHoras = dadosUmidade.map(s => s.sensor_id ? s.sensor_id : 'Sensor');
    const valoresNumericos = dadosUmidade.map(s => parseFloat(String(s.valor).replace('%', '')));

    construirGraficoEfetivo(canvas, rotasHoras, valoresNumericos);
}

function construirGraficoEfetivo(canvas, labels, dados) {
    if (umidadeChartInstance) umidadeChartInstance.destroy(); // Limpa a instância do gráfico anterior antes de redesenhar

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

function exibirMensagemErro(elementId, mensagem) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.innerHTML = `
            <div style="padding: 20px; color: #c62828; background: #ffebee; border-radius: 8px; font-weight: 500; text-align: center; margin-top: 20px;">
                🔌 ${mensagem} Verifique se o back-end está rodando.
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