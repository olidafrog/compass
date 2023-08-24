

// Function to load the default template from a JSON file
function loadDefaultTemplate() {
  return fetch('js/defaultTemplate.json')
    .then(response => response.json())
    .catch(error => {
      console.error('Error loading default template:', error);
      return []; // Return an empty array if the JSON file can't be loaded
    });
}

// Function to initialize the token object from local storage or a default template
function initializeTokenObject() {
  var tokenObjectString = localStorage.getItem('tokenObject');
  if (tokenObjectString) {
    return Promise.resolve(JSON.parse(tokenObjectString));
  } else {
    return loadDefaultTemplate().then(defaultTemplate => {
      localStorage.setItem('tokenObject', JSON.stringify(defaultTemplate));
      return defaultTemplate;
    });
  }
}

// Check if there's existing data in local storage
initializeTokenObject().then(tokenObject => {
  populateUI(tokenObject);
});

// Function to populate the UI
function populateUI(tokenObject) {
  var container = document.querySelector('.token-list-container');
  container.innerHTML = ''; // Clear existing content

  tokenObject.forEach(function(item, index) {
    var tokenContainer = document.createElement('div');
    tokenContainer.className = 'token-container';

    var content = `
      <div class="token-content">
        <form class="form">
          <div class="label-wrapper"><label class="token-label">${item.label}</label>
            <div class="token-description">${item.description}</div>
          </div><input type="text" class="token-value-input" maxlength="256" placeholder="Create a token" value="${item.token}">
        </form>
      </div>`;

    tokenContainer.innerHTML = content;
    container.appendChild(tokenContainer);

    // Add event listener to update token object and local storage
    tokenContainer.querySelector('.token-value-input').addEventListener('input', function() {
      tokenObject[index].token = this.value;
      localStorage.setItem('tokenObject', JSON.stringify(tokenObject));
    });
  });
}

// -------------- output functionality --------------

//Comma separate functionality
document.getElementById('generate-btn').addEventListener('click', function() {
  var tokenObjectString = localStorage.getItem('tokenObject');
  if (tokenObjectString) {
    var tokenObject = JSON.parse(tokenObjectString);
    // Filter out empty or blank values
    var values = tokenObject
      .map(item => item.token)
      .filter(token => token && token.trim() !== '')
      .join(', ');
    document.getElementById('outputPromptTextBox').value = values;
  } else {
    console.error('tokenObject not found in local storage');
  }
});


// ------------- Clear local storage button
document.getElementById('clear-local').addEventListener('click', function() {
  localStorage.removeItem('tokenObject');
  // Optionally, you can refresh the UI to reflect the cleared data
  initializeTokenObject().then(tokenObject => {
    populateUI(tokenObject);
  });
});