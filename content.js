console.log('Tracker running')

let editBuffer = "";
let typingTimer;
const PAUSE_DURATION = 1500; //1.5 seconds

//saves to extension storage
function saveToExtensionStorage(twffEvent) {
    // Open the vault and get the current array of logs (or an empty array if it's new)
    chrome.storage.local.get({ ProcessLogs: [] }, (result) => {
        let currentLogs = result.ProcessLogs;
        
        // Add the newest event to the array
        currentLogs.push(twffEvent);
        
        // Save the updated array back into the vault
        chrome.storage.local.set({ ProcessLogs: currentLogs }, () => {
            console.log(` Event stored securely! Total events logged: ${currentLogs.length}`);
        });
    });
}

// context grabber
// Tries to grab the surrounding text to have an idea of where typing occured
function getCursorContext() {
    try {
        // Find all the invisible text lines Google renders for screen readers
        let textLines = document.querySelectorAll('.kix-lineview');
        
        if (textLines && textLines.length > 0) {
            let context = "";
            // Grab the text from the last 3 visible lines on the screen
            let startIndex = Math.max(0, textLines.length - 3);
            
            for (let i = startIndex; i < textLines.length; i++) {
                // Clean up the text by removing zero-width spaces Google uses
                context += textLines[i].innerText.replace(/[\u200B-\u200D\uFEFF]/g, '') + " ";
            }
            
            return context.trim() ? context.substring(0, 100) + "..." : "Context unavailable";
        }
    } catch (e) {
        console.log("Kix extraction failed:", e);
    }
    
    return "Context unavailable";
}


function flushBuffer() {
    if (editBuffer.length > 0) {
        const editJson = buildTwffEvent("edit", editBuffer);
        // console.log("[EDIT LOGGED] Sending batched text:");
        // console.log(JSON.stringify(editJson, null, 4));
        saveToExtensionStorage(editJson);

        editBuffer = ""; 
        clearTimeout(typingTimer); 
    }
}

//builds a constructor for required json payload/schema
function buildTwffEvent(eventType, textContent) {
    return {
        "schema_version": "1.0",
        "event_type": eventType,                     
        "timestamp": new Date().toISOString(),       
        "actor": "human", 
        "payload": {
            "content": textContent,                  
            "source_url": window.location.href,      
            "character_count": textContent.length,
            "surrounding_context": getCursorContext() 
        }
    };
}

document.addEventListener('paste', (event)=>{
    //store pasted value
    let pastedText = event.clipboardData.getData('text/plain')

    //display pasted value
    if (pastedText){    
        const jsonPayload = buildTwffEvent('paste', pastedText)
        // console.log("New TWFF event logged")
        // console.log(JSON.stringify(jsonPayload,null,4))
        saveToExtensionStorage(jsonPayload);
    }   
    else{
        console.log('paste event detected but no text found')
    }
}, true)

document.addEventListener('mouseup', () => {
    flushBuffer(); 
}, true);

document.addEventListener('mousedown', () => {
        flushBuffer(); 
}, true);

window.addEventListener('blur', () => {
        flushBuffer();
}, true);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushBuffer();
    }
}, true);

document.addEventListener('keydown', (event) => {

    if (event.key.includes("Arrow")) {
        flushBuffer();
        return; 
    }

    let isPrintableChar = event.key.length === 1;
    let isActionKey = event.key === 'Backspace' || event.key === 'Enter';

    if ((isPrintableChar || isActionKey) && !event.ctrlKey && !event.metaKey) {
        clearTimeout(typingTimer); 

        if (event.key === 'Enter') {
            editBuffer += "\n";
        } else if (event.key === 'Backspace') {
            editBuffer = editBuffer.slice(0, -1); 
        } else {
            editBuffer += event.key;
        }

        typingTimer = setTimeout(() => flushBuffer(), PAUSE_DURATION);
    }
}, true);