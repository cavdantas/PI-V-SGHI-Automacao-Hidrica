#include <WiFi.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>

// --- Configurações e Pinos ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com"; // Endereço do broker MQTT; utilize "broker.hivemq.com" para testes em ambiente público
const char* deviceName = "ESP32_Irrigacao_Gabriel"; // Quando mqtt_server == "broker.hivemq.com" utilize um deviceName diferente de "ESP32" para evitar conflito no broker publico.

const int PIN_POT = 34;
const int PIN_RELE = 2;
const int PIN_SERVO = 13;

// --- Objetos ---
WiFiClient espClient;
PubSubClient client(espClient);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", -10800, 60000);
Servo servo;

// --- 1. MÓDULO DE TEMPO E COMUNICAÇÃO ---

void getISO8601Timestamp(char* buffer) {
  time_t rawTime = (time_t)timeClient.getEpochTime();
  struct tm *ptm = localtime(&rawTime);
  sprintf(buffer, "%04d-%02d-%02dT%02d:%02d:%02dZ", 
          ptm->tm_year + 1900, ptm->tm_mon + 1, ptm->tm_mday, 
          ptm->tm_hour, ptm->tm_min, ptm->tm_sec);
}

void enviarTelemetria(float valorUmidade) {
  char timestamp[25];
  getISO8601Timestamp(timestamp);

  char msg[256];
  sprintf(msg, "{\"deviceID\":\"%s\",\"propriedade\":\"Umidade\",\"valor\":%.2f,\"statusBomba\":\"%s\",\"timestamp\":\"%s\"}", 
          deviceName, valorUmidade, statusBomba(), timestamp);

  Serial.print("Enviando: ");
  Serial.println(msg);
  client.publish("sensor/umidade", msg);
}

// --- 2. MÓDULO DE LÓGICA ---

float lerUmidade() {
  int analogRaw = analogRead(PIN_POT);
  return analogRaw / 10.0; // Sua conversão atual
}

void moverServo(int angulo) {
  servo.write(angulo);
  delay(300);
}

bool statusBomba(bool estado) {
  digitalWrite(PIN_RELE, estado ? HIGH : LOW);
  return estado;
}

char* statusBomba() {
  if (digitalRead(PIN_RELE) == HIGH) return "ligado";
  else return "desligado";
}

void analisarEAgir(float umidade) {
  // Lógica 1: Controle do Relé (Bomba)
  if(!umidade == 0){

    switch ((int)umidade)
    {
    case 1 ... 102:
      statusBomba(true);
      //Serial.println("Bomba ligada");
      //Serial.println("Critico");
      moverServo(90);
      break;
    case 103 ... 205:
      statusBomba(false);
      //Serial.println("Bomba desligada");
      //Serial.println("Perigo! Solo quase seco");
      moverServo(0);
      break;
    case 206 ... 307:
      statusBomba(false);
      //Serial.println("Bomba desligada");
      //Serial.println("Ideal! Solo úmido");
      moverServo(0);
      break;
    case 308 ... 409:
      statusBomba(false);
      //Serial.println("Bomba desligada");
      //Serial.println("Muito úmido! Solo saturado");
      moverServo(0);
      break;
    default:
      break;
    }
  }else{
    statusBomba(true);
    //Serial.println("Bomba ligada");
    //Serial.println("Critico");
    moverServo(90);
  }
  
  // Lógica 2: Espaço reservado para o Servo Motor
  // if (umidade < X) { moverServo(90); }
}

// --- 3. INFRAESTRUTURA (WiFi/MQTT) ---

void setup_wifi() {
  Serial.print("\nConectando WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\n WiFi OK");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Tentando MQTT...");
    if (client.connect(deviceName)) {
      Serial.println(" Conectado");
    } else {
      Serial.print(" Erro: "); Serial.println(client.state());
      delay(5000);
    }
  }
}

// --- CORE DO PROGRAMA ---

void setup() {
  Serial.begin(115200);
  setup_wifi();
  timeClient.begin();
  
  pinMode(PIN_POT, INPUT);
  pinMode(PIN_RELE, OUTPUT);

  servo.attach(PIN_SERVO);
  servo.write(0);

  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
  timeClient.update();

  // Fluxo simplificado e organizado:
  float umidadeAtual = lerUmidade();
  analisarEAgir(umidadeAtual);
  enviarTelemetria(umidadeAtual);

  delay(2000); // Frequência de atualização
}