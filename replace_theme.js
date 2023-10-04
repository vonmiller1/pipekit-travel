const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app');

const replacements = [
  { pattern: /text-slate-[123]00/g, replacement: 'text-[#1d1d1f]' },
  { pattern: /text-slate-[456]00/g, replacement: 'text-[#7a7a7a]' },
  { pattern: /border-white\/(10|8|7|5)/g, replacement: 'border-[#e0e0e0]' },
  { pattern: /bg-slate-(950\/60|950|900|800)/g, replacement: 'bg-[#fafafc]' },
  { pattern: /#2EC4B6/gi, replacement: '#0066cc' },
  { pattern: /rgba\(255,\s*255,\s*255,\s*(0\.\d+)\)/g, replacement: 'rgba(0, 0, 0, $1)' },
  { pattern: /bg-\[#0C1524\]/g, replacement: 'bg-[#ffffff]' },
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const { pattern, replacement } of replacements) {
        newContent = newContent.replace(pattern, replacement);
      }
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  }
}

processDir(dir);
console.log('Done.');
