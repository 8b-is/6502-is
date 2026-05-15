import re
import json

with open("6502.md", "r") as f:
    text = f.read()

opcodes = [None] * 256

# Find sections like:
# === ADC - Add with Carry ===
# ...
# {| class="wikitable"
# ! Addressing mode !! Opcode !! Bytes !! Cycles
# |-
# | [[Addressing_modes#Immediate|#Immediate]] || $69 || 2 || 2

blocks = re.split(r'=== ([A-Z]{3}) - .*? ===', text)
for i in range(1, len(blocks), 2):
    mnemonic = blocks[i]
    content = blocks[i+1]
    
    # find the wikitable for addressing modes
    table_match = re.search(r'!\s*Addressing mode.*?(?=\n\|})', content, flags=re.DOTALL)
    if table_match:
        table = table_match.group(0)
        # find rows: | mode || $opcode || bytes || cycles
        for row in table.split('|-'):
            cols = row.split('||')
            if len(cols) >= 3 and '$' in cols[1]:
                # extract addressing mode
                mode_col = cols[0]
                mode_match = re.search(r'\[\[.*?\|(.*?)\]\]|([a-zA-Z#,()]+)', mode_col)
                if mode_match:
                    mode = mode_match.group(1) or mode_match.group(2)
                    mode = mode.strip()
                else:
                    if 'Accumulator' in mode_col: mode = 'A'
                    elif 'Implied' in mode_col: mode = 'Implied'
                    else: mode = mode_col.replace('|', '').strip()
                
                opcode_match = re.search(r'\$([0-9A-Fa-f]{2})', cols[1])
                bytes_match = re.search(r'\d+', cols[2])
                
                if opcode_match and bytes_match:
                    opcode = int(opcode_match.group(1), 16)
                    size = int(bytes_match.group(0))
                    
                    opcodes[opcode] = {'m': mnemonic, 'mode': mode, 'size': size}

# Provide defaults for known unofficial/blank opcodes just in case
for i in range(256):
    if opcodes[i] is None:
        opcodes[i] = {'m': '???', 'mode': 'Implied', 'size': 1}

# output the JS
js_out = "export const OPCODES = [\n"
for i in range(256):
    o = opcodes[i]
    js_out += f"  {{ m: '{o['m']}', mode: '{o['mode']}', size: {o['size']} }},\n"
js_out += "];\n\n"

js_out += """
export function disassemble(pc, mRead) {
  const opcode = mRead(pc);
  const info = OPCODES[opcode];
  if (!info || info.m === '???') return 'Unknown ($' + opcode.toString(16).toUpperCase().padStart(2, '0') + ')';
  
  const m = info.m;
  const mode = info.mode;
  const size = info.size;
  
  if (size === 1) {
    if (mode === 'A' || mode === 'Accumulator') return m + ' A';
    return m;
  } else if (size === 2) {
    const b1 = mRead((pc + 1) & 0xFFFF);
    const hex1 = '$' + b1.toString(16).toUpperCase().padStart(2, '0');
    if (mode === '#Immediate') return m + ' #' + hex1;
    if (mode === 'Zero Page') return m + ' ' + hex1;
    if (mode === 'Zero Page,X') return m + ' ' + hex1 + ',X';
    if (mode === 'Zero Page,Y') return m + ' ' + hex1 + ',Y';
    if (mode === '(Indirect,X)') return m + ' (' + hex1 + ',X)';
    if (mode === '(Indirect),Y') return m + ' (' + hex1 + '),Y';
    if (mode === 'Relative') {
      // Relative branch target
      let offset = b1;
      if (offset > 127) offset -= 256;
      let target = (pc + 2 + offset) & 0xFFFF;
      return m + ' $' + target.toString(16).toUpperCase().padStart(4, '0');
    }
    return m + ' ' + hex1; // fallback
  } else if (size === 3) {
    const b1 = mRead((pc + 1) & 0xFFFF);
    const b2 = mRead((pc + 2) & 0xFFFF);
    const addr = (b2 << 8) | b1;
    const hexAddr = '$' + addr.toString(16).toUpperCase().padStart(4, '0');
    if (mode === 'Absolute') return m + ' ' + hexAddr;
    if (mode === 'Absolute,X') return m + ' ' + hexAddr + ',X';
    if (mode === 'Absolute,Y') return m + ' ' + hexAddr + ',Y';
    if (mode === '(Indirect)') return m + ' (' + hexAddr + ')';
    return m + ' ' + hexAddr;
  }
  return m;
}
"""

with open('src/utils/disassembler.js', 'w') as f:
    f.write(js_out)
    
print("Disassembler generated.")
