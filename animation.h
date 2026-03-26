#ifndef ANIMATION_H
#define ANIMATION_H

#include "neopixelsegment.h"

struct FireState {
  int rate = 5;
};

struct PulseState {
  int rate = 8;
  bool increasing = true;
  int increment = 3;
  int brightness = 4;
  int max = 24;
  int min = 8;
};

struct ProgressState {
  int rate = 3;
  uint8_t rotationPins[12] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
};
struct FireworkState {
  int rate = 2;
  int phase = 0;        // 0=idle, 1=burst, 2=fade
  int origin = 0;       // which LED the firework launches from
  int spread = 0;       // how far the burst has spread
  int idleTimer = 0;    // countdown before next firework
  int fadeStep = 0;     // fade progress
  uint8_t r = 0;
  uint8_t g = 0;
  uint8_t b = 0;
};

struct ArcReactorState {
  int rate = 2;
  int phase = 0;          // 0=startup, 1=running
  int brightness = 0;
  int minBrightness = 0;
  bool rising = true;
  int startupCount = 0;
  uint8_t rotation[4] = {0, 3, 6, 9};
  int maxBright = 18;
  int minBright = 8;
  int spinRate = 1;       // target spin rate (user-configurable)
  int spinCounter = 0;
  int currentSpinRate = 6;  // starts slow, ramps down to spinRate
  int initSpinRate = 6;     // configurable initial spin rate
  int rampCounter = 0;
};

struct AuroraState {
  int rate = 3;
  uint16_t hueOffset = 0;
  int minBright = 6;
  int maxBright = 20;
};

struct Animation {
  void (*func);
  void* state;
};

void fire(NeoPixelSegment& segment, unsigned long ticks, FireState& state);
void blueFire(NeoPixelSegment& segment, unsigned long ticks, FireState& state);
void pulse(NeoPixelSegment& segment, unsigned long ticks, PulseState& state);
void progress(NeoPixelSegment& segment, unsigned long ticks, ProgressState& state);
void fireworks(NeoPixelSegment& segment, unsigned long ticks, FireworkState& state);
void aurora(NeoPixelSegment& segment, unsigned long ticks, AuroraState& state);
void arcReactorAnim(NeoPixelSegment& segment, unsigned long ticks, ArcReactorState& state);

#endif