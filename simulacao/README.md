# Simulação IoT e Lógica de Automação
Projeto Desenvolvido por alunos da UNIVESP, na disciplina Projeto Integrador V. Nome do Projeto: Sistema de Gestão Hídrica Inteligente.

Este diretório é dedicado ao ambiente de simulação do sistema de monitoramento hídrico.
* Objetivo: Implementar a captura de dados via sensores de umidade e temperatura.
* Lógica: Desenvolvimento do código em C++ para processamento de borda (Edge Computing), permitindo que o sistema tome decisões de irrigação de forma autônoma.

Responsáveis: Izabelle Oliveira, Gabriel Rodrigues e Isaque Pereira.

# README

## Arquivos
>sketch.ino
    :É o arquivo principal de um projeto. Ele contém o código-fonte escrito em C/C++ que define as instruções para o microcontrolador e posteriormente gerando os binários para o microcontrolador.
>libraries.txt
    :É um arquivo de projeto que gerencia as bibliotecas Arduino externas usadas no código fonte. Ele é mantido automaticamente pelo Gerenciador de Bibliotecas integrado, mas pode ser editado manualmente para configurações avançadas.
>diagram.json
    :Este arquivo define os componentes que serão usados ​​na simulação, suas propriedades e as conexões entre os componentes.
>wokwi-project.txt
    :Arquivo padrão gerado pela plataforma Wokwi.com

## Como usar
### Simulação
> Vá em https://wokwi.com/, crie um novo projeto ou carregue esse projeto e inicie a simulação. Aguarde o compilador finalizar os binários e verifique no terminal do Linux e no terminal da plataforma Wokwi e verifique as publicações no broker.
    *Requisito: É necessário estar conectado ao broker destino*
### Broker
> Tendo o Mosquitto Broker instalado em uma máquina Linux, execute o comando "mosquitto_sub -h broker.hivemq.com -t sensor/temperatura" no terminal e verfiquei as publicações sendo recebidas.

## Atenção - Ao clonar o repositório sigas as instruções do arquivo "BUILD_INSTRUCTIONS.md"