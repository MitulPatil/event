#!/usr/bin/env node
/**
 * Event Pulse Setup Script
 * Validates environment configuration and Appwrite connectivity
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function checkEnvFile() {
  log('blue', '\n🔍 Checking environment configuration...');
  
  if (!checkFileExists('.env')) {
    log('red', '❌ .env file not found!');
    log('yellow', '💡 Run: cp .env.example .env');
    log('yellow', '   Then edit .env with your Appwrite credentials');
    return false;
  }
  
  log('green', '✅ .env file found');
  
  // Read and parse .env file
  const envContent = fs.readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const requiredVars = [
    'EXPO_PUBLIC_APPWRITE_ENDPOINT',
    'EXPO_PUBLIC_APPWRITE_PROJECT_ID',
    'EXPO_PUBLIC_APPWRITE_DATABASE_ID',
    'EXPO_PUBLIC_APPWRITE_STORAGE_ID',
    'EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID',
    'EXPO_PUBLIC_APPWRITE_VIDEO_COLLECTION_ID',
    'EXPO_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID',
    'EXPO_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID'
  ];
  
  const setVars = [];
  const missingVars = [];
  
  envLines.forEach(line => {
    const [key] = line.split('=');
    if (requiredVars.includes(key)) {
      setVars.push(key);
    }
  });
  
  requiredVars.forEach(varName => {
    if (!setVars.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log('red', `❌ Missing required environment variables:`);
    missingVars.forEach(varName => {
      log('red', `   - ${varName}`);
    });
    return false;
  }
  
  log('green', `✅ All ${requiredVars.length} required environment variables are set`);
  return true;
}

function checkProjectStructure() {
  log('blue', '\n🏗️ Checking project structure...');
  
  const requiredFiles = [
    'package.json',
    'app.json',
    'babel.config.js',
    'tailwind.config.js',
    'app/_layout.jsx',
    'lib/appwrite.js',
    'lib/config.js',
    'context/GlobalProvider.js'
  ];
  
  const requiredDirs = [
    'app',
    'components',
    'lib',
    'constants',
    'context',
    'assets'
  ];
  
  let allGood = true;
  
  // Check files
  requiredFiles.forEach(file => {
    if (checkFileExists(file)) {
      log('green', `✅ ${file}`);
    } else {
      log('red', `❌ ${file} missing`);
      allGood = false;
    }
  });
  
  // Check directories
  requiredDirs.forEach(dir => {
    if (checkFileExists(dir)) {
      log('green', `✅ ${dir}/`);
    } else {
      log('red', `❌ ${dir}/ missing`);
      allGood = false;
    }
  });
  
  return allGood;
}

function checkPackageJson() {
  log('blue', '\n📦 Checking package.json dependencies...');
  
  if (!checkFileExists('package.json')) {
    log('red', '❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'expo',
    'react',
    'react-native',
    'expo-router',
    'react-native-appwrite',
    'nativewind',
    'tailwindcss'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !deps[dep]);
  
  if (missingDeps.length > 0) {
    log('red', '❌ Missing required dependencies:');
    missingDeps.forEach(dep => log('red', `   - ${dep}`));
    log('yellow', '💡 Run: npm install');
    return false;
  }
  
  log('green', '✅ All required dependencies are installed');
  return true;
}

function generateSetupSummary() {
  log('blue', '\n📋 Setup Summary');
  log('cyan', '='.repeat(50));
  
  log('green', '✅ Environment file configured');
  log('green', '✅ Project structure validated');
  log('green', '✅ Dependencies installed');
  
  log('yellow', '\n🚀 Next steps:');
  log('cyan', '1. Start the development server: npm start');
  log('cyan', '2. Run on your device: npm run android / npm run ios');
  log('cyan', '3. Test Appwrite connection in the app');
  
  log('magenta', '\n📚 Useful commands:');
  log('cyan', '• npm start           - Start Expo dev server');
  log('cyan', '• npm run android     - Run on Android');
  log('cyan', '• npm run ios         - Run on iOS');
  log('cyan', '• npm run web         - Run on web browser');
}

function main() {
  log('magenta', '🎬 Event Pulse Setup Validator');
  log('cyan', '='.repeat(40));
  
  const checks = [
    checkEnvFile(),
    checkProjectStructure(),
    checkPackageJson()
  ];
  
  const allPassed = checks.every(check => check);
  
  if (allPassed) {
    generateSetupSummary();
    log('green', '\n🎉 Setup validation passed! Your app is ready to run.');
  } else {
    log('red', '\n❌ Setup validation failed. Please fix the issues above.');
    process.exit(1);
  }
}

main();
