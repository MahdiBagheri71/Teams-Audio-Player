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

      // Format chat objects
      const formattedChats = chats.value.map((chat) => ({
        id: chat.id,
        title: this.getChatTitle(chat),
        type: chat.chatType,
        lastUpdated: new Date(chat.lastUpdatedDateTime),
        hasAudio: null, // Will be checked later if needed
      }));

      return formattedChats;
    } catch (error) {
      console.error('❌ Failed to fetch chats:', error);
      throw new Error(`Failed to load chats: ${error.message}`);
    }
  }

  // گرفتن فایل‌های یک چت مشخص
  async getChatAudioFiles(chatId, chatTitle) {
    const audioFiles = [];

    try {
      console.log(`📨 Getting audio files from chat: ${chatTitle}`);

      // Get messages from specific chat
      const messages = await this.graphClient
        .api(`/chats/${chatId}/messages`)
        .top(50)
        .orderby('createdDateTime desc')
        .get();

      console.log(`📝 Found ${messages.value.length} messages in chat`);

      let totalAttachments = 0;
      let audioAttachments = 0;

      // Process each message
      for (const message of messages.value) {
        try {
          // Check attachments
          if (message.attachments && message.attachments.length > 0) {
            totalAttachments += message.attachments.length;
            console.log(
              `📎 Message has ${message.attachments.length} attachments`
            );

            // Filter audio attachments
            const audioFiles_inMessage = message.attachments.filter(
              (attachment) => {
                const isAudio = this.isAudioFile(attachment);
                if (isAudio) {
                  audioAttachments++;
                  console.log(`🎵 Found audio: ${attachment.name}`);
                }
                return isAudio;
              }
            );

            // Create audio file objects
            for (const attachment of audioFiles_inMessage) {
              const audioFile = this.createDisplayAudioFile(
                attachment,
                message,
                { title: chatTitle }
              );
              if (audioFile) {
                audioFiles.push(audioFile);
              }
            }
          }

          // Check for shared audio links in message body
          if (message.body && message.body.content) {
            const sharedFiles = this.extractSharedAudioFiles(
              message.body.content,
              message,
              { title: chatTitle }
            );
            if (sharedFiles.length > 0) {
              audioFiles.push(...sharedFiles);
              console.log(`🔗 Found ${sharedFiles.length} shared links`);
            }
          }
        } catch (messageError) {
          console.warn(`❌ Failed to process message:`, messageError);
        }
      }

      console.log(
        `📊 Chat summary - Total attachments: ${totalAttachments}, Audio files: ${audioAttachments}`
      );
      console.log(`✅ Found ${audioFiles.length} total audio files in chat`);

      // Sort by date (newest first)
      return audioFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error(`❌ Failed to get audio files from chat ${chatId}:`, error);
      throw new Error(`Failed to load audio files: ${error.message}`);
    }
  }

  // Quick scan to see if chat has audio files
  async quickScanChatForAudio(chatId) {
    try {
      const messages = await this.graphClient
        .api(`/chats/${chatId}/messages`)
        .top(50)
        .get();

      let hasAudio = false;
      for (const message of messages.value) {
        if (message.attachments && message.attachments.length > 0) {
          const audioFiles = message.attachments.filter((att) =>
            this.isAudioFile(att)
          );
          if (audioFiles.length > 0) {
            hasAudio = true;
            break;
          }
        }

        // Check for audio links
        if (message.body && message.body.content) {
          const urlRegex =
            /https:\/\/[^\s<>"]+\.(mp3|wav|m4a|aac|ogg|wma|flac)(\?[^\s<>"]*)?/gi;
          if (message.body.content.match(urlRegex)) {
            hasAudio = true;
            break;
          }
        }
      }

      return hasAudio;
    } catch (error) {
      console.warn(`⚠️ Could not scan chat ${chatId} for audio`);
      return false;
    }
  }

  getChatTitle(chat) {
    if (chat.topic) {
      return chat.topic;
    }

    if (chat.chatType === 'oneOnOne') {
      return 'One-on-One Chat';
    }

    if (chat.chatType === 'group') {
      return 'Group Chat';
    }

    return 'Unknown Chat';
  }

  createDisplayAudioFile(attachment, message, chat) {
    try {
      const audioFile = {
        id: attachment.id || `${message.id}_${Date.now()}`,
        name: attachment.name || 'Unknown Audio',
        downloadUrl: null, // Teams attachments aren't directly accessible
        webUrl: message.webUrl, // Link to Teams message
        size: attachment.size || 0,
        source: 'teams_chat',
        location: chat.title,
        sender: message.from?.user?.displayName || 'Unknown',
        date: new Date(message.createdDateTime),
        duration: null,
        type: attachment.contentType || 'audio/mpeg',
        canPlay: false, // Can't play Teams attachments directly
        teamsMessageUrl: message.webUrl,
        instructions: 'Click to open in Teams and download',
      };

      return audioFile;
    } catch (error) {
      console.error('❌ Failed to create display audio file:', error);
      return null;
    }
  }

  extractSharedAudioFiles(messageContent, message, chat) {
    const audioFiles = [];

    try {
      // Look for direct audio URLs
      const urlRegex =
        /https:\/\/[^\s<>"]+\.(mp3|wav|m4a|aac|ogg|wma|flac)(\?[^\s<>"]*)?/gi;
      const matches = messageContent.match(urlRegex);

      if (matches) {
        console.log(`🔗 Found ${matches.length} direct audio URLs`);

        for (const url of matches) {
          try {
            const filename = decodeURIComponent(
              url.split('/').pop().split('?')[0]
            );

            const audioFile = {
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
              instructions: 'Direct link - may require permissions',
            };

            audioFiles.push(audioFile);
          } catch (error) {
            console.warn('❌ Failed to process audio URL:', error);
          }
        }
      }

      // Look for OneDrive/SharePoint share links
      const shareRegex =
        /https:\/\/[^\/]*1drv\.ms\/[^\s<>"]+|https:\/\/[^\/]*sharepoint\.com\/[^\s<>"]+/gi;
      const shareMatches = messageContent.match(shareRegex);

      if (shareMatches) {
        console.log(
          `🔗 Found ${shareMatches.length} share links (may contain audio)`
        );
      }
    } catch (error) {
      console.error('❌ Failed to extract shared audio files:', error);
    }

    return audioFiles;
  }

  isAudioFile(file) {
    if (!file) return false;

    // Check by MIME type
    if (file.contentType) {
      const isAudioMime = this.audioMimeTypes.some((type) =>
        file.contentType.toLowerCase().startsWith(type)
      );
      if (isAudioMime) return true;
    }

    // Check by file extension
    if (file.name) {
      const extension = file.name.toLowerCase();
      const isAudioExt = this.audioExtensions.some((ext) =>
        extension.endsWith(ext)
      );
      if (isAudioExt) return true;
    }

    return false;
  }

  // Test basic access
  async testBasicAccess() {
    try {
      console.log('🧪 Testing basic Graph API access...');

      const me = await this.graphClient.api('/me').get();
      console.log('✅ Profile access:', me.displayName);

      const chats = await this.graphClient.api('/me/chats').top(3).get();
      console.log('✅ Chats access:', chats.value.length, 'chats');

      if (chats.value.length > 0) {
        const firstChat = chats.value[0];
        const messages = await this.graphClient
          .api(`/chats/${firstChat.id}/messages`)
          .top(50)
          .get();
        console.log('✅ Messages access:', messages.value.length, 'messages');
      }

      return true;
    } catch (error) {
      console.error('❌ Basic access test failed:', error);
      return false;
    }
  }
}

export default AudioService;
