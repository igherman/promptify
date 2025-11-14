// Background service worker for Ollama Chrome extension
console.log('Promptify background service worker loaded');

// Heartbeat to keep service worker alive
setInterval(() => {
  console.log('[Background] Heartbeat - service worker is alive');
}, 25000);

// Keep service worker alive during long-running operations
let keepAliveInterval = null;

function startKeepAlive() {
  if (keepAliveInterval) return;
  
  console.log('[Background] Starting keep-alive for long operation');
  keepAliveInterval = setInterval(() => {
    console.log('[Background] Keep-alive ping during operation');
  }, 5000); // Ping every 5 seconds during operation
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    console.log('[Background] Stopping keep-alive');
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);
  console.log('[Background] Full message:', message);
  
  if (message.type === 'OLLAMA_QUERY') {
    console.log('[Background] Processing OLLAMA_QUERY');
    startKeepAlive(); // Prevent service worker from sleeping
    
    handleLLMQuery(message.payload)
      .then(response => {
        console.log('[Background] LLM query successful:', response);
        sendResponse(response);
        stopKeepAlive();
      })
      .catch(error => {
        console.error('[Background] LLM query failed:', error);
        sendResponse({ ok: false, error: error.message });
        stopKeepAlive();
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  if (message.type === 'OLLAMA_TEST') {
    handleOllamaTest(message.payload)
      .then(response => {
        console.log('Ollama test successful:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Ollama test failed:', error);
        sendResponse({ ok: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  if (message.type === 'API_TEST') {
    handleAPITest(message.payload)
      .then(response => {
        console.log('API test successful:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('API test failed:', error);
        sendResponse({ ok: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  if (message.type === 'TEXT_INPUT_FOCUS') {
    const { focused } = message.payload;
    
    if (focused) {
      // User is typing in a text input
      // You could show a badge or notification
      //chrome.action.setBadgeText({ text: "✏️" });
      chrome.action.setBadgeBackgroundColor({ color: "#1a73e8" });
    } else {
      // User left text input
      chrome.action.setBadgeText({ text: "" });
    }
    
    console.log('Text input focus changed:', focused);
  }
});

// Create enhanced prompt for prompt engineering
function createEnhancedPrompt(prompt) {
  return 'Act as a professional prompt engineer. Improve the following user prompt for use with an AI language model:\n"' + prompt
    + '".\nReturn an enhanced prompt, without any additional commentary. Structure the prompt to get the best possible results.';
}

// Handle LLM query - routes to appropriate provider
async function handleLLMQuery(payload) {
  const { prompt, model, host } = payload;
  
  // Get settings to determine provider
  const storage = chrome.storage.sync || chrome.storage.local;
  const settings = await storage.get([
    'llmProvider',
    'ollamaHost',
    'defaultModel',
    'apiKey',
    'apiModel',
    'apiBaseUrl'
  ]);
  
  const provider = settings.llmProvider || 'ollama';
  
  console.log(`[Background] Using provider: ${provider}`);
  
  if (provider === 'ollama') {
    return handleOllamaQuery({
      prompt,
      model: model || settings.defaultModel,
      host: host || settings.ollamaHost
    });
  } else {
    return handleCloudAPIQuery({
      prompt,
      provider,
      apiKey: settings.apiKey,
      apiModel: settings.apiModel,
      apiBaseUrl: settings.apiBaseUrl
    });
  }
}

// Handle Ollama API query
async function handleOllamaQuery(payload) {
  const { prompt, model, host } = payload;
  
  // Validate required fields
  if (!prompt || !model) {
    throw new Error('Missing required fields: prompt and model are required');
  }
  
  const apiHost = host || 'http://localhost:11434';
  const apiUrl = `${apiHost}/api/generate`;
  
  console.log(`Making Ollama API request to: ${apiUrl}`);
  
  const enhancedPrompt = createEnhancedPrompt(prompt);
  console.log('Request payload:', { model, enhancedPrompt });

  try {
    console.log('Sending fetch request to Ollama...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      keepalive: true,
      body: JSON.stringify({
        model: model,
        prompt: enhancedPrompt,
        stream: false // Disable streaming for simpler response handling
      })
    });
    
    clearTimeout(timeoutId);
    console.log('Received response from Ollama, status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    console.log('Parsing JSON response...');
    const data = await response.json();
    console.log('Ollama API response received, length:', data.response?.length || 0);
    
    // Extract the response text from Ollama's response format
    const responseText = data.response || data.text || 'No response text available';
    
    return {
      ok: true,
      text: responseText
    };
    
  } catch (error) {
    console.error('Network error or API error:', error);
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 2 minutes. The model might be too slow or unavailable.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Failed to connect to Ollama API. Make sure Ollama is running locally.');
    }
    
    throw error;
  }
}

// Handle Cloud API query (OpenAI, Anthropic, etc.)
async function handleCloudAPIQuery(payload) {
  const { prompt, provider, apiKey, apiModel, apiBaseUrl } = payload;
  
  // Validate required fields
  if (!prompt || !apiKey || !apiModel) {
    throw new Error('Missing required fields: prompt, apiKey, and apiModel are required');
  }
  
  const enhancedPrompt = createEnhancedPrompt(prompt);
  
  console.log(`Making ${provider} API request`);
  
  try {
    if (provider === 'openai' || provider === 'openrouter') {
      return await handleOpenAICompatibleAPI({
        prompt: enhancedPrompt,
        apiKey,
        apiModel,
        apiBaseUrl: apiBaseUrl || (provider === 'openai' ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1')
      });
    } else if (provider === 'anthropic') {
      return await handleAnthropicAPI({
        prompt: enhancedPrompt,
        apiKey,
        apiModel,
        apiBaseUrl: apiBaseUrl || 'https://api.anthropic.com/v1'
      });
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`${provider} API error:`, error);
    throw error;
  }
}

// Handle OpenAI-compatible API
async function handleOpenAICompatibleAPI({ prompt, apiKey, apiModel, apiBaseUrl }) {
  const apiUrl = `${apiBaseUrl}/chat/completions`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || 'No response text available';
    
    return {
      ok: true,
      text: responseText
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 2 minutes');
    }
    
    throw error;
  }
}

// Handle Anthropic API
async function handleAnthropicAPI({ prompt, apiKey, apiModel, apiBaseUrl }) {
  const apiUrl = `${apiBaseUrl}/messages`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: apiModel,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = data.content?.[0]?.text || 'No response text available';
    
    return {
      ok: true,
      text: responseText
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 2 minutes');
    }
    
    throw error;
  }
}

// Handle Ollama connection test
async function handleOllamaTest(payload) {
  const { host } = payload;
  
  const apiHost = host || 'http://127.0.0.1:11434';
  const testUrl = `${apiHost}/api/tags`; // Lightweight endpoint that lists available models
  
  console.log(`Testing Ollama connection to: ${testUrl}`);
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    // Try to parse JSON to ensure it's a valid Ollama response
    const data = await response.json();
    console.log('Ollama test response:', data);
    
    return {
      ok: true
    };
    
  } catch (error) {
    console.error('Ollama connection test failed:', error);
    
    // Provide more specific error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Failed to connect to Ollama. Make sure Ollama is running and accessible.');
    }
    
    if (error.message.includes('HTTP error')) {
      throw new Error(`Ollama server responded with an error: ${error.message}`);
    }
    
    throw new Error(`Connection test failed: ${error.message}`);
  }
}

// Handle API connection test for cloud providers
async function handleAPITest(payload) {
  const { provider, apiKey, apiModel, apiBaseUrl } = payload;
  
  console.log(`Testing ${provider} API connection`);
  
  try {
    if (provider === 'openai' || provider === 'openrouter') {
      const baseUrl = apiBaseUrl || (provider === 'openai' ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1');
      const testUrl = `${baseUrl}/models`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }
      
      return { ok: true };
      
    } else if (provider === 'anthropic') {
      // Anthropic doesn't have a simple test endpoint, so we make a minimal request
      const baseUrl = apiBaseUrl || 'https://api.anthropic.com/v1';
      const testUrl = `${baseUrl}/messages`;
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: apiModel,
          max_tokens: 1,
          messages: [
            {
              role: 'user',
              content: 'test'
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }
      
      return { ok: true };
      
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
  } catch (error) {
    console.error(`${provider} API test failed:`, error);
    throw error;
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Promptify installed:', details.reason);
});

// Add connection handler to wake up service worker
chrome.runtime.onConnect.addListener((port) => {
  console.log('[Background] Port connected:', port.name);
});

// Ensure service worker starts up
console.log('[Background] Service worker initialization complete');