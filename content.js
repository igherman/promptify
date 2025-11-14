/**
 * Content script that shows floating Promptify button and handles text insertion
 * Optimized to avoid triggering Chrome's internal Aura system errors
 */

(function() {
  'use strict';
  
  // Prevent duplicate loading
  if (window.promptifyLoaded) {
    return;
  }
  
  window.promptifyLoaded = true;
  
  // Verify extension context is valid
  let extensionActive = true;
  
  // Monitor extension context validity
  function checkExtensionContext() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  let floatingButton = null;
  let currentTextInput = null;
  let lastFocusedInput = null;
  let isInitialized = false;

  // Wait for DOM to be ready
  function initializePromptify() {
    if (isInitialized) return;
    
    try {
      // Add event listeners - passive to not block Chrome's internal systems
      document.addEventListener('focusin', handleFocusIn, { passive: true, capture: false });
      document.addEventListener('focusout', handleFocusOut, { passive: true, capture: false });
      
      isInitialized = true;
    } catch (error) {
      console.error('[PROMPTIFY] Initialization error:', error);
    }
  }

  // Handle focus in - use requestAnimationFrame to avoid blocking Chrome Aura
  function handleFocusIn(event) {
    try {
      if (isTextInput(event.target)) {
        currentTextInput = event.target;
        lastFocusedInput = event.target;
        // Defer to next frame to let Chrome's systems settle
        requestAnimationFrame(() => {
          showFloatingButton();
        });
      }
    } catch (error) {
      console.error('Focus in error:', error);
    }
  }

  // Handle focus out with error protection
  function handleFocusOut(event) {
    try {
      if (isTextInput(event.target)) {
        setTimeout(() => {
          if (!document.activeElement || !isTextInput(document.activeElement)) {
            currentTextInput = null;
            hideFloatingButton();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Focus out error:', error);
    }
  }

  // Update button position on scroll and resize
  let repositionTimeout;
  function scheduleReposition() {
    clearTimeout(repositionTimeout);
    repositionTimeout = setTimeout(() => {
      if (currentTextInput && floatingButton && floatingButton.style.display === 'block') {
        positionButtonNearInput(currentTextInput);
      }
    }, 100);
  }

  window.addEventListener('scroll', scheduleReposition, { passive: true });
  window.addEventListener('resize', scheduleReposition, { passive: true });

function isTextInput(element) {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const type = element.type ? element.type.toLowerCase() : '';
  
  if (tagName === 'textarea') return true;
  if (tagName === 'input' && ['text', 'email', 'password', 'search', 'url'].includes(type)) return true;
  if (element.contentEditable === 'true') return true;
  
  return false;
}

function showFloatingButton() {
  if (!floatingButton) {
    createFloatingButton();
  }
  
  if (document.body && !document.body.contains(floatingButton)) {
    document.body.appendChild(floatingButton);
  }
  
  if (floatingButton && currentTextInput) {
    floatingButton.style.display = 'block';
    positionButtonNearInput(currentTextInput);
  }
}

// Position button near the focused input
function positionButtonNearInput(inputElement) {
  if (!inputElement || !floatingButton) return;
  
  const rect = inputElement.getBoundingClientRect();
  const button = floatingButton.firstElementChild;
  
  if (button) {
    // Position at top-right corner of the input field
    button.style.position = 'fixed';
    button.style.top = `${rect.top + window.scrollY}px`;
    button.style.left = `${rect.right + window.scrollX - 70}px`; // 10px from right edge of input
    button.style.zIndex = '10000';
  }
}

// Hide floating button
function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.style.display = 'none';
  }
}

// Create floating button
function createFloatingButton() {
  if (floatingButton) return floatingButton;
  
  floatingButton = document.createElement('div');
  floatingButton.innerHTML = `
    <div id="promptify-float-btn" style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      z-index: 10000;
      color: white;
      font-weight: bold;
      font-size: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
    " title="Enhance with Promptify AI">
      ✨ AI
    </div>
  `;
  
  const button = floatingButton.firstElementChild;
  
  // Click handler
  button.addEventListener('click', () => {
    openPromptifyInterface();
  });
  
  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1) rotate(5deg)';
    button.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)';
    button.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.6)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1) rotate(0deg)';
    button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
  });
  
  return floatingButton;
}

// Create custom modal for input
function createPromptModal(currentText) {
  const modal = document.createElement('div');
  modal.id = 'promptify-modal';
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      backdrop-filter: blur(5px);
    ">
      <div style="
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      ">
        <h2 style="
          margin: 0 0 16px 0;
          font-size: 24px;
          color: #667eea;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">✨ Promptify AI</h2>
        <p style="
          margin: 0 0 16px 0;
          color: #666;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">Current text: <strong>${currentText || '(empty)'}</strong></p>
        <textarea id="promptify-input" placeholder="Enter your prompt (leave empty to enhance current text)" style="
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          resize: vertical;
          box-sizing: border-box;
        "></textarea>
        <div id="promptify-status" style="
          margin: 12px 0;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: none;
          text-align: center;
        "></div>
        <div style="
          display: flex;
          gap: 12px;
          margin-top: 16px;
        ">
          <button id="promptify-cancel" style="
            flex: 1;
            padding: 12px 24px;
            border: 2px solid #e0e0e0;
            background: white;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">Cancel</button>
          <button id="promptify-submit" style="
            flex: 1;
            padding: 12px 24px;
            border: none;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">Generate ✨</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus textarea
  const textarea = modal.querySelector('#promptify-input');
  textarea.focus();
  
  return new Promise((resolve) => {
    const submitBtn = modal.querySelector('#promptify-submit');
    const cancelBtn = modal.querySelector('#promptify-cancel');
    
    submitBtn.addEventListener('click', () => {
      // Don't remove modal on submit - let the async function handle it
      resolve(textarea.value.trim());
    });
    
    cancelBtn.addEventListener('click', () => {
      modal.remove();
      resolve(null);
    });
    
    // Submit on Enter (with Ctrl/Cmd)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Don't remove modal on submit - let the async function handle it
        resolve(textarea.value.trim());
      }
      // Cancel on Escape
      if (e.key === 'Escape') {
        modal.remove();
        resolve(null);
      }
    });
  });
}

// Show status in modal
function showModalStatus(message, type = 'info') {
  const modal = document.getElementById('promptify-modal');
  if (!modal) return;
  
  const statusDiv = modal.querySelector('#promptify-status');
  const submitBtn = modal.querySelector('#promptify-submit');
  
  statusDiv.style.display = 'block';
  statusDiv.textContent = message;
  
  if (type === 'loading') {
    statusDiv.style.background = '#e3f2fd';
    statusDiv.style.color = '#1976d2';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
  } else if (type === 'error') {
    statusDiv.style.background = '#ffebee';
    statusDiv.style.color = '#c62828';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
  } else if (type === 'success') {
    statusDiv.style.background = '#e8f5e9';
    statusDiv.style.color = '#2e7d32';
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById('promptify-modal');
  if (modal) {
    modal.remove();
  }
}

// Open Promptify interface
async function openPromptifyInterface() {
  // Verify extension is still connected
  if (!checkExtensionContext()) {
    console.error('Extension context lost, reloading page...');
    window.location.reload();
    return;
  }
  
  console.info('Get current text in the input (if any)');
  
  // Save the target input BEFORE opening modal (modal will steal focus)
  const targetInput = currentTextInput || lastFocusedInput;
  
  if (!targetInput) {
    alert('Please focus on a text input first');
    return;
  }
  
  console.log('Target input saved:', targetInput);
  
  let currentText = '';
  if (targetInput) {
    currentText = getCurrentInputText(targetInput);
  }
  
  const prompt = await createPromptModal(currentText);
  
  if (prompt === null) return; // User cancelled
  
  const finalPrompt = prompt || currentText || 'Help me write something good';
  
  if (!finalPrompt) {
    showModalStatus('Please enter some text or prompt', 'error');
    return;
  }
  
  try {
    console.info('Querying Promptify AI...');
    const startTime = Date.now();
    showModalStatus('⏳ Connecting to Ollama... (0s)', 'loading');
    
    const button = document.getElementById('promptify-float-btn');
    let originalContent;
    if (button) {
      originalContent = button.innerHTML;
      button.innerHTML = '⏳';
      button.style.animation = 'promptify-spin 1s linear infinite';
    }
    
    // Show progress updates with timer
    let progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const statusDiv = document.querySelector('#promptify-status');
      if (statusDiv && statusDiv.style.display !== 'none') {
        const messages = [
          `⏳ Connecting to Ollama... (${elapsed}s)`,
          `⏳ Processing your prompt... (${elapsed}s)`,
          `⏳ Generating AI response... (${elapsed}s)`,
          `⏳ Still working... (${elapsed}s)`
        ];
        let msgIndex = Math.min(Math.floor(elapsed / 3), messages.length - 1);
        statusDiv.textContent = messages[msgIndex];
      }
    }, 1000);
    
    // Send message to background script with retry logic
    let response;
    try {
      console.log('Sending message to background script...');
      
      // Wake up service worker by checking if it's alive
      if (!chrome.runtime?.id) {
        throw new Error('Extension context is invalid');
      }
      
      response = await chrome.runtime.sendMessage({
        type: 'OLLAMA_QUERY',
        payload: {
          prompt: finalPrompt,
          model: 'llama3.2' // Could load from storage
        }
      });
      
      console.log('Received response from background:', response);
      
      if (!response) {
        throw new Error('No response received from background script');
      }
    } catch (err) {
      clearInterval(progressInterval);
      // If extension context is invalidated, try to reload and retry
      if (err.message && err.message.includes('Extension context invalidated')) {
        console.warn('Extension context invalidated, reloading...');
        closeModal();
        window.location.reload();
        return;
      }
      throw err;
    } finally {
      clearInterval(progressInterval);
    }
    
    if (response && response.ok && targetInput) {
      console.log('Success! Inserting text into:', targetInput);
      console.log('Response text:', response.text);
      showModalStatus('✅ Success! Inserting text...', 'success');
      
      // Insert enhanced response into saved target input
      insertTextIntoInput(targetInput, response.text);
      
      // Show success animation on button
      if (button) {
        button.innerHTML = '✅';
        button.style.animation = 'none';
        setTimeout(() => {
          button.innerHTML = '✨ AI';
        }, 2000);
      }
      
      // Close modal after short delay
      setTimeout(() => {
        closeModal();
      }, 1000);
    } else {
      console.error('Failed to insert text. Response:', response, 'targetInput:', targetInput);
      const errorMsg = !response ? 'No response' : 
                       !response.ok ? (response.error || 'Unknown error') :
                       !targetInput ? 'No text input found' : 'Unknown error';
      showModalStatus('Error: ' + errorMsg, 'error');
      if (button) {
        button.innerHTML = originalContent || '✨ AI';
        button.style.animation = 'none';
      }
    }
  } catch (error) {
    console.error('Error querying Ollama:', error);
    showModalStatus('Failed: ' + error.message, 'error');
    const button = document.getElementById('promptify-float-btn');
    if (button) {
      button.innerHTML = '✨ AI';
      button.style.animation = 'none';
    }
  }
}

// Get current text from input
function getCurrentInputText(element) {
  if (element.tagName.toLowerCase() === 'textarea' || element.type === 'text') {
    return element.value || '';
  } else if (element.contentEditable === 'true') {
    return element.innerText || '';
  }
  return '';
}

// Insert text into input (replaces existing content)
function insertTextIntoInput(element, text) {
  console.log('insertTextIntoInput called with:', { element, text: text?.substring(0, 50) + '...' });
  
  if (!element || !text) {
    console.warn('Missing element or text:', { element, text });
    return;
  }
  
  if (element.tagName.toLowerCase() === 'textarea' || 
      (element.tagName.toLowerCase() === 'input' && element.type !== 'file')) {
    
    console.log('Replacing content in textarea/input');
    // For input/textarea elements - replace all content
    element.value = text;
    
    console.log('New value set, length:', text.length);
    
    // Position cursor at the end
    element.setSelectionRange(text.length, text.length);
    
    // Focus the element
    element.focus();
    
    // Trigger events to notify the page of the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('Text replaced successfully');
    
  } else if (element.contentEditable === 'true') {
    console.log('Replacing content in contenteditable');
    // For contenteditable elements - replace all content
    element.focus();
    
    // Select all content and replace
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Use execCommand for better compatibility
    if (document.execCommand) {
      document.execCommand('insertText', false, text);
    } else {
      // Fallback - clear and insert
      element.textContent = text;
    }
  }
  
  console.log('📝 Text replaced in input:', element);
}

// Check if element is a text input
function isTextInput(element) {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const type = element.type ? element.type.toLowerCase() : '';
  
  if (tagName === 'textarea') return true;
  if (tagName === 'input' && ['text', 'email', 'password', 'search', 'url'].includes(type)) return true;
  if (element.contentEditable === 'true') return true;
  
  return false;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'GET_SELECTION') {
    try {
      const selection = getSelectedTextSafely();
      sendResponse({
        ok: true,
        selection: selection
      });
      console.log('Selection retrieved:', selection);
    } catch (error) {
      console.error('Error getting selection:', error);
      sendResponse({
        ok: false,
        selection: ""
      });
    }
  }
  
  // NEW: Handle AI response insertion
  if (message.type === 'INSERT_AI_RESPONSE') {
    try {
      const { text } = message.payload;
      const success = insertAIResponse(text);
      sendResponse({ success: success });
    } catch (error) {
      console.error('Error inserting AI response:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true;
});

/**
 * Insert AI response into the best available text input
 */
function insertAIResponse(text) {
  // Priority order:
  // 1. Currently focused input
  // 2. Last focused input
  // 3. Any visible text input on the page
  
  let targetInput = null;
  
  // Check currently focused element
  if (document.activeElement && isTextInput(document.activeElement)) {
    targetInput = document.activeElement;
    console.log('✅ Using currently focused input');
  }
  // Check last focused input
  else if (lastFocusedInput && isTextInput(lastFocusedInput) && isElementVisible(lastFocusedInput)) {
    targetInput = lastFocusedInput;
    console.log('✅ Using last focused input');
  }
  // Find any visible text input
  else {
    targetInput = findVisibleTextInput();
    if (targetInput) {
      console.log('✅ Using found visible input');
    }
  }
  
  if (targetInput) {
    insertTextIntoInput(targetInput, text);
    
    // Focus the input and position cursor at the end
    targetInput.focus();
    if (targetInput.setSelectionRange) {
      const len = targetInput.value.length;
      targetInput.setSelectionRange(len, len);
    }
    
    return true;
  } else {
    console.log('❌ No suitable text input found');
    return false;
  }
}

/**
 * Check if element is visible
 */
function isElementVisible(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    element.offsetParent !== null
  );
}

/**
 * Find any visible text input on the page
 */
function findVisibleTextInput() {
  const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], input[type="url"], textarea, [contenteditable="true"]');
  
  for (const input of inputs) {
    if (isTextInput(input) && isElementVisible(input)) {
      return input;
    }
  }
  
  return null;
}

  // Add spin animation style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes promptify-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.head) {
        document.head.appendChild(style);
      }
    });
  }

  // Initialize when DOM is ready - delayed to not interfere with Chrome Aura
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Give Chrome's systems time to initialize first
      setTimeout(initializePromptify, 1500);
    });
  } else {
    // DOM already ready, still delay to avoid Aura conflicts
    setTimeout(initializePromptify, 1500);
  }

})(); // End of IIFE