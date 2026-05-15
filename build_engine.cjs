const fs = require('fs');

const nodenames = fs.readFileSync('visual6502-ref/nodenames.js', 'utf8');
const transdefs = fs.readFileSync('visual6502-ref/transdefs.js', 'utf8');
const chipsim = fs.readFileSync('visual6502-ref/chipsim.js', 'utf8');
const macros = fs.readFileSync('visual6502-ref/macros.js', 'utf8');

// The setup functions from expertWires.js
const setupLogic = `
export const nodes = [];
export const transistors = {};
export const nodenamelist = [];

export const ngnd = nodenames['vss'];
export const npwr = nodenames['vcc'];

export function setupNodes() {
	for(var i in segdefs){
		var seg = segdefs[i];
		var w = seg[0];
		if(nodes[w]==undefined) 
			nodes[w] = {segs: new Array(), num: w, pullup: seg[1]=='+',
			            state: false, gates: new Array(), c1c2s: new Array()};
		if(w==ngnd) continue;
		if(w==npwr) continue;
		nodes[w].segs.push(seg.slice(3));
	}
}

export function setupTransistors() {
	for(let i in transdefs){
		var tdef = transdefs[i];
		var name = tdef[0];
		var gate = tdef[1];
		var c1 = tdef[2];
		var c2 = tdef[3];
		var bb = tdef[4];
		if(c1==ngnd) {c1=c2;c2=ngnd;}
		if(c1==npwr) {c1=c2;c2=npwr;}
		var trans = {name: name, on: false, gate: gate, c1: c1, c2: c2, bb: bb};
		nodes[gate].gates.push(trans);
		nodes[c1].c1c2s.push(trans);
		nodes[c2].c1c2s.push(trans);
		transistors[name] = trans;
	}
}

export function setupNodeNameList() {
	for(var i in nodenames)
		nodenamelist.push(i);
}

// Auto-initialize arrays so the engine is ready
setupNodes();
setupTransistors();
setupNodeNameList();

// Modify chipStatus to not rely on the DOM
export function getMachineState() {
  return {
    pc: readPC(),
    a: readA(),
    x: readX(),
    y: readY(),
    sp: readSP(),
    p: readPstring(),
    instruction: busToString('Execute'),
    fetch: isNodeHigh(nodenames['sync']) ? busToString('Fetch') : "",
    cycle: cycle
  };
}

// Dummy functions to replace DOM calls
globalThis.setStatus = () => {};
globalThis.updateLogbox = () => {};
globalThis.selectCell = () => {};
globalThis.initLogbox = () => {};
globalThis.setCellValue = () => {};
globalThis.refresh = () => {};
globalThis.hiliteNode = () => {};
`;

let engineCode = `
import { segdefs } from '../data/segdefs.js';

${nodenames}
${transdefs}

var animateChipLayout = false;
var userCode = [];
var testprogram = [];
var testprogramAddress = 0;
var userResetLow = undefined;
var userResetHigh = undefined;
var userSteps = undefined;
var expertMode = true;

// Fix strict mode missing declarations
var clockTriggers = {};
var writeTriggers = {};
var readTriggers = {};
var fetchTriggers = {};
var logStream = [];
var now = () => Date.now();
var document = { getElementById: () => ({ value: '', style: {}, innerHTML: '' }) };


${setupLogic}

// Now the chipsim and macros
${chipsim}
${macros}

// Export the necessary functions
export { 
  initChip, 
  step, 
  halfStep, 
  loadProgram, 
  runChip, 
  stopChip, 
  resetChip,
  mRead,
  mWrite,
  userCode,
  testprogram,
  testprogramAddress,
  userResetLow,
  userResetHigh,
  readPC,
  readA,
  readX,
  readY,
  readSP,
  readPstring,
  busToString,
  isNodeHigh
};
`;

// Remove original var declarations for ones we defined, to avoid duplicate lets/consts if we used them,
// but with var it's mostly fine. Let's just remove duplicate declarations of testprogram though
// because testprogram is defined in macros.js without var sometimes or with var.
engineCode = engineCode.replace(/var nodenames =/g, 'export const nodenames =');
engineCode = engineCode.replace(/var transdefs =/g, 'export const transdefs =');

// Removed dangerous document.getElementById regex replacements

// Remove console.log calls that spam
engineCode = engineCode.replace(/console\.log\(/g, 'void(');

fs.writeFileSync('src/simulation/engine.js', engineCode);
console.log('Engine built successfully!');
