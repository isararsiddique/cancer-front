#!/usr/bin/env node

/**
 * Build script for JupyterLite integration in ML Training Dashboard
 * This script builds JupyterLite and places it in the correct location
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const JUPYTER_BUILD_DIR = 'public/static/jupyterlite/lite-build';
const JUPYTER_CONFIG_DIR = 'public/static/jupyterlite';

function runCommand(command, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

async function main() {
  console.log('🚀 Building JupyterLite for ML Training Dashboard...\n');

  // 1. Check if jupyter-lite is installed
  try {
    execSync('jupyter lite --version', { stdio: 'pipe' });
    console.log('✅ JupyterLite is already installed');
  } catch (error) {
    console.log('⚠️  JupyterLite not found in PATH');
    console.log('💡 Checking backend virtual environment...');
    
    // Try to use backend's virtual environment
    const backendVenvPath = '../cancer-back/venv/bin/jupyter';
    if (fs.existsSync(backendVenvPath)) {
      console.log('✅ Found JupyterLite in backend virtual environment');
      // We'll use the backend's jupyter for building
    } else {
      console.warn('⚠️  JupyterLite not installed. Skipping build.');
      console.warn('To install JupyterLite, run:');
      console.warn('  cd cancer-back && source venv/bin/activate && pip install jupyterlite[all]');
      console.warn('Or run: npm run setup:jupyter');
      process.exit(0); // Exit gracefully, don't fail the build
    }
  }

  // 2. Ensure build directories exist
  ensureDirectory(JUPYTER_BUILD_DIR);

  // 3. Build JupyterLite
  console.log('\n🔨 Building JupyterLite...');
  
  // Try to use backend's jupyter if available
  const backendJupyter = path.resolve(__dirname, '../cancer-back/venv/bin/jupyter');
  const jupyterCmd = fs.existsSync(backendJupyter) ? backendJupyter : 'jupyter';
  
  // Build JupyterLite - build from the frontend directory
  try {
    runCommand(
      `cd ${__dirname} && ${jupyterCmd} lite build --output-dir ${JUPYTER_BUILD_DIR}`,
      'Building JupyterLite'
    );
  } catch (error) {
    console.error('❌ JupyterLite build failed');
    console.error('The ML Training notebook feature will not be available.');
    console.error('To fix this, install JupyterLite in the backend:');
    console.error('  cd cancer-back && source venv/bin/activate && pip install jupyterlite[all]');
    process.exit(0); // Exit gracefully
  }

  // 4. Verify build
  console.log('\n🔍 Verifying build...');
  
  const requiredFiles = [
    `${JUPYTER_BUILD_DIR}/lab/index.html`,
    `${JUPYTER_BUILD_DIR}/index.html`,
    `${JUPYTER_BUILD_DIR}/build`
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    console.log('\n🎉 JupyterLite build completed successfully!');
    console.log('\n📋 Integration complete:');
    console.log('1. JupyterLite is now embedded in your ML Training Dashboard');
    console.log('2. Navigate to /research/ml-training and select "Custom Code" tab');
    console.log('3. Your approved data will be available in the notebook');
    console.log('4. Access at: /static/jupyterlite/lite-build/lab/index.html');
  } else {
    console.error('\n❌ Build verification failed - some required files are missing');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}

module.exports = { main };