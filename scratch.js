import { initChip, step, loadProgram, userCode, getMachineState } from './src/simulation/engine.js';

// Setup userCode
const hexInput = 'A9 42 85 0A E8 4C 00 00';
const bytes = hexInput.replace(/[^0-9A-Fa-f]/g, ' ').trim().split(' ').map(b => parseInt(b, 16));
userCode.length = 0;
for(let i=0; i<bytes.length; i++) userCode[i] = bytes[i];

loadProgram();
initChip();

for(let i=0; i<50; i++) {
  step();
  const state = getMachineState();
  if (i % 2 === 0) {
    console.log(`Cycle ${state.cycle}: PC=${state.pc.toString(16)} A=${state.a.toString(16)} fetch=${state.fetch}`);
  }
}
