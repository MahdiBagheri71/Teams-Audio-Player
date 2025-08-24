# Changelog

All notable changes to Teams Audio Player will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

- Initial release of Teams Audio Player
- Microsoft Azure AD authentication with MSAL
- Teams chat integration via Microsoft Graph API
- Audio file browsing and playback from Teams chats
- Support for multiple audio formats (MP3, WAV, M4A, AAC, OGG, WMA, FLAC)
- Advanced audio player with controls:
  - Play/Pause/Skip functionality
  - Progress bar with seek
  - Volume control
  - Playlist management
- Progressive Web App (PWA) features:
  - Offline support with service workers
  - Installable on desktop and mobile
  - Responsive design
- Docker support for containerized deployment
- Production-ready nginx configuration
- Comprehensive error handling and user feedback
- Keyboard shortcuts for player control
- File caching for improved performance

### Security

- Secure OAuth 2.0 authentication flow
- Session-based token storage
- API calls with user context only

### Technical

- React 18.2.0 with hooks
- MSAL Browser 3.5.0 for authentication
- Microsoft Graph Client 3.0.7
- Workbox for PWA functionality
- Docker multi-stage build for optimized images

## [Unreleased]

### Planned Features

- Playlist saving and sharing
- Audio transcription support
- Advanced search and filtering
- Batch download functionality
- Dark mode theme
- Multi-language support
- Audio waveform visualization
- Integration with OneDrive folders
- Background playback on mobile
- Chromecast support

### Known Issues

- Teams attachment files cannot be played directly (Microsoft API limitation)
- Large audio files may take time to buffer
- Some audio formats may not be supported on all browsers

---

For detailed release notes, see the [GitHub Releases](https://github.com/yourusername/teams-audio-player/releases) page.
