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
    openButton.addEventListener('click', () => {
        openInNewWindow(JSON.stringify(results, null, 2), 'json');
    });
    
    actionsContainer.appendChild(downloadButton);
    actionsContainer.appendChild(openButton);
    
    const pre = document.createElement('pre');
    pre.className = 'json-display';
    pre.textContent = JSON.stringify(results, null, 2);
    
    jsonContainer.appendChild(jsonHeader);
    jsonContainer.appendChild(actionsContainer);
    jsonContainer.appendChild(pre);
    resultsContainer.appendChild(jsonContainer);
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
    pre.textContent = xmlString;
    
    xmlContainer.appendChild(xmlHeader);
    xmlContainer.appendChild(actionsContainer);
    xmlContainer.appendChild(pre);
    resultsContainer.appendChild(xmlContainer);
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
 * Display results as a graph
 * @param {Object} results - The query results
 * @param {HTMLElement} resultsContainer - The container to display results in
 */
function displayGraphResults(results, resultsContainer) {
    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';
    
    const graphHeader = document.createElement('h3');
    graphHeader.textContent = 'Graph View';
    graphHeader.style.marginBottom = '10px';
    
    const graphInfo = document.createElement('div');
    graphInfo.innerHTML = `
        <p>This is a placeholder for a graph visualization of your SPARQL results.</p>
        <p>To implement this feature, you could use libraries like:</p>
        <ul>
            <li>D3.js - For custom graph visualizations</li>
            <li>vis.js - For network graphs</li>
            <li>Cytoscape.js - For interactive graph networks</li>
        </ul>
        <p>The graph would show nodes for subjects and objects, with edges representing predicates.</p>
    `;
    
    // Create a visual mockup of a graph using CSS
    const mockGraph = document.createElement('div');
    mockGraph.className = 'mock-graph';
    mockGraph.style.height = '200px';
    mockGraph.style.border = '1px dashed #ccc';
    mockGraph.style.borderRadius = '4px';
    mockGraph.style.margin = '20px 0';
    mockGraph.style.position = 'relative';
    mockGraph.style.backgroundColor = '#f8f8f8';
    
    // Add some mock nodes and edges if we have results
    if (results.results && results.results.bindings && results.results.bindings.length > 0) {
        let nodeCount = Math.min(results.results.bindings.length, 5);
        
        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.className = 'mock-node';
            node.style.width = '40px';
            node.style.height = '40px';
            node.style.borderRadius = '50%';
            node.style.backgroundColor = '#3498db';
            node.style.position = 'absolute';
            node.style.left = `${Math.random() * 80 + 10}%`;
            node.style.top = `${Math.random() * 80 + 10}%`;
            node.style.transform = 'translate(-50%, -50%)';
            node.style.display = 'flex';
            node.style.alignItems = 'center';
            node.style.justifyContent = 'center';
            node.style.color = 'white';
            node.style.fontSize = '12px';
            node.style.fontWeight = 'bold';
            node.textContent = i + 1;
            
            mockGraph.appendChild(node);
        }
    } else {
        // No results message
        const noResults = document.createElement('div');
        noResults.style.position = 'absolute';
        noResults.style.top = '50%';
        noResults.style.left = '50%';
        noResults.style.transform = 'translate(-50%, -50%)';
        noResults.style.fontSize = '14px';
        noResults.style.color = '#777';
        noResults.textContent = 'No data to visualize';
        
        mockGraph.appendChild(noResults);
    }
    
    graphContainer.appendChild(graphHeader);
    graphContainer.appendChild(mockGraph);
    graphContainer.appendChild(graphInfo);
    resultsContainer.appendChild(graphContainer);
}