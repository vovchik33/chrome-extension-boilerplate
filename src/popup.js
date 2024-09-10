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
      if (domains.some(domain => url.hostname.indexOf(domain) !== -1)) {
        count++;
      }
    });

    callback(count);
  });
}

// Function to update button text with current tab counts
function updateButtonCounts() {
  const closeAllButtonDiv = document.getElementById('closeAllDiv');
  closeAllButtonDiv.innerHTML = ''; // Clear existing buttons

  // Add "Close All" button
  const closeAllButton = document.createElement('button');
  closeAllButton.textContent = 'Close All';
  closeAllButton.id = 'closeAllButton';
  closeAllButton.disabled = true; // Initially disable the button
  closeAllButton.addEventListener('click', () => {
    chrome.storage.sync.get({ domainGroups: [] }, (items) => {
      const domainGroups = items.domainGroups;

      domainGroups.forEach(group => {
        if (group.active) {
          closeTabsForGroupName(group.name);
        }
      });

      setTimeout(updateButtonCounts, 500); // Delay to allow tabs to close
    });
  });
  closeAllButtonDiv.appendChild(closeAllButton);

  const closeOtherButtonDiv = document.getElementById('closeOtherDiv');
  closeOtherButtonDiv.innerHTML = ''; // Clear existing buttons

  // Add "Close Other" button
  const closeOtherButton = document.createElement('button');
  closeOtherButton.textContent = 'Close Other';
  closeOtherButton.id = 'closeOtherButton';
  closeOtherButton.disabled = false; // Initially disable the button but TODO: Enable it when there are tabs without group
  closeOtherButton.addEventListener('click', () => {
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

      setTimeout(updateButtonCounts, 500); // Delay to allow tabs to close
    });
  });
  closeOtherButtonDiv.appendChild(closeOtherButton);

  const closeButtonsDiv = document.getElementById('closeButtons');
  closeButtonsDiv.innerHTML = ''; // Clear existing buttons

  getGroupNamesFromStorage((groupNames) => {
    let totalTabCount = 0;

    groupNames.forEach(name => {
      getDomainsFromStorage(name, (domains) => {
        countTabsWithDomains(domains, (count) => {
          totalTabCount += count;

          const button = document.createElement('button');
          button.textContent = `Close ${name} (${count})`;
          button.addEventListener('click', () => {
            closeTabsForGroupName(name);
            setTimeout(updateButtonCounts, 500); // Delay to allow tabs to close
          });
          closeButtonsDiv.appendChild(button);

          // Enable the "Close All" and "Close Other" buttons if there are any tabs
          closeAllButton.disabled = totalTabCount === 0;
          closeOtherButton.disabled = false; // TODO check calculations
        });
      });
    });
  });
}

// Function to create and add buttons
function addButtons() {
  updateButtonCounts(); // Initial call to add buttons with counts
}

// Add buttons when the popup is loaded
document.addEventListener('DOMContentLoaded', addButtons);