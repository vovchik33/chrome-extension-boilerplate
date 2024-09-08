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
    })
});

