const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Shamanth Academy - Production Build Script
 * Optimized for AWS Amplify and modern ESM deployments.
 */

const DIST_DIR = path.resolve(__dirname, 'dist');
const ASSETS = ['index.html', 'metadata.json'];

try {
  console.log('--- 🚀 Shamanth Academy: Build Initialized ---');

  // 1. Clean previous builds
  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Cleaning old artifacts...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  // 2. Create dist folder
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 3. Bundle JS with esbuild
  // We inject the API_KEY from the environment so it's available in the browser as process.env.API_KEY
  console.log('📦 Bundling application source...');
  const apiKey = process.env.API_KEY || '';
  const esbuildPath = path.join(__dirname, 'node_modules', '.bin', 'esbuild');
  const esbuildCommand = `"${esbuildPath}" index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --minify --external:react --external:react-dom --external:react/jsx-runtime --define:process.env.API_KEY='\"${apiKey}\"'`;
  
  execSync(esbuildCommand, { stdio: 'inherit', shell: true });

  // 4. Process assets
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
    } else {
      console.warn(`   ⚠️ Source file not found: ${fileName}`);
    }
  });

  // 5. Final Verification
  const entryPoint = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(entryPoint)) {
    console.log('\n--- ✨ BUILD SUCCESSFUL! ---');
    console.log(`Artifacts ready in: ${DIST_DIR}`);
  } else {
    throw new Error('Critical Error: index.html was not created in dist/');
  }

} catch (error) {
  console.error('\n❌ BUILD FAILED:');
  console.error(error.message);
  process.exit(1);
}