function clickVersion() {
    // alert("Hello");
    chrome.runtime.sendMessage(
        { message: "get_version", version: "1.2.3" },
        (response) => {
            alert(response.version);
        }
    );
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_version") {
        alert("Version: " + request.version);

        chrome.tabs.create({}, function (newTab) {
            chrome.tabs.query({}, function (tabs) {
                for (let tab of tabs) {
                    const url = new URL(tab.url);
                    if (tab.id !== newTab.id && ['www.youtube.com', 'test.com'].includes(url.hostname)) {
                        chrome.tabs.remove(tab.id);
                    }
                }
            });
        });

        sendResponse({ version: request.version + "response" });
    }
});

let versionBtn = document.getElementById("getVersionBtn");

versionBtn.addEventListener("click", async () => {
    // Get the active tab
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    // Send a message to the active tab
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: clickVersion,
    });
});

// Function to close tabs with a specific domain
function closeTabsWithDomain(domain) {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => {
            const url = new URL(tab.url);
            if (url.hostname === domain) {
                chrome.tabs.remove(tab.id);
            }
        });
    });
}

// Function to create and add buttons
function addButtons() {
    const domains = ['www.youtube.com', 'test.com'];
    const closeButtonsDiv = document.getElementById('closeButtons');

    domains.forEach(domain => {
        const button = document.createElement('button');
        button.textContent = `Close ${domain}`;
        button.addEventListener('click', () => closeTabsWithDomain(domain));
        closeButtonsDiv.appendChild(button);
    });
}

// Add buttons when the popup is loaded
document.addEventListener('DOMContentLoaded', addButtons);