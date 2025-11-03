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
  // const groupDomains = document.getElementById('groupDomains').value.trim();
  const addGroupButton = document.getElementById('addGroupButton');

  addGroupButton.disabled = !groupName; // Check we should be able to add empty group || !groupDomains;
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
  const groupDomains = document.getElementById('groupDomains').value
    .split(',')
    .map(d => d.trim())
    .filter(i => !!i);
  const groupActive = document.getElementById('groupActive'); // Get the active checkbox value

  chrome.storage.sync.get({ domainGroups: [] }, (items) => {
    const domainGroups = items.domainGroups;

    if (selectedIndex > -1) {
      // Update existing group
      domainGroups[selectedIndex] = { name: groupName, domains: groupDomains, active: groupActive.checked };
      selectedIndex = -1; // Reset selected index
    } else {
      // Add new group
      domainGroups.push({ name: groupName, domains: groupDomains, active: groupActive.checked });
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

  // Sort groups alphabetically by name
  const sortedGroups = [...groups].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  sortedGroups.forEach((group, index) => {
    // Find the original index in the unsorted array for updating
    const originalIndex = groups.findIndex(g => g.name === group.name);
    const li = document.createElement('li');

    const div = document.createElement('div');
    div.className = 'group-item';
    div.addEventListener('click', () => {
      document.querySelectorAll('.group-item').forEach(item => item.classList.remove('selected'));
      div.classList.add('selected');
      populateEditor(group);
      selectedIndex = originalIndex; // Update the selected index using original position
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
    { active: true, name: 'Search Engines', domains: ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com', 'yandex.com'] },
    { active: true, name: 'Email Services', domains: ['gmail.com', 'mail.google.com', 'outlook.com', 'outlook.live.com', 'hotmail.com', 'yahoo.com', 'mail.yahoo.com', 'mail.com', 'protonmail.com', 'proton.me', 'icloud.com', 'mail.icloud.com', 'aol.com', 'mail.aol.com', 'zoho.com', 'mail.zoho.com', 'yandex.com', 'mail.yandex.com', 'mail.ru', 'gmx.com', 'mail.gmx.com', 'fastmail.com', 'tutanota.com', 'mail.tutanota.com'] },
    { active: true, name: 'Social Media', domains: ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'youtube.com', 'reddit.com', 'pinterest.com', 'snapchat.com', 'whatsapp.com', 'telegram.org', 'discord.com', 'twitch.tv', 'tumblr.com'] },
    { active: true, name: 'E-commerce', domains: ['amazon.com', 'ebay.com', 'aliexpress.com', 'walmart.com', 'target.com', 'etsy.com', 'shopify.com', 'rakuten.com', 'mercadolivre.com', 'flipkart.com', 'taobao.com', 'jd.com'] },
    { active: true, name: 'News & Media', domains: ['bbc.com', 'cnn.com', 'nytimes.com', 'theguardian.com', 'reuters.com', 'bloomberg.com', 'wsj.com', 'washingtonpost.com', 'usatoday.com', 'ap.org', 'npr.org', 'forbes.com'] },
    { active: true, name: 'Cloud Storage', domains: ['drive.google.com', 'dropbox.com', 'onedrive.com', 'icloud.com', 'box.com', 'mega.nz', 'pcloud.com', 'mediafire.com'] },
    { active: true, name: 'Video Streaming', domains: ['youtube.com', 'netflix.com', 'amazon.com/prime', 'primevideo.com', 'disney.com', 'disneyplus.com', 'hulu.com', 'hbo.com', 'hbomax.com', 'paramountplus.com', 'peacocktv.com', 'vimeo.com', 'dailymotion.com'] },
    { active: true, name: 'Music Streaming', domains: ['spotify.com', 'youtube.com/music', 'apple.com/music', 'soundcloud.com', 'pandora.com', 'deezer.com', 'tidal.com', 'bandcamp.com'] },
    { active: true, name: 'Educational Resources', domains: ['coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'udacity.com', 'codecademy.com', 'pluralsight.com', 'linkedin.com/learning', 'skillshare.com', 'masterclass.com', 'lynda.com', 'futurelearn.com', 'mit.edu', 'stanford.edu', 'harvard.edu', 'freecodecamp.org', 'w3schools.com', 'mdn.com'] },
    { active: true, name: 'AI & Machine Learning', domains: ['openai.com', 'chatgpt.com', 'claude.ai', 'anthropic.com', 'ai.google.com', 'gemini.google.com', 'bard.google.com', 'perplexity.ai', 'copilot.microsoft.com', 'github.com/copilot', 'cursor.sh', 'character.ai', 'groq.com', 'jasper.ai', 'notion.ai', 'midjourney.com', 'stability.ai', 'runwayml.com', 'leonardo.ai', 'dalle.openai.com', 'replicate.com', 'huggingface.co', 'kaggle.com', 'tensorflow.org', 'pytorch.org', 'paperswithcode.com', 'together.ai', 'mistral.ai'] },
    { active: true, name: 'Productivity Tools', domains: ['office.com', 'microsoft.com', 'docs.google.com', 'sheets.google.com', 'slides.google.com', 'notion.so', 'trello.com', 'asana.com', 'monday.com', 'slack.com', 'zoom.us', 'webex.com', 'microsoftteams.com'] },
    { active: true, name: 'Design Tools', domains: ['figma.com', 'adobe.com', 'sketch.com', 'canva.com', 'invisionapp.com', 'framer.com', 'penpot.app', 'whimsical.com', 'miro.com', 'dribbble.com', 'behance.net', 'ui8.net', 'unsplash.com', 'pexels.com', 'pixabay.com'] },
    { active: true, name: 'Development', domains: ['github.com', 'gitlab.com', 'bitbucket.org', 'atlassian.com', 'jira.com', 'confluence.com', 'stackoverflow.com', 'stackexchange.com', 'npmjs.com', 'docker.com', 'kubernetes.io', 'aws.amazon.com', 'azure.microsoft.com', 'cloud.google.com', 'vercel.com', 'netlify.com', 'heroku.com', 'circleci.com', 'jenkins.io', 'travis-ci.com', 'codecov.io', 'sonarqube.org'] },
    { active: true, name: 'Sports', domains: ['espn.com', 'sports.yahoo.com', 'nba.com', 'nfl.com', 'nhl.com', 'mlb.com', 'fifa.com', 'uefa.com', 'skysports.com', 'bleacherreport.com', 'theathletic.com', 'sportsnet.ca', 'bbc.com/sport', 'goal.com', 'sportingnews.com', 'cbssports.com', 'foxsports.com', 'nbcsports.com'] },
    { active: true, name: 'Art & Culture', domains: ['deviantart.com', 'artstation.com', 'behance.net', 'dribbble.com', 'pinterest.com', 'artsy.net', 'saatchiart.com', 'artnet.com', 'moma.org', 'metmuseum.org', 'tate.org.uk', 'louvre.fr', 'guggenheim.org', 'museodelprado.es', 'rijksmuseum.nl', 'smithsonianmag.com', 'nationalgeographic.com', 'artsy.com'] },
    { active: true, name: 'Banking & Finance', domains: ['paypal.com', 'stripe.com', 'visa.com', 'mastercard.com', 'americanexpress.com', 'coinbase.com', 'binance.com', 'robinhood.com', 'schwab.com', 'fidelity.com'] },
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
