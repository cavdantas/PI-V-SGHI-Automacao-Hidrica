# Sistema de Gestão Hídrica Inteligente (SGHI)

## Arquitetura do sistema

[SENSOR / SIMULADOR]
        │
        ▼
   (MQTT Broker)
        │
        ▼
 [Backend Node.js]
        │
        ▼
     [SQLite DB]
        │
        ▼
      [API REST]

------------------------------------------------

## Como rodar o projeto

### Instalar dependências
npm install

### Iniciar o backend
node server.js

------------------------------------------------

## Integração MQTT

O sistema escuta dados no tópico:

sghi/sensores

---

## Formato esperado do JSON

{
  "deviceID": "sensor_01",
  "propriedade": "umidade",
  "valor": 55.3,
  "timestamp": "2026-04-10T15:00:00Z"
}

------------------------------------------------

## Endpoints da API

GET    /                     -> Status do sistema  
GET    /leituras             -> Lista todas as leituras  
GET    /leituras/:deviceID   -> Filtra por dispositivo  
POST   /leituras             -> Inserção manual para testes  

------------------------------------------------

## Tecnologias utilizadas

- Node.js  
- Express  
- MQTT (Mosquitto)  
- SQLite  

------------------------------------------------

## Teste rápido (sem sensor)

Exemplo de envio manual via MQTT:

mosquitto_pub -h localhost -t sghi/sensores -m '{"deviceID":"sensor_01","propriedade":"umidade","valor":60,"timestamp":"2026-04-10T15:00:00Z"}'

------------------------------------------------

## Observações

- O banco de dados é criado automaticamente (sensores.db)
- Necessário ter um broker MQTT rodando localmente
