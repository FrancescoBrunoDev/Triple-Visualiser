// Query execution and API handling

// Make these functions globally available
window.fetchAvailableDatasets = fetchAvailableDatasets;
window.executeSparqlQuery = executeSparqlQuery;
window.executeTurtleQuery = executeTurtleQuery;
window.handleQueryError = handleQueryError;

/**
 * Fetch available datasets from the B3Kat SPARQL endpoint
 * @param {Object} jenaServer - The server configuration object
 * @returns {Promise<Object>} - Object with dataset names and endpoints
 */
async function fetchAvailableDatasets(jenaServer) {
    try {
        // Force to use HTTPS protocol since B3Kat is HTTPS only
        const protocolToUse = 'https://';
        const serverHost = jenaServer.endpoint.replace(/^https?:\/\//, '');
        const endpoint = `${protocolToUse}${serverHost}${jenaServer.datasetsPath}`;
        console.log(`Attempting to fetch datasets from: ${endpoint}`);
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        // For B3Kat, we don't expect to get a dataset list, but we'll keep this code
        // in case the endpoint changes in the future
        try {
            const data = await response.json();
            console.log(`Successfully fetched datasets`);
            
            // Parse the datasets from the response
            const datasets = {};
            
            if (Array.isArray(data.datasets)) {
                data.datasets.forEach(dataset => {
                    const name = dataset.ds.name || '';
                    if (name) {
                        // Extract just the dataset name from the URI path
                        const nameOnly = name.split('/').pop();
                        datasets[nameOnly] = nameOnly;
                    }
                });
            }
            
            // If no datasets found, return default set
            if (Object.keys(datasets).length === 0) {
                throw new Error('No datasets found in JSON response');
            }
            
            // Add default dataset
            datasets.default = 'dataset';
            console.log(`Found datasets: ${Object.keys(datasets).join(', ')}`);
            
            return datasets;
        } catch (jsonError) {
            console.error('Could not parse JSON from response, using default dataset only');
            // For B3Kat, we'll just use the default dataset
            return {
                default: 'default',
                B3Kat: 'b3kat'
            };
        }
    } catch (error) {
        console.error('Error fetching datasets:', error);
        // Return fallback datasets if fetch fails
        return {
            default: 'default',
            B3Kat: 'b3kat'
        };
    }
}

/**
 * Execute a SPARQL query against the SPARQL endpoint
 * @param {string} query - The SPARQL query to execute
 * @param {string} format - The requested result format
 * @param {string} dataset - The dataset to query
 * @param {Object} jenaServer - The server configuration object
 * @returns {Object} - The query results
 */
async function executeSparqlQuery(query, format, dataset, jenaServer) {
    console.log(`executeSparqlQuery called with dataset: ${dataset}`);
    
    // B3Kat endpoint is HTTPS only
    const protocolToUse = 'https://';
    const serverHost = jenaServer.endpoint.replace(/^https?:\/\//, '');
    
    // For B3Kat, we don't need to include the dataset in the path
    // We'll use the endpoint directly
    const endpoint = `${protocolToUse}${serverHost}${jenaServer.queryPath}`;
    
    console.log(`Endpoint URL: ${endpoint}`);
    
    // Update UI for better user feedback
    document.getElementById('statusMessage').textContent = `Connecting to B3Kat SPARQL endpoint...`;
    
    // Determine the accept header based on the format
    let acceptHeader = 'application/sparql-results+json';
    
    try {
        console.log(`Sending fetch request to: ${endpoint}`);
        console.log(`Query body: ${query.substring(0, 100)}...`);
        
        // For B3Kat endpoint, we use GET with URL encoding
        const encodedQuery = encodeURIComponent(query);
        const queryUrl = `${endpoint}?query=${encodedQuery}`;
        
        console.log(`Making GET request to: ${queryUrl.substring(0, 100)}...`);
        
        const response = await fetch(queryUrl, {
            method: 'GET',
            headers: {
                'Accept': acceptHeader
            }
        });
        
        console.log(`Received response with status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const results = await response.json();
        console.log(`Parsed results, binding count: ${results?.results?.bindings?.length || 'unknown'}`);
        return results;
    } catch (error) {
        // Add more context to the error
        console.error('Error in executeSparqlQuery:', error);
        throw new Error(`Error querying B3Kat endpoint: ${error.message}`);
    }
}

/**
 * Execute a Turtle query (placeholder implementation)
 * @param {string} query - The Turtle query to execute
 * @param {string} dataset - The dataset to query
 * @returns {Object} - The query results
 */
async function executeTurtleQuery(query, dataset) {
    // This is a placeholder. In a real application, you would need to 
    // implement logic to handle Turtle queries based on your endpoint's capabilities
    throw new Error('Turtle query execution not implemented yet');
}

/**
 * Handle query errors with user-friendly messages
 * @param {Error} error - The error object
 * @param {HTMLElement} resultsContainer - The container to display error messages
 * @param {HTMLElement} statusMessage - The status message element
 * @param {Object} jenaServer - The server configuration object
 */
function handleQueryError(error, resultsContainer, statusMessage, jenaServer) {
    let errorMessage = error.message;
    
    resultsContainer.innerHTML = `<div class="error">${errorMessage}</div>`;
    statusMessage.textContent = `Error: ${errorMessage.split('.')[0]}`; // Just show the first sentence in status bar
}