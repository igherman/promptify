# LLM Provider Configuration Guide

Promptify now supports multiple LLM providers! You can use local Ollama models or cloud-based AI services like OpenAI, Anthropic (Claude), and OpenRouter.

## Supported Providers

### 1. Ollama (Local)
Run AI models locally on your machine.

**Requirements:**
- Ollama installed and running locally
- Download: https://ollama.ai

**Configuration:**
- **Host URL**: `http://127.0.0.1:11434` (default)
- **Model**: Any model you've pulled (e.g., `llama3.1`, `mistral`, `codellama`)

**Advantages:**
- ✅ Free
- ✅ Private (data stays on your machine)
- ✅ No API key required
- ✅ Works offline

**Disadvantages:**
- ⚠️ Requires local installation
- ⚠️ Slower on older hardware
- ⚠️ Uses computer resources

---

### 2. OpenAI
Access GPT models from OpenAI.

**Requirements:**
- OpenAI account
- API key from: https://platform.openai.com/api-keys

**Configuration:**
- **API Key**: Your OpenAI API key (starts with `sk-`)
- **Model**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`, etc.
- **Base URL** (optional): `https://api.openai.com/v1` (default)

**Advantages:**
- ✅ Fast responses
- ✅ High-quality outputs
- ✅ No local setup required

**Disadvantages:**
- ⚠️ Costs money per API call
- ⚠️ Requires internet connection
- ⚠️ Data sent to OpenAI servers

---

### 3. Anthropic (Claude)
Access Claude models from Anthropic.

**Requirements:**
- Anthropic account
- API key from: https://console.anthropic.com/

**Configuration:**
- **API Key**: Your Anthropic API key (starts with `sk-ant-`)
- **Model**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
- **Base URL** (optional): `https://api.anthropic.com/v1` (default)

**Advantages:**
- ✅ Excellent reasoning capabilities
- ✅ Large context windows
- ✅ Strong at following instructions

**Disadvantages:**
- ⚠️ Costs money per API call
- ⚠️ Requires internet connection
- ⚠️ Data sent to Anthropic servers

---

### 4. OpenRouter
Access multiple AI models through a single API.

**Requirements:**
- OpenRouter account
- API key from: https://openrouter.ai/keys

**Configuration:**
- **API Key**: Your OpenRouter API key (starts with `sk-or-`)
- **Model**: Any model from their catalog (e.g., `openai/gpt-4`, `anthropic/claude-3-opus`, `meta-llama/llama-3.1-70b`)
- **Base URL** (optional): `https://openrouter.ai/api/v1` (default)

**Advantages:**
- ✅ Access to many models from one place
- ✅ Competitive pricing
- ✅ Flexible model switching

**Disadvantages:**
- ⚠️ Costs money per API call
- ⚠️ Requires internet connection
- ⚠️ Data sent to third party

---

## Configuration Instructions

1. **Open Extension Options**
   - Click the Promptify icon in Chrome
   - Click "Options" or right-click → "Options"

2. **Select Your Provider**
   - Choose from the dropdown: Ollama, OpenAI, Anthropic, or OpenRouter

3. **Configure Provider Settings**

   **For Ollama:**
   - Enter the Ollama host URL (usually `http://127.0.0.1:11434`)
   - Enter the model name (e.g., `llama3.1`)
   
   **For Cloud Providers (OpenAI, Anthropic, OpenRouter):**
   - Enter your API key
   - Enter the model name
   - (Optional) Enter a custom base URL if using a proxy or custom endpoint

4. **Test Connection**
   - Click "Test Connection" to verify your settings
   - Green checkmark = success!
   - Red error = check your settings

5. **Save Settings**
   - Click "Save Settings" to store your configuration

## Security Notes

- API keys are stored locally in Chrome's storage (sync or local storage)
- Keys are never sent anywhere except to the configured API endpoint
- For maximum security, use local Ollama instead of cloud APIs
- Never share your API keys with anyone
- Regularly rotate your API keys if using cloud providers

## Cost Considerations

### Free Options:
- **Ollama**: Completely free, runs locally

### Paid Options (approximate costs):
- **OpenAI GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- **OpenAI GPT-3.5**: ~$0.0015 per 1K input tokens, ~$0.002 per 1K output tokens
- **Anthropic Claude 3 Opus**: ~$0.015 per 1K input tokens, ~$0.075 per 1K output tokens
- **Anthropic Claude 3 Sonnet**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **OpenRouter**: Varies by model, check https://openrouter.ai/models

**Tip**: Start with a cheaper model (GPT-3.5 or Claude Haiku) for testing!

## Troubleshooting

### Connection Test Fails

**Ollama:**
- Make sure Ollama is running: `ollama serve`
- Check if the port is correct (default: 11434)
- Try accessing http://127.0.0.1:11434/api/tags in your browser

**Cloud APIs:**
- Verify your API key is correct (no extra spaces)
- Check your account has credits/billing enabled
- Ensure the model name is valid for your provider

### No Response from Extension

- Check the browser console for errors (F12 → Console)
- Verify the extension is enabled
- Try reloading the extension: chrome://extensions → Reload

### Slow Responses

**Ollama:**
- Use a smaller/faster model (e.g., `llama3.1:8b` instead of `llama3.1:70b`)
- Check your CPU/GPU usage
- Consider using a cloud API for faster responses

**Cloud APIs:**
- Check your internet connection
- The model might be experiencing high load
- Try a different model

## Model Recommendations

### For Speed:
- Ollama: `llama3.1:8b`, `mistral:7b`
- OpenAI: `gpt-3.5-turbo`
- Anthropic: `claude-3-haiku-20240307`

### For Quality:
- Ollama: `llama3.1:70b`, `mixtral:8x7b`
- OpenAI: `gpt-4-turbo`, `gpt-4`
- Anthropic: `claude-3-opus-20240229`

### For Balance:
- Ollama: `llama3.1:13b`
- OpenAI: `gpt-4-turbo` (faster than gpt-4)
- Anthropic: `claude-3-sonnet-20240229`

## Privacy Comparison

| Provider | Data Location | Privacy Level |
|----------|--------------|---------------|
| Ollama | Your computer | 🔒 Highest |
| OpenAI | OpenAI servers | ⚠️ Medium |
| Anthropic | Anthropic servers | ⚠️ Medium |
| OpenRouter | Third-party servers | ⚠️ Lower |

Choose based on your privacy requirements and use case!
