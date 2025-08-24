# Teams Audio Player 🎵

A modern web application that allows you to play audio files directly from your Microsoft Teams chats and OneDrive. Built with React and integrated with Microsoft Graph API, this Progressive Web App (PWA) provides seamless access to audio content shared within Teams conversations.

![Teams Audio Player](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Azure AD](https://img.shields.io/badge/Azure%20AD-MSAL-0078D4?logo=microsoft-azure)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8)

## 🚀 Features

- **🔐 Secure Authentication**: OAuth 2.0 authentication with Microsoft Azure AD (MSAL)
- **💬 Teams Integration**: Browse and access audio files from your Teams chats
- **🎧 Advanced Audio Player**:
  - Play/Pause/Skip controls
  - Progress bar with seek functionality
  - Volume control
  - Playlist management
  - Keyboard shortcuts
- **📱 Progressive Web App**:
  - Offline support with service workers
  - Installable on desktop and mobile
  - Responsive design
- **🚀 Performance Optimized**:
  - Lazy loading
  - Audio file caching
  - Optimized builds with Workbox
- **🐳 Docker Ready**: Production-ready Docker configuration with nginx

## 📋 Prerequisites

- Node.js >= 16.x
- npm or yarn
- Microsoft Azure AD App Registration
- Microsoft Teams account with appropriate permissions

## 🛠️ Azure AD Setup

1. **Register an Application in Azure AD**:

   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to Azure Active Directory > App registrations
   - Click "New registration"
   - Set the redirect URI to `http://localhost:3000` (development) and your production URL

2. **Configure API Permissions**:

   ```
   Microsoft Graph API:
   - User.Read
   - Chat.Read
   - Files.Read
   ```

3. **Configure Authentication**:
   - Enable "Access tokens" and "ID tokens" in Authentication settings
   - Add your redirect URIs
   - Enable "Single-page application" platform

## ⚙️ Installation

### Local Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/teams-audio-player.git
   cd teams-audio-player
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:

   ```env
   REACT_APP_CLIENT_ID=your-azure-ad-client-id
   REACT_APP_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
   REACT_APP_REDIRECT_URI=http://localhost:3000
   REACT_APP_GRAPH_SCOPES=User.Read Chat.Read Files.Read
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

### Docker Deployment

1. **Build the Docker image**:

   ```bash
   docker build -t teams-audio-player .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     -p 80:80 \
     -e REACT_APP_CLIENT_ID=your-client-id \
     -e REACT_APP_AUTHORITY=your-authority \
     -e REACT_APP_REDIRECT_URI=your-redirect-uri \
     -e REACT_APP_GRAPH_SCOPES="User.Read Chat.Read Files.Read" \
     teams-audio-player
   ```

### Production Build

1. **Build for production**:

   ```bash
   npm run build:prod
   ```

2. **Serve the build**:
   ```bash
   npm run serve
   ```

## 📁 Project Structure

```
teams-audio-player/
├── public/                 # Static assets
│   ├── manifest.json      # PWA manifest
│   └── index.html         # HTML template
├── src/
│   ├── components/        # React components
│   │   ├── AudioPlayer.js # Main audio player component
│   │   ├── ChatSelector.js # Teams chat selector
│   │   ├── LoginScreen.js # Authentication screen
│   │   └── Playlist.js    # Playlist management
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.js     # Authentication hook
│   │   └── useAudioPlayer.js # Audio player logic
│   ├── services/          # API services
│   │   └── audioService.js # Microsoft Graph API integration
│   ├── App.js             # Main application component
│   └── authConfig.js      # MSAL configuration
├── Dockerfile             # Docker configuration
├── nginx.conf            # Nginx configuration
├── workbox-config.js     # PWA service worker config
└── package.json          # Project dependencies
```

## 🔧 Available Scripts

```bash
# Development
npm start              # Start development server
npm test              # Run tests
npm run lint          # Lint code
npm run format        # Format code with Prettier

# Production
npm run build         # Create production build
npm run build:prod    # Build with PWA optimization
npm run analyze       # Analyze bundle size

# Utilities
npm run serve         # Serve production build locally
npm run pre-commit    # Run pre-commit checks
```

## 🎯 Usage

1. **Login**: Sign in with your Microsoft Teams account
2. **Select Chat**: Browse your Teams chats and select one containing audio files
3. **Play Audio**:
   - Click on any audio file to play
   - Use player controls for navigation
   - Manage playlist with drag and drop

### Keyboard Shortcuts

- `Space`: Play/Pause
- `→`: Next track
- `←`: Previous track
- `↑`: Volume up
- `↓`: Volume down
- `M`: Mute/Unmute

## 🔒 Security Considerations

- All authentication is handled through Microsoft's secure OAuth 2.0 flow
- Tokens are stored in session storage and cleared on logout
- No audio files are stored locally - streaming only
- API calls are made directly to Microsoft Graph with user context

## 🐛 Troubleshooting

### Common Issues

1. **"No audio files found" error**:

   - Ensure the Teams chat contains audio files
   - Check that you have appropriate permissions
   - Verify the file types are supported (.mp3, .wav, .m4a, etc.)

2. **Authentication errors**:

   - Verify Azure AD app configuration
   - Check redirect URI matches your environment
   - Ensure all required API permissions are granted

3. **Playback issues**:
   - Check browser audio permissions
   - Verify network connectivity
   - Try refreshing the page

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Microsoft Graph API for Teams integration
- Azure AD for secure authentication
- React team for the excellent framework
- Workbox for PWA capabilities

## 📞 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/yourusername/teams-audio-player/issues) page.

---

Made with ❤️ for Microsoft Teams users who love audio content
