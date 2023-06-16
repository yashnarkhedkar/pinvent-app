#include <HX711.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// WiFi credentials
const char* ssid[] = {"ABHISHEK", "Yash", "Destiny"};
const char* password[] = {"12345678", "Yash@123", "Shreerampur"};
const int numWifi = 3;

// HX711 pins
const int LOADCELL_DOUT_PIN = 14;
const int LOADCELL_SCK_PIN = 12;

HX711 scale;
HTTPClient http;

int count = 0;
char card_no[12];

// LED pin
const int LED_PIN = 2;  // Change to the desired pin for the LED

void setup() {
  Serial.begin(9600);

  pinMode(LED_PIN, OUTPUT);

  connectToWiFi();

  // Set up the HX711 load cell amplifier
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(-204.60);
  scale.tare();
  digitalWrite(LED_PIN, HIGH);
}

void loop() {
  if (Serial.available()) {
    count = 0;
    while (Serial.available() && count < 12) {
      card_no[count] = Serial.read();
      count++;
      delay(5);
    }
    card_no[count] = '\0';
    Serial.print("Card Number: ");
    Serial.println(card_no);
    Serial.println("Weight: ");
    float weight = scale.get_units(10) / 4.97;
    Serial.println(weight, 1);
    digitalWrite(LED_PIN, LOW);
    delay(100);
    sendDataToServer(card_no, weight);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
  }
  delay(1000);
}

void connectToWiFi() {
  int wifiIndex = 0;
  while (wifiIndex < numWifi) {
    WiFi.begin(ssid[wifiIndex], password[wifiIndex]);
    Serial.print("Connecting to WiFi: ");
    Serial.println(ssid[wifiIndex]);

    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
      delay(2000);
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Connected to WiFi ");
      Serial.println(WiFi.localIP());
      digitalWrite(LED_PIN, LOW);
      delay(100);
      digitalWrite(LED_PIN, HIGH);
      return;
    } else {
      Serial.print("Connection failed for: ");
      Serial.println(ssid[wifiIndex]);
      wifiIndex++;
    }
  }

  Serial.println("Failed to connect to any Wi-Fi network");
}

void sendDataToServer(const char* cardNumber, float weight) {
  String payload = "{\"cardNumber\":\"";
  payload += cardNumber;
  payload += "\",\"weight\":";
  payload += weight;
  payload += "}";

  http.begin("https://inventron.onrender.com/api/products/update");
  http.addHeader("Content-Type", "application/json");
  auto httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    Serial.println(httpResponseCode);

    String response = http.getString();
    Serial.println(response);
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.print("Error sending data to server. Error code: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

