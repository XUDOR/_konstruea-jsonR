// Function to parse JSON-R data
function parseJSONR(jsonrText) {
    let jsonrObject;
    try {
        jsonrObject = JSON.parse(jsonrText);
    } catch (e) {
        alert('Invalid JSON-R format.');
        return null;
    }

    // Ensure required sections exist
    if (!jsonrObject.metadata || !jsonrObject.content || !jsonrObject.rhtml) {
        alert('JSON-R file is missing required sections: metadata, content, or rhtml.');
        return null;
    }

    return jsonrObject;
}

function parseCSV(data) {
    const lines = data.trim().split('\n');
    const headers = splitCSVLine(lines[0]);
    const rows = lines.slice(1);

    return rows.map(line => {
        const values = splitCSVLine(line);
        let rowObject = {};

        headers.forEach((header, index) => {
            rowObject[header.trim()] = values[index] ? values[index].trim() : '';
        });

        return rowObject;
    });
}

// Helper function to split CSV lines while considering quoted fields
function splitCSVLine(line) {
    const result = [];
    let field = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(field);
            field = '';
        } else {
            field += char;
        }
    }
    result.push(field);

    // Remove surrounding quotes from fields
    return result.map(field => field.replace(/^"(.*)"$/s, '$1').replace(/""/g, '"'));
}


// Function to generate the website
function generateWebsite() {
    const fileInput = document.getElementById('jsonr-upload');
    const file = fileInput.files[0];
    if (!file) return alert('Please upload a JSON-R file.');

    const reader = new FileReader();
    reader.onload = function(event) {
        const jsonrText = event.target.result;
        const jsonrData = parseJSONR(jsonrText);
        if (jsonrData) {
            renderElements(jsonrData);
        }
    };
    reader.readAsText(file);
}

// Function to render elements
function renderElements(jsonrData) {
    const rhtmlData = parseCSV(jsonrData.rhtml);

    rhtmlData.forEach(row => {
        const element = createElementFromRHTMLRow(row, jsonrData.content);

        // Append elements based on the 'Section' specified
        if (row.Section === 'Header') {
            document.querySelector('#header').appendChild(element);
        } else if (row.Section === 'Content') {
            document.querySelector('#content').appendChild(element);
        } else if (row.Section === 'Footer') {
            document.querySelector('#footer').appendChild(element);
        }
    });
}

// Function to create element from RHTML row
function createElementFromRHTMLRow(row, contentData) {
    let element;

    // Create element based on 'Type'
    switch (row.Type) {
        case 'heading':
            element = document.createElement('h1');
            break;
        case 'paragraph':
            element = document.createElement('p');
            break;
        case 'sub-container':
            element = document.createElement('div');
            break;
        // Add more cases as needed
        default:
            element = document.createElement('div');
            break;
    }

    // Retrieve and set content
    const contentValue = resolveContent(row.Content, contentData);
    if (contentValue) {
        element.textContent = contentValue;
    }

    // Apply style classes
    if (row['Style Classes']) {
        element.className = row['Style Classes'];
    }

    // Apply inline CSS
    if (row['Inline CSS']) {
        element.style.cssText += row['Inline CSS'];
    }

    // Additional attributes (e.g., links, images)
    if (row.Link) {
        element.href = row.Link;
    }
    if (row['Image URL']) {
        element.src = row['Image URL'];
    }

    // Apply JavaScript actions
    if (row['JavaScript Action']) {
        element.setAttribute('onclick', row['JavaScript Action']);
    }

    // Layout handling
    if (row.Layout) {
        // Apply layout styles (e.g., grid, flex)
        applyLayoutStyles(element, row);
    }

    // Sticky positioning
    if (row.Sticky && row.Sticky.toLowerCase() === 'yes') {
        element.style.position = 'sticky';
        element.style.top = '0';
    }

    // Border styling
    if (row['Border Width'] || row['Border Style'] || row['Border Color']) {
        element.style.border = `${row['Border Width'] || '1px'} ${row['Border Style'] || 'solid'} ${row['Border Color'] || '#000'}`;
    }

    return element;
}

// Function to resolve content expressions
function resolveContent(contentTemplate, contentData) {
    return contentTemplate.replace(/\{\{([^}]+)\}\}/g, function(match, keyPath) {
        const value = getContentValue(keyPath.trim(), contentData);
        return value !== null && value !== undefined ? value : '';
    });
}

// Function to get content value from contentData using keyPath
function getContentValue(keyPath, contentData) {
    const keys = keyPath.match(/([^[.\]]+|\[\d+\])/g); // Split keys, including array indices
    let value = contentData;

    for (let key of keys) {
        if (key.startsWith('[')) {
            // Array index
            const index = parseInt(key.slice(1, -1));
            if (Array.isArray(value) && value[index]) {
                value = value[index];
            } else {
                return null;
            }
        } else {
            if (value && value.hasOwnProperty(key)) {
                value = value[key];
            } else {
                return null;
            }
        }
    }

    // Handle arrays or objects if necessary
    if (Array.isArray(value)) {
        return value.join(', ');
    } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }

    return value;
}

// Function to apply layout styles
function applyLayoutStyles(element, row) {
    if (row.Layout === 'grid') {
        element.style.display = 'grid';
        if (row.Columns) {
            element.style.gridTemplateColumns = `repeat(${row.Columns}, 1fr)`;
        }
    } else if (row.Layout === 'flex') {
        element.style.display = 'flex';
        if (row['Flex Properties']) {
            row['Flex Properties'].split(';').forEach(prop => {
                const [key, value] = prop.split(':');
                if (key && value) {
                    element.style[key.trim()] = value.trim();
                }
            });
        }
    }
}
