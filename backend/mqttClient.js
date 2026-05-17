const mqtt = require('mqtt');
const db = require('./database');

//mqtt://3.126.43.235:1883 ou mqtt://broker.hivemq.com:1883
const client = mqtt.connect('mqtt://3.126.43.235:1883',{
  family: 4,
  reconnectPeriod: 2000,
  connectTimeout: 30_000,
  clientId: 'sghi_backend_' + Math.random().toString(16).slice(2,8),
});

client.on('connect', () => {
  console.log('Conectado ao broker MQTT - SGHI - (IPv4 forced)');
  client.subscribe('sensor/umidade', (err, granted) => {
    if (err) {
      console.error('Erro ao se inscrever no tópico MQTT:', err.message);
    } else {
      console.log('Inscrito com sucesso no tópico MQTT:', granted);
    }
  });
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

client.on('reconnect', () => console.log('MQTT reconnecting...'));
client.on('offline', () => console.log('MQTT offline'));
client.on('close', () => console.log('MQTT connection closed'));
client.on('error', (err) => console.error('Erro MQTT:', err && err.message ? err.message : err));