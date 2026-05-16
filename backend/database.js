const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./sensores.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
  } else {
    console.log('Banco SQLite conectado.');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS leituras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      propriedade REAL NOT NULL,
      valor REAL NOT NULL,
      timestamp TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela:', err.message);
    } else {
      console.log('Tabela "leituras" pronta.');
    }
  });
});

module.exports = db;