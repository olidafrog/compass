// ---------------- Load Tokens

// Function to load JSON from a given path
function loadJSON(path) {
  return fetch(path)
    .then(response => response.json())
    .catch(error => {
      console.error(`Error loading JSON from ${path}:`, error);
      return [];
    });
}

// Function to initialize the token object from local storage or a default template
function initializeTokenObject() {
  var tokenObjectString = localStorage.getItem('tokenObject');
  if (tokenObjectString) {
    return Promise.resolve(JSON.parse(tokenObjectString));
  } else {
    return loadJSON('js/defaultTemplate.json').then(defaultTemplate => {
      localStorage.setItem('tokenObject', JSON.stringify(defaultTemplate));
      return defaultTemplate;
    });
  }
}

// Function to populate the token UI
function populateUI(tokenObject) {
  var container = document.querySelector('.token-list-container');
  container.innerHTML = '';

  tokenObject.forEach(function(item, index) {
    var tokenContainer = document.createElement('div');
    tokenContainer.className = 'token-container';

    var content = `
      <div class="token-content">
        <form class="form">
          <div class="label-wrapper"><label class="text-label">${item.label}</label>
            <div class="text-subcopy">${item.description}</div>
          </div><input type="text" class="token-value-input" maxlength="256" placeholder="Create a token" value="${item.token}">
        </form>
      </div>`;

    tokenContainer.innerHTML = content;
    container.appendChild(tokenContainer);

    tokenContainer.querySelector('.token-value-input').addEventListener('input', function() {
      tokenObject[index].token = this.value;
      localStorage.setItem('tokenObject', JSON.stringify(tokenObject));
    });
  });
}

// --------------- Parameters ----------

// Function to populate the parameters UI
function populateParametersUI(parameters) {
  var parametersContainer = document.getElementById('parameters-container');
  parametersContainer.innerHTML = ''; // Clear existing content

  parameters.forEach(function(parameter) {
    var inputHtml = '';
    if (parameter['input type'] === 'select from array') {
      inputHtml = `<select id="${parameter.label}">${parameter['value range']
        .split(',')
        .map(optionValue => `<option value="${optionValue}">${optionValue}</option>`)
        .join('')}</select>`;
    } else if (parameter['input type'] === 'integer') {
      inputHtml = `<input type="number" id="${parameter.label}" min="${parameter['value range'].split('–')[0]}" max="${parameter['value range'].split('–')[1]}" value="${parameter['default value']}">`;
    } else if (parameter['input type'] === 'boolean') {
      inputHtml = `<input type="checkbox" id="${parameter.label}" ${parameter['default value'] === 'true' ? 'checked' : ''}>`;
    }

    var containerHtml = `
      <div class="parameter" id="${parameter.label}-container">
      <div class="label-wrapper">
        <label class="text-label" for="${parameter.label}">${parameter.label.charAt(0).toUpperCase() + parameter.label.slice(1)}</label>
        <div class="text-subcopy">${parameter.description}</div>
        <div class="value-range">${parameter['value range']}</div>
       <div class="default-value">${parameter['default value']}</div>
       </div>
        ${inputHtml}
      </div>`;

    parametersContainer.innerHTML += containerHtml;
  });
}

// Function to initialize the parameters from local storage or a default template
function initializeParameters() {
  return loadJSON('./js/parameters.json').then(parameters => {
    populateParametersUI(parameters);
  });
}

/// ----------------- Generate output ------------

// Function to generate token prompt
function generateTokenPrompt() {
  var tokenObjectString = localStorage.getItem('tokenObject');
  var tokenObject = JSON.parse(tokenObjectString);
  return tokenObject
    .map(item => item.token)
    .filter(token => token && token.trim() !== '')
    .join(', ');
}

// Function to generate parameters
function generateParameters() {
  return loadJSON('./js/parameters.json').then(parameters => {
    return parameters
      .map(param => {
        var inputElement = document.getElementById(param.label);
        var value;
        if (inputElement.type === 'checkbox') {
          value = inputElement.checked.toString();
        } else {
          value = inputElement.value;
        }

        // Only output the parameter if it has been modified from the default value
        if (value !== param['default value']) {
          // For boolean parameters, only output the 'output command' value, not 'true' or 'false'
          if (param['input type'] === 'boolean') {
            return param['output command'];
          }
          // For 'select from an array' and other types, include the value
          return `${param['output command']} ${value}`;
        }
      })
      .filter(param => param) // Remove undefined values
      .join(' ');
  });
}

// Include parameters and tokens in output
document.getElementById('generate-btn').addEventListener('click', function() {
  var tokenPrompt = generateTokenPrompt();

  generateParameters().then(params => {
    document.getElementById('outputPromptTextBox').value = `${tokenPrompt} ${params}`;
  });
});



// Copy prompt to clipboard button
document.getElementById('copyPromptBtn').addEventListener('click', function() {
  var copyText = document.getElementById('outputPromptTextBox').value;
  
  navigator.clipboard.writeText(copyText)
    .then(() => {
      alert('Copied the text: ' + copyText);
    })
    .catch(err => {
      console.error('Could not copy text: ', err);
    });
});


// Clear local storage button
document.getElementById('clear-local').addEventListener('click', function() {
  localStorage.removeItem('tokenObject');
  localStorage.removeItem('parameters');
  initializeTokenObject().then(tokenObject => {
    populateUI(tokenObject);
  });
  initializeParameters(); // This will now clear the existing parameters and append the new ones
});

// Function to reset parameters to their default values
function resetParametersToDefault() {
  // Clear only the parameter-related fields from local storage
  localStorage.removeItem('parameters');

  // Re-initialize the parameters to reload the default values
  initializeParameters();
}

// Attach the reset function to the 'parameter-reset' button
document.getElementById('parameter-reset').addEventListener('click', function() {
  resetParametersToDefault();
});


// Initialize the UI
initializeTokenObject().then(tokenObject => {
  populateUI(tokenObject);
});
initializeParameters();
