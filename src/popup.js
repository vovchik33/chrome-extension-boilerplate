document.getElementById('openOptionsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Function to check if a hostname matches a domain pattern
// Supports:
// - Exact match: "google.com" matches "google.com" and "www.google.com"
// - Subdomain wildcard: "*.google.com" matches "gemini.google.com", "maps.google.com", etc.
// - TLD wildcard: "*.com" matches all .com domains
// - Universal wildcard: "*" matches all domains
function hostnameMatchesDomain(hostname, domain) {
  if (!hostname || !domain) return false;
  
  // Universal wildcard - matches everything
  if (domain === '*') return true;
  
  // Remove optional 'www.' prefix for comparison
  const normalizedHostname = hostname.replace(/^www\./, '');
  let normalizedDomain = domain.replace(/^www\./, '');
  
  // Handle wildcard patterns
  if (normalizedDomain.startsWith('*.')) {
    // Pattern like "*.google.com" - match all subdomains
    const baseDomain = normalizedDomain.substring(2); // Remove "*. "
    
    // Check if hostname is the base domain itself or any subdomain
    if (normalizedHostname === baseDomain) return true;
    if (normalizedHostname.endsWith('.' + baseDomain)) return true;
    
    return false;
  }
  
  // Exact match (no wildcards)
  if (normalizedHostname === normalizedDomain) return true;
  
  return false;
}

// Function to close tabs with a specific domain
function closeTabsWithDomain(domain) {
  // alert(domain);
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(tab => {
      const url = new URL(tab.url);
      if (hostnameMatchesDomain(url.hostname, domain)) {
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
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })) // Sort alphabetically
      : [];
    callback(groupNames);
  });
}

// Function to count tabs with specific domains
function countTabsWithDomains(domains, callback) {
  chrome.tabs.query({}, (tabs) => {
    let count = 0;

    tabs.forEach((tab) => {
      try {
        const url = new URL(tab.url);
        if (!!url.hostname && domains.some(domain => !!domain && hostnameMatchesDomain(url.hostname, domain))) {
          count++;
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });

    callback(count);
  });
}

const addOrRemoveButton = (groupName, domain, domains) => {
  const button = document.createElement('button');
  // Check if domain matches any domain in the group (handles www.domain vs domain)
  const domainKnown = domains.some(d => d && hostnameMatchesDomain(domain, d));

  if (domainKnown) {
    button.className = 'remove-from-group-button';
    button.innerHTML = '-';
    button.title = 'Remove domain from this group';
  } else {
    button.className = 'add-current-tab-button';
    button.innerHTML = '+';
    button.title = 'Add current domain to this group';
  }


  button.addEventListener('click', () => {
    chrome.storage.sync.get({ domainGroups: [] }, (items) => {
      const groups = items.domainGroups;
      const groupIdx = groups.findIndex(group => group.name === groupName);

      if (groupIdx !== -1) {
        // Find the matching domain (could be www.domain or domain)
        const matchingDomain = domains.find(d => d && hostnameMatchesDomain(domain, d));
        if (matchingDomain) {
          // Remove domain from group (remove the exact domain stored in the group)
          groups[groupIdx].domains = groups[groupIdx].domains.filter(d => d !== matchingDomain);
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

// Function to move tabs matching a group to a new window
function moveGroupTabsToNewWindow(groupName) {
  getDomainsFromStorage(groupName, (domains) => {
    chrome.tabs.query({}, (allTabs) => {
      const matchingTabs = allTabs.filter(tab => {
        try {
          // Skip empty or system tabs (chrome://, about:, etc.)
          if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
            return false;
          }
          const url = new URL(tab.url);
          // Skip tabs without hostname or empty hostname
          if (!url.hostname || url.hostname.trim() === '') {
            return false;
          }
          return domains.some(domain => !!domain && hostnameMatchesDomain(url.hostname, domain));
        } catch (e) {
          return false; // Skip invalid URLs
        }
      });

      if (matchingTabs.length === 0) {
        return; // No matching tabs to move
      }

      const tabIds = matchingTabs.map(tab => tab.id);
      
      // Create new window and move tabs to it
      chrome.windows.create({}, (newWindow) => {
        // Get all tabs in the new window to find and remove the empty initial tab
        chrome.tabs.query({ windowId: newWindow.id }, (windowTabs) => {
          // Find the empty tab (usually chrome://newtab/ or about:newtab)
          const emptyTab = windowTabs.find(tab => 
            !tab.url || 
            tab.url === 'chrome://newtab/' || 
            tab.url === 'about:newtab' ||
            tab.url.startsWith('chrome://newtab') ||
            tab.url.startsWith('about:newtab')
          );
          
          // Move tabs to the new window
          chrome.tabs.move(tabIds, { windowId: newWindow.id, index: -1 }, () => {
            // Remove the empty tab after moving (if it still exists and tabs were moved successfully)
            if (emptyTab && tabIds.length > 0) {
              chrome.tabs.remove(emptyTab.id);
            }
            setTimeout(refreshControls, 500); // Refresh to update counts
          });
        });
      });
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
  closeAllTabsButtonDiv.appendChild(closeAllTabsButton);

  const closeOtherTabsButtonDiv = document.getElementById('closeOtherDiv');
  closeOtherTabsButtonDiv.innerHTML = ''; // Clear existing buttons

  // Add "Close Other" button (will be hidden if no domains exist)
  const closeOtherTabsButton = document.createElement('button');
  closeOtherTabsButton.classList.add('close-other-tabs-button');
  closeOtherTabsButton.disabled = false;
  // Event listener will be added conditionally in checkForDomains callback

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

    // Check if there are any domains in active groups
    const checkForDomains = (callback) => {
      if (groupNames.length === 0) {
        callback(false);
        return;
      }

      let checkedGroups = 0;
      let hasAnyDomains = false;

      groupNames.forEach(groupName => {
        getDomainsFromStorage(groupName, (domains) => {
          if (domains.length > 0) {
            hasAnyDomains = true;
          }
          checkedGroups++;
          if (checkedGroups === groupNames.length) {
            callback(hasAnyDomains);
          }
        });
      });
    };

    checkForDomains((hasDomains) => {
      if (!hasDomains) {
        // No domains exist - hide "Close Other" button and enable "Close All" to close all tabs
        closeOtherTabsButtonDiv.style.display = 'none';
        
        chrome.tabs.query({}, (tabs) => {
          const totalTabs = tabs.length;
          
          // Update click handler to close ALL tabs without filtering
          const newCloseAllButton = closeAllTabsButton.cloneNode(true);
          newCloseAllButton.textContent = 'Close All Tabs';
          newCloseAllButton.disabled = totalTabs === 0;
          newCloseAllButton.addEventListener('click', () => {
            chrome.tabs.query({}, (allTabs) => {
              allTabs.forEach(tab => {
                chrome.tabs.remove(tab.id);
              });
              setTimeout(refreshControls, 500);
            });
          });
          closeAllTabsButtonDiv.replaceChild(newCloseAllButton, closeAllTabsButton);
        });
        return; // Early return - don't process groups when no domains exist
      }

      // Domains exist - show "Close Other" button and use filtered behavior
      closeOtherTabsButtonDiv.style.display = '';
      closeOtherTabsButtonDiv.appendChild(closeOtherTabsButton);
      
      // Set up "Close All" button to close only grouped tabs
      const newCloseAllButton = closeAllTabsButton.cloneNode(true);
      // Text will be updated when we know if there are groups with tabs
      newCloseAllButton.textContent = 'Close All Tabs';
      newCloseAllButton.disabled = true;
      newCloseAllButton.addEventListener('click', () => {
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

      // Set up "Close Other" button handler
      closeOtherTabsButton.addEventListener('click', () => {
        chrome.storage.sync.get({ domainGroups: [] }, (items) => {
          const activeDomains = items.domainGroups
            .filter(group => group.active)
            .flatMap(group => group.domains);

          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              try {
                const url = new URL(tab.url);
                if (!activeDomains.some(domain => hostnameMatchesDomain(url.hostname, domain))) {
                  chrome.tabs.remove(tab.id);
                }
              } catch (e) {
                // Skip invalid URLs
              }
            });
          });

          setTimeout(refreshControls, 500); // Delay to allow tabs to close
        });
      });
      closeAllTabsButtonDiv.replaceChild(newCloseAllButton, closeAllTabsButton);
    });

    if (groupNames.length === 0) {
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
                !!domain && hostnameMatchesDomain(url.hostname, domain)
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

            // Check if domain matches any domain in the group (handles www.domain vs domain)
            if (domains.some(d => d && hostnameMatchesDomain(domain, d))) {
              groupNameElement.classList.add('highlight');
            }

            const button = addOrRemoveButton(groupName, domain, domains);
            
            const closeGroupButton = document.createElement('button');
            closeGroupButton.className = 'close-group-button';
            closeGroupButton.innerHTML = `✕`;
            closeGroupButton.title = `Close all ${count} tabs matching this group's domains`;
            closeGroupButton.addEventListener('click', () => {
              closeTabsForGroupName(groupName);
              setTimeout(refreshControls, 500); // Delay to allow tabs to close
            });
            
            // Add "Move to Window" button
            const moveToWindowButton = document.createElement('button');
            moveToWindowButton.className = 'move-group-button';
            moveToWindowButton.innerHTML = `↗`; // Up-right arrow icon
            moveToWindowButton.title = `Move ${count} tabs to new window`;
            moveToWindowButton.disabled = count === 0;
            moveToWindowButton.addEventListener('click', () => {
              moveGroupTabsToNewWindow(groupName);
            });

            const groupElement = document.createElement('div');
            groupElement.className = 'group-count';

            groupElement.appendChild(groupNameElement);
            groupElement.appendChild(button);
            groupElement.appendChild(closeGroupButton);
            groupElement.appendChild(moveToWindowButton);

            closeButtonsDiv.appendChild(groupElement);

            // Enable the "Close All" button if there are any matching tabs
            const closeAllButton = closeAllTabsButtonDiv.querySelector('.close-all-tabs-button');
            if (closeAllButton) {
              closeAllButton.disabled = totalTabCount === 0;
              // Update button text to "Close All Tabs in Groups" if there are groups with tabs
              if (totalTabCount > 0) {
                closeAllButton.textContent = 'Close All Tabs in Groups';
              } else {
                closeAllButton.textContent = 'Close All Tabs';
              }
            }

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