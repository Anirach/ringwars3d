export type FixedStepClock = {
  stepMs: number;
  accMs: number;
  maxSteps: number;
};

export function createFixedStepClock(hz = 60, maxSteps = 4): FixedStepClock {
  return {
    stepMs: 1000 / hz,
    accMs: 0,
    maxSteps
  };
}

export function consumeSteps(clock: FixedStepClock, frameMs: number, onStep: (dtSec: number) => void) {
  clock.accMs += frameMs;
  let steps = 0;
  while (clock.accMs >= clock.stepMs && steps < clock.maxSteps) {
    clock.accMs -= clock.stepMs;
    onStep(clock.stepMs / 1000);
    steps++;
  }
}
