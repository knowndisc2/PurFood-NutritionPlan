#!/usr/bin/env node

/**
 * Deployment helper script for PurFood Nutrition App
 * This script helps prepare and deploy the app to GitHub Pages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 PurFood Deployment Helper\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Run this script from the project root.');
  process.exit(1);
}

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.error('❌ Error: .env file not found. Please create it with your Firebase configuration.');
  process.exit(1);
}

// Read package.json to verify homepage
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!packageJson.homepage) {
  console.error('❌ Error: homepage not set in package.json');
  process.exit(1);
}

console.log('✅ Project structure looks good');
console.log(`📍 Homepage: ${packageJson.homepage}`);

// Check if gh-pages is installed
try {
  execSync('npm list gh-pages', { stdio: 'ignore' });
  console.log('✅ gh-pages is installed');
} catch (error) {
  console.log('📦 Installing gh-pages...');
  execSync('npm install --save-dev gh-pages', { stdio: 'inherit' });
}

// Build the project
console.log('\n🏗️  Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Check if build directory exists and has content
if (!fs.existsSync('build') || fs.readdirSync('build').length === 0) {
  console.error('❌ Build directory is empty or missing');
  process.exit(1);
}

console.log('✅ Build directory created with content');

// Deploy to GitHub Pages
console.log('\n🚀 Deploying to GitHub Pages...');
try {
  execSync('npm run deploy', { stdio: 'inherit' });
  console.log('\n🎉 Deployment completed successfully!');
  console.log(`🌐 Your app should be available at: ${packageJson.homepage}`);
  console.log('\n📝 Note: It may take a few minutes for GitHub Pages to update.');
} catch (error) {
  console.error('❌ Deployment failed');
  console.error('💡 Make sure you have push access to the repository');
  process.exit(1);
}

console.log('\n✨ Deployment complete! Check your GitHub repository for the gh-pages branch.');
