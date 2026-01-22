const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Shamanth Academy - Professional Build Script (Cross-Platform)
 * Verified for: Windows 10/11, macOS, and AWS Linux
 */

const DIST_DIR = path.resolve(__dirname, 'dist');
const ASSETS = ['index.html', 'metadata.json'];

try {
  console.log('--- 🚀 Starting Build Process ---');

  // 1. Clean previous builds
  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Removing old dist folder...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  // 2. Create dist folder
  console.log('📁 Creating fresh dist folder...');
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 3. Bundle JS with esbuild
  console.log('📦 Bundling application source...');
  // We use npx to ensure the local esbuild version is used
  const esbuildCommand = 'npx esbuild index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --minify --external:react --external:react-dom';
  execSync(esbuildCommand, { stdio: 'inherit', shell: true });

  // 4. Copy static assets
  console.log('📄 Copying assets to dist...');
  ASSETS.forEach(fileName => {
    const src = path.resolve(__dirname, fileName);
    const dest = path.resolve(DIST_DIR, fileName);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`   ✅ Copied: ${fileName}`);
    } else {
      console.warn(`   ⚠️ Warning: Source file ${fileName} not found!`);
    }
  });

  console.log('--- ✨ Build Successful! ---');
  console.log(`Ready for deployment in: ${DIST_DIR}\n`);

} catch (error) {
  console.error('\n❌ BUILD FAILED:');
  console.error(error.message);
  process.exit(1);
}