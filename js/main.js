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

// Function to populate the UI
function populateUI(tokenObject) {
  var container = document.querySelector('.token-list-container');
  container.innerHTML = '';

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

    tokenContainer.querySelector('.token-value-input').addEventListener('input', function() {
      tokenObject[index].token = this.value;
      localStorage.setItem('tokenObject', JSON.stringify(tokenObject));
    });
  });
}

// Function to initialize the parameters from local storage or a default template
function initializeParameters() {
  return loadJSON('./js/parameters.json').then(parameters => {
    var parametersContainer = document.getElementById('parameters-container');

    if (!parametersContainer) {
      console.error('parameters-container not found in HTML');
      return;
    }

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
        <div id="${parameter.label}-container">
          <label for="${parameter.label}">${parameter.label.charAt(0).toUpperCase() + parameter.label.slice(1)}</label>
          <div class="parameter-description">${parameter.description}</div>
          <div class="value-range">${parameter['value range']}</div>
          <div class="default-value">${parameter['default value']}</div>
          ${inputHtml}
        </div>`;

      parametersContainer.innerHTML += containerHtml;
    });
  });
}

// Include parameters in output
document.getElementById('generate-btn').addEventListener('click', function() {
  var tokenObjectString = localStorage.getItem('tokenObject');
  var tokenObject = JSON.parse(tokenObjectString);
  var values = tokenObject
    .map(item => item.token)
    .filter(token => token && token.trim() !== '')
    .join(', ');

  var params = '';
  loadJSON('./js/parameters.json').then(parameters => {
    params = parameters
      .map(param => {
        var inputElement = document.getElementById(param.label);
        var value = inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value;
        if (value.toString() !== param['default value']) {
          return `${param['output command']} ${value}`;
        }
      })
      .filter(param => param)
      .join(' ');

    document.getElementById('outputPromptTextBox').value = `${values} ${params}`;
  });
});

// Clear local storage button
document.getElementById('clear-local').addEventListener('click', function() {
  localStorage.removeItem('tokenObject');
  localStorage.removeItem('parameters');
  initializeTokenObject().then(tokenObject => {
    populateUI(tokenObject);
  });
  initializeParameters();
});

// Initialize the UI
initializeTokenObject().then(tokenObject => {
  populateUI(tokenObject);
});
initializeParameters();
