# API Documentation

This document describes the Microsoft Graph API endpoints used by Teams Audio Player and how the application interacts with them.

## Authentication

Teams Audio Player uses Microsoft Authentication Library (MSAL) for OAuth 2.0 authentication with Azure AD.

### Required Scopes

```javascript
const scopes = [
  'User.Read', // Read user profile
  'Chat.Read', // Read Teams chat messages
  'Files.Read', // Read files shared with user
];
```

## API Endpoints

### 1. Get User Profile

```http
GET https://graph.microsoft.com/v1.0/me
```

**Response:**

```json
{
  "id": "user-id",
  "displayName": "John Doe",
  "mail": "john.doe@company.com"
}
```

### 2. Get User Chats

```http
GET https://graph.microsoft.com/v1.0/me/chats
```

**Query Parameters:**

- `$select`: id,topic,chatType,createdDateTime,lastUpdatedDateTime
- `$top`: 50 (maximum chats to retrieve)
- `$orderby`: lastUpdatedDateTime desc

**Response:**

```json
{
  "@odata.context": "...",
  "value": [
    {
      "id": "chat-id",
      "topic": "Project Discussion",
      "chatType": "group",
      "createdDateTime": "2024-01-01T10:00:00Z",
      "lastUpdatedDateTime": "2024-01-15T15:30:00Z"
    }
  ]
}
```

### 3. Get Chat Messages

```http
GET https://graph.microsoft.com/v1.0/chats/{chat-id}/messages
```

**Query Parameters:**

- `$select`: id,createdDateTime,body,attachments,from
- `$expand`: attachments
- `$top`: 50
- `$orderby`: createdDateTime desc

**Response:**

```json
{
  "value": [
    {
      "id": "message-id",
      "createdDateTime": "2024-01-15T14:00:00Z",
      "from": {
        "user": {
          "displayName": "Jane Smith"
        }
      },
      "attachments": [
        {
          "id": "attachment-id",
          "contentType": "audio/mpeg",
          "name": "recording.mp3",
          "contentUrl": "https://..."
        }
      ]
    }
  ]
}
```

### 4. Get Drive Item (Audio File)

```http
GET https://graph.microsoft.com/v1.0/drives/{drive-id}/items/{item-id}
```

**Query Parameters:**

- `$select`: id,name,size,@microsoft.graph.downloadUrl,audio

**Response:**

```json
{
  "id": "item-id",
  "name": "audio-file.mp3",
  "size": 5242880,
  "@microsoft.graph.downloadUrl": "https://...",
  "audio": {
    "duration": 180000,
    "bitrate": 320000
  }
}
```

### 5. Get Audio Stream

```http
GET https://graph.microsoft.com/v1.0/drives/{drive-id}/items/{item-id}/content
```

**Headers:**

```
Authorization: Bearer {access-token}
Range: bytes=0-1048575
```

**Response:**

- Binary audio data stream
- Status: 206 Partial Content (for range requests)

## Error Handling

### Common Error Responses

#### 401 Unauthorized

```json
{
  "error": {
    "code": "InvalidAuthenticationToken",
    "message": "Access token is missing or invalid"
  }
}
```

#### 403 Forbidden

```json
{
  "error": {
    "code": "AccessDenied",
    "message": "Insufficient privileges to complete the operation"
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "itemNotFound",
    "message": "The resource could not be found"
  }
}
```

#### 429 Too Many Requests

```json
{
  "error": {
    "code": "TooManyRequests",
    "message": "Too many requests",
    "retry-after": 60
  }
}
```

## Rate Limiting

Microsoft Graph API has the following rate limits:

- **Per app across all tenants**: 2000 requests per second
- **Per app per tenant**: 50 requests per second
- **Throttling threshold**: Varies by endpoint

### Best Practices

1. **Implement exponential backoff** for retry logic
2. **Cache responses** when appropriate
3. **Use batch requests** for multiple operations
4. **Respect Retry-After headers**

## Code Examples

### Initialize Graph Client

```javascript
import { Client } from '@microsoft/microsoft-graph-client';

const graphClient = Client.init({
  authProvider: (done) => {
    getAccessToken()
      .then((token) => done(null, token))
      .catch((error) => done(error, null));
  },
});
```

### Fetch User Chats

```javascript
async getUserChats() {
  try {
    const response = await graphClient
      .api('/me/chats')
      .select('id,topic,chatType,createdDateTime,lastUpdatedDateTime')
      .top(50)
      .orderby('lastUpdatedDateTime desc')
      .get();

    return response.value;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
}
```

### Get Audio Files from Chat

```javascript
async getChatAudioFiles(chatId) {
  const messages = await graphClient
    .api(`/chats/${chatId}/messages`)
    .expand('attachments')
    .top(50)
    .get();

  const audioFiles = [];

  for (const message of messages.value) {
    if (message.attachments) {
      const audioAttachments = message.attachments.filter(att =>
        att.contentType?.startsWith('audio/')
      );
      audioFiles.push(...audioAttachments);
    }
  }

  return audioFiles;
}
```

### Stream Audio File

```javascript
async getAudioStream(driveId, itemId) {
  const response = await graphClient
    .api(`/drives/${driveId}/items/${itemId}/content`)
    .getStream();

  return response;
}
```

## Security Considerations

1. **Token Storage**: Access tokens are stored in session storage only
2. **Token Refresh**: Tokens are automatically refreshed by MSAL
3. **Scope Limitation**: Request only necessary scopes
4. **CORS**: Ensure proper CORS configuration for API calls
5. **Content Security**: Validate all content before playback

## Troubleshooting

### Common Issues

1. **"Access Denied" errors**

   - Verify all required permissions are granted in Azure AD
   - Ensure admin consent is provided if required

2. **Audio files not loading**

   - Check if the file URL is accessible
   - Verify the content type is supported
   - Ensure proper authentication headers are sent

3. **Performance issues**
   - Implement pagination for large datasets
   - Cache frequently accessed data
   - Use selective field queries ($select)

## Additional Resources

- [Microsoft Graph API Reference](https://docs.microsoft.com/en-us/graph/api/overview)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Teams API Documentation](https://docs.microsoft.com/en-us/graph/api/resources/teams-api-overview)
