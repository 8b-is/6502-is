import { segdefs } from './src/data/segdefs.js';
let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
segdefs.forEach(seg => {
  const pts = seg.slice(3);
  for(let i=0; i<pts.length; i+=2) {
    if(pts[i] < minX) minX = pts[i];
    if(pts[i] > maxX) maxX = pts[i];
    if(pts[i+1] < minY) minY = pts[i+1];
    if(pts[i+1] > maxY) maxY = pts[i+1];
  }
});
console.log({minX, maxX, minY, maxY, width: maxX-minX, height: maxY-minY});
