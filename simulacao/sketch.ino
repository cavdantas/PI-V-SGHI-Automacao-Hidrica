#include <WiFi.h>
#include <PubSubClient.h>

// 🔐 WiFi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// 🌐 MQTT (trocar pelo seu IP local)
const char* mqtt_server = "broker.hivemq.com"; // <-- seu IP aqui

WiFiClient espClient;
PubSubClient client(espClient);

// 🔄 Conectar WiFi
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando ao WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado!");
}

// 🔄 Conectar MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando ao MQTT...");
    
    if (client.connect("ESP32Client")) {
      Serial.println("conectado!");
    } else {
      Serial.print("falhou, rc=");
      Serial.print(client.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  setup_wifi();

  client.setServer(mqtt_server, 1883);
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  // 🎯 Simulando sensor (temperatura aleatória)
  float temperatura = random(20, 35);

  char msg[50];
  sprintf(msg, "Temperatura: %.2f", temperatura);

  Serial.print("Publicando: ");
  Serial.println(msg);

  client.publish("sensor/temperatura", msg);

  delay(3000);
}