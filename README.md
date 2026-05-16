# PI-V-SGHI-Automacao-Hidrica

📌 Contexto do Projeto
Este projeto foi desenvolvido com base em uma necessidade real identificada em entrevista com o Sr. Moacir Fernandes Rodrigues, proprietário de uma área rural. A propriedade sofre com perdas críticas de biomassa (capim de corte e mudas de Mogno Africano) devido ao estresse hídrico. Atualmente, o monitoramento é manual, gerando um custo logístico de aproximadamente 20 litros de combustível e duas horas de deslocamento por visita.

🚀 A Solução
Desenvolvemos um sistema de Internet das Coisas (IoT) focado em:
Captura de Dados: Sensores de umidade e temperatura.
Automação Autônoma: Lógica de Edge Computing para acionamento da irrigação sem necessidade de intervenção humana diária.
Análise Remota: Interface web com gráficos comparativos para gestão à distância.
*Nota sobre a Simulação: Por definições técnicas do grupo, os sistemas de comunicação via Starlink (necessidades reais da propriedade) serão considerados no escopo teórico, mas a simulação prática focará estritamente na lógica dos sensores, automação e visualização de dados via site.*

📂 Organização do Repositório
*/simulacao*: Código C++ e esquemáticos para o ambiente virtual (Wokwi/Tinkercad).
*/backend*: Banco de dados e API de integração.
*/frontend*: Código fonte do site (HTML/CSS/JS) e dashboards.

🌿 Estratégia de Branches (Organização do Time)
Para garantir a integridade do código, adotamos o seguinte fluxo:
main: Versão estável e final para entrega. **Não commitar direto aqui.**
develop: Branch de integração onde unimos as frentes de trabalho para testes.

*Branches de Feature*: Cada subgrupo tem sua própria ramificação para trabalhar:
feature-simulacao: Membros 2, 3 e 4.
feature-backend: Membros 5 e 6.
feature-frontend: Membros 7 e 8.