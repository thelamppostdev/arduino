#include "animation.h"
#include "colors.h"

RgbColor getFireColor() {
  uint8_t r = random(180, 255);
  uint8_t g = random(64, 128);

  if (g > r) {
    g = r;
  }

  return RgbColor("", r, g, 0);
}

RgbColor getBlueFireColor() {
  uint8_t b = random(180, 255);
  uint8_t g = random(0, 64);

  if (g > b) {
    g = b;
  }

  return RgbColor("", 0, g, b);
}

void fire(NeoPixelSegment& segment, unsigned long ticks, FireState& state) {
  if(ticks % state.rate == 0) {
      for (int i = 0; i < segment.getLength(); i++) {
        segment.setPixelColor(i, getFireColor());
        segment.setPixelBrightness(i, random(4, 10));
      }
      // segment.setBrightness(random(4, 10));
      segment.show();
  }
}

void blueFire(NeoPixelSegment& segment, unsigned long ticks, FireState& state) {
  if(ticks % state.rate == 0) {
      for (int i = 0; i < segment.getLength(); i++) {
        segment.setPixelColor(i, getBlueFireColor());
        segment.setPixelBrightness(i, random(4, 10));
      }
      segment.show();
  }
}

void pulse(NeoPixelSegment& segment, unsigned long ticks, PulseState& state) {

  if(ticks % state.rate == 0) {
    if(state.increasing) {
      state.brightness += state.increment;
    } else {
      state.brightness -= state.increment;
    }

    if(state.brightness <= state.min) {
      state.brightness = state.min;
      state.increasing = true;
    } else if (state.brightness >= state.max) {
      state.brightness = state.max;
      state.increasing = false;
    }

    segment.setBrightness(state.brightness);
    segment.show();
  }
}

void fireworks(NeoPixelSegment& segment, unsigned long ticks, FireworkState& state) {
  if(ticks % state.rate != 0) return;

  int len = segment.getLength();

  if(state.phase == 0) {
    // Idle — all dark, waiting for next firework
    state.idleTimer--;
    if(state.idleTimer <= 0) {
      // Launch a new firework
      state.origin = random(0, len);
      state.spread = 0;
      state.fadeStep = 0;
      // Random bright color
      int colorType = random(0, 5);
      switch(colorType) {
        case 0: state.r = 255; state.g = 50;  state.b = 50;  break; // red
        case 1: state.r = 50;  state.g = 255; state.b = 50;  break; // green
        case 2: state.r = 50;  state.g = 50;  state.b = 255; break; // blue
        case 3: state.r = 255; state.g = 255; state.b = 50;  break; // yellow
        case 4: state.r = 255; state.g = 50;  state.b = 255; break; // magenta
      }
      state.phase = 1;
    }
    // Dim everything toward black during idle
    for(int i = 0; i < len; i++) {
      segment.setPixelBrightness(i, 0);
    }
    segment.show();
    return;
  }

  if(state.phase == 1) {
    // Burst — spread outward from origin
    for(int i = 0; i < len; i++) {
      segment.setPixelBrightness(i, 0);
    }

    for(int s = 0; s <= state.spread; s++) {
      int brightness = max(10 - s * 2, 1);
      // Spread in both directions around the ring
      int ledA = (state.origin + s) % len;
      int ledB = (state.origin - s + len) % len;
      segment.setPixelColor(ledA, RgbColor("", state.r, state.g, state.b));
      segment.setPixelBrightness(ledA, brightness);
      segment.setPixelColor(ledB, RgbColor("", state.r, state.g, state.b));
      segment.setPixelBrightness(ledB, brightness);
    }

    state.spread++;
    if(state.spread > len / 2) {
      state.phase = 2;
      state.fadeStep = 8;
    }
    segment.show();
    return;
  }

  if(state.phase == 2) {
    // Fade out
    for(int i = 0; i < len; i++) {
      int cur = state.fadeStep;
      segment.setPixelBrightness(i, max(cur, 0));
    }
    state.fadeStep -= 2;
    if(state.fadeStep <= 0) {
      state.phase = 0;
      state.idleTimer = random(5, 20); // random pause before next
    }
    segment.show();
    return;
  }
}

void arcReactorAnim(NeoPixelSegment& segment, unsigned long ticks, ArcReactorState& state) {
  if(ticks % state.rate != 0) return;

  int len = segment.getLength();
  RgbColor cyan("", 0, 255, 255);
  RgbColor dimCyan("", 0, 140, 140);

  if(state.phase == 0) {
    // Startup: pulse brightness, ramping up minimum each cycle
    segment.fill("marine");

    if(state.rising) {
      state.brightness += 1;
    } else {
      state.brightness -= 1;
    }

    if(state.brightness >= 16) {
      state.rising = false;
      state.brightness = 16;
      state.startupCount++;
    } else if(state.brightness <= state.minBrightness) {
      state.rising = true;
      state.minBrightness += 1;
      state.brightness = state.minBrightness;
    }

    segment.setBrightness(state.brightness);
    segment.show();

    if(state.startupCount >= 10) {
      state.phase = 1;
      state.brightness = 10;
      state.rising = true;
      state.currentSpinRate = state.initSpinRate;
      state.rampCounter = 0;
    }
    return;
  }

  // Running: cyan base with 4 dimmer spots rotating + gentle pulse
  for(int i = 0; i < len; i++) {
    segment.setPixelColor(i, cyan);
    segment.setPixelBrightness(i, state.brightness);
  }

  // Dim spots rotate around the ring
  for(int i = 0; i < 4; i++) {
    segment.setPixelColor(state.rotation[i], dimCyan);
    segment.setPixelBrightness(state.rotation[i], max(state.brightness - 4, 2));
  }

  // Ramp spin speed from slow (10) down to target spinRate
  if(state.currentSpinRate > state.spinRate) {
    state.rampCounter++;
    if(state.rampCounter >= 15) {  // decrease every ~15 ticks
      state.rampCounter = 0;
      state.currentSpinRate--;
    }
  }

  // Rotate the dim spots based on current spin rate
  state.spinCounter++;
  if(state.spinCounter >= state.currentSpinRate) {
    state.spinCounter = 0;
    for(int i = 0; i < 4; i++) {
      state.rotation[i] = (state.rotation[i] + 1) % len;
    }
  }

  // Gentle pulse
  if(state.rising) {
    state.brightness += 1;
  } else {
    state.brightness -= 1;
  }
  if(state.brightness >= state.maxBright) {
    state.rising = false;
    state.brightness = state.maxBright;
  } else if(state.brightness <= state.minBright) {
    state.rising = true;
    state.brightness = state.minBright;
  }

  segment.show();
}

void aurora(NeoPixelSegment& segment, unsigned long ticks, AuroraState& state) {
  if(ticks % state.rate != 0) return;

  int len = segment.getLength();
  state.hueOffset += 1;

  for(int i = 0; i < len; i++) {
    // Each LED gets a different phase based on position + time offset
    // Use sin approximation with integer math to stay lightweight
    int angle1 = (state.hueOffset * 3 + i * 60) % 360;
    int angle2 = (state.hueOffset * 5 + i * 40 + 120) % 360;
    int angle3 = (state.hueOffset * 2 + i * 80 + 240) % 360;

    // Simple sine approximation: map 0-360 to a wave using lookup-free math
    // sin approx: value peaks at 90, zero at 0/180, negative at 270
    // We just want 0-255 range, so use triangle wave as cheap approximation
    auto wave = [](int a) -> uint8_t {
      a = a % 360;
      if(a < 0) a += 360;
      if(a < 90) return (uint8_t)(a * 255 / 90);
      if(a < 180) return (uint8_t)((180 - a) * 255 / 90);
      return 0;
    };

    // Aurora palette: green dominant, with blue and purple accents
    // Minimum of 40 so LEDs never go fully dark
    uint8_t g = max(wave(angle1), (uint8_t)40);
    uint8_t b = max(wave(angle2), (uint8_t)40);
    uint8_t r = wave(angle3) / 3;

    segment.setPixelColor(i, RgbColor("", r, g, b));
    int bright = map((int)(g + b + r), 0, 600, state.minBright, state.maxBright);
    segment.setPixelBrightness(i, constrain(bright, state.minBright, state.maxBright));
  }
  segment.show();
}

void progress(NeoPixelSegment& segment, unsigned long ticks, ProgressState& state) {
  if(ticks % state.rate == 0) {
    segment.setBrightness(4);
    if(segment.getLength() == 12) {
      int start_bright = segment.getLength() / 2;
      for(int i = 0; i < 12; i++) {
        if(i < segment.getLength()/2) {
          segment.setPixelBrightness(state.rotationPins[i], min(start_bright + (i), segment.getLength()/2));
        } else {
          segment.setPixelBrightness(state.rotationPins[i], max(start_bright - (i), 1));
        }
      }

      for(int i = 0; i < segment.getLength(); i++) {
        state.rotationPins[i] = state.rotationPins[i] + 1;
        if(state.rotationPins[i] >= segment.getLength()) {
          state.rotationPins[i] = 0;
        }
      }
    }
    segment.show();
  }
}