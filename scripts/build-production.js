
// scripts/build-production.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Clean previous build
console.log('🧹 Cleaning previous build...');
if (fs.existsSync('build')) {
    fs.rmSync('build', { recursive: true, force: true });
}

// Set production environment
process.env.NODE_ENV = 'production';
process.env.GENERATE_SOURCEMAP = 'false';

try {
    // Build React app
    console.log('⚛️  Building React application...');
    execSync('npm run build', { stdio: 'inherit' });

    // Optimize build
    console.log('⚡ Optimizing build...');
    
    // Create service worker
    console.log('👷 Generating service worker...');
    execSync('npx workbox-cli generateSW workbox-config.js', { stdio: 'inherit' });

    // Generate build report
    console.log('📊 Generating build analysis...');
    execSync('npx webpack-bundle-analyzer build/static/js/*.js --mode server --port 8888 --no-open', 
        { stdio: 'inherit' });

    // Success message
    console.log('✅ Production build completed successfully!');
    console.log('📁 Build files are in the ./build directory');
    console.log('🌐 Ready for deployment');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
