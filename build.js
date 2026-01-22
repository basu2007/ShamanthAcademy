const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Shamanth Academy - Professional Build Script (Cross-Platform)
 * Includes "Report Collector" to capture artifacts from Temp directories.
 */

const DIST_DIR = path.resolve(__dirname, 'dist');
const REPORTS_DIST = path.join(DIST_DIR, 'reports');
const ASSETS = ['index.html', 'metadata.json'];

// Windows Temp path for reports as reported by the user
const TEMP_REPORT_PATH = process.env.LOCALAPPDATA 
  ? path.join(process.env.LOCALAPPDATA, 'Temp', 'ShamanthAcademy')
  : null;

try {
  console.log('--- 🚀 Starting Build Process ---');

  // 1. Clean previous builds
  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Removing old dist folder...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  // 2. Create folders
  console.log('📁 Creating fresh dist folders...');
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIST, { recursive: true });

  // 3. Bundle JS with esbuild
  console.log('📦 Bundling application source...');
  const esbuildCommand = 'npx esbuild index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --minify --external:react --external:react-dom';
  execSync(esbuildCommand, { stdio: 'inherit', shell: true });

  // 4. Copy static assets and patch index.html
  console.log('📄 Processing and copying assets to dist...');
  ASSETS.forEach(fileName => {
    const src = path.resolve(__dirname, fileName);
    const dest = path.resolve(DIST_DIR, fileName);
    
    if (fs.existsSync(src)) {
      if (fileName === 'index.html') {
        let htmlContent = fs.readFileSync(src, 'utf8');
        htmlContent = htmlContent.replace('src="index.tsx"', 'src="index.js"');
        fs.writeFileSync(dest, htmlContent);
        console.log(`   ✅ Patched and copied: ${fileName}`);
      } else {
        fs.copyFileSync(src, dest);
        console.log(`   ✅ Copied: ${fileName}`);
      }
    }
  });

  // 5. NEW: Collect Reports from Temp directory
  // This ensures that "Report saved: C:\Users\..." files are actually uploaded to Amplify
  if (TEMP_REPORT_PATH && fs.existsSync(TEMP_REPORT_PATH)) {
    console.log(`🔍 Checking for reports in ${TEMP_REPORT_PATH}...`);
    const files = fs.readdirSync(TEMP_REPORT_PATH);
    const zipFiles = files.filter(f => f.endsWith('.zip'));
    
    zipFiles.forEach(file => {
      const src = path.join(TEMP_REPORT_PATH, file);
      const dest = path.join(REPORTS_DIST, file);
      fs.copyFileSync(src, dest);
      console.log(`   📦 Collected Report: ${file}`);
    });

    if (zipFiles.length === 0) {
      console.log('   ℹ️ No recent reports found to upload.');
    }
  }

  console.log('--- ✨ Build Successful! ---');
  console.log(`Ready for deployment in: ${DIST_DIR}\n`);

} catch (error) {
  console.error('\n❌ BUILD FAILED:');
  console.error(error.message);
  process.exit(1);
}