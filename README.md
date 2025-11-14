# Promptify Chrome Extension

A Chrome extension for prompt engineering with support for multiple LLM providers including local Ollama, OpenAI, Anthropic (Claude), and OpenRouter.

## Purpose

This extension provides a convenient interface to interact with various language models directly from your browser. You can send prompts, use selected text from web pages, and get AI-powered prompt improvements through a clean popup interface.

## Features

- **🤖 Multiple LLM Providers**: Support for Ollama (local), OpenAI, Anthropic, and OpenRouter
- **🔧 Configurable**: Easy-to-use options page for provider setup and API keys
- **✨ Prompt Engineering**: Automatically improves your prompts for better AI responses
- **📝 Text Selection**: Use selected text from web pages as prompts
- **🔒 Secure**: API keys stored locally in Chrome storage
- **⚡ Smart Button**: Floating AI button appears near text inputs
- **🧪 Connection Testing**: Verify provider connectivity before use

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

- **Popup Interface**: Send prompts to your configured LLM with customizable model selection
- **Multiple Providers**: Choose between local Ollama or cloud-based services (OpenAI, Anthropic, OpenRouter)
- **Text Selection**: Use selected text from web pages as prompts
- **Smart Text Insertion**: AI-enhanced prompts can be inserted directly into text inputs on any webpage
- **Floating Button**: Context-aware AI button appears when you focus on text inputs
- **Settings**: Configure provider, API keys, models, and connection settings
- **Connection Testing**: Test connectivity to your chosen provider
- **Error Handling**: Clear error messages and loading states
- **Service Worker Keepalive**: Ensures reliable background processing

## Quick Start

### 1. Install the Extension

1. **Open Extension Management Page**
   - Go to `chrome://extensions/` in Chrome
   - Or `edge://extensions/` in Microsoft Edge

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the project folder containing `manifest.json`
   - The extension should appear in your extensions list

### 2. Configure Your LLM Provider

Choose one of the following options:

#### Option A: Use Local Ollama (Free, Private)

1. **Install Ollama** (if not already installed)
   
   **macOS:**
   - Download the installer from [ollama.ai](https://ollama.ai)
   - Open the downloaded `.dmg` file and drag Ollama to Applications
   - Or install via Homebrew: `brew install ollama`
   
   **Linux:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```
   
   **Windows:**
   - Download the installer from [ollama.ai](https://ollama.ai)
   - Run the downloaded `.exe` file and follow the installation wizard
   - Or use Windows Subsystem for Linux (WSL) and follow Linux instructions

2. **Start the Ollama Server**
   ```bash
   ollama serve
   ```

3. **Pull a Model**
   ```bash
   ollama pull llama3.1
   ```

4. **Configure Extension**
   - Click the extension icon → Options
   - Select "Ollama (Local)" as provider
   - Host URL: `http://127.0.0.1:11434` (default)
   - Model: `llama3.1` (or your preferred model)
   - Click "Test Connection" to verify
   - Click "Save Settings"

#### Option B: Use OpenAI (Requires API Key)

1. **Get API Key**
   - Visit [platform.openai.com](https://platform.openai.com/api-keys)
   - Create a new API key

2. **Configure Extension**
   - Click the extension icon → Options
   - Select "OpenAI" as provider
   - Enter your API key
   - Model: `gpt-4` or `gpt-3.5-turbo`
   - Click "Test Connection" to verify
   - Click "Save Settings"

#### Option C: Use Anthropic Claude (Requires API Key)

1. **Get API Key**
   - Visit [console.anthropic.com](https://console.anthropic.com/)
   - Create a new API key

2. **Configure Extension**
   - Click the extension icon → Options
   - Select "Anthropic (Claude)" as provider
   - Enter your API key
   - Model: `claude-3-opus-20240229` or `claude-3-sonnet-20240229`
   - Click "Test Connection" to verify
   - Click "Save Settings"

#### Option D: Use OpenRouter (Requires API Key)

1. **Get API Key**
   - Visit [openrouter.ai/keys](https://openrouter.ai/keys)
   - Create a new API key

2. **Configure Extension**
   - Click the extension icon → Options
   - Select "OpenRouter" as provider
   - Enter your API key
   - Model: `openai/gpt-4` or any supported model
   - Click "Test Connection" to verify
   - Click "Save Settings"

### 3. Start Using Promptify

#### Method 1: Floating AI Button
1. Click on any text input field on a webpage
2. A floating AI button will appear near the input
3. Click the button and enter your prompt idea
4. The AI will generate an improved prompt and insert it into the field

#### Method 2: Extension Popup
1. Click the extension icon in your browser toolbar
2. Enter your prompt in the text area
3. Click "Send" to get an AI-enhanced version

For detailed provider comparison and configuration options, see [LLM_PROVIDERS.md](./LLM_PROVIDERS.md).

## Permissions

The extension requires the following permissions:

- **`storage`** - Save user preferences (provider, API keys, model settings)
- **`activeTab`** - Access selected text from web pages
- **`scripting`** - Inject content script to enable floating AI button
- **`host_permissions`** - Access LLM APIs:
  - Local Ollama: `http://127.0.0.1/*`, `http://localhost/*`
  - OpenAI: `https://api.openai.com/*`
  - Anthropic: `https://api.anthropic.com/*`
  - OpenRouter: `https://openrouter.ai/*`

## Usage

### Floating AI Button (Main Feature)

1. **Navigate to any webpage** with text inputs (forms, search bars, comment fields, etc.)
2. **Click on a text input field** to focus it
3. **A floating AI button** (✨) will appear near the top-right of the input
4. **Click the AI button** to open a prompt dialog
5. **Enter your prompt idea** (what you want to write about)
6. **Wait for processing** - the AI will enhance your prompt
7. **The improved prompt** will be automatically inserted into the input field

### Extension Popup

1. **Open the Extension**
   - Click the extension icon in your browser toolbar

2. **Configure Settings** (if needed)
   - Click the gear icon to open options
   - Select your LLM provider
   - Enter required credentials (API key for cloud providers)
   - Test connection to verify setup

3. **Send Prompts**
   - Enter your prompt in the text area
   - The configured provider and model will be used
   - Click "Send" to get AI response

4. **Use Selected Text**
   - Select text on any webpage
   - Click "Use Selection" in the popup to use it as a prompt

## Troubleshooting

### Connection Test Fails

#### For Ollama:
1. **Check Ollama Server Status**
   ```bash
   # Verify Ollama is running
   curl http://127.0.0.1:11434/api/tags
   ```

2. **Start Ollama if needed**
   ```bash
   ollama serve
   ```

3. **Verify Host Configuration**
   - Open extension options (gear icon)
   - Ensure host URL is `http://127.0.0.1:11434`
   - Use "Test Connection" button to verify

#### For Cloud Providers (OpenAI, Anthropic, OpenRouter):
1. **Verify API Key**
   - Check for typos or extra spaces
   - Ensure the key is active and not expired
   - Check your account has credits/billing enabled

2. **Check Model Name**
   - Verify the model name is correct for your provider
   - OpenAI: `gpt-4`, `gpt-3.5-turbo`
   - Anthropic: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`
   - OpenRouter: Use format `provider/model` (e.g., `openai/gpt-4`)

3. **Test API Directly**
   ```bash
   # OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   
   # Anthropic
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_API_KEY" \
     -H "anthropic-version: 2023-06-01"
   ```

### Floating Button Not Appearing

1. **Check Extension is Enabled**
   - Go to `chrome://extensions/`
   - Verify Promptify is enabled

2. **Reload the Extension**
   - Go to `chrome://extensions/`
   - Click reload button on Promptify

3. **Refresh the Webpage**
   - The content script only loads on new page loads
   - Try refreshing the page (F5)

4. **Check Input Field Type**
   - The button only appears on text inputs, textareas, and contenteditable elements
   - Some websites may block the button with strict CSP policies

### No Response from API

1. **Check Browser Console**
   - Press F12 to open DevTools
   - Check Console tab for error messages
   - Look for background service worker errors

2. **Verify Provider Settings**
   - Open Options page
   - Verify all required fields are filled
   - Run "Test Connection"

3. **Check Internet Connection** (for cloud providers)
   - Cloud APIs require active internet
   - Check firewall/proxy settings

### Slow Responses

#### For Ollama:
- Use a smaller/faster model (e.g., `llama3.1:8b` instead of `llama3.1:70b`)
- Check CPU/GPU usage on your machine
- Consider switching to a cloud provider for faster responses

#### For Cloud APIs:
- Check your internet connection speed
- The API provider may be experiencing high load
- Try a different model (e.g., `gpt-3.5-turbo` is faster than `gpt-4`)

### Common Error Messages

- **"Failed to connect to API"** - Check provider is running/accessible
- **"Invalid API key"** - Verify your API key is correct
- **"Model not found"** - Check model name is valid for your provider
- **"Extension context invalidated"** - Reload the extension
- **"Rate limit exceeded"** - You've hit API rate limits, wait or upgrade plan

## Development

To modify or extend the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

For debugging, use the browser's developer tools to inspect the popup, options page, and background service worker separately.
