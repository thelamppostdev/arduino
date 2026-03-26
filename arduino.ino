// Arduino Uno sketch for driving LEDs for profit
// 2023 Benton Mize

// Built on:
// NeoPixel Ring simple sketch (c) 2013 Shae Erisson
// Released under the GPLv3 license to match the rest of the
// Adafruit NeoPixel library

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include "arc.h"
#include "rainbow.h"
#include "ring.h"
#ifdef __AVR__
 #include <avr/power.h> // Required for 16 MHz Adafruit Trinket
#endif
#include "animation.h"
#include "neopixelsegment.h"
#include "colors.h"
#include "animation.h"
#include <pins_arduino.h>
#include "serial.h"

#define NEO_PIN   6
#define NUMPIXELS 12

Adafruit_NeoPixel pixels(NUMPIXELS, NEO_PIN, NEO_GRB + NEO_KHZ800);
NeoPixelSegment* ring;

unsigned previousMs = -1;
unsigned buttonTriggerMs = -1;
int deltaMs = 0;

unsigned long iterations = 0;

bool tick = false;
bool buttonPressed = false;

FireState fireState;
PulseState ringPulseState;
ProgressState progressState;
FireworkState fireworkState;
AuroraState auroraState;
ArcReactorState arcReactorState;

String ringAnimation = "fire";
int monitorPulseSpeed = 60;  // pulse period in ticks (lower = faster)

SerialState serialState = SerialState();

void setup() {
  pixels.begin();
  ring = new NeoPixelSegment(&pixels, 0, 12);

  pinMode(2, INPUT);
  attachInterrupt(digitalPinToInterrupt(2), handleButtonPressIsr, FALLING);

  initSerialState(serialState);
  Serial.begin(230400);
  while(!Serial) {
    delay(10);
  }

  setupAnimations();

  Serial.println("Initialized!");
}

void setupAnimations() {
  fireState = FireState();

  ringPulseState = PulseState();
  ringPulseState.rate = 10;

  progressState = ProgressState();
  progressState.rate = 3;

  ring->fill("blue");
}

void loop() {
  // Get the delta, trying to make a 5ms clock here for driving LEDs
  deltaMs = millis() - previousMs;
  if(deltaMs >= 10) {
    previousMs = millis();
    iterations++;
    tick = true;
  } else {
    tick = false;
  }

  if(buttonPressed) {
    buttonPressed = false;
    ring->fill("purple");
    ringAnimation = "pulse";
  }

  // Running every 10ms
  if(tick) {
    runRingAnimation(ringAnimation);
  } 

  checkSerial(serialState);

  if(serialState.commandReceived) {
    serialState.commandReceived = false;
    Serial.println("Commands received!");
    for(int i=0; i < serialState.numOfCommands; i++) {
      Serial.print(serialState.commands[i]);
      Serial.print(" ");
    }
    Serial.println();
    processCommands(serialState.commands, serialState.numOfCommands);
  }
}

void runRingAnimation(String animateCommand) {
  if(animateCommand.equalsIgnoreCase("fire")) {
    ring->animate(fire, iterations, fireState);
  } else if(animateCommand.equalsIgnoreCase("bluefire")) {
    ring->animate(blueFire, iterations, fireState);
  } else if(animateCommand.equalsIgnoreCase("pulse")) {
    ring->animate(pulse, iterations, ringPulseState);
  } else if(animateCommand.equalsIgnoreCase("progress")) {
    ring->animate(progress, iterations, progressState);
  } else if(animateCommand.equalsIgnoreCase("reactor")) {
    ring->animate(arcReactorAnim, iterations, arcReactorState);
  } else if(animateCommand.equalsIgnoreCase("aurora")) {
    ring->animate(aurora, iterations, auroraState);
  } else if(animateCommand.equalsIgnoreCase("fireworks")) {
    ring->animate(fireworks, iterations, fireworkState);
  } else if(animateCommand.equalsIgnoreCase("monitor")) {
    // Subtle pulse — the levels command sets color to black for off LEDs,
    // so pulsing brightness on all LEDs only affects lit ones visually
    if(iterations % 4 == 0) {
      int half = monitorPulseSpeed / 2;
      int phase = iterations % monitorPulseSpeed;
      int bright;
      if(phase < half) {
        bright = 6 + (phase * 6 / half);
      } else {
        bright = 12 - ((phase - half) * 6 / half);
      }
      ring->setBrightness(bright);
      ring->show();
    }
  }
}

void processCommands(String commands[], int numCommands) {
  if(commands[0].equalsIgnoreCase("ring")) {
    ring->fill(commands[1]);
    if(numCommands == 3) {
      ringAnimation = commands[2];
    }
    ring->show();
  } else if(commands[0].equalsIgnoreCase("levels") && numCommands >= 3) {
    int cpuLevel = constrain(commands[1].toInt(), 0, 12);
    int memLevel = constrain(commands[2].toInt(), 0, 12);
    for(int i = 0; i < 12; i++) {
      bool isCpu = i < cpuLevel;
      bool isMem = i < memLevel;
      if(isCpu && isMem) {
        ring->setPixelColor(i, RgbColor("", 128, 0, 255)); // purple
      } else if(isCpu) {
        ring->setPixelColor(i, RgbColor("", 255, 0, 0));   // red
      } else if(isMem) {
        ring->setPixelColor(i, RgbColor("", 0, 0, 255));   // blue
      } else {
        ring->setPixelColor(i, RgbColor("", 0, 0, 0));     // off
      }
      ring->setPixelBrightness(i, (isCpu || isMem) ? 8 : 0);
    }
    ring->show();
  } else if(commands[0].equalsIgnoreCase("rrestart")) {
    arcReactorState = ArcReactorState();
    ringAnimation = "reactor";
  } else if(commands[0].equalsIgnoreCase("rconfig") && numCommands >= 5) {
    arcReactorState.maxBright = constrain(commands[1].toInt(), 5, 30);
    arcReactorState.minBright = constrain(commands[2].toInt(), 1, arcReactorState.maxBright);
    arcReactorState.spinRate = constrain(commands[3].toInt(), 1, 10);
    arcReactorState.initSpinRate = constrain(commands[4].toInt(), 2, 10);
  } else if(commands[0].equalsIgnoreCase("mpulse") && numCommands >= 2) {
    monitorPulseSpeed = constrain(commands[1].toInt(), 10, 200);
  } else if(commands[0].equalsIgnoreCase("abright") && numCommands >= 3) {
    auroraState.minBright = constrain(commands[1].toInt(), 1, 30);
    auroraState.maxBright = constrain(commands[2].toInt(), auroraState.minBright, 30);
  }
}

// Do something interesting with this button press :D
void handleButtonPressIsr() {
  if(millis() - buttonTriggerMs > 500) {
    buttonPressed = true;
  }
  buttonTriggerMs = millis();
}