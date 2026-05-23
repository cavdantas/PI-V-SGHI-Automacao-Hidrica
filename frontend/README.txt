# SGH Inteligente - Front-end Dashboard

Este diretório contém a interface web (Front-end) do **Sistema de Gestão Hídrica (SGH)** para automação e monitoramento de umidade do solo em setores agrícolas de São José dos Campos.

A interface foi desenvolvida no formato **SPA (Single Page Application)**, garantindo uma navegação fluida e rápida entre o monitoramento em tempo real, gerenciamento de dispositivos e histórico de leituras.

##  Funcionalidades Implementadas
* **Dashboard em Tempo Real:** Cards dinâmicos que exibem o último estado dos sensores de umidade e atuadores (bomba de irrigação).
* **Alertas Visuais Automatizados:** Sistema que identifica níveis críticos de umidade (≤ 20%) e dispara avisos visuais de necessidade de irrigação na tela.
* **Mapeamento de Cores por Status:** 
  * 🔴 **Crítico (≤ 20%)** -> Alerta vermelho.
  * 🟡 **Atenção (21% a 40%)** -> Alerta amarelo/laranja.
  * 🟢 **Ideal (> 40%)** -> Status verde estável.
* **Gráfico de Tendência:** Integração com a biblioteca **Chart.js** para plotar a curva de umidade por dispositivo.
* **Tabelas de Gerenciamento e Histórico:** Listagem limpa dos dados armazenados no banco de dados.

##  Tecnologias Utilizadas
* **HTML5:** Estruturação semântica da aplicação.
* **CSS3:** Estilização responsiva e componentes visuais personalizados (cards, barras de progresso, alertas).
* **JavaScript (ES6+):** Lógica de consumo de API (`fetch`), manipulação dinâmica do DOM e tratamento de tipos de dados.
* **Chart.js:** Biblioteca externa para renderização do gráfico de linha.

##  Integração com o Back-end
O front-end está configurado para consumir os dados da API local em:
`http://localhost:3000/leituras`

As propriedades dos objetos JSON estão mapeadas conforme a estrutura do banco de dados SQLite (`sensor_id`, `propriedade`, `valor`, `timestamp`).

---
*Desenvolvido como parte do Projeto Integrador V Engenharia da Computação.*