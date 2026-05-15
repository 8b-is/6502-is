const fs = require('fs');
let svg = fs.readFileSync('public/cd.svg', 'utf8');
// Replace 6-digit hex
svg = svg.replace(/#[0-9a-fA-F]{6}/g, '#00ff00');
// Replace 3-digit hex (using word boundary or capturing group to prevent matching inside 6-digit hex)
svg = svg.replace(/#[0-9a-fA-F]{3}(?![0-9a-fA-F])/g, '#00ff00');
fs.writeFileSync('public/cd.svg', svg);
