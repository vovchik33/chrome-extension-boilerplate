// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = (defaultGroups = []) => {
  chrome.storage.sync.get(
    { domainGroups: defaultGroups },
    (items) => {
      restoreGroups(items.domainGroups);
    }
  );
};

const checkInputs = () => {
  const groupName = document.getElementById('groupName').value.trim();
  const groupDomains = document.getElementById('groupDomains').value.trim();
  const addGroupButton = document.getElementById('addGroupButton');

  addGroupButton.disabled = !groupName || !groupDomains;
};

const clearEditor = () => {
  document.getElementById('groupName').value = '';
  document.getElementById('groupDomains').value = '';
  document.getElementById('groupActive').checked = false;
  document.getElementById('addGroupButton').textContent = 'Add Group'; // Change button text back to "Add Group"
  checkInputs(); // Check inputs to disable the button if necessary
};

const addGroup = () => {
  const groupName = document.getElementById('groupName').value;
  const groupDomains = document.getElementById('groupDomains').value.split(',').map(d => d.trim());
  const groupActive = document.getElementById('groupActive').checked; // Get the active checkbox value

  chrome.storage.sync.get({ domainGroups: [] }, (items) => {
    const domainGroups = items.domainGroups;

    if (selectedIndex > -1) {
      // Update existing group
      domainGroups[selectedIndex] = { name: groupName, domains: groupDomains, active: groupActive };
      selectedIndex = -1; // Reset selected index
    } else {
      // Add new group
      domainGroups.push({ name: groupName, domains: groupDomains, active: groupActive });
    }

    chrome.storage.sync.set({ domainGroups: domainGroups }, () => {
      restoreGroups(domainGroups);
      clearEditor(); // Clear the editor fields
    });
  });
};

let selectedIndex = -1; // Variable to store the selected index

const populateEditor = (group) => {
  document.getElementById('groupName').value = group.name;
  document.getElementById('groupDomains').value = group.domains.join(', ');
  document.getElementById('groupActive').checked = group.active; // Set the active checkbox
  document.getElementById('addGroupButton').textContent = 'Update Group'; // Change button text to "Update Group"

  checkInputs();
};

// Restores the list of domain groups
const restoreGroups = (groups) => {
  const groupsList = document.getElementById('groupsList');
  groupsList.innerHTML = '';

  groups.forEach((group, index) => {
    const li = document.createElement('li');

    const div = document.createElement('div');
    div.className = 'group-item';
    div.addEventListener('click', () => {
      document.querySelectorAll('.group-item').forEach(item => item.classList.remove('selected'));
      div.classList.add('selected');
      populateEditor(group);
      selectedIndex = index; // Update the selected index
    });

    const checkbox = document.createElement('input');
    checkbox.className = 'group-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = group.active;

    // Add event listener to handle checkbox state change
    checkbox.addEventListener('click', (event  ) => {
      event.stopPropagation(); // Prevent click event from bubbling up
    });

    // Add event listener to handle checkbox state change
    checkbox.addEventListener('change', (event  ) => {
      group.active = checkbox.checked;
      chrome.storage.sync.get({ domainGroups: [] }, (items) => {
        const domainGroups = items.domainGroups.map(g => g.name === group.name ? group : g);
        chrome.storage.sync.set({ domainGroups: domainGroups });
      });
    });

    const label = document.createElement('label');
    label.className = 'group-label';
    label.textContent = `${group.name}: ${group.domains.join(', ')}`;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '&#x2715;';
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent click event from bubbling up
      clearEditor(); // Clear the editor fields

      chrome.storage.sync.get({ domainGroups: [] }, (items) => {
        const domainGroups = items.domainGroups.filter(g => g.name !== group.name);
        chrome.storage.sync.set({ domainGroups: domainGroups }, () => {
          restoreGroups(domainGroups);
        });
      });
    });

    div.appendChild(checkbox);
    div.appendChild(label);
    div.appendChild(deleteButton);
    li.appendChild(div);
    groupsList.appendChild(li);
  });
};

// Clears all saved options
const clearOptions = () => {
  clearEditor();

  chrome.storage.sync.clear(() => {
    restoreOptions([]);
  });
};

// Sets recommended options
const useRecommended = () => {
  const recommendedGroups = [
    { active: true, name: 'Email', domains: ['gmail', 'mail', 'yahoo', 'outlook', 'mail.ru', 'aol', 'icloud', 'protonmail', 'zoho', 'yandex', 'tutanota', 'fastmail'] },
    { active: true, name: 'Social Media', domains: ['chatgpt', 'coursehunter', 'facebook', 'x', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube', 'snapchat', 'pinterest', 'reddit', 'tumblr', 'vimeo', 'telegram'] },
    { active: true, name: 'News', domains: ['kyivpost', 'pravda.ua', 'unian.info', 'ukrinform.net', '112.international', 'interfax.ua', 'lb.ua', 'zn.ua', 'segodnya.ua', 'nv.ua', 'obozrevatel'] },
    { active: true, name: 'Shopping', domains: ['amazon', 'ebay', 'walmart', 'target', 'aliexpress', 'etsy', 'bestbuy', 'homedepot', 'wayfair', 'macys'] },
    { active: true, name: 'Work', domains: ['microsoftonline', 'tlnlive.ptec', 'bitbucket', 'localhost', 'stackoverflow', 'slack', 'trello', 'asana', 'jira', 'confluence', 'zoom.us', 'webex', 'gotomeeting', 'skype', 'microsoftteams', 'stash', 'figma'] },
    { active: true, name: 'Entertainment', domains: ['football', 'netflix', 'hulu', 'disneyplus', 'hbomax', 'primevideo', 'youtube', 'twitch', 'vimeo', 'dailymotion', 'funnyordie'] },
    { active: true, name: 'Google', domains: ['google', 'gmail', 'youtube', 'drive', 'maps', 'translate', 'photos', 'calendar', 'meet', 'keep', 'news'] },
  ];
  chrome.storage.sync.set({ domainGroups: recommendedGroups }, () => {
    restoreGroups(recommendedGroups);
  });
};

// Function to export group data
const exportGroups = () => {
  chrome.storage.sync.get({ domainGroups: [] }, (items) => {
    const domainGroups = items.domainGroups;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(domainGroups, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "domain-groups-config.json");
    document.body.appendChild(downloadAnchorNode); // Required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });
};

// Function to import group data
const importGroups = (event) => {
  let file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedGroups = JSON.parse(e.target.result);
        chrome.storage.sync.get({ domainGroups: [] }, (items) => {
          const groupMap = new Map();

          // Add existing groups to the map
          items.domainGroups.forEach(group => {
            groupMap.set(group.name, group);
          });

          // Merge imported groups into the map
          importedGroups.forEach(importedGroup => {
            if (groupMap.has(importedGroup.name)) {
              const existingGroup = groupMap.get(importedGroup.name);
              existingGroup.domains = Array.from(new Set([...existingGroup.domains, ...importedGroup.domains]));
              existingGroup.active = importedGroup.active; // Update the active status if needed
            } else {
              groupMap.set(importedGroup.name, importedGroup);
            }
          });

          // Convert the map back to an array
          const groups = Array.from(groupMap.values());

          chrome.storage.sync.set({ domainGroups: groups }, () => {
            restoreGroups(groups);
          });
        });
      } catch (error) {
        console.error('Error parsing imported file:', error);
      } finally {
        // Unload the file after reading
        file = null;
        event.target.value = ''; // Reset the input value to allow re-uploading the same file
      }
    };
    reader.readAsText(file);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  checkInputs(); // Initial check to disable the button if necessary
});

document.getElementById('groupName').addEventListener('input', checkInputs);
document.getElementById('groupDomains').addEventListener('input', checkInputs);
document.getElementById('addGroupButton').addEventListener('click', addGroup);
document.getElementById('clearOptionsButton').addEventListener('click', clearOptions);
document.getElementById('useRecommendedButton').addEventListener('click', useRecommended);
document.getElementById('exportGroupsButton').addEventListener('click', exportGroups); // Add event listener for export button
document.getElementById('importGroupsButton').addEventListener('click', () => document.getElementById('importGroupsInput').click()); // Trigger file input click
document.getElementById('importGroupsInput').addEventListener('change', importGroups); // Add event listener for file input change
