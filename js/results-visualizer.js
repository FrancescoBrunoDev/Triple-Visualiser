// Results visualization functions

// Make these functions globally available
window.displayResults = displayResults;
window.displayTableResults = displayTableResults;
window.displayJsonResults = displayJsonResults;
window.displayXmlResults = displayXmlResults;
window.displayGraphResults = displayGraphResults;

// Pagination state - moved to a global object for better state management
const paginationState = {
    rowsPerPage: 10, // Default number of rows to display per page
    updateRowsPerPage: function(newValue) {
        this.rowsPerPage = newValue;
    }
};

/**
 * Display results based on the selected format
 * @param {Object} results - The query results
 * @param {string} format - The display format (table, json, xml, graph)
 * @param {HTMLElement} resultsContainer - The container to display results in
 */
function displayResults(results, format, resultsContainer) {
    // Store the results for format switching
    resultsContainer.dataset.results = JSON.stringify(results);
    
    // Store the current format
    resultsContainer.dataset.currentFormat = format;
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    if (!results || (results.results && results.results.bindings && results.results.bindings.length === 0)) {
        resultsContainer.innerHTML = '<p>No results found</p>';
        return;
    }
    
    // Display based on format
    switch (format) {
        case 'table':
            displayTableResults(results, resultsContainer);
            break;
        case 'json':
            displayJsonResults(results, resultsContainer);
            break;
        case 'xml':
            displayXmlResults(results, resultsContainer);
            break;
        case 'graph':
            displayGraphResults(results, resultsContainer);
            break;
        default:
            displayTableResults(results, resultsContainer);
    }
    
    // Add a small info message about format switching
    const formatInfo = document.createElement('div');
    formatInfo.className = 'format-info';
    formatInfo.style.marginTop = '15px';
    formatInfo.style.fontSize = '12px';
    formatInfo.style.color = '#777';
    formatInfo.textContent = 'You can switch between display formats without re-running the query.';
    resultsContainer.appendChild(formatInfo);
}

/**
 * Display results as a table with pagination
 * @param {Object} results - The query results
 * @param {HTMLElement} resultsContainer - The container to display results in
 */
function displayTableResults(results, resultsContainer) {
    if (!results.head || !results.results) {
        resultsContainer.innerHTML = '<p>Invalid results format</p>';
        return;
    }
    
    const { head, results: { bindings } } = results;
    const variables = head.vars;
    
    // Add a container with a header
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    const tableHeader = document.createElement('h3');
    tableHeader.textContent = 'Table View';
    tableHeader.style.marginBottom = '10px';
    
    tableContainer.appendChild(tableHeader);
    
    // Add result count
    const resultCount = document.createElement('div');
    resultCount.className = 'result-count';
    resultCount.textContent = `Found ${bindings.length} results`;
    resultCount.style.marginBottom = '10px';
    resultCount.style.fontSize = '14px';
    resultCount.style.color = '#666';
    tableContainer.appendChild(resultCount);
    
    // Create table
    const table = document.createElement('table');
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    variables.forEach(variable => {
        const th = document.createElement('th');
        th.textContent = variable;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    
    // Calculate total pages
    const totalPages = Math.ceil(bindings.length / paginationState.rowsPerPage);
    
    // Store pagination state in the table container
    tableContainer.dataset.currentPage = '1';
    tableContainer.dataset.totalPages = totalPages.toString();
    tableContainer.dataset.totalRows = bindings.length.toString();
    
    // Store the bindings data in the table container for pagination
    tableContainer.dataset.bindings = JSON.stringify(bindings);
    tableContainer.dataset.variables = JSON.stringify(variables);
    
    // Function to display a specific page
    function displayPage(pageNum) {
        // Clear the current table body
        tbody.innerHTML = '';
        
        // Calculate start and end indices
        const startIdx = (pageNum - 1) * paginationState.rowsPerPage;
        const endIdx = Math.min(startIdx + paginationState.rowsPerPage, bindings.length);
        
        // Add rows for current page
        for (let i = startIdx; i < endIdx; i++) {
            const binding = bindings[i];
            const row = document.createElement('tr');
            
            variables.forEach(variable => {
                const td = document.createElement('td');
                
                if (binding[variable]) {
                    const value = binding[variable];
                    
                    switch (value.type) {
                        case 'uri':
                            const link = document.createElement('a');
                            link.href = value.value;
                            link.textContent = value.value;
                            link.target = '_blank';
                            td.appendChild(link);
                            break;
                        default:
                            td.textContent = value.value;
                    }
                } else {
                    td.textContent = '';
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        }
        
        // Update pagination controls
        updatePaginationControls(tableContainer, pageNum);
    }
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    // Add pagination controls if needed
    if (totalPages > 1) {
        const paginationContainer = createPaginationControls(totalPages, bindings, variables, (pageNum) => {
            tableContainer.dataset.currentPage = pageNum.toString();
            displayPage(pageNum);
        });
        tableContainer.appendChild(paginationContainer);
    }
    
    resultsContainer.appendChild(tableContainer);
    
    // Display the first page
    displayPage(1);
}

/**
 * Create pagination controls
 * @param {number} totalPages - Total number of pages
 * @param {Array} bindings - The query bindings
 * @param {Array} variables - The query variables
 * @param {Function} onPageChange - Callback when page changes
 * @returns {HTMLElement} - The pagination container
 */
function createPaginationControls(totalPages, bindings, variables, onPageChange) {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    paginationContainer.style.marginTop = '20px';
    paginationContainer.style.textAlign = 'center';
    
    // Add pagination info
    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'pagination-info';
    paginationInfo.style.marginBottom = '10px';
    paginationInfo.textContent = `Page 1 of ${totalPages}`;
    paginationContainer.appendChild(paginationInfo);
    
    // Create pagination buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '5px';
    
    // First page button
    const firstBtn = document.createElement('button');
    firstBtn.textContent = '<<';
    firstBtn.title = 'First Page';
    firstBtn.addEventListener('click', () => handlePageChange(1));
    buttonContainer.appendChild(firstBtn);
    
    // Previous page button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    prevBtn.title = 'Previous Page';
    prevBtn.addEventListener('click', () => {
        const currentPage = parseInt(paginationContainer.parentNode.dataset.currentPage);
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    });
    buttonContainer.appendChild(prevBtn);
    
    // Create page number buttons - we'll display up to 5 page numbers
    const maxButtons = Math.min(5, totalPages);
    for (let i = 1; i <= maxButtons; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i.toString();
        pageBtn.dataset.page = i.toString();
        pageBtn.addEventListener('click', () => handlePageChange(i));
        
        // Highlight the first page
        if (i === 1) {
            pageBtn.style.backgroundColor = '#3498db';
            pageBtn.style.color = 'white';
        }
        
        buttonContainer.appendChild(pageBtn);
    }
    
    // If there are more pages, add an ellipsis
    if (totalPages > 5) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.margin = '0 5px';
        buttonContainer.appendChild(ellipsis);
        
        // Add the last page button
        const lastPageBtn = document.createElement('button');
        lastPageBtn.textContent = totalPages.toString();
        lastPageBtn.dataset.page = totalPages.toString();
        lastPageBtn.addEventListener('click', () => handlePageChange(totalPages));
        buttonContainer.appendChild(lastPageBtn);
    }
    
    // Next page button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    nextBtn.title = 'Next Page';
    nextBtn.addEventListener('click', () => {
        const currentPage = parseInt(paginationContainer.parentNode.dataset.currentPage);
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    });
    buttonContainer.appendChild(nextBtn);
    
    // Last page button
    const lastBtn = document.createElement('button');
    lastBtn.textContent = '>>';
    lastBtn.title = 'Last Page';
    lastBtn.addEventListener('click', () => handlePageChange(totalPages));
    buttonContainer.appendChild(lastBtn);
    
    paginationContainer.appendChild(buttonContainer);
    
    // Add rows per page selector
    const rowsPerPageContainer = document.createElement('div');
    rowsPerPageContainer.style.marginTop = '10px';
    rowsPerPageContainer.style.fontSize = '14px';
    
    const rowsLabel = document.createElement('label');
    rowsLabel.textContent = 'Rows per page: ';
    
    const rowsSelect = document.createElement('select');
    [10, 25, 50, 100].forEach(value => {
        const option = document.createElement('option');
        option.value = value.toString();
        option.textContent = value.toString();
        if (value === paginationState.rowsPerPage) {
            option.selected = true;
        }
        rowsSelect.appendChild(option);
    });
    
    rowsSelect.addEventListener('change', () => {
        const newRowsPerPage = parseInt(rowsSelect.value);
        
        // Update the pagination state
        paginationState.updateRowsPerPage(newRowsPerPage);
        
        // Get the table container and current data
        const tableContainer = paginationContainer.parentNode;
        const storedBindings = JSON.parse(tableContainer.dataset.bindings);
        const storedVariables = JSON.parse(tableContainer.dataset.variables);
        
        // Recalculate total pages
        const newTotalPages = Math.ceil(storedBindings.length / newRowsPerPage);
        tableContainer.dataset.totalPages = newTotalPages.toString();
        
        // Update pagination info display
        paginationInfo.textContent = `Page 1 of ${newTotalPages}`;
        
        // Rebuild the pagination container for the new page count
        const tbody = tableContainer.querySelector('tbody');
        
        // Function to redisplay a specific page with the new rows per page
        function redisplayPage(pageNum) {
            // Clear the current table body
            tbody.innerHTML = '';
            
            // Calculate start and end indices with new rowsPerPage
            const startIdx = (pageNum - 1) * newRowsPerPage;
            const endIdx = Math.min(startIdx + newRowsPerPage, storedBindings.length);
            
            // Add rows for current page
            for (let i = startIdx; i < endIdx; i++) {
                const binding = storedBindings[i];
                const row = document.createElement('tr');
                
                storedVariables.forEach(variable => {
                    const td = document.createElement('td');
                    
                    if (binding[variable]) {
                        const value = binding[variable];
                        
                        switch (value.type) {
                            case 'uri':
                                const link = document.createElement('a');
                                link.href = value.value;
                                link.textContent = value.value;
                                link.target = '_blank';
                                td.appendChild(link);
                                break;
                            default:
                                td.textContent = value.value;
                        }
                    } else {
                        td.textContent = '';
                    }
                    
                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            }
        }
        
        // Reset to page 1 with new rows per page
        tableContainer.dataset.currentPage = '1';
        redisplayPage(1);
        
        // Replace the pagination container with a new one
        const oldPaginationContainer = tableContainer.querySelector('.pagination');
        if (oldPaginationContainer) {
            const newPaginationContainer = createPaginationControls(newTotalPages, storedBindings, storedVariables, (pageNum) => {
                tableContainer.dataset.currentPage = pageNum.toString();
                redisplayPage(pageNum);
            });
            
            tableContainer.replaceChild(newPaginationContainer, oldPaginationContainer);
        }
    });
    
    rowsPerPageContainer.appendChild(rowsLabel);
    rowsPerPageContainer.appendChild(rowsSelect);
    paginationContainer.appendChild(rowsPerPageContainer);
    
    function handlePageChange(pageNum) {
        // Call the callback
        onPageChange(pageNum);
        
        // Visually update the active page button
        const pageBtns = buttonContainer.querySelectorAll('button[data-page]');
        pageBtns.forEach(btn => {
            if (parseInt(btn.dataset.page) === pageNum) {
                btn.style.backgroundColor = '#3498db';
                btn.style.color = 'white';
            } else {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }
        });
        
        // Update pagination info
        paginationInfo.textContent = `Page ${pageNum} of ${totalPages}`;
    }
    
    return paginationContainer;
}

/**
 * Update pagination controls based on current page
 * @param {HTMLElement} tableContainer - The table container element
 * @param {number} currentPage - Current page number
 */
function updatePaginationControls(tableContainer, currentPage) {
    const totalPages = parseInt(tableContainer.dataset.totalPages);
    const paginationInfo = tableContainer.querySelector('.pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    // Update button states
    const pageBtns = tableContainer.querySelectorAll('button[data-page]');
    pageBtns.forEach(btn => {
        const pageNum = parseInt(btn.dataset.page);
        if (pageNum === currentPage) {
            btn.style.backgroundColor = '#3498db';
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }
    });
    
    // Enable/disable prev/next buttons
    const prevBtn = tableContainer.querySelector('.pagination button:nth-child(2)');
    const nextBtn = tableContainer.querySelector('.pagination button:nth-last-child(2)');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
    }
}

/**
 * Display results as JSON
 * @param {Object} results - The query results
 * @param {HTMLElement} resultsContainer - The container to display results in
 */
function displayJsonResults(results, resultsContainer) {
    const jsonContainer = document.createElement('div');
    jsonContainer.className = 'json-container';
    
    const jsonHeader = document.createElement('h3');
    jsonHeader.textContent = 'JSON View';
    jsonHeader.style.marginBottom = '10px';
    
    // Create a container for actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'format-actions';
    actionsContainer.style.marginBottom = '15px';
    
    // Create raw file download button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Raw JSON';
    downloadButton.className = 'format-download-btn';
    downloadButton.style.marginRight = '10px';
    downloadButton.addEventListener('click', () => {
        downloadRawFile(JSON.stringify(results, null, 2), 'sparql-results.json', 'application/json');
    });
    
    // Create open in new window button
    const openButton = document.createElement('button');
    openButton.textContent = 'Open in New Window';
    openButton.className = 'format-open-btn';
    openButton.style.marginRight = '10px';
    openButton.addEventListener('click', () => {
        openInNewWindow(JSON.stringify(results, null, 2), 'json');
    });
    
    // Create copy to clipboard button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy to Clipboard';
    copyButton.className = 'format-copy-btn';
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(results, null, 2))
            .then(() => {
                // Show a temporary "Copied!" tooltip
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy to Clipboard';
                }, 2000);
            })
            .catch(err => {
                console.error('Error copying text: ', err);
                alert('Failed to copy to clipboard');
            });
    });
    
    actionsContainer.appendChild(downloadButton);
    actionsContainer.appendChild(openButton);
    actionsContainer.appendChild(copyButton);
    
    const pre = document.createElement('pre');
    pre.className = 'json-display';
    
    // Apply simple syntax highlighting to the JSON - no collapsible functionality
    const formattedJson = JSON.stringify(results, null, 2);
    const highlightedJson = formatJsonWithHighlighting(formattedJson);
    pre.innerHTML = highlightedJson;
    
    jsonContainer.appendChild(jsonHeader);
    jsonContainer.appendChild(actionsContainer);
    jsonContainer.appendChild(pre);
    resultsContainer.appendChild(jsonContainer);
}

/**
 * Apply simple syntax highlighting to JSON string without collapsible functionality
 * @param {string} json - The JSON string to highlight
 * @returns {string} - HTML with syntax highlighting
 */
function formatJsonWithHighlighting(json) {
    if (!json) return '';
    
    // Create a more advanced replacement function for better highlighting
    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Define pattern to match various JSON elements
        const patterns = [
            // Property keys and their values with colons
            {
                pattern: /"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g,
                replacement: function(match) {
                    const isKey = /:$/.test(match);
                    return '<span class="' + (isKey ? 'json-key' : 'json-string') + '">' + match + '</span>';
                }
            },
            // Numbers
            {
                pattern: /\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g,
                replacement: '<span class="json-number">$1</span>'
            },
            // Boolean values
            {
                pattern: /\b(true|false)\b/g,
                replacement: '<span class="json-boolean">$1</span>'
            },
            // Null values
            {
                pattern: /\bnull\b/g,
                replacement: '<span class="json-null">null</span>'
            },
            // Punctuation and brackets - ENSURING NO COLLAPSIBLE CLASSES ARE ADDED
            {
                pattern: /([{}\[\],])/g,
                replacement: '<span class="json-punctuation">$1</span>'
            }
        ];
        
        // Apply all patterns
        let result = json;
        patterns.forEach(p => {
            result = result.replace(p.pattern, p.replacement);
        });
        
        return result;
    }
    
    // Function to indent JSON properly
    function prettyPrintJson(json) {
        let result = '';
        let indentLevel = 0;
        let inString = false;
        let lastChar = '';
        let currentChar = '';
        
        // Process character by character for proper indentation and line breaks
        for (let i = 0; i < json.length; i++) {
            lastChar = i > 0 ? json.charAt(i - 1) : '';
            currentChar = json.charAt(i);
            const nextChar = i < json.length - 1 ? json.charAt(i + 1) : '';
            
            // Handle strings specially to prevent breaking them
            if (currentChar === '"' && lastChar !== '\\') {
                inString = !inString;
                result += currentChar;
                continue;
            }
            
            if (inString) {
                result += currentChar;
                continue;
            }
            
            // Format based on brackets and punctuation
            switch (currentChar) {
                case '{':
                case '[':
                    result += currentChar;
                    // Don't add newline and indent if the array/object is empty
                    if (nextChar !== '}' && nextChar !== ']') {
                        result += '\n' + ' '.repeat(++indentLevel * 2);
                    }
                    break;
                case '}':
                case ']':
                    // Don't add newline and reduce indent if the array/object was empty
                    if (lastChar !== '{' && lastChar !== '[') {
                        result += '\n' + ' '.repeat(--indentLevel * 2);
                    } else {
                        // Just reduce the indent level without changing the result
                        indentLevel--;
                    }
                    result += currentChar;
                    break;
                case ',':
                    result += currentChar;
                    result += '\n' + ' '.repeat(indentLevel * 2);
                    break;
                case ':':
                    result += currentChar + ' ';  // Add space after colon
                    break;
                default:
                    // Skip whitespace in input as we're adding our own
                    if (!/\s/.test(currentChar)) {
                        result += currentChar;
                    }
            }
        }
        
        return result;
    }
    
    try {
        // Parse and re-stringify to ensure valid JSON
        const obj = JSON.parse(json);
        const prettified = prettyPrintJson(JSON.stringify(obj));
        const highlighted = syntaxHighlight(prettified);
        return highlighted;
    } catch (e) {
        console.error("Error formatting JSON:", e);
        // Return the original JSON if there's an error
        return json;
    }
}

/**
 * Display results as XML
 * @param {Object} results - The query results
 * @param {HTMLElement} resultsContainer - The container to display results in
 */
function displayXmlResults(results, resultsContainer) {
    const xmlContainer = document.createElement('div');
    xmlContainer.className = 'xml-container';
    
    const xmlHeader = document.createElement('h3');
    xmlHeader.textContent = 'XML View';
    xmlHeader.style.marginBottom = '10px';
    
    // Convert the JSON results to XML format
    const xmlString = convertJsonToXml(results);
    
    // Create a container for actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'format-actions';
    actionsContainer.style.marginBottom = '15px';
    
    // Create raw file download button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Raw XML';
    downloadButton.className = 'format-download-btn';
    downloadButton.style.marginRight = '10px';
    downloadButton.addEventListener('click', () => {
        downloadRawFile(xmlString, 'sparql-results.xml', 'application/xml');
    });
    
    // Create open in new window button
    const openButton = document.createElement('button');
    openButton.textContent = 'Open in New Window';
    openButton.className = 'format-open-btn';
    openButton.addEventListener('click', () => {
        openInNewWindow(xmlString, 'xml');
    });
    
    actionsContainer.appendChild(downloadButton);
    actionsContainer.appendChild(openButton);
    
    const pre = document.createElement('pre');
    pre.className = 'xml-display';
    
    // Apply enhanced syntax highlighting to the XML
    const highlightedXml = syntaxHighlightXml(xmlString);
    pre.innerHTML = highlightedXml;
    
    xmlContainer.appendChild(xmlHeader);
    xmlContainer.appendChild(actionsContainer);
    xmlContainer.appendChild(pre);
    resultsContainer.appendChild(xmlContainer);
}

/**
 * Apply improved syntax highlighting to XML string
 * @param {string} xml - The XML string to highlight
 * @returns {string} - HTML with syntax highlighting
 */
function syntaxHighlightXml(xml) {
    // Escape HTML entities first
    let escaped = xml
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    
    // Apply more comprehensive XML highlighting with improved regex patterns
    return escaped
        // Highlight XML declaration
        .replace(/(&lt;\?xml.*?\?&gt;)/g, 
            '<span class="xml-declaration">$1</span>')
        
        // Highlight comments
        .replace(/(&lt;!--.*?--&gt;)/g, 
            '<span class="xml-comment">$1</span>')
            
        // Highlight opening tags with attributes
        .replace(/(&lt;)([A-Za-z0-9_:-]+)(?=(?:.*?&gt;))/g, 
            '$1<span class="xml-tag">$2</span>')
            
        // Highlight attributes and their values
        .replace(/\s+([A-Za-z0-9_:-]+)=(&quot;|&apos;)(.*?)(\2)/g, 
            ' <span class="xml-attr">$1</span>=<span class="xml-attr-value">$2$3$4</span>')
            
        // Highlight closing tags
        .replace(/(&lt;\/)([A-Za-z0-9_:-]+)(&gt;)/g, 
            '$1<span class="xml-tag">$2</span>$3')
            
        // Highlight the closing angle brackets of tags
        .replace(/(\?)?(&gt;)/g, 
            '$1<span class="xml-bracket">$2</span>');
}

/**
 * Download content as a file
 * @param {string} content - The content to download
 * @param {string} filename - The name of the file
 * @param {string} mimeType - The MIME type of the file
 */
function downloadRawFile(content, filename, mimeType) {
    // Create a blob with the content
    const blob = new Blob([content], { type: mimeType });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    
    // Append the link to the document
    document.body.appendChild(downloadLink);
    
    // Trigger the download
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

/**
 * Open content in a new window as raw text
 * @param {string} content - The content to display
 * @param {string} type - The type of content (json or xml)
 */
function openInNewWindow(content, type) {
    // Create a new window
    const newWindow = window.open('', '_blank');
    
    // Check if the window was created successfully
    if (!newWindow) {
        alert('Pop-up blocker may have prevented opening a new window. Please allow pop-ups for this site.');
        return;
    }
    
    // Set the content type based on the type parameter
    const contentType = type === 'json' ? 'application/json' : 'application/xml';
    
    // Create the raw content document without extra whitespace
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<title>SPARQL ${type.toUpperCase()} Results (Raw)</title>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="${contentType}; charset=utf-8">
<style>
body, pre {
    margin: 0;
    padding: 0;
    font-family: monospace;
    white-space: pre;
    word-wrap: normal;
    overflow-wrap: normal;
}
</style>
</head>
<body><pre>${content}</pre></body>
</html>`;
    
    // Write the raw content to the new window
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
}

/**
 * Convert JSON results to XML format
 * @param {Object} json - The JSON results to convert
 * @returns {string} - The XML representation
 */
function convertJsonToXml(json) {
    // Create XML header
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sparql xmlns="http://www.w3.org/2005/sparql-results#">\n';
    
    // Add head section with variables
    xml += '  <head>\n';
    if (json.head && json.head.vars) {
        json.head.vars.forEach(variable => {
            xml += `    <variable name="${escapeXml(variable)}"/>\n`;
        });
    }
    xml += '  </head>\n';
    
    // Add results section with bindings
    xml += '  <results>\n';
    if (json.results && json.results.bindings) {
        json.results.bindings.forEach(binding => {
            xml += '    <result>\n';
            
            // Process each variable in the binding
            if (json.head && json.head.vars) {
                json.head.vars.forEach(variable => {
                    if (binding[variable]) {
                        const value = binding[variable];
                        xml += `      <binding name="${escapeXml(variable)}">\n`;
                        
                        // Handle different types of values
                        switch (value.type) {
                            case 'uri':
                                xml += `        <uri>${escapeXml(value.value)}</uri>\n`;
                                break;
                            case 'literal':
                                if (value['xml:lang']) {
                                    xml += `        <literal xml:lang="${escapeXml(value['xml:lang'])}">${escapeXml(value.value)}</literal>\n`;
                                } else if (value.datatype) {
                                    xml += `        <literal datatype="${escapeXml(value.datatype)}">${escapeXml(value.value)}</literal>\n`;
                                } else {
                                    xml += `        <literal>${escapeXml(value.value)}</literal>\n`;
                                }
                                break;
                            case 'typed-literal':
                                xml += `        <literal datatype="${escapeXml(value.datatype)}">${escapeXml(value.value)}</literal>\n`;
                                break;
                            case 'bnode':
                                xml += `        <bnode>${escapeXml(value.value)}</bnode>\n`;
                                break;
                            default:
                                xml += `        <literal>${escapeXml(value.value)}</literal>\n`;
                        }
                        
                        xml += '      </binding>\n';
                    }
                });
            }
            
            xml += '    </result>\n';
        });
    }
    xml += '  </results>\n';
    
    // Close the root element
    xml += '</sparql>';
    
    return xml;
}

/**
 * Escape special XML characters
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeXml(str) {
    if (typeof str !== 'string') {
        return str;
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Display results as a graph using D3.js
 * @param {Object} results - The query results
 * @param {HTMLElement} resultsContainer - The container to display results in
 */
function displayGraphResults(results, resultsContainer) {
    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';
    
    const graphHeader = document.createElement('h3');
    graphHeader.textContent = 'Graph View';
    graphHeader.style.marginBottom = '10px';
    
    // Create a container for the controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'graph-controls';
    controlsContainer.style.marginBottom = '15px';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '10px';
    controlsContainer.style.flexWrap = 'wrap';
    
    // Add search functionality
    const searchContainer = document.createElement('div');
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.marginRight = '20px';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search nodes...';
    searchInput.id = 'node-search';
    searchInput.style.padding = '5px';
    searchInput.style.marginRight = '5px';
    searchInput.style.width = '150px';
    
    const searchButton = document.createElement('button');
    searchButton.textContent = 'Find';
    searchButton.className = 'btn-secondary';
    searchButton.id = 'search-node-btn';
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchButton);
    
    // Create simulation controls
    const forceSlider = document.createElement('div');
    forceSlider.innerHTML = `
        <label for="force-strength">Force Strength: </label>
        <input type="range" id="force-strength" min="-200" max="-10" value="-30" style="width: 100px;">
    `;
    
    const distanceSlider = document.createElement('div');
    distanceSlider.innerHTML = `
        <label for="link-distance">Link Distance: </label>
        <input type="range" id="link-distance" min="50" max="300" value="150" style="width: 100px;">
    `;
    
    const chargeSlider = document.createElement('div');
    chargeSlider.innerHTML = `
        <label for="node-charge">Node Charge: </label>
        <input type="range" id="node-charge" min="-1000" max="-50" value="-300" style="width: 100px;">
    `;
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Simulation';
    resetButton.className = 'btn-secondary';
    resetButton.style.marginLeft = 'auto';
    
    // Add filter toggle
    const filterToggle = document.createElement('div');
    filterToggle.style.display = 'flex';
    filterToggle.style.alignItems = 'center';
    filterToggle.style.marginLeft = '20px';
    
    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Show Literals: ';
    filterLabel.htmlFor = 'show-literals';
    filterLabel.style.marginRight = '5px';
    
    const filterCheckbox = document.createElement('input');
    filterCheckbox.type = 'checkbox';
    filterCheckbox.id = 'show-literals';
    filterCheckbox.checked = true;
    
    filterToggle.appendChild(filterLabel);
    filterToggle.appendChild(filterCheckbox);
    
    // Add controls to container
    controlsContainer.appendChild(searchContainer);
    controlsContainer.appendChild(forceSlider);
    controlsContainer.appendChild(distanceSlider);
    controlsContainer.appendChild(chargeSlider);
    controlsContainer.appendChild(filterToggle);
    controlsContainer.appendChild(resetButton);
    
    // Add a graph legend
    const legendContainer = document.createElement('div');
    legendContainer.className = 'graph-legend';
    legendContainer.style.display = 'flex';
    legendContainer.style.gap = '15px';
    legendContainer.style.marginBottom = '15px';
    legendContainer.style.padding = '10px';
    legendContainer.style.backgroundColor = '#f5f5f5';
    legendContainer.style.borderRadius = '4px';
    
    // Create legend items
    const subjectLegend = document.createElement('div');
    subjectLegend.innerHTML = `<span style="display: inline-block; width: 15px; height: 15px; background-color: #6baed6; border-radius: 50%; margin-right: 5px;"></span> Subject`;
    
    const predicateLegend = document.createElement('div');
    predicateLegend.innerHTML = `<span style="display: inline-block; width: 15px; height: 5px; background-color: #9e9e9e; margin-right: 5px;"></span> Predicate`;
    
    const objectLegend = document.createElement('div');
    objectLegend.innerHTML = `<span style="display: inline-block; width: 15px; height: 15px; background-color: #fd8d3c; border-radius: 50%; margin-right: 5px;"></span> Object`;
    
    const literalLegend = document.createElement('div');
    literalLegend.innerHTML = `<span style="display: inline-block; width: 15px; height: 15px; background-color: #74c476; border-radius: 50%; margin-right: 5px;"></span> Literal`;
    
    legendContainer.appendChild(subjectLegend);
    legendContainer.appendChild(predicateLegend);
    legendContainer.appendChild(objectLegend);
    legendContainer.appendChild(literalLegend);
    
    // Create SVG container
    const svgContainer = document.createElement('div');
    svgContainer.style.border = '1px solid #ddd';
    svgContainer.style.borderRadius = '4px';
    svgContainer.style.height = '600px';
    svgContainer.style.overflow = 'hidden';
    svgContainer.style.position = 'relative';
    svgContainer.style.backgroundColor = '#fff';
    
    // Add a loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.textContent = 'Processing data for visualization...';
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    loadingIndicator.style.padding = '10px 20px';
    loadingIndicator.style.borderRadius = '4px';
    loadingIndicator.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    loadingIndicator.style.zIndex = '10';
    
    svgContainer.appendChild(loadingIndicator);
    
    // Add to container
    graphContainer.appendChild(graphHeader);
    graphContainer.appendChild(controlsContainer);
    graphContainer.appendChild(legendContainer);
    graphContainer.appendChild(svgContainer);
    
    // Add the graph container to the results container
    resultsContainer.appendChild(graphContainer);
    
    // Check if we have results to visualize
    if (!results || !results.results || !results.results.bindings || results.results.bindings.length === 0) {
        loadingIndicator.textContent = 'No data available for graph visualization';
        return;
    }
    
    // Add message about data limits
    const dataMessage = document.createElement('div');
    dataMessage.className = 'data-message';
    dataMessage.style.marginTop = '10px';
    dataMessage.style.fontSize = '12px';
    dataMessage.style.color = '#666';
    resultsContainer.appendChild(dataMessage);
    
    // Process the results and create the graph
    setTimeout(() => {
        createD3Graph(results, svgContainer, loadingIndicator, dataMessage);
        
        // Setup event listeners for the simulation controls
        document.getElementById('force-strength').addEventListener('input', updateForceSimulation);
        document.getElementById('link-distance').addEventListener('input', updateForceSimulation);
        document.getElementById('node-charge').addEventListener('input', updateForceSimulation);
        
        // Setup search functionality
        document.getElementById('search-node-btn').addEventListener('click', searchNodes);
        document.getElementById('node-search').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchNodes();
        });
        
        // Setup filter toggle
        document.getElementById('show-literals').addEventListener('change', toggleLiterals);
        
        // Setup reset button
        resetButton.addEventListener('click', () => {
            document.getElementById('force-strength').value = -30;
            document.getElementById('link-distance').value = 150;
            document.getElementById('node-charge').value = -300;
            updateForceSimulation();
        });
    }, 100);
}

/**
 * Create a D3.js graph visualization for SPARQL results
 * @param {Object} results - The SPARQL query results
 * @param {HTMLElement} container - The container to render the graph in
 * @param {HTMLElement} loadingIndicator - The loading indicator element
 * @param {HTMLElement} dataMessage - Element to display data processing messages
 */
function createD3Graph(results, container, loadingIndicator, dataMessage) {
    // Extract nodes and links from SPARQL results
    const { nodes, links, limitReached } = processGraphData(results);
    
    if (limitReached) {
        dataMessage.textContent = 'Note: Only showing the first 100 relationships to maintain performance. Use more specific queries for complete results.';
    } else {
        dataMessage.textContent = `Displaying ${nodes.length} nodes and ${links.length} relationships.`;
    }
    
    // Remove existing SVG if any
    d3.select(container).select('svg').remove();
    
    // Create SVG element with dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const svg = d3.select(container).append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);
    
    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
            graphGroup.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Add a group for the graph elements
    const graphGroup = svg.append('g');
    
    // Add arrow marker for directed links
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');
    
    // Create the simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
    
    // Create the links
    const link = graphGroup.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');
    
    // Create link labels
    const linkLabel = graphGroup.append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(links)
        .enter().append('text')
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .attr('dy', -5)
        .attr('fill', '#666')
        .text(d => d.label);
    
    // Create the nodes
    const node = graphGroup.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('r', d => d.isLiteral ? 6 : 10)
        .attr('class', d => 'node ' + (d.isLiteral ? 'literal-node' : 'resource-node'))
        .attr('fill', d => {
            if (d.isLiteral) return '#74c476'; // Literal - green
            if (d.type === 'subject') return '#6baed6'; // Subject - blue
            if (d.type === 'object') return '#fd8d3c'; // Object - orange
            return '#bdbdbd'; // Default - gray
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .call(drag(simulation));
    
    // Create tooltips with enhanced information
    node.append('title')
        .text(d => {
            let tooltip = d.id;
            if (d.isLiteral) {
                return `Literal: ${tooltip}`;
            } else {
                // Extract the prefix if it exists
                const prefixMatch = tooltip.match(/^(https?:\/\/[^\/]+\/)(.*)$/);
                if (prefixMatch) {
                    return `URI: ${prefixMatch[1]}\nPath: ${prefixMatch[2]}`;
                }
                return `URI: ${tooltip}`;
            }
        });
    
    // Create node labels
    const nodeLabel = graphGroup.append('g')
        .attr('class', 'node-labels')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .attr('font-size', 10)
        .attr('dx', 12)
        .attr('dy', 4)
        .text(d => {
            const label = formatLabel(d.id);
            return d.isLiteral ? `"${label}"` : label;
        });
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        linkLabel
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);
        
        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        nodeLabel
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });
    
    // Add drag behavior for nodes
    function drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
    
    // Function to search for nodes
    window.searchNodes = function() {
        const searchText = document.getElementById('node-search').value.toLowerCase();
        
        if (!searchText) {
            // Reset all nodes if search is empty
            node.attr('r', d => d.isLiteral ? 6 : 10)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5);
                
            nodeLabel.attr('font-weight', 'normal')
                    .attr('font-size', 10);
            return;
        }
        
        // Update visualization to highlight matching nodes
        node.each(function(d) {
            const element = d3.select(this);
            const label = formatLabel(d.id);
            const isMatch = d.id.toLowerCase().includes(searchText) || 
                            label.toLowerCase().includes(searchText);
            
            if (isMatch) {
                // Highlight the node
                element.attr('r', d.isLiteral ? 8 : 14)
                       .attr('stroke', '#f8e71c')
                       .attr('stroke-width', 3);
                
                // Get the corresponding label
                const nodeId = d.id;
                nodeLabel.filter(l => l.id === nodeId)
                         .attr('font-weight', 'bold')
                         .attr('font-size', 12);
            } else {
                // Reset to normal
                element.attr('r', d.isLiteral ? 6 : 10)
                       .attr('stroke', '#fff')
                       .attr('stroke-width', 1.5);
                
                // Reset the label
                const nodeId = d.id;
                nodeLabel.filter(l => l.id === nodeId)
                         .attr('font-weight', 'normal')
                         .attr('font-size', 10);
            }
        });
    };
    
    // Function to toggle literal nodes
    window.toggleLiterals = function() {
        const showLiterals = document.getElementById('show-literals').checked;
        
        // Filter nodes
        node.filter(d => d.isLiteral)
            .style('display', showLiterals ? 'block' : 'none');
        
        // Filter labels
        nodeLabel.filter(d => d.isLiteral)
                .style('display', showLiterals ? 'block' : 'none');
        
        // Filter links that connect to literals
        link.style('display', function(d) {
            if (showLiterals) return 'block';
            return (d.source.isLiteral || d.target.isLiteral) ? 'none' : 'block';
        });
        
        // Filter link labels
        linkLabel.style('display', function(d) {
            if (showLiterals) return 'block';
            return (d.source.isLiteral || d.target.isLiteral) ? 'none' : 'block';
        });
    };
    
    // Function to update the force simulation parameters
    window.updateForceSimulation = function() {
        const strength = parseInt(document.getElementById('force-strength').value);
        const distance = parseInt(document.getElementById('link-distance').value);
        const charge = parseInt(document.getElementById('node-charge').value);
        
        simulation.force('link').distance(distance);
        simulation.force('charge').strength(charge);
        simulation.alpha(1).restart();
    };
    
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
    
    // Make simulation and viz elements globally accessible
    window.graphVisualization = {
        simulation,
        nodes,
        links,
        nodeElements: node,
        linkElements: link
    };
}

/**
 * Process SPARQL results into a graph data structure
 * @param {Object} results - The SPARQL query results
 * @returns {Object} - Object with nodes and links arrays
 */
function processGraphData(results) {
    const nodes = new Map();
    const links = [];
    
    // Track the number of processed bindings to limit the graph size if needed
    let processedCount = 0;
    const maxBindings = 100; // Limit to prevent browser performance issues
    let limitReached = false;
    
    // Process each result binding
    results.results.bindings.forEach(binding => {
        // Skip if we're over the limit to prevent performance issues
        if (processedCount >= maxBindings) {
            limitReached = true;
            return;
        }
        
        // Extract subject, predicate, object from each binding
        let subject = null, predicate = null, object = null;
        
        // Look for subject, predicate, object variables in the binding
        for (const key in binding) {
            const value = binding[key].value;
            const type = binding[key].type;
            
            // Try to determine what this variable represents (subject, predicate, or object)
            if (key.toLowerCase().includes('subject') || key.toLowerCase() === 's') {
                subject = value;
            } else if (key.toLowerCase().includes('predicate') || key.toLowerCase() === 'p') {
                predicate = value;
            } else if (key.toLowerCase().includes('object') || key.toLowerCase() === 'o') {
                object = value;
                // Check if it's a literal (string, number, etc.)
                const isLiteral = type === 'literal' || 
                                  type === 'typed-literal' || 
                                  type.toLowerCase().includes('literal');
                
                // Add node for the object if it's a resource
                if (!nodes.has(value)) {
                    nodes.set(value, {
                        id: value,
                        type: 'object',
                        isLiteral: isLiteral
                    });
                }
            } else if (type === 'uri') {
                // If it's a URI but not explicitly labeled, treat as a node
                if (!nodes.has(value)) {
                    nodes.set(value, {
                        id: value,
                        type: 'generic',
                        isLiteral: false
                    });
                }
            } else {
                // For other variables, we'll treat them as generic nodes
                if (!nodes.has(value)) {
                    nodes.set(value, {
                        id: value,
                        type: 'generic',
                        isLiteral: type === 'literal' || type === 'typed-literal'
                    });
                }
            }
        }
        
        // If we have both subject and object, add nodes and links
        if (subject && object) {
            // Add subject node if not exists
            if (!nodes.has(subject)) {
                nodes.set(subject, {
                    id: subject,
                    type: 'subject',
                    isLiteral: false
                });
            } else {
                // If node already exists, make sure it's marked as a subject
                const node = nodes.get(subject);
                if (node.type !== 'subject') {
                    node.type = 'subject';
                }
            }
            
            // Add link between subject and object
            links.push({
                source: subject,
                target: object,
                label: predicate ? formatLabel(predicate) : ''
            });
            
            processedCount++;
        }
        
        // Alternative pattern detection: If we have multiple variables that
        // aren't explicitly labeled as subject/predicate/object
        if (!subject && !predicate && !object) {
            // Extract URIs which could be subjects or objects
            const uriVars = Object.entries(binding)
                .filter(([key, val]) => val.type === 'uri')
                .map(([key, val]) => ({ key, value: val.value }));
            
            // If we have at least two URIs, create a relationship between them
            if (uriVars.length >= 2) {
                // Use the first one as source and second as target
                const sourceUri = uriVars[0].value;
                const targetUri = uriVars[1].value;
                
                // Add nodes if they don't exist
                if (!nodes.has(sourceUri)) {
                    nodes.set(sourceUri, {
                        id: sourceUri,
                        type: 'subject',
                        isLiteral: false
                    });
                }
                
                if (!nodes.has(targetUri)) {
                    nodes.set(targetUri, {
                        id: targetUri,
                        type: 'object',
                        isLiteral: false
                    });
                }
                
                // Add a link between them
                links.push({
                    source: sourceUri,
                    target: targetUri,
                    label: uriVars.length > 2 ? formatLabel(uriVars[2].value) : ''
                });
                
                processedCount++;
            }
        }
    });
    
    return {
        nodes: Array.from(nodes.values()),
        links: links,
        limitReached: limitReached
    };
}

/**
 * Format a label for display by extracting the meaningful part
 * @param {string} uri - The URI or value to format
 * @returns {string} - Formatted label
 */
function formatLabel(uri) {
    if (!uri) return '';
    
    // Extract the last part of a URI (after the last # or /)
    if (uri.includes('#') || uri.includes('/')) {
        const hashPart = uri.split('#').pop();
        const slashPart = hashPart.split('/').pop();
        
        // Remove any trailing ">" from URIs
        let label = slashPart.replace(/[<>]/g, '');
        
        // Return shortened version if too long
        return label.length > 25 ? label.substring(0, 25) + '...' : label;
    }
    
    // If it's a literal or simple value, return as is but truncate if too long
    return uri.length > 30 ? uri.substring(0, 30) + '...' : uri;
}

/**
 * Format the JSON result with syntax highlighting
 * @param {string} json - The JSON string to format
 * @returns {string} - HTML with syntax highlighting
 */
function formatJsonWithHighlighting(json) {
    if (!json) return '';
    
    // Create a more advanced replacement function for better highlighting
    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Define pattern to match various JSON elements
        const patterns = [
            // Property keys and their values with colons
            {
                pattern: /"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g,
                replacement: function(match) {
                    const isKey = /:$/.test(match);
                    return '<span class="' + (isKey ? 'json-key' : 'json-string') + '">' + match + '</span>';
                }
            },
            // Numbers
            {
                pattern: /\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g,
                replacement: '<span class="json-number">$1</span>'
            },
            // Boolean values
            {
                pattern: /\b(true|false)\b/g,
                replacement: '<span class="json-boolean">$1</span>'
            },
            // Null values
            {
                pattern: /\bnull\b/g,
                replacement: '<span class="json-null">null</span>'
            },
            // Punctuation and brackets - ENSURING NO COLLAPSIBLE CLASSES ARE ADDED
            {
                pattern: /([{}\[\],])/g,
                replacement: '<span class="json-punctuation">$1</span>'
            }
        ];
        
        // Apply all patterns
        let result = json;
        patterns.forEach(p => {
            result = result.replace(p.pattern, p.replacement);
        });
        
        return result;
    }
    
    // Function to indent JSON properly
    function prettyPrintJson(json) {
        let result = '';
        let indentLevel = 0;
        let inString = false;
        let lastChar = '';
        let currentChar = '';
        
        // Process character by character for proper indentation and line breaks
        for (let i = 0; i < json.length; i++) {
            lastChar = i > 0 ? json.charAt(i - 1) : '';
            currentChar = json.charAt(i);
            const nextChar = i < json.length - 1 ? json.charAt(i + 1) : '';
            
            // Handle strings specially to prevent breaking them
            if (currentChar === '"' && lastChar !== '\\') {
                inString = !inString;
                result += currentChar;
                continue;
            }
            
            if (inString) {
                result += currentChar;
                continue;
            }
            
            // Format based on brackets and punctuation
            switch (currentChar) {
                case '{':
                case '[':
                    result += currentChar;
                    // Don't add newline and indent if the array/object is empty
                    if (nextChar !== '}' && nextChar !== ']') {
                        result += '\n' + ' '.repeat(++indentLevel * 2);
                    }
                    break;
                case '}':
                case ']':
                    // Don't add newline and reduce indent if the array/object was empty
                    if (lastChar !== '{' && lastChar !== '[') {
                        result += '\n' + ' '.repeat(--indentLevel * 2);
                    } else {
                        // Just reduce the indent level without changing the result
                        indentLevel--;
                    }
                    result += currentChar;
                    break;
                case ',':
                    result += currentChar;
                    result += '\n' + ' '.repeat(indentLevel * 2);
                    break;
                case ':':
                    result += currentChar + ' ';  // Add space after colon
                    break;
                default:
                    // Skip whitespace in input as we're adding our own
                    if (!/\s/.test(currentChar)) {
                        result += currentChar;
                    }
            }
        }
        
        return result;
    }
    
    try {
        // Parse and re-stringify to ensure valid JSON
        const obj = JSON.parse(json);
        const prettified = prettyPrintJson(JSON.stringify(obj));
        const highlighted = syntaxHighlight(prettified);
        return highlighted;
    } catch (e) {
        console.error("Error formatting JSON:", e);
        // Return the original JSON if there's an error
        return json;
    }
}

/**
 * Format Turtle RDF content with syntax highlighting
 * @param {string} turtle - The Turtle string to format
 * @returns {string} - HTML with syntax highlighting
 */
function formatTurtleWithHighlighting(turtle) {
    if (!turtle) return '';
    
    // Escape HTML entities
    let escaped = turtle
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Import the Turtle highlighting function from script.js if available
    if (typeof applyTurtleHighlighting === 'function') {
        return applyTurtleHighlighting(escaped);
    }
    
    // Basic highlighting patterns
    const patterns = [
        // URIs
        { pattern: /&lt;([^&]*)&gt;/g, className: 'uri' },
        // Comments
        { pattern: /#.*/g, className: 'comment' },
        // Prefixes and directives
        { pattern: /@prefix|@base/g, className: 'keyword' },
        // Literals
        { pattern: /"([^"\\]|\\.)*"/g, className: 'string' },
        // Numbers
        { pattern: /\b\d+(\.\d+)?([eE][+-]?\d+)?\b/g, className: 'number' },
        // Prefixed names
        { pattern: /([a-zA-Z0-9_-]+):/g, className: 'prefix' },
        // Punctuation
        { pattern: /[\.;,]/g, className: 'punctuation' },
        // RDF type shorthand
        { pattern: /\ba\b/g, className: 'boolean' }
    ];
    
    // Apply all patterns
    patterns.forEach(p => {
        escaped = escaped.replace(p.pattern, match => 
            `<span class="${p.className}">${match}</span>`);
    });
    
    return escaped;
}