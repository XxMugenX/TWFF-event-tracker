document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('log-container');
    const clearBtn = document.getElementById('clearBtn');

    // Fetch the logs from the extension vault
    function loadLogs() {
        chrome.storage.local.get({ ProcessLogs: [] }, (result) => {
            const logs = result.ProcessLogs;
            logContainer.innerHTML = ''; // Clears current view

            if (logs.length === 0) {
                logContainer.innerHTML = '<div class="empty-state">No events logged yet. Go type in a Google Doc!</div>';
                return;
            }

            // Loop through the logs backwards (newest to oldest)
            for (let i = logs.length - 1; i >= 0; i--) {
                const event = logs[i];
                const logDiv = document.createElement('div');
                
                // Add a class based on event type for color coding
                logDiv.className = `log-entry ${event.event_type}`; 
                
                // Prints the formatted JSON
                logDiv.textContent = JSON.stringify(event, null, 2);
                logContainer.appendChild(logDiv);
            }
        });
    }

    //Clear button function
    clearBtn.addEventListener('click', () => {
        chrome.storage.local.set({ ProcessLogs: [] }, () => {
            loadLogs(); // Reload the UI
        });
    });

    // Initial load
    loadLogs();
});