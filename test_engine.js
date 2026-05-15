import { initChip, loadProgram, step, getMachineState, userCode } from './src/simulation/engine.js';

userCode.push(0xA9, 0x42, 0x85, 0x00, 0xE8, 0x4C, 0x00, 0x00);
loadProgram();
initChip();

for(let i=0; i<30; i++) {
  step();
  const state = getMachineState();
  console.log(`Cycle: ${state.cycle}, PC: ${state.pc}, A: ${state.a}, Inst: ${state.instruction}, Fetch: ${state.fetch}`);
}
