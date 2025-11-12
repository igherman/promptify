# Promptify Chrome Extension

A simple Chrome extension that allows you to query local Ollama LLM instances directly from your browser.

## Purpose

This extension provides a convenient interface to interact with your locally running Ollama language models without leaving your browser. You can send prompts, use selected text from web pages, and get AI responses through a clean popup interface.

## Files Overview

### Core Extension Files

- **`manifest.json`** - Extension manifest (Manifest V3) defining permissions, popup, background worker, and options page
- **`background.js`** - Service worker that handles API communication with Ollama server
- **`popup.html`** - Main popup interface HTML structure
- **`popup.css`** - Styling for the popup interface
- **`popup.js`** - Popup logic, form handling, and communication with background worker
- **`content.js`** - Content script for extracting selected text from web pages
- **`options.html`** - Options page for configuring Ollama host and default model
- **`options.js`** - Options page logic and settings persistence

### Key Features

- **Popup Interface**: Send prompts to Ollama with customizable model selection
- **Text Selection**: Use selected text from web pages as prompts
- **Settings**: Configure Ollama host URL and default model
- **Connection Testing**: Test connectivity to your Ollama instance
- **Error Handling**: Clear error messages and loading states

## Installation

### Load as Unpacked Extension

1. **Open Extension Management Page**
   - Go to `chrome://extensions/` in Chrome
   - Or `edge://extensions/` in Microsoft Edge

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the project folder containing `manifest.json`
   - The extension should appear in your extensions list

## Setup Ollama

### Start Ollama Server

1. **Install Ollama** (if not already installed)
   - Visit [ollama.ai](https://ollama.ai) for installation instructions

2. **Start the Ollama Server**
   ```bash
   ollama serve
   ```

3. **Verify Default Configuration**
   - Ollama binds to `127.0.0.1:11434` by default
   - The extension is pre-configured to use this address
   - See [Ollama documentation](https://github.com/ollama/ollama/blob/main/docs/api.md) for more details

4. **Pull a Model** (if needed)
   ```bash
   ollama pull llama3.2
   ```

## Permissions

The extension requires the following permissions:

- **`storage`** - Save user preferences (model, host settings)
- **`activeTab`** - Access selected text from web pages
- **`scripting`** - Inject content script to get text selection
- **`host_permissions`** - Access local Ollama API at:
  - `http://127.0.0.1:11434/*`
  - `http://localhost:11434/*`

## Usage

1. **Open the Extension**
   - Click the extension icon in your browser toolbar

2. **Configure Settings** (Optional)
   - Click the gear icon to open options
   - Set custom Ollama host URL if different from default
   - Set preferred default model name
   - Test connection to verify setup

3. **Send Prompts**
   - Enter your prompt in the text area
   - Select or confirm the model name
   - Click "Send" to get AI response

4. **Use Selected Text**
   - Select text on any webpage
   - Click "Use Selection" in the popup to use it as a prompt

## Troubleshooting

### Ollama Not Reachable

1. **Check Ollama Server Status**
   ```bash
   # Verify Ollama is running
   curl http://127.0.0.1:11434/api/tags
   ```

2. **Verify Host Configuration**
   - Open extension options (gear icon)
   - Ensure host URL matches your Ollama server address
   - Use "Test Connection" button to verify connectivity

3. **Check Console Logs**
   - Open Chrome DevTools (`F12`)
   - Go to Extensions tab → Service Worker → Inspect
   - Check console for detailed error messages

### Common Issues

- **"Failed to connect"** - Ollama server not running or wrong host/port
- **"Model not found"** - Specified model not available, check with `ollama list`
- **Permission errors** - Ensure extension has required permissions enabled

### Debug Steps

1. Verify Ollama is accessible: `curl http://127.0.0.1:11434/api/tags`
2. Check extension permissions in `chrome://extensions/`
3. Review background service worker logs for detailed errors
4. Test with a simple model like `llama3.2` first

## Development

To modify or extend the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

For debugging, use the browser's developer tools to inspect the popup, options page, and background service worker separately.
