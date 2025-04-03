// Main application script
document.addEventListener('DOMContentLoaded', () => {
    // Log for troubleshooting
    console.log("Application initializing...");
    
    // Get DOM Elements
    const elements = {
        queryTypeSelect: document.getElementById('queryType'),
        queryInput: document.getElementById('queryInput'),
        executeQueryBtn: document.getElementById('executeQuery'),
        clearQueryBtn: document.getElementById('clearQuery'),
        resultsContainer: document.getElementById('resultsContainer'),
        statusMessage: document.getElementById('statusMessage'),
        queryTime: document.getElementById('queryTime'),
        formatRadios: document.querySelectorAll('input[name="format"]')
    };
    
    // Check if all elements were found
    Object.entries(elements).forEach(([key, element]) => {
        if (!element) {
            console.error(`Element not found: ${key}`);
        } else {
            console.log(`Found element: ${key}`);
        }
    });
    
    // Initialize UI components
    initUI(elements);
    
    // Add direct event listeners for critical functionality
    // This ensures that the buttons work even if there are issues with the modular code
    elements.executeQueryBtn.onclick = async function(e) {
        console.log("Direct execute handler triggered");
        e.preventDefault();
        
        try {
            const query = elements.queryInput.value.trim();
            if (!query) {
                elements.statusMessage.textContent = 'Error: Query is empty';
                return;
            }
            
            const queryType = elements.queryTypeSelect.value;
            const format = Array.from(elements.formatRadios).find(r => r.checked)?.value || 'table';
            const datasetSelector = document.getElementById('datasetSelector');
            
            if (!datasetSelector) {
                elements.statusMessage.textContent = 'Error: Dataset selector not found';
                return;
            }
            
            const selectedDataset = datasetSelector.value;
            elements.statusMessage.textContent = `Executing ${queryType} query on ${selectedDataset}...`;
            
            if (queryType === 'sparql') {
                const results = await executeSparqlQuery(query, format, selectedDataset, jenaServer);
                displayResults(results, format, elements.resultsContainer);
                elements.statusMessage.textContent = `Query executed successfully on ${selectedDataset}`;
            } else {
                elements.statusMessage.textContent = 'Error: Turtle queries are not yet implemented';
            }
        } catch (error) {
            console.error("Direct handler caught error:", error);
            elements.statusMessage.textContent = `Error: ${error.message}`;
            elements.resultsContainer.innerHTML = `<div class="error"><p>${error.message}</p></div>`;
        }
    };
    
    elements.clearQueryBtn.onclick = function() {
        console.log("Direct clear handler triggered");
        elements.queryInput.value = '';
        elements.statusMessage.textContent = 'Query cleared';
    };
    
    // Initialize event listeners from the modular system
    // We'll keep these as well for consistency
    initEventListeners(elements);
    
    console.log("Application initialization complete");
});

// Initialize UI components
async function initUI(elements) {
    // Show loading status
    elements.statusMessage.textContent = 'Loading datasets...';
    
    try {
        // Create dataset selector (now async)
        const datasetSelector = await createDatasetSelector(jenaServer);
        const datasetContainer = createDatasetContainer(datasetSelector);
        
        // Add to page
        const queryInputContainer = document.querySelector('.query-input');
        queryInputContainer.insertBefore(datasetContainer, queryInputContainer.firstChild);
        
        // Set initial query
        elements.queryInput.value = sampleQueries.sparql;
        
        // Reset status
        elements.statusMessage.textContent = 'Ready';
    } catch (error) {
        console.error('Error initializing UI:', error);
        elements.statusMessage.textContent = 'Error loading datasets. Using defaults.';
        
        // Fallback to static selector if there's an error
        const staticSelector = document.createElement('select');
        staticSelector.id = 'datasetSelector';
        staticSelector.innerHTML = `
            <option value="dataset">Default Dataset</option>
            <option value="b3kat">B3Kat</option>
        `;
        
        const datasetContainer = createDatasetContainer(staticSelector);
        
        const queryInputContainer = document.querySelector('.query-input');
        queryInputContainer.insertBefore(datasetContainer, queryInputContainer.firstChild);
        
        // Set initial query
        elements.queryInput.value = sampleQueries.sparql;
    }
}