// Background service worker for Ollama Chrome extension
console.log('Promptify background service worker loaded');

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'OLLAMA_QUERY') {
    handleOllamaQuery(message.payload)
      .then(response => {
        console.log('Ollama query successful:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Ollama query failed:', error);
        sendResponse({ ok: false, error: error.message });
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
  
  const enhancedPrompt =  'Act as a professional prompt engineer. Improve the following user prompt for use with an AI language model:\n"' + prompt
   + '".\nReturn an enhanced prompt, without any additional commentary. Structure the prompt to get the best possible results.';
  console.log('Request payload:', { model, enhancedPrompt });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      
      body: JSON.stringify({
        model: model,
        prompt: enhancedPrompt,
        stream: false // Disable streaming for simpler response handling
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Ollama API response:', data);
    
    // Extract the response text from Ollama's response format
    const responseText = data.response || data.text || 'No response text available';
    
    return {
      ok: true,
      text: responseText
    };
    
  } catch (error) {
    console.error('Network error or API error:', error);
    
    // Provide more specific error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Failed to connect to Ollama API. Make sure Ollama is running locally.');
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

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Promptify installed:', details.reason);
});