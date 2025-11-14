/**
 * Chrome Extension Options Page Script
 * Handles settings configuration and persistence
 */

// Default configuration
const DEFAULT_CONFIG = {
  provider: 'ollama',
  host: 'http://127.0.0.1:11434',
  defaultModel: 'llama3.2',
  apiKey: '',
  apiModel: 'gpt-4',
  apiBaseUrl: ''
};

// DOM elements
const elements = {
  form: document.getElementById('optionsForm'),
  providerSelect: document.getElementById('providerSelect'),
  ollamaConfig: document.getElementById('ollamaConfig'),
  apiKeyConfig: document.getElementById('apiKeyConfig'),
  hostInput: document.getElementById('hostInput'),
  defaultModelInput: document.getElementById('defaultModelInput'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  apiModelInput: document.getElementById('apiModelInput'),
  apiBaseUrlInput: document.getElementById('apiBaseUrlInput'),
  saveBtn: document.getElementById('saveBtn'),
  testBtn: document.getElementById('testBtn'),
  statusMessage: document.getElementById('statusMessage'),
  saveBtnText: document.querySelector('#saveBtn .btn-text'),
  saveBtnSpinner: document.querySelector('#saveBtn .spinner'),
  testBtnText: document.querySelector('#testBtn .btn-text'),
  testBtnSpinner: document.querySelector('#testBtn .spinner')
};

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions);

/**
 * Initialize the options page
 */
async function initializeOptions() {
  console.log('Initializing options page...');
  
  // Load existing settings
  await loadSettings();
  
  // Set up event listeners
  setupEventListeners();
  
  console.log('Options page initialized');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  elements.form.addEventListener('submit', handleSaveSettings);
  elements.testBtn.addEventListener('click', handleTestConnection);
  elements.providerSelect.addEventListener('change', handleProviderChange);
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    // Try chrome.storage.sync first, fallback to local
    const storage = chrome.storage.sync || chrome.storage.local;
    const result = await storage.get([
      'llmProvider',
      'ollamaHost',
      'defaultModel',
      'apiKey',
      'apiModel',
      'apiBaseUrl'
    ]);
    
    console.log('Loaded settings:', result);
    
    // Populate provider selection
    elements.providerSelect.value = result.llmProvider || DEFAULT_CONFIG.provider;
    
    // Populate Ollama fields
    elements.hostInput.value = result.ollamaHost || DEFAULT_CONFIG.host;
    elements.defaultModelInput.value = result.defaultModel || DEFAULT_CONFIG.defaultModel;
    
    // Populate API fields
    elements.apiKeyInput.value = result.apiKey || DEFAULT_CONFIG.apiKey;
    elements.apiModelInput.value = result.apiModel || DEFAULT_CONFIG.apiModel;
    elements.apiBaseUrlInput.value = result.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
    
    // Show/hide appropriate configuration sections
    handleProviderChange();
    
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings. Using defaults.', 'error');
    
    // Use defaults on error
    elements.providerSelect.value = DEFAULT_CONFIG.provider;
    elements.hostInput.value = DEFAULT_CONFIG.host;
    elements.defaultModelInput.value = DEFAULT_CONFIG.defaultModel;
    elements.apiKeyInput.value = DEFAULT_CONFIG.apiKey;
    elements.apiModelInput.value = DEFAULT_CONFIG.apiModel;
    elements.apiBaseUrlInput.value = DEFAULT_CONFIG.apiBaseUrl;
  }
}

/**
 * Handle provider selection change
 */
function handleProviderChange() {
  const provider = elements.providerSelect.value;
  
  if (provider === 'ollama') {
    elements.ollamaConfig.style.display = 'block';
    elements.apiKeyConfig.style.display = 'none';
  } else {
    elements.ollamaConfig.style.display = 'none';
    elements.apiKeyConfig.style.display = 'block';
    
    // Update placeholder based on provider
    switch (provider) {
      case 'openai':
        elements.apiKeyInput.placeholder = 'sk-...';
        elements.apiModelInput.placeholder = 'gpt-4';
        elements.apiBaseUrlInput.placeholder = 'https://api.openai.com/v1';
        break;
      case 'anthropic':
        elements.apiKeyInput.placeholder = 'sk-ant-...';
        elements.apiModelInput.placeholder = 'claude-3-opus-20240229';
        elements.apiBaseUrlInput.placeholder = 'https://api.anthropic.com/v1';
        break;
      case 'openrouter':
        elements.apiKeyInput.placeholder = 'sk-or-...';
        elements.apiModelInput.placeholder = 'openai/gpt-4';
        elements.apiBaseUrlInput.placeholder = 'https://openrouter.ai/api/v1';
        break;
    }
  }
}

/**
 * Handle save settings form submission
 */
async function handleSaveSettings(event) {
  event.preventDefault();
  
  const provider = elements.providerSelect.value;
  
  // Build settings object based on provider
  const settings = {
    llmProvider: provider
  };
  
  // Validate and add provider-specific settings
  if (provider === 'ollama') {
    const host = elements.hostInput.value.trim();
    const defaultModel = elements.defaultModelInput.value.trim();
    
    if (!host) {
      showStatus('Please enter a valid host URL', 'error');
      elements.hostInput.focus();
      return;
    }
    
    if (!defaultModel) {
      showStatus('Please enter a default model name', 'error');
      elements.defaultModelInput.focus();
      return;
    }
    
    // Validate URL format
    try {
      new URL(host);
    } catch (error) {
      showStatus('Please enter a valid URL (e.g., http://127.0.0.1:11434)', 'error');
      elements.hostInput.focus();
      return;
    }
    
    settings.ollamaHost = host;
    settings.defaultModel = defaultModel;
  } else {
    // Cloud provider settings
    const apiKey = elements.apiKeyInput.value.trim();
    const apiModel = elements.apiModelInput.value.trim();
    const apiBaseUrl = elements.apiBaseUrlInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter your API key', 'error');
      elements.apiKeyInput.focus();
      return;
    }
    
    if (!apiModel) {
      showStatus('Please enter a model name', 'error');
      elements.apiModelInput.focus();
      return;
    }
    
    // Validate base URL if provided
    if (apiBaseUrl) {
      try {
        new URL(apiBaseUrl);
      } catch (error) {
        showStatus('Please enter a valid base URL', 'error');
        elements.apiBaseUrlInput.focus();
        return;
      }
    }
    
    settings.apiKey = apiKey;
    settings.apiModel = apiModel;
    settings.apiBaseUrl = apiBaseUrl;
  }
  
  // Set loading state
  setSaveLoadingState(true);
  
  try {
    // Save settings
    const storage = chrome.storage.sync || chrome.storage.local;
    await storage.set(settings);
    
    console.log('Settings saved:', settings);
    showStatus('Settings saved successfully!', 'success');
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Failed to save settings. Please try again.', 'error');
  } finally {
    setSaveLoadingState(false);
  }
}

/**
 * Handle test connection button click
 */
async function handleTestConnection() {
  const provider = elements.providerSelect.value;
  
  // Set loading state
  setTestLoadingState(true);
  showStatus('Testing connection...', 'info');
  
  try {
    if (provider === 'ollama') {
      const host = elements.hostInput.value.trim();
      
      if (!host) {
        showStatus('Please enter a host URL first', 'error');
        elements.hostInput.focus();
        return;
      }
      
      // Validate URL format
      try {
        new URL(host);
      } catch (error) {
        showStatus('Please enter a valid URL', 'error');
        elements.hostInput.focus();
        return;
      }
      
      console.log('Testing connection to:', host);
      
      // Send test message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'OLLAMA_TEST',
        payload: { host }
      });
      
      console.log('Test response:', response);
      
      if (response.ok) {
        showStatus('✅ Connection successful! Ollama is reachable.', 'success');
      } else {
        showStatus(`❌ Connection failed: ${response.error}`, 'error');
      }
    } else {
      // Test cloud API
      const apiKey = elements.apiKeyInput.value.trim();
      const apiModel = elements.apiModelInput.value.trim();
      const apiBaseUrl = elements.apiBaseUrlInput.value.trim();
      
      if (!apiKey) {
        showStatus('Please enter your API key first', 'error');
        elements.apiKeyInput.focus();
        return;
      }
      
      if (!apiModel) {
        showStatus('Please enter a model name first', 'error');
        elements.apiModelInput.focus();
        return;
      }
      
      console.log('Testing API connection for provider:', provider);
      
      // Send test message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'API_TEST',
        payload: {
          provider,
          apiKey,
          apiModel,
          apiBaseUrl
        }
      });
      
      console.log('Test response:', response);
      
      if (response.ok) {
        showStatus('✅ Connection successful! API is reachable.', 'success');
      } else {
        showStatus(`❌ Connection failed: ${response.error}`, 'error');
      }
    }
    
  } catch (error) {
    console.error('Error testing connection:', error);
    showStatus('❌ Failed to test connection. Make sure the extension is properly loaded.', 'error');
  } finally {
    setTestLoadingState(false);
  }
}

/**
 * Set loading state for save button
 */
function setSaveLoadingState(isLoading) {
  elements.saveBtn.disabled = isLoading;
  
  if (isLoading) {
    elements.saveBtnText.classList.add('hidden');
    elements.saveBtnSpinner.classList.remove('hidden');
  } else {
    elements.saveBtnText.classList.remove('hidden');
    elements.saveBtnSpinner.classList.add('hidden');
  }
}

/**
 * Set loading state for test button
 */
function setTestLoadingState(isLoading) {
  elements.testBtn.disabled = isLoading;
  
  // Disable inputs based on provider
  const provider = elements.providerSelect.value;
  if (provider === 'ollama') {
    elements.hostInput.disabled = isLoading;
  } else {
    elements.apiKeyInput.disabled = isLoading;
    elements.apiModelInput.disabled = isLoading;
    elements.apiBaseUrlInput.disabled = isLoading;
  }
  
  if (isLoading) {
    elements.testBtnText.classList.add('hidden');
    elements.testBtnSpinner.classList.remove('hidden');
  } else {
    elements.testBtnText.classList.remove('hidden');
    elements.testBtnSpinner.classList.add('hidden');
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message status-${type}`;
  elements.statusMessage.classList.remove('hidden');
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      elements.statusMessage.classList.add('hidden');
    }, 3000);
  }
}