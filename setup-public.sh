
#!/bin/bash
# setup-public.sh - Create basic public files

echo "🚀 Setting up public files..."

# Create public directory if it doesn't exist
mkdir -p public

# Create a simple favicon (text-based)
echo "🎵 Creating favicon..."
cat > public/favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#grad1)"/>
  <text x="16" y="22" font-family="Arial" font-size="16" fill="white" text-anchor="middle">♪</text>
</svg>
EOF

# Create basic PNG icons
echo "📱 Creating app icons..."
# This would need a more sophisticated tool in reality
# For now, we'll create placeholder files

touch public/icon-192.png
touch public/icon-512.png
touch public/apple-touch-icon.png
touch public/favicon-16x16.png
touch public/favicon-32x32.png

# Create placeholder favicon.ico
cp public/favicon.svg public/favicon.ico

echo "✅ Public files created!"
echo "📝 Note: Replace placeholder icon files with actual icons using a favicon generator"
echo "🌐 Suggested: Use https://favicon.io/ or https://realfavicongenerator.net/"
