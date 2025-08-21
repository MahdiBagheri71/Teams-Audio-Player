
#!/bin/sh
# env.sh - Runtime environment variable injection

# Replace environment variables in JavaScript files
envsubst '${REACT_APP_CLIENT_ID} ${REACT_APP_REDIRECT_URI}' < /usr/share/nginx/html/static/js/main.*.js > /tmp/main.js
mv /tmp/main.js /usr/share/nginx/html/static/js/main.*.js

# Log environment setup
echo "Environment variables configured for production"
echo "Client ID: ${REACT_APP_CLIENT_ID}"
echo "Redirect URI: ${REACT_APP_REDIRECT_URI}"
