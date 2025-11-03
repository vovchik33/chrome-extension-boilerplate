document.getElementById('openOptionsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Function to close tabs with a specific domain
function closeTabsWithDomain(domain) {
  // alert(domain);
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(tab => {
      const url = new URL(tab.url);
      if (url.hostname.indexOf(domain) > -1) {
        chrome.tabs.remove(tab.id);
      }
    });
  });
}

// Function to close tabs with a specific group
function closeTabsForGroupName(name) {
  // alert(name);
  getDomainsFromStorage(name, (domains) => {
    // alert(domains);
    domains.forEach(closeTabsWithDomain);
  });
}

// Function to retrieve domains from storage
function getDomainsFromStorage(name, callback) {
  chrome.storage.sync.get(['domainGroups'], (result) => {
    const domains = result.domainGroups
      ? result.domainGroups
        .filter(group => group.name === name && group.active)
        .flatMap(group => group.domains)
      : [];
    callback(domains);
  });
}

// Function to retrieve group names from storage
function getGroupNamesFromStorage(callback) {
  chrome.storage.sync.get(['domainGroups'], (result) => {
    const groupNames = result.domainGroups
      ? result.domainGroups
        .filter(group => group.active)
        .map(group => group.name)
      : [];
    callback(groupNames);
  });
}

// Function to count tabs with specific domains
function countTabsWithDomains(domains, callback) {
  chrome.tabs.query({}, (tabs) => {
    let count = 0;

    tabs.forEach((tab) => {
      const url = new URL(tab.url);
      if (!!url.hostname && domains.some(domain => !!domain && url.hostname.indexOf(domain) !== -1)) {
        count++;
      }
    });

    callback(count);
  });
}

const addOrRemoveButton = (groupName, domain, domains) => {
  const button = document.createElement('button');
  const domainKnown = domains.includes(domain);

  if (domainKnown) {
    button.className = 'remove-from-group-button';
    button.innerHTML = '-';
    button.title = 'Remove from Group';
  } else {
    button.className = 'add-current-tab-button';
    button.innerHTML = '+';
    button.title = 'Add to Group';
  }


  button.addEventListener('click', () => {
    chrome.storage.sync.get({ domainGroups: [] }, (items) => {
      const groups = items.domainGroups;
      const groupIdx = groups.findIndex(group => group.name === groupName);

      if (groupIdx !== -1) {
        if (domains.includes(domain)) {
          // Remove domain from group
          groups[groupIdx].domains = groups[groupIdx].domains.filter(d => d !== domain);
        } else {
          const requestDomainName = prompt(`Domain ${domain} will be added to ${groupName}`, domain);
          // Add domain to group
          groups[groupIdx].domains.push(requestDomainName);
        }

        chrome.storage.sync.set({ domainGroups: groups }, () => {
          refreshControls(); // Update the button counts
        });
      }
    });
  });

  return button;
};

function moveAllTabsToOneWindow() {
  chrome.windows.create({}, (newWindow) => {
    chrome.tabs.query({}, (tabs) => {
      const tabIds = tabs.map(tab => tab.id);
      chrome.tabs.move(tabIds, { windowId: newWindow.id, index: -1 });
    });
  });
}

const refreshControls = () => {
  const closeAllTabsButtonDiv = document.getElementById('closeAllDiv');
  closeAllTabsButtonDiv.innerHTML = ''; // Clear existing buttons

  // Add "Close All" button
  const closeAllTabsButton = document.createElement('button');
  closeAllTabsButton.textContent = 'Close All Tabs';
  closeAllTabsButton.classList.add('close-all-tabs-button');
  closeAllTabsButton.disabled = true; // Initially disable the button
  closeAllTabsButton.addEventListener('click', () => {
    chrome.storage.sync.get({ domainGroups: [] }, (items) => {
      const domainGroups = items.domainGroups;

      domainGroups.forEach(group => {
        if (group.active) {
          closeTabsForGroupName(group.name);
        }
      });

      setTimeout(refreshControls, 500); // Delay to allow tabs to close
    });
  });
  closeAllTabsButtonDiv.appendChild(closeAllTabsButton);

  const closeOtherTabsButtonDiv = document.getElementById('closeOtherDiv');
  closeOtherTabsButtonDiv.innerHTML = ''; // Clear existing buttons

  // Add "Close Other" button
  const closeOtherTabsButton = document.createElement('button');
  closeOtherTabsButton.classList.add('close-other-tabs-button');
  closeOtherTabsButton.disabled = false; // Initially disable the button but TODO: Enable it when there are tabs without group

  closeOtherTabsButton.addEventListener('click', () => {
    chrome.storage.sync.get({ domainGroups: [] }, (items) => {
      const activeDomains = items.domainGroups
        .filter(group => group.active)
        .flatMap(group => group.domains);

      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          const url = new URL(tab.url);
          if (!activeDomains.some(domain => url.hostname.includes(domain))) {
            chrome.tabs.remove(tab.id);
          }
        });
      });

      setTimeout(refreshControls, 500); // Delay to allow tabs to close
    });
  });
  closeOtherTabsButtonDiv.appendChild(closeOtherTabsButton);

  const closeButtonsDiv = document.getElementById('closeButtons');
  closeButtonsDiv.innerHTML = ''; // Clear existing buttons

  const stickAllTabsDiv = document.getElementById('stickAllTabsDiv');
  stickAllTabsDiv.innerHTML = '';

  chrome.windows.getAll({}, (windows) => {
    if (windows.length > 1) {
      const moveTabsButton = document.createElement('button');
      moveTabsButton.textContent = `Merge Tabs from All(${windows.length}) Windows`;
      moveTabsButton.classList.add('move-tabs-button');
      moveTabsButton.addEventListener('click', moveAllTabsToOneWindow);
      stickAllTabsDiv.appendChild(moveTabsButton);
    }
  });

  getGroupNamesFromStorage((groupNames) => {
    let totalTabCount = 0;
    let processedGroups = 0;
    let domainsCollected = 0;
    const allActiveDomains = [];

    if (groupNames.length === 0) {
      // If no groups, count all tabs as ungrouped
      chrome.tabs.query({}, (tabs) => {
        const ungroupedCount = tabs.length;
        closeOtherTabsButton.textContent = `Close Other (${ungroupedCount}) Tabs`;
        closeOtherTabsButton.disabled = ungroupedCount === 0;
        closeAllTabsButton.disabled = true;
      });
      return;
    }

    // Helper function to count ungrouped tabs once all data is collected
    const countUngroupedTabs = () => {
      if (domainsCollected === groupNames.length && processedGroups === groupNames.length) {
        chrome.tabs.query({}, (tabs) => {
          let ungroupedTabCount = 0;
          tabs.forEach(tab => {
            try {
              const url = new URL(tab.url);
              const matchesGroup = allActiveDomains.some(domain => 
                !!domain && url.hostname.includes(domain)
              );
              if (!matchesGroup) {
                ungroupedTabCount++;
              }
            } catch (e) {
              // Skip tabs with invalid URLs (like chrome:// or about:)
            }
          });

          closeOtherTabsButton.textContent = `Close Other (${ungroupedTabCount}) Tabs`;
          closeOtherTabsButton.disabled = ungroupedTabCount === 0;
        });
      }
    };

    groupNames.forEach(groupName => {
      getDomainsFromStorage(groupName, (domains) => {
        // Collect all active domains
        allActiveDomains.push(...domains);
        domainsCollected++;
        countUngroupedTabs(); // Check if we can count now

        countTabsWithDomains(domains, (count) => {
          totalTabCount += count;
          processedGroups++;

          const groupNameElement = document.createElement('span');
          groupNameElement.textContent = `${groupName} (${count})`;
          groupNameElement.className = 'group-name';

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            const url = new URL(currentTab.url);
            const domain = url.hostname;

            if (domains.includes(domain)) {
              groupNameElement.classList.add('highlight');
            }

            const button = addOrRemoveButton(groupName, domain, domains);
            const closeGroupButton = document.createElement('button');
            closeGroupButton.className = 'close-group-button';
            closeGroupButton.innerHTML = `✕`;
            closeGroupButton.title = `Close ${count} tabs`;
            closeGroupButton.addEventListener('click', () => {
              closeTabsForGroupName(groupName);
              setTimeout(refreshControls, 500); // Delay to allow tabs to close
            });

            const groupElement = document.createElement('div');
            groupElement.className = 'group-count';

            groupElement.appendChild(groupNameElement);
            groupElement.appendChild(button);
            groupElement.appendChild(closeGroupButton);

            closeButtonsDiv.appendChild(groupElement);

            // Enable the "Close All" button if there are any tabs
            closeAllTabsButton.disabled = totalTabCount === 0;

            // Count ungrouped tabs after all groups are processed
            countUngroupedTabs();
          });
        });
      });
    });
  });
};

// Add buttons when the popup is loaded
document.addEventListener('DOMContentLoaded', refreshControls);