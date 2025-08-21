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

  async getUserChats() {
    try {
      console.log('📞 Fetching user chats...');

      const chats = await this.graphClient
        .api('/me/chats')
        .select('id,topic,chatType,createdDateTime,lastUpdatedDateTime')
        .top(50)
        .get();

      console.log(`✅ Found ${chats.value.length} chats`);

      const formattedChats = chats.value.map((chat) => ({
        id: chat.id,
        title: this.getChatTitle(chat),
        type: chat.chatType,
        lastUpdated: new Date(chat.lastUpdatedDateTime),
        hasAudio: null,
      }));

      // Sort by date manually
      formattedChats.sort((a, b) => b.lastUpdated - a.lastUpdated);
      return formattedChats;
    } catch (error) {
      console.error('❌ Failed to fetch chats:', error);
      throw new Error(`Failed to load chats: ${error.message}`);
    }
  }

  async getChatAudioFiles(chatId, chatTitle) {
    const audioFiles = [];

    try {
      console.log(`📨 Getting audio files from chat: ${chatTitle}`);

      const messages = await this.graphClient
        .api(`/chats/${chatId}/messages`)
        .top(50)
        .get();

      console.log(`📝 Found ${messages.value.length} messages in chat`);

      for (const message of messages.value) {
        try {
          // Process attachments
          if (message.attachments && message.attachments.length > 0) {
            for (const attachment of message.attachments) {
              if (this.isAudioFile(attachment)) {
                console.log(`🎵 Processing audio: ${attachment.name}`);

                // Try multiple approaches to get playable URL
                const audioFile = await this.createPlayableAudioFile(
                  attachment,
                  message,
                  chatId,
                  chatTitle
                );

                if (audioFile) {
                  audioFiles.push(audioFile);
                }
              }
            }
          }

          // Process shared links
          if (message.body && message.body.content) {
            const sharedFiles = this.extractSharedAudioFiles(
              message.body.content,
              message,
              { title: chatTitle }
            );
            if (sharedFiles.length > 0) {
              audioFiles.push(...sharedFiles);
              console.log(`🔗 Found ${sharedFiles.length} shared audio links`);
            }
          }
        } catch (messageError) {
          console.warn(`❌ Failed to process message:`, messageError);
        }
      }

      console.log(`✅ Found ${audioFiles.length} total audio files in chat`);
      return audioFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error(`❌ Failed to get audio files from chat ${chatId}:`, error);
      throw new Error(`Failed to load audio files: ${error.message}`);
    }
  }

  async createPlayableAudioFile(attachment, message, chatId, chatTitle) {
    let audioFile = {
      id: attachment.id || `${message.id}_${Date.now()}`,
      name: attachment.name || 'Unknown Audio',
      downloadUrl: null,
      webUrl: message.webUrl,
      size: attachment.size || 0,
      source: 'teams_chat',
      location: chatTitle,
      sender: message.from?.user?.displayName || 'Unknown',
      date: new Date(message.createdDateTime),
      duration: null,
      type: attachment.contentType || 'audio/mpeg',
      canPlay: false,
      teamsMessageUrl: message.webUrl,
      instructions: 'Teams attachment - trying to make it playable...',
    };

    // Method 1: Try to get direct download URL from attachment
    try {
      if (attachment.contentUrl) {
        console.log(
          `🔗 Trying attachment contentUrl: ${attachment.contentUrl}`
        );
        audioFile.downloadUrl = attachment.contentUrl;
        audioFile.canPlay = true;
        audioFile.instructions = 'Direct attachment link';
        console.log(`✅ Got direct URL for: ${attachment.name}`);
      }
    } catch (error) {
      console.warn(`⚠️ Method 1 failed:`, error.message);
    }

    // Method 2: Try to get via Messages API with attachment ID
    if (!audioFile.canPlay && attachment.id) {
      try {
        console.log(
          `🔍 Trying to get attachment via Graph API: ${attachment.id}`
        );

        const attachmentDetails = await this.graphClient
          .api(
            `/chats/${chatId}/messages/${message.id}/attachments/${attachment.id}`
          )
          .get();

        if (
          attachmentDetails.contentUrl ||
          attachmentDetails['@microsoft.graph.downloadUrl']
        ) {
          const url =
            attachmentDetails['@microsoft.graph.downloadUrl'] ||
            attachmentDetails.contentUrl;
          audioFile.downloadUrl = url;
          audioFile.canPlay = true;
          audioFile.instructions = 'Retrieved via Graph API';
          console.log(`✅ Got Graph API URL for: ${attachment.name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Method 2 failed:`, error.message);
      }
    }

    // Method 3: Try to search for file in OneDrive/SharePoint
    if (!audioFile.canPlay) {
      try {
        console.log(
          `🔍 Searching for file in user's drives: ${attachment.name}`
        );
        const driveFile = await this.searchForFileInDrives(attachment.name);

        if (driveFile) {
          audioFile.downloadUrl = driveFile.downloadUrl;
          audioFile.webUrl = driveFile.webUrl;
          audioFile.canPlay = true;
          audioFile.source = 'onedrive';
          audioFile.instructions = 'Found in OneDrive';
          console.log(`✅ Found in drives: ${attachment.name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Method 3 failed:`, error.message);
      }
    }

    // Method 4: Try to find in recent files
    if (!audioFile.canPlay) {
      try {
        console.log(`🔍 Searching in recent files: ${attachment.name}`);
        const recentFile = await this.searchInRecentFiles(attachment.name);

        if (recentFile) {
          audioFile.downloadUrl = recentFile.downloadUrl;
          audioFile.webUrl = recentFile.webUrl;
          audioFile.canPlay = true;
          audioFile.source = 'recent';
          audioFile.instructions = 'Found in recent files';
          console.log(`✅ Found in recent files: ${attachment.name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Method 4 failed:`, error.message);
      }
    }

    // If still not playable, provide helpful instructions
    if (!audioFile.canPlay) {
      audioFile.instructions = 'Click to open in Teams and download manually';
      console.log(`⚠️ Could not make playable: ${attachment.name}`);
    }

    return audioFile;
  }

  async searchForFileInDrives(fileName) {
    try {
      console.log(`🔍 Searching drives for: ${fileName}`);

      // Search in OneDrive
      const searchQuery = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars
      const searchResults = await this.graphClient
        .api(`/me/drive/root/search(q='${searchQuery}')`)
        .top(10)
        .get();

      for (const file of searchResults.value) {
        if (file.name === fileName && file['@microsoft.graph.downloadUrl']) {
          console.log(`✅ Found exact match in OneDrive: ${fileName}`);
          return {
            downloadUrl: file['@microsoft.graph.downloadUrl'],
            webUrl: file.webUrl,
          };
        }
      }

      // Search in SharePoint sites (if accessible)
      try {
        const sites = await this.graphClient.api('/sites').top(5).get();

        for (const site of sites.value) {
          try {
            const siteSearch = await this.graphClient
              .api(`/sites/${site.id}/drive/root/search(q='${searchQuery}')`)
              .top(5)
              .get();

            for (const file of siteSearch.value) {
              if (
                file.name === fileName &&
                file['@microsoft.graph.downloadUrl']
              ) {
                console.log(`✅ Found in SharePoint site: ${fileName}`);
                return {
                  downloadUrl: file['@microsoft.graph.downloadUrl'],
                  webUrl: file.webUrl,
                };
              }
            }
          } catch (siteError) {
            console.warn(
              `⚠️ Could not search site ${site.id}:`,
              siteError.message
            );
          }
        }
      } catch (sitesError) {
        console.warn(
          `⚠️ Could not access SharePoint sites:`,
          sitesError.message
        );
      }
    } catch (error) {
      console.warn(`⚠️ Drive search failed:`, error.message);
    }

    return null;
  }

  async searchInRecentFiles(fileName) {
    try {
      console.log(`🔍 Searching recent files for: ${fileName}`);

      const recentFiles = await this.graphClient
        .api('/me/drive/recent')
        .top(50)
        .get();

      for (const file of recentFiles.value) {
        if (file.name === fileName && file['@microsoft.graph.downloadUrl']) {
          console.log(`✅ Found in recent files: ${fileName}`);
          return {
            downloadUrl: file['@microsoft.graph.downloadUrl'],
            webUrl: file.webUrl,
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Recent files search failed:`, error.message);
    }

    return null;
  }

  extractSharedAudioFiles(messageContent, message, chat) {
    const audioFiles = [];

    try {
      // Direct audio URLs
      const urlRegex =
        /https:\/\/[^\s<>"]+\.(mp3|wav|m4a|aac|ogg|wma|flac)(\?[^\s<>"]*)?/gi;
      const matches = messageContent.match(urlRegex);

      if (matches) {
        for (const url of matches) {
          try {
            const filename = decodeURIComponent(
              url.split('/').pop().split('?')[0]
            );

            audioFiles.push({
              id: `shared_${message.id}_${Date.now()}_${Math.random()}`,
              name: filename,
              downloadUrl: url,
              webUrl: url,
              size: 0,
              source: 'shared_url',
              location: chat.title,
              sender: message.from?.user?.displayName || 'Unknown',
              date: new Date(message.createdDateTime),
              duration: null,
              type: 'audio/mpeg',
              canPlay: true,
              instructions: 'Direct shared link',
            });
          } catch (error) {
            console.warn('❌ Failed to process audio URL:', error);
          }
        }
      }

      // OneDrive/SharePoint share links
      const shareRegex =
        /https:\/\/[^/]*1drv\.ms\/[^\s<>"]+|https:\/\/[^/]*sharepoint\.com\/[^\s<>"]+/gi;
      const shareMatches = messageContent.match(shareRegex);

      if (shareMatches) {
        console.log(
          `🔗 Found ${shareMatches.length} OneDrive/SharePoint links`
        );
        // These could be converted to direct download links with additional processing
      }
    } catch (error) {
      console.error('❌ Failed to extract shared audio files:', error);
    }

    return audioFiles;
  }

  getChatTitle(chat) {
    if (chat.topic) return chat.topic;
    if (chat.chatType === 'oneOnOne') return 'One-on-One Chat';
    if (chat.chatType === 'group') return 'Group Chat';
    return 'Unknown Chat';
  }

  isAudioFile(file) {
    if (!file) return false;

    if (file.contentType) {
      const isAudioMime = this.audioMimeTypes.some((type) =>
        file.contentType.toLowerCase().startsWith(type)
      );
      if (isAudioMime) return true;
    }

    if (file.name) {
      const extension = file.name.toLowerCase();
      const isAudioExt = this.audioExtensions.some((ext) =>
        extension.endsWith(ext)
      );
      if (isAudioExt) return true;
    }

    return false;
  }

  async testEnhancedAccess() {
    try {
      console.log('🧪 Testing enhanced Graph API access...');

      // Test basic access
      const me = await this.graphClient.api('/me').get();
      console.log('✅ Profile access:', me.displayName);

      // Test OneDrive access
      try {
        const drive = await this.graphClient.api('/me/drive').get();
        console.log('✅ OneDrive access:', drive.driveType);

        // Test search
        const searchResults = await this.graphClient
          .api("/me/drive/root/search(q='.mp3')")
          .top(3)
          .get();
        console.log(
          '✅ Drive search works:',
          searchResults.value.length,
          'results'
        );
      } catch (driveError) {
        console.warn('⚠️ OneDrive access limited:', driveError.message);
      }

      // Test Sites access
      try {
        const sites = await this.graphClient.api('/sites').top(3).get();
        console.log('✅ Sites access:', sites.value.length, 'sites');
      } catch (sitesError) {
        console.warn('⚠️ Sites access limited:', sitesError.message);
      }

      // Test recent files
      try {
        const recent = await this.graphClient
          .api('/me/drive/recent')
          .top(5)
          .get();
        console.log('✅ Recent files access:', recent.value.length, 'files');
      } catch (recentError) {
        console.warn('⚠️ Recent files access limited:', recentError.message);
      }

      return true;
    } catch (error) {
      console.error('❌ Enhanced access test failed:', error);
      return false;
    }
  }
}

export default AudioService;
