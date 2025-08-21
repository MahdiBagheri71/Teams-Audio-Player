// src/services/audioService.js
class AudioService {
  constructor(graphClient) {
    this.graphClient = graphClient;
    this.audioExtensions = [
      '.mp3',
      '.wav',
      '.m4a',
      '.aac',
      '.ogg',
      '.wma',
      '.flac',
    ];
    this.audioMimeTypes = ['audio/', 'application/ogg'];
  }

  async getTeamsAudioFiles() {
    try {
      const audioFiles = [];

      // Get all user chats
      console.log('Fetching chats...');
      const chats = await this.graphClient.api('/me/chats').top(50).get();

      console.log(`Found ${chats.value.length} chats`);

      // Process each chat
      for (const chat of chats.value) {
        try {
          const chatFiles = await this.getChatAudioFiles(chat);
          audioFiles.push(...chatFiles);
        } catch (error) {
          console.warn(`Failed to process chat ${chat.id}:`, error);
        }
      }

      // Also check OneDrive for shared audio files
      try {
        const driveFiles = await this.getOneDriveAudioFiles();
        audioFiles.push(...driveFiles);
      } catch (error) {
        console.warn('Failed to fetch OneDrive files:', error);
      }

      // Sort by date (newest first)
      return audioFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Failed to fetch Teams audio files:', error);
      throw error;
    }
  }

  async getChatAudioFiles(chat) {
    const audioFiles = [];

    try {
      // Get messages from chat
      const messages = await this.graphClient
        .api(`/chats/${chat.id}/messages`)
        .top(100)
        .expand('attachments')
        .get();

      for (const message of messages.value) {
        if (message.attachments && message.attachments.length > 0) {
          const audioAttachments = message.attachments.filter((attachment) =>
            this.isAudioFile(attachment)
          );

          for (const attachment of audioAttachments) {
            const audioFile = await this.createAudioFileObject(
              attachment,
              message,
              chat,
              'chat'
            );
            if (audioFile) {
              audioFiles.push(audioFile);
            }
          }
        }

        // Check for shared OneDrive links in message body
        if (message.body && message.body.content) {
          const sharedFiles = await this.extractSharedAudioFiles(
            message.body.content,
            message,
            chat
          );
          audioFiles.push(...sharedFiles);
        }
      }
    } catch (error) {
      console.warn(`Failed to get messages for chat ${chat.id}:`, error);
    }

    return audioFiles;
  }

  async getOneDriveAudioFiles() {
    const audioFiles = [];

    try {
      // Search for audio files in OneDrive
      const searchResults = await this.graphClient
        .api("/me/drive/root/search(q='.mp3 OR .wav OR .m4a OR .aac')")
        .top(50)
        .get();

      for (const file of searchResults.value) {
        if (this.isAudioFile(file)) {
          const audioFile = {
            id: file.id,
            name: file.name,
            downloadUrl: file['@microsoft.graph.downloadUrl'],
            webUrl: file.webUrl,
            size: file.size,
            source: 'onedrive',
            location: 'OneDrive',
            sender: 'Me',
            date: new Date(file.lastModifiedDateTime),
            duration: null,
            type: file.file?.mimeType || 'audio/mpeg',
          };
          audioFiles.push(audioFile);
        }
      }
    } catch (error) {
      console.warn('Failed to search OneDrive:', error);
    }

    return audioFiles;
  }

  async createAudioFileObject(attachment, message, chat, source) {
    try {
      // Get download URL for attachment
      let downloadUrl = attachment.contentUrl;

      if (source === 'chat' && attachment.id) {
        try {
          // Try to get direct download URL from Graph API
          const attachmentDetails = await this.graphClient
            .api(
              `/chats/${chat.id}/messages/${message.id}/attachments/${attachment.id}`
            )
            .get();

          downloadUrl = attachmentDetails.contentUrl || downloadUrl;
        } catch (error) {
          console.warn('Failed to get attachment details:', error);
        }
      }

      return {
        id: attachment.id || `${message.id}_${attachment.name}`,
        name: attachment.name,
        downloadUrl: downloadUrl,
        webUrl: attachment.contentUrl,
        size: attachment.size || 0,
        source: source,
        location: chat.topic || chat.chatType || 'Chat',
        sender: message.from?.user?.displayName || 'Unknown',
        date: new Date(message.createdDateTime),
        duration: null,
        type: attachment.contentType || 'audio/mpeg',
      };
    } catch (error) {
      console.error('Failed to create audio file object:', error);
      return null;
    }
  }

  async extractSharedAudioFiles(messageContent, message, chat) {
    const audioFiles = [];

    // Look for OneDrive/SharePoint links in message content
    const urlRegex = /https:\/\/[^\s]+\.(mp3|wav|m4a|aac|ogg|wma|flac)/gi;
    const matches = messageContent.match(urlRegex);

    if (matches) {
      for (const url of matches) {
        try {
          // Extract filename from URL
          const filename = url.split('/').pop();

          const audioFile = {
            id: `shared_${message.id}_${filename}`,
            name: filename,
            downloadUrl: url,
            webUrl: url,
            size: 0,
            source: 'shared_link',
            location: chat.topic || 'Chat',
            sender: message.from?.user?.displayName || 'Unknown',
            date: new Date(message.createdDateTime),
            duration: null,
            type: 'audio/mpeg',
          };

          audioFiles.push(audioFile);
        } catch (error) {
          console.warn('Failed to process shared audio link:', error);
        }
      }
    }

    return audioFiles;
  }

  isAudioFile(file) {
    if (!file) return false;

    // Check by MIME type
    if (file.contentType) {
      return this.audioMimeTypes.some((type) =>
        file.contentType.toLowerCase().startsWith(type)
      );
    }

    // Check by file extension
    if (file.name) {
      const extension = file.name.toLowerCase();
      return this.audioExtensions.some((ext) => extension.endsWith(ext));
    }

    return false;
  }

  async getAudioMetadata(audioFile) {
    try {
      // Create audio element to get metadata
      const audio = new Audio();

      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve({
            duration: audio.duration,
            title: audioFile.name,
            artist: audioFile.sender,
          });
        });

        audio.addEventListener('error', () => {
          resolve({
            duration: 0,
            title: audioFile.name,
            artist: audioFile.sender,
          });
        });

        audio.src = audioFile.downloadUrl;
      });
    } catch (error) {
      console.warn('Failed to get audio metadata:', error);
      return {
        duration: 0,
        title: audioFile.name,
        artist: audioFile.sender,
      };
    }
  }
}

export default AudioService;
