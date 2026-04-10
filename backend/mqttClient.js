const mqtt = require('mqtt');
const db = require('./database');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Conectado ao broker MQTT - SGHI');
  client.subscribe('sghi/sensores');
});

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    const { deviceID, propriedade, valor, timestamp } = data;

    console.log('Dado recebido (SGHI):', data);

    if (!deviceID || !propriedade || valor === undefined || !timestamp) {
      console.warn('Dados incompletos recebidos:', data);
      return;
    }

    db.run(
      `INSERT INTO leituras (device_id, propriedade, valor, timestamp)
       VALUES (?, ?, ?, ?)`,
      [deviceID, propriedade, valor, timestamp],
      (err) => {
        if (err) {
          console.error('Erro ao inserir no banco:', err.message);
        } else {
          console.log('Dados salvos com sucesso');
        }
      }
    );

  } catch (err) {
    console.error('Erro ao processar mensagem:', err.message);
  }
});

client.on('error', (err) => {
  console.error('Erro MQTT:', err.message);
});