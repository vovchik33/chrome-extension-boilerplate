
let versionBtn = document.getElementById("getVersionBtn");

function clickVersion(title) {
    chrome.runtime.sendMessage(
        { message: "get_version", version: "1.2.3", title },
        (response) => {
            function replacePageText(node, strIn, strOut) {
                if (node.nodeType === Node.TEXT_NODE) {
                    console.log(node.innerText);
                    node.textContent = node.textContent.replace(new RegExp(strIn, "g"), strOut);
                } else {
                    if (!!node.childNodes) {
                        node.childNodes.forEach(child => {
                            replacePageText(child, strIn, strOut);
                        });
                    }
                }
            }

            replacePageText(document.body, 'Samsung', '3333333333333');
            alert(response.version);
        }
    );
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_version") {
        alert("Version: " + request.version + request.title);
        sendResponse({version: request.version});
    }
});

versionBtn.addEventListener("click", async () => {
    // Get the active tab
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    // Send a message to the active tab
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: clickVersion,
        args: [tab.title]
    })
});

