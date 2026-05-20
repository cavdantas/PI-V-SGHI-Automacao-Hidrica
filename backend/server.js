const express = require('express');
const db = require('./database');
const LeituraMapper = require('./DTO/leituraMapper');
require('./mqttClient'); // inicia o MQTT automaticamente

const app = express();
app.use(express.json());

const PORT = 3000;
const MQTT_TOPIC = 'sensor/umidade';

/**
 * ROTA RAIZ
 * Status do sistema
 */
app.get('/', (req, res) => {
  res.json({
    sistema: "Sistema de Gestão Hídrica Inteligente (SGHI)",
    status: "Online",
    timestamp: new Date()
  });
});

/**
 * Buscar todas as leituras
 */
app.get('/leituras', (req, res) => {
  db.all(
    `SELECT * FROM leituras ORDER BY timestamp DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: err.message });
      const dtos = (rows || []).map(r => {
        const dto = LeituraMapper.toDTO(r);
        dto.valor = LeituraMapper.transformValor(dto.valor);
        return dto;
      });
      res.json(dtos);
    }
  );
});

/**
 * Buscar leituras por dispositivo
 */
app.get('/leituras/:deviceID', (req, res) => {
  const { deviceID } = req.params;

  db.all(
    `SELECT * FROM leituras 
     WHERE device_id = ? 
     ORDER BY timestamp DESC`,
    [deviceID],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      res.json(rows);
    }
  );
});

/**
 * Inserção manual (opcional para testes via Postman)
 */
app.post('/leituras', (req, res) => {
  const { deviceID, propriedade, valor, timestamp } = req.body;

  if (!deviceID || !propriedade || valor === undefined || !timestamp) {
    return res.status(400).json({
      erro: "Campos obrigatórios: deviceID, propriedade, valor, timestamp"
    });
  }

  db.run(
    `INSERT INTO leituras (device_id, propriedade, valor, timestamp)
     VALUES (?, ?, ?, ?)`,
    [deviceID, propriedade, valor, timestamp],
    function (err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      res.status(201).json({
        mensagem: "Leitura inserida com sucesso",
        id: this.lastID
      });
    }
  );
});

/**
 * Rota não encontrada
 */
app.use((req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada"
  });
});

/**
 * Inicialização do servidor
 */
app.listen(PORT, () => {
  console.log(`SGHI rodando em http://localhost:${PORT}`);
  console.log(`📡 Aguardando dados no tópico MQTT: ${MQTT_TOPIC}`);
});