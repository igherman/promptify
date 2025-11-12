/**
 * Chrome Extension Options Page Script
 * Handles settings configuration and persistence
 */

// Default configuration
const DEFAULT_CONFIG = {
  host: 'http://127.0.0.1:11434',
  defaultModel: 'llama3.1'
};

// DOM elements
const elements = {
  form: document.getElementById('optionsForm'),
  hostInput: document.getElementById('hostInput'),
  defaultModelInput: document.getElementById('defaultModelInput'),
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
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    // Try chrome.storage.sync first, fallback to local
    const storage = chrome.storage.sync || chrome.storage.local;
    const result = await storage.get(['ollamaHost', 'defaultModel']);
    
    console.log('Loaded settings:', result);
    
    // Populate form with saved values or defaults
    elements.hostInput.value = result.ollamaHost || DEFAULT_CONFIG.host;
    elements.defaultModelInput.value = result.defaultModel || DEFAULT_CONFIG.defaultModel;
    
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings. Using defaults.', 'error');
    
    // Use defaults on error
    elements.hostInput.value = DEFAULT_CONFIG.host;
    elements.defaultModelInput.value = DEFAULT_CONFIG.defaultModel;
  }
}

/**
 * Handle save settings form submission
 */
async function handleSaveSettings(event) {
  event.preventDefault();
  
  const host = elements.hostInput.value.trim();
  const defaultModel = elements.defaultModelInput.value.trim();
  
  // Validate inputs
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
  
  // Set loading state
  setSaveLoadingState(true);
  
  try {
    // Save settings
    const storage = chrome.storage.sync || chrome.storage.local;
    await storage.set({
      ollamaHost: host,
      defaultModel: defaultModel
    });
    
    console.log('Settings saved:', { host, defaultModel });
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
  
  // Set loading state
  setTestLoadingState(true);
  showStatus('Testing connection...', 'info');
  
  try {
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
  elements.hostInput.disabled = isLoading;
  
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