const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Shamanth Academy - Cross-Platform Build Script
 * This script works on Windows, macOS, and Linux.
 */

try {
  console.log('🧹 Cleaning dist folder...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  console.log('📁 Creating dist folder...');
  fs.mkdirSync('dist');

  console.log('📦 Bundling with esbuild...');
  // Use npx to ensure we find the local esbuild installation
  execSync('npx esbuild index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --minify --external:react --external:react-dom', { 
    stdio: 'inherit',
    shell: true 
  });

  console.log('📄 Copying static assets...');
  const filesToCopy = ['index.html', 'metadata.json'];
  
  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
      console.log(`   ✅ Copied ${file}`);
    } else {
      console.warn(`   ⚠️ Warning: ${file} not found, skipping.`);
    }
  });

  console.log('\n✨ Build successfully completed in /dist folder!');
} catch (error) {
  console.error('\n❌ Build failed:');
  console.error(error.message);
  process.exit(1);
}