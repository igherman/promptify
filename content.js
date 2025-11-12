/**
 * Content script that shows floating Promptify button and handles text insertion
 */

console.log('[CONTENT] Promptify content script loaded on:', window.location.hostname);

let floatingButton = null;
let currentTextInput = null;
let lastFocusedInput = null;

// Listen for focus on text inputs
document.addEventListener('focusin', (event) => {
  if (isTextInput(event.target)) {
    currentTextInput = event.target;
    lastFocusedInput = event.target;
    showFloatingButton();
    console.log('[CONTENT] Text input focused:', event.target.tagName.toLowerCase());
  }
});

// Listen for focus out
document.addEventListener('focusout', (event) => {
  if (isTextInput(event.target)) {
    setTimeout(() => {
      if (!document.activeElement || !isTextInput(document.activeElement)) {
        currentTextInput = null;
        hideFloatingButton();
        console.log('[CONTENT] Text input focus lost');
      }
    }, 200);
  }
});

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
  
  if (!document.body.contains(floatingButton)) {
    document.body.appendChild(floatingButton);
    console.log('[CONTENT] Floating button displayed');
  }
  
  floatingButton.style.display = 'block';
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

// Open Promptify interface
async function openPromptifyInterface() {
  // Get current text in the input (if any)
  let currentText = '';
  if (currentTextInput) {
    currentText = getCurrentInputText(currentTextInput);
  }
  
  const prompt = window.prompt(`Promptify - Enhance your text with AI:\n\nCurrent text: "${currentText}"\n\nEnter your prompt (leave empty to enhance current text):`);
  
  if (prompt === null) return; // User cancelled
  
  const finalPrompt = prompt.trim() || currentText || 'Help me write something good';
  
  if (!finalPrompt) {
    alert('Please enter some text or prompt');
    return;
  }
  
  try {
    // Show loading state
    const button = document.getElementById('promptify-float-btn');
    if (button) {
      const originalContent = button.innerHTML;
      button.innerHTML = '⏳';
      button.style.animation = 'spin 1s linear infinite';
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.animation = 'none';
      }, 10000); // Reset after 10 seconds max
    }
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      type: 'OLLAMA_QUERY',
      payload: {
        prompt: finalPrompt,
        model: 'llama3.2' // Could load from storage
      }
    });
    
    if (response.ok && currentTextInput) {
      // Insert enhanced response into current text input
      insertTextIntoInput(currentTextInput, response.text);
      
      // Show success animation
      if (button) {
        button.innerHTML = '✅';
        setTimeout(() => {
          button.innerHTML = '✨ AI';
        }, 2000);
      }
    } else {
      alert('Error: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error querying Ollama:', error);
    alert('Failed to query Promptify: ' + error.message);
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

// Insert text into input
function insertTextIntoInput(element, text) {
  if (!element || !text) return;
  
  if (element.tagName.toLowerCase() === 'textarea' || 
      (element.tagName.toLowerCase() === 'input' && element.type !== 'file')) {
    
    // For input/textarea elements
    const start = element.selectionStart || element.value.length;
    const end = element.selectionEnd || element.value.length;
    const currentValue = element.value || '';
    
    // Insert text at cursor position (or append if no selection)
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    element.value = newValue;
    
    // Position cursor after inserted text
    const newPosition = start + text.length;
    element.setSelectionRange(newPosition, newPosition);
    
    // Trigger events to notify the page of the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
  } else if (element.contentEditable === 'true') {
    // For contenteditable elements
    element.focus();
    
    // Use execCommand for better compatibility
    if (document.execCommand) {
      document.execCommand('insertText', false, text);
    } else {
      // Fallback for newer browsers
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  console.log('📝 Text inserted into input:', element);
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

// Add spin animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);