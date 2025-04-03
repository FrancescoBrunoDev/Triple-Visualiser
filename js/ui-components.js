// UI component creation and management

// Make these functions globally available
window.createDatasetSelector = createDatasetSelector;
window.createDatasetContainer = createDatasetContainer;

/**
 * Creates and adds the dataset selector to the UI
 * @param {Object} jenaServer - The server configuration object
 * @returns {HTMLElement} - The dataset selector element
 */
async function createDatasetSelector(jenaServer) {
    // Create dataset selector dropdown
    const datasetSelector = document.createElement('select');
    datasetSelector.id = 'datasetSelector';
    datasetSelector.style.width = '200px';
    datasetSelector.style.padding = '8px';
    datasetSelector.style.marginBottom = '10px';
    datasetSelector.style.border = '1px solid #ddd';
    datasetSelector.style.borderRadius = '4px';
    
    // Add a loading option while fetching datasets
    const loadingOption = document.createElement('option');
    loadingOption.textContent = 'Loading datasets...';
    loadingOption.disabled = true;
    loadingOption.selected = true;
    datasetSelector.appendChild(loadingOption);
    
    // Try to fetch available datasets
    try {
        // Fetch datasets
        const datasets = await fetchAvailableDatasets(jenaServer);
        
        // Clear the loading option
        datasetSelector.innerHTML = '';
        
        // Add the default option at the beginning
        const defaultOption = document.createElement('option');
        defaultOption.value = datasets.default || 'dataset';
        defaultOption.textContent = 'Default Dataset';
        datasetSelector.appendChild(defaultOption);
        
        // Add options for each dataset
        Object.keys(datasets).forEach(key => {
            if (key !== 'default') {
                const option = document.createElement('option');
                option.value = datasets[key];
                option.textContent = key;
                datasetSelector.appendChild(option);
            }
        });
        
        // If we couldn't find any datasets
        if (datasetSelector.options.length === 1) {
            const noDataOption = document.createElement('option');
            noDataOption.disabled = true;
            noDataOption.textContent = 'No additional datasets found';
            datasetSelector.appendChild(noDataOption);
        }
    } catch (error) {
        console.error('Failed to fetch datasets:', error);
        
        // Remove the loading option
        datasetSelector.innerHTML = '';
        
        // Add the default option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'dataset';
        defaultOption.textContent = 'Default Dataset';
        datasetSelector.appendChild(defaultOption);
        
        // Add error option
        const errorOption = document.createElement('option');
        errorOption.disabled = true;
        errorOption.textContent = 'Error loading datasets';
        datasetSelector.appendChild(errorOption);
        
        // Add fallback datasets
        const fallbackDatasets = {
            B3Kat: 'b3kat'
        };
        
        Object.keys(fallbackDatasets).forEach(key => {
            const option = document.createElement('option');
            option.value = fallbackDatasets[key];
            option.textContent = key;
            datasetSelector.appendChild(option);
        });
    }
    
    return datasetSelector;
}

/**
 * Creates and adds the dataset selector container to the query input section
 * @param {HTMLElement} datasetSelector - The dataset selector element
 * @returns {HTMLElement} - The dataset container element
 */
function createDatasetContainer(datasetSelector) {
    const datasetLabel = document.createElement('label');
    datasetLabel.textContent = 'Select Dataset:';
    datasetLabel.style.display = 'block';
    datasetLabel.style.marginBottom = '5px';
    datasetLabel.style.fontWeight = 'bold';
    
    // Create a container for dataset selection
    const datasetContainer = document.createElement('div');
    datasetContainer.className = 'dataset-selector';
    datasetContainer.style.marginBottom = '15px';
    datasetContainer.appendChild(datasetLabel);
    datasetContainer.appendChild(datasetSelector);
    
    return datasetContainer;
}