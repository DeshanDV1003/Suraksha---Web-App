const fs = require('fs');
const path = require('path');
const pagesDir = path.join('d:', 'Suraksha - Web App', 'frontend', 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

const h1Class = 'text-3xl font-bold tracking-tight text-[#1e293b]';
const pClass = 'text-slate-500 mt-1 font-medium';

for (const file of files) {
    if (file === 'DashboardPage.tsx') continue;
    
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const h1Regex = /<h1 className="[^"]*"/;
    content = content.replace(h1Regex, `<h1 className="${h1Class}"`);
    
    const parts = content.split('</h1>');
    if (parts.length > 1) {
        const pRegex = /<p className="[^"]*"/;
        parts[1] = parts[1].replace(pRegex, `<p className="${pClass}"`);
        content = parts.join('</h1>');
    }
    
    fs.writeFileSync(filePath, content);
}
console.log('Successfully updated 16 files.');
