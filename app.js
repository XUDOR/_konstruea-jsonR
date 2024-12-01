// Parse CSV without using a library
function parseCSV(data) {
  const lines = data.split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1);

  return rows.map(row => {
      const values = row.split(',');
      let rowObject = {};

      headers.forEach((header, index) => {
          rowObject[header.trim()] = values[index] ? values[index].trim() : '';
      });

      return rowObject;
  });
}

// Create SVG placeholders based on CSV parameters
function createSVGPlaceholder(params) {
  const svgParams = Object.fromEntries(params.split(';').map(param => param.split('=').map(s => s.trim())));
  const svgElement = document.createElement('svg');
  svgElement.setAttribute('width', svgParams.width || '100');
  svgElement.setAttribute('height', svgParams.height || '100');
  svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgElement.style.backgroundColor = svgParams.color || '#ccc';

  const rect = document.createElement('rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', svgParams.color || '#ccc');

  svgElement.appendChild(rect);
  return svgElement;
}

// Create elements based on CSV data
function createElementFromData(row) {
  let element;

  // Determine the type of element to create
  switch (row.Type) {
      case 'nav-link':
          element = document.createElement('a');
          element.href = row.Link || '#';
          element.textContent = row.Content || '';
          break;
      case 'hero':
          element = document.createElement('div');
          element.classList.add('hero-section');
          element.textContent = row.Content || '';
          break;
      case 'paragraph':
          element = document.createElement('p');
          element.textContent = row.Content || '';
          break;
      case 'image':
          element = document.createElement('img');
          element.src = row['Image URL'] || '';
          break;
      case 'footer-link':
          element = document.createElement('a');
          element.href = row.Link || '#';
          element.textContent = row.Content || '';
          break;
      case 'svg-placeholder':
          element = createSVGPlaceholder(row['SVG Params']);
          break;
      case 'sub-container':
          element = document.createElement('div');
          element.classList.add(row['Style Classes']);
          break;
      default:
          element = document.createElement('div');
          element.textContent = row.Content || '';
          break;
  }

  // Apply style classes if provided
  if (row['Style Classes']) {
      element.className = row['Style Classes'];
  }

  // Apply inline CSS if specified
  if (row['Inline CSS']) {
      row['Inline CSS'].split(';').forEach(style => {
          const [property, value] = style.split(':');
          if (property && value) {
              element.style[property.trim()] = value.trim();
          }
      });
  }

  // Apply border properties if specified
  if (row['Border Width'] || row['Border Style'] || row['Border Color']) {
      element.style.border = `${row['Border Width'] || '1px'} ${row['Border Style'] || 'solid'} ${row['Border Color'] || '#000'}`;
  }

  // Apply JavaScript action if provided
  if (row['JavaScript Action']) {
      element.setAttribute('onclick', row['JavaScript Action']);
  }

  // Apply layout options
  if (row.Layout === 'grid') {
      element.style.display = 'grid';
      if (row.Columns) element.style.gridColumn = `span ${row.Columns}`;
  } else if (row.Layout === 'flex') {
      element.style.display = 'flex';
      if (row['Flex Properties']) {
          row['Flex Properties'].split(';').forEach(property => {
              const [key, value] = property.split(':');
              if (key && value) {
                  element.style[key.trim()] = value.trim();
              }
          });
      }
  }

  // Apply sticky positioning if specified
  if (row.Sticky && row.Sticky.toLowerCase() === 'yes') {
      element.style.position = 'sticky';
      element.style.top = '0';
  }

  return element;
}

// Render the generated elements
function renderElements(parsedData) {
  parsedData.forEach(row => {
      const element = createElementFromData(row);

      // Append elements based on section
      if (row.Section === 'Header') {
          document.querySelector('#header').appendChild(element);
      } else if (row.Section === 'Content') {
          document.querySelector('#content').appendChild(element);
      } else if (row.Section === 'Footer') {
          document.querySelector('#footer').appendChild(element);
      }
  });
}

// Main function to handle file upload and parsing
function generateWebsite() {
  const fileInput = document.getElementById('csv-upload');
  const file = fileInput.files[0];
  if (!file) return alert('Please upload a CSV file.');

  const reader = new FileReader();
  reader.onload = function(event) {
      const text = event.target.result;
      const parsedData = parseCSV(text);
      renderElements(parsedData);
  };
  reader.readAsText(file);
}