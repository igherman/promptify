/**
 * Chrome Extension Popup Script
 * Handles UI interactions and communication with background script
 */

// DOM elements
const elements = {
  modelInput: document.getElementById('modelInput'),
  promptTextarea: document.getElementById('promptTextarea'),
  sendBtn: document.getElementById('sendBtn'),
  useSelectionBtn: document.getElementById('useSelectionBtn'),
  optionsBtn: document.getElementById('optionsBtn'),
  output: document.getElementById('output'),
  errorMessage: document.getElementById('errorMessage'),
  btnText: document.querySelector('.btn-text'),
  spinner: document.querySelector('.spinner')
};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

/**
 * Initialize the popup interface
 */
async function initializePopup() {
  console.log('Initializing popup...');
  
  // Load saved model from storage
  await loadSavedModel();
  
  // Set up event listeners
  setupEventListeners();
  
  // Focus on prompt textarea
  elements.promptTextarea.focus();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  elements.sendBtn.addEventListener('click', handleSendClick);
  elements.useSelectionBtn.addEventListener('click', handleUseSelectionClick);
  elements.optionsBtn.addEventListener('click', handleOptionsClick);
  elements.modelInput.addEventListener('input', handleModelChange);
  
  // Allow Enter + Ctrl/Cmd to send
  elements.promptTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendClick();
    }
  });
}

/**
 * Load saved model from chrome storage
 */
async function loadSavedModel() {
  try {
    const result = await chrome.storage.local.get(['savedModel']);
    if (result.savedModel) {
      elements.modelInput.value = result.savedModel;
      console.log('Loaded saved model:', result.savedModel);
    }
  } catch (error) {
    console.error('Error loading saved model:', error);
  }
}

/**
 * Save model to chrome storage
 */
async function saveModel(model) {
  try {
    await chrome.storage.local.set({ savedModel: model });
    console.log('Saved model:', model);
  } catch (error) {
    console.error('Error saving model:', error);
  }
}

/**
 * Handle model input change
 */
function handleModelChange() {
  const model = elements.modelInput.value.trim();
  if (model) {
    saveModel(model);
  }
}

/**
 * Handle send button click - updated to insert response into active input
 */
async function handleSendClick() {
  const prompt = elements.promptTextarea.value.trim();
  const model = elements.modelInput.value.trim();
  
  console.log('[POPUP] handleSendClick initiated');
  console.log('[POPUP] Form values:', { prompt: prompt.substring(0, 50) + '...', model });
  
  // Validate inputs
  if (!prompt) {
    console.log('[POPUP] Validation failed: No prompt provided');
    showError('Please enter a prompt');
    elements.promptTextarea.focus();
    return;
  }
  
  if (!model) {
    console.log('[POPUP] Validation failed: No model provided');
    showError('Please enter a model name');
    elements.modelInput.focus();
    return;
  }
  
  // Clear previous error
  hideError();
  
  // Set loading state
  setLoadingState(true);
  
  try {
    console.log('[POPUP] Preparing to send message to background script');
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      type: 'OLLAMA_QUERY',
      payload: { prompt, model }
    });
    
    console.log('Received response:', response);
    
    if (response.ok) {
      displayResponse(response.text);
      
      // Insert response into active text input
      console.log('[POPUP] Attempting to insert response into active input');
      await insertResponseIntoActiveInput(response.text);
      
    } else {
      console.error('[POPUP] Request failed:', response.error);
      showError(response.error || 'Unknown error occurred');
    }
    
  } catch (error) {
    console.error('[POPUP] Exception occurred:', error.message);
    console.error('[POPUP] Stack trace:', error.stack);
    showError('Request failed: ' + error.message);
  } finally {
    setLoadingState(false);
    console.log('[POPUP] Request completed');
  }
}

/**
 * Insert AI response into the currently active text input
 */
async function insertResponseIntoActiveInput(text) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.log('No active tab found');
      return;
    }
    
    // Send message to content script to insert text
    const result = await chrome.tabs.sendMessage(tab.id, {
      type: 'INSERT_AI_RESPONSE',
      payload: { text: text }
    });
    
    if (result && result.success) {
      console.log('✅ Text inserted successfully');
      // Optionally close the popup after successful insertion
      // window.close();
    } else {
      console.log('ℹ️ No active text input found to insert response');
    }
    
  } catch (error) {
    console.error('Error inserting response into input:', error);
    // Don't show error to user - this is optional functionality
  }
}

/**
 * Handle use selection button click
 */
async function handleUseSelectionClick() {
  try {
    console.log('Getting selected text from active tab...');
    
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showError('No active tab found');
      return;
    }
    
    // Inject content script to get selection
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getSelectedText
    });
    
    const selectedText = results[0]?.result;
    
    if (selectedText && selectedText.trim()) {
      elements.promptTextarea.value = selectedText.trim();
      console.log('Selected text retrieved:', selectedText);
      hideError();
    } else {
      showError('No text selected on the page');
    }
    
  } catch (error) {
    console.error('Error getting selection:', error);
    showError('Failed to get selected text. Make sure you have text selected on the page.');
  }
}

/**
 * Function to be injected into content script to get selected text
 */
function getSelectedText() {
  return window.getSelection().toString();
}

/**
 * Handle options button click
 */
function handleOptionsClick() {
  chrome.runtime.openOptionsPage();
}

/**
 * Set loading state for the UI
 */
function setLoadingState(isLoading) {
  elements.sendBtn.disabled = isLoading;
  elements.useSelectionBtn.disabled = isLoading;
  elements.modelInput.disabled = isLoading;
  elements.promptTextarea.disabled = isLoading;
  
  if (isLoading) {
    elements.btnText.classList.add('hidden');
    elements.spinner.classList.remove('hidden');
  } else {
    elements.btnText.classList.remove('hidden');
    elements.spinner.classList.add('hidden');
  }
}

/**
 * Display the response in the output area
 */
function displayResponse(text) {
  elements.output.innerHTML = '';
  elements.output.textContent = text;
  elements.output.scrollTop = 0;
}

/**
 * Show error message
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('hidden');
  console.error('UI Error:', message);
}

/**
 * Hide error message
 */
function hideError() {
  elements.errorMessage.classList.add('hidden');
  elements.errorMessage.textContent = '';
}
/**
 * Test background script connection
 */
async function testBackgroundConnection() {
  try {
    console.log('[POPUP] Testing background script connection');
    
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_CONNECTION'
    });
    
    console.log('[POPUP] Background connection test result:', response);
    return true;
  } catch (error) {
    console.error('[POPUP] Background connection test failed:', error.message);
    return false;
  }
}

// Test connection when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[POPUP] DOM loaded, initializing popup');
  
  // Test background connection
  const connected = await testBackgroundConnection();
  console.log('[POPUP] Background script connection status:', connected);
  
  // Load saved model
  await loadSavedModel();
  
  // Focus on prompt textarea
  elements.promptTextarea.focus();
});