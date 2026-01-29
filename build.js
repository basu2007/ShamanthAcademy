const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Shamanth Academy - Production Build Script
 */

const DIST_DIR = path.resolve(__dirname, 'dist');
const ASSETS = ['index.html', 'metadata.json'];

try {
  console.log('--- 🚀 Shamanth Academy: Build Initialized ---');

  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Cleaning old artifacts...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });

  console.log('📦 Bundling application source...');
  
  const apiKey = process.env.API_KEY || '';
  const esbuildPath = path.join(__dirname, 'node_modules', '.bin', 'esbuild');
  
  // Mark all CDN-loaded packages as external
  const externals = [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react-dom/client',
    '@google/genai'
  ].map(pkg => `--external:${pkg}`).join(' ');

  const esbuildCommand = `"${esbuildPath}" index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --minify ${externals} --define:process.env.API_KEY='\"${apiKey}\"'`;
  
  console.log('🛠️  Running esbuild...');
  execSync(esbuildCommand, { stdio: 'inherit', shell: true });

  console.log('📄 Processing static assets...');
  ASSETS.forEach(fileName => {
    const src = path.resolve(__dirname, fileName);
    const dest = path.resolve(DIST_DIR, fileName);
    
    if (fs.existsSync(src)) {
      if (fileName === 'index.html') {
        let htmlContent = fs.readFileSync(src, 'utf8');
        htmlContent = htmlContent.replace(/src=["']index\.tsx["']/gi, 'src="index.js"');
        fs.writeFileSync(dest, htmlContent);
        console.log(`   ✅ Patched and copied: ${fileName}`);
      } else {
        fs.copyFileSync(src, dest);
        console.log(`   ✅ Copied: ${fileName}`);
      }
    }
  });

  console.log('\n--- ✨ BUILD SUCCESSFUL! ---');

} catch (error) {
  console.error('\n❌ BUILD FAILED:');
  console.error(error.message);
  process.exit(1);
}