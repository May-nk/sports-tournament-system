const fs = require('fs');
const path = require('path');

const currentDir = process.cwd();
const nestedDir = path.join(currentDir, 'frontend');

// Move files from nested frontend to current dir
function moveFiles() {
  const files = fs.readdirSync(nestedDir);
  for (const file of files) {
    if (file === 'node_modules') continue;
    
    const src = path.join(nestedDir, file);
    const dest = path.join(currentDir, file);
    
    fs.renameSync(src, dest);
  }
}

// Clean up
try {
  if (fs.existsSync('node_modules')) {
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
  if (fs.existsSync('package.json')) {
    fs.unlinkSync('package.json');
  }
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }

  moveFiles();

  fs.rmSync(nestedDir, { recursive: true, force: true });
  
  console.log('✅ Successfully fixed folder structure! The Vite app is now in E:\\sports-tournament-system\\frontend.');
  console.log('\nPlease run the following commands next:');
  console.log('1. npm install');
  console.log('2. npm install -D tailwindcss postcss autoprefixer');
  console.log('3. npm run dev');
} catch (error) {
  console.error('Error:', error);
}
