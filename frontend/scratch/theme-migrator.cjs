const fs = require('fs');
const path = require('path');

const targetDirs = [
  'D:\\Suraksha - Web App\\frontend\\src\\pages',
  'D:\\Suraksha - Web App\\frontend\\src\\components'
];

function replaceColors(content) {
  let result = content;

  // Blue brand colors
  result = result.replace(/bg-\[#0061ff\]/g, 'bg-brand-500');
  result = result.replace(/text-\[#0061ff\]/g, 'text-brand-500');
  result = result.replace(/border-\[#0061ff\]/g, 'border-brand-500');
  
  result = result.replace(/bg-\[#1e293b\]/g, 'bg-gray-800 dark:bg-gray-900');
  result = result.replace(/text-\[#1e293b\]/g, 'text-gray-800 dark:text-white/90');
  
  result = result.replace(/bg-slate-50/g, 'bg-gray-50 dark:bg-gray-800/50');
  result = result.replace(/bg-slate-100/g, 'bg-gray-100 dark:bg-gray-800');
  result = result.replace(/bg-slate-200/g, 'bg-gray-200 dark:bg-gray-700');
  result = result.replace(/bg-white/g, 'bg-white dark:bg-gray-900');
  
  result = result.replace(/text-slate-400/g, 'text-gray-400 dark:text-gray-500');
  result = result.replace(/text-slate-500/g, 'text-gray-500 dark:text-gray-400');
  result = result.replace(/text-slate-600/g, 'text-gray-600 dark:text-gray-300');
  
  result = result.replace(/border-slate-100/g, 'border-gray-200 dark:border-gray-800');
  result = result.replace(/border-slate-200/g, 'border-gray-200 dark:border-gray-700');

  // Breadcrumb addition if it's a main page that doesn't have it yet
  // We'll skip complex breadcrumb logic for now to ensure we don't break existing layouts
  // The global CSS updates and these color updates will do 95% of the work.

  return result;
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = replaceColors(content);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('Theme migration complete!');
