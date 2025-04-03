// Event handling functions

// Make these functions globally available
window.initEventListeners = initEventListeners;
window.executeQuery = executeQuery;
window.handleFormatChange = handleFormatChange;
window.getSelectedFormat = getSelectedFormat;

/**
 * Initialize all event listeners for the application
 * @param {Object} elements - DOM elements collection
 */
function initEventListeners(elements) {
    console.log("Setting up event listeners...");
    
    // Query type change
    elements.queryTypeSelect.addEventListener('change', () => {
        const queryType = elements.queryTypeSelect.value;
        console.log(`Query type changed to: ${queryType}`);
        elements.queryInput.placeholder = `Enter your ${queryType.toUpperCase()} query here...`;
        elements.queryInput.value = sampleQueries[queryType] || '';
    });
    
    // Clear button
    elements.clearQueryBtn.addEventListener('click', () => {
        console.log("Clear button clicked");
        elements.queryInput.value = '';
        elements.statusMessage.textContent = 'Query cleared';
    });
    
    // Execute button
    elements.executeQueryBtn.addEventListener('click', async () => {
        console.log("Execute button click handler from event-handlers.js");
        try {
            await executeQuery(elements);
        } catch (error) {
            console.error("Error in executeQuery:", error);
            elements.statusMessage.textContent = `Error: ${error.message}`;
        }
    });
    
    // Format change
    elements.formatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            console.log(`Format changed to: ${radio.value}`);
            handleFormatChange(radio.value, elements);
        });
    });
    
    console.log("Event listeners setup complete");
}

/**
 * Execute a query against the B3Kat endpoint
 * @param {Object} elements - DOM elements collection
 */
async function executeQuery(elements) {
    console.log("executeQuery function called");
    
    const query = elements.queryInput.value.trim();
    if (!query) {
        console.log("Query is empty");
        elements.statusMessage.textContent = 'Error: Query is empty';
        return;
    }
    
    const queryType = elements.queryTypeSelect.value;
    const format = getSelectedFormat(elements.formatRadios);
    const datasetSelector = document.getElementById('datasetSelector');
    
    if (!datasetSelector) {
        console.error("Dataset selector not found!");
        elements.statusMessage.textContent = 'Error: Dataset selector not found';
        return;
    }
    
    const selectedDataset = datasetSelector.value;
    console.log(`Executing ${queryType} query on dataset: ${selectedDataset}`);
    
    try {
        elements.statusMessage.textContent = `Executing query on ${selectedDataset} dataset...`;
        const startTime = performance.now();
        
        let results;
        if (queryType === 'sparql') {
            results = await executeSparqlQuery(query, format, selectedDataset, jenaServer);
        } else if (queryType === 'turtle') {
            results = await executeTurtleQuery(query, selectedDataset);
        }
        
        const endTime = performance.now();
        const timeTaken = Math.round(endTime - startTime);
        elements.queryTime.textContent = `Query time: ${timeTaken}ms`;
        
        console.log("Query executed successfully, displaying results");
        displayResults(results, format, elements.resultsContainer);
        elements.statusMessage.textContent = `Query executed successfully on ${selectedDataset}`;
    } catch (error) {
        console.error('Query execution error:', error);
        handleQueryError(error, elements.resultsContainer, elements.statusMessage, jenaServer);
    }
}

/**
 * Handle format change event
 * @param {string} format - The selected format
 * @param {Object} elements - DOM elements collection
 */
function handleFormatChange(format, elements) {
    // Check if we have stored results to display in the new format
    if (elements.resultsContainer.dataset.results) {
        try {
            console.log(`Changing display format to ${format}`);
            const results = JSON.parse(elements.resultsContainer.dataset.results);
            displayResults(results, format, elements.resultsContainer);
            elements.statusMessage.textContent = `Display format changed to ${format}`;
        } catch (e) {
            console.error('Error parsing stored results:', e);
            elements.statusMessage.textContent = 'Error changing format: Could not parse results';
        }
    } else {
        console.log('No results to display in new format');
        elements.statusMessage.textContent = 'Execute a query first to see results in this format';
    }
}

/**
 * Get the selected format from radio buttons
 * @param {NodeList} formatRadios - The format radio buttons
 * @returns {string} - The selected format
 */
function getSelectedFormat(formatRadios) {
    for (const radio of formatRadios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return 'table'; // Default
}