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
    
    // Add query input highlighting with enhanced functionality
    initQueryHighlighting(elements.queryInput, elements.queryTypeSelect);
    
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
            const format = getSelectedFormat(elements.formatRadios);
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
        
        // Update the highlighting for the cleared textarea
        updateQueryHighlighting(elements.queryInput, elements.queryTypeSelect.value);
    };
    
    // Add direct format change listeners
    elements.formatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            console.log(`Format radio changed directly to: ${radio.value}`);
            if (elements.resultsContainer.dataset.results) {
                try {
                    const results = JSON.parse(elements.resultsContainer.dataset.results);
                    displayResults(results, radio.value, elements.resultsContainer);
                    elements.statusMessage.textContent = `Display format changed to ${radio.value}`;
                } catch (e) {
                    console.error('Error parsing stored results:', e);
                    elements.statusMessage.textContent = 'Error changing format: Could not parse results';
                }
            } else {
                console.log('No results to display in new format');
                elements.statusMessage.textContent = 'Execute a query first to see results in this format';
            }
        });
    });
    
    // Initialize event listeners from the modular system
    // We'll keep these as well for consistency
    initEventListeners(elements);
    
    console.log("Application initialization complete");
});

/**
 * Initialize enhanced query highlighting with custom implementation
 * @param {HTMLTextAreaElement} textarea - The query input textarea
 * @param {HTMLSelectElement} queryTypeSelect - The query type selector
 */
function initQueryHighlighting(textarea, queryTypeSelect) {
    // Create a container to hold both the textarea and the highlighting layer
    const container = document.createElement('div');
    container.className = 'query-editor-container';
    container.style.position = 'relative';
    container.style.width = '100%';
    
    // Don't set a fixed height for the container, let it adjust to content
    // Instead of copying the height, set a minimum height based on the textarea
    const textareaStyle = window.getComputedStyle(textarea);
    container.style.minHeight = textareaStyle.height;
    
    // Insert the container in place of the textarea
    textarea.parentNode.insertBefore(container, textarea);
    
    // Create the highlighting pre element
    const highlightLayer = document.createElement('pre');
    highlightLayer.className = 'highlight-layer';
    highlightLayer.style.position = 'absolute';
    highlightLayer.style.top = '0';
    highlightLayer.style.left = '0';
    highlightLayer.style.width = '100%';
    highlightLayer.style.height = '100%';
    highlightLayer.style.margin = '0';
    highlightLayer.style.padding = textareaStyle.padding;
    highlightLayer.style.border = 'none';
    highlightLayer.style.pointerEvents = 'none';
    highlightLayer.style.overflow = 'auto';
    highlightLayer.style.whiteSpace = 'pre-wrap';
    highlightLayer.style.backgroundColor = 'transparent';
    
    // Move the textarea into the container and set its background to transparent
    container.appendChild(highlightLayer);
    
    // Keep original textarea styling but make it transparent for highlighting to show through
    textarea.style.backgroundColor = 'transparent';
    textarea.style.position = 'relative'; // Changed from absolute to relative
    textarea.style.width = '100%';
    // Don't override the height, let it be controlled by the user
    textarea.style.color = 'transparent';
    textarea.style.caretColor = '#000';
    textarea.style.zIndex = '1';
    // Ensure resize is explicitly set to vertical
    textarea.style.resize = 'vertical';
    
    // Store original height to calculate changes
    let originalHeight = textarea.offsetHeight;
    
    container.appendChild(textarea);
    
    // Use the MutationObserver instead of ResizeObserver for better compatibility
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                // When textarea style changes (including height), update the container and highlight layer
                const newHeight = textarea.offsetHeight;
                if (newHeight !== originalHeight) {
                    container.style.height = newHeight + 'px';
                    highlightLayer.style.height = newHeight + 'px';
                    originalHeight = newHeight;
                }
            }
        });
    });
    
    // Configure and start the observer
    observer.observe(textarea, {
        attributes: true,
        attributeFilter: ['style']
    });
    
    // Also use the input event to update container height when content changes
    textarea.addEventListener('input', function() {
        // Use setTimeout to ensure this runs after the browser has updated the textarea size
        setTimeout(() => {
            const newHeight = textarea.offsetHeight;
            if (newHeight !== originalHeight) {
                container.style.height = newHeight + 'px';
                highlightLayer.style.height = newHeight + 'px';
                originalHeight = newHeight;
            }
        }, 0);
    });
    
    // Function to update the highlighting
    function updateHighlighting() {
        const query = textarea.value;
        const queryType = queryTypeSelect.value;
        const highlightedCode = applyHighlighting(query, queryType);
        highlightLayer.innerHTML = highlightedCode;
        
        // Sync scrolling
        highlightLayer.scrollTop = textarea.scrollTop;
        highlightLayer.scrollLeft = textarea.scrollLeft;
    }
    
    // Update the highlighting on input
    textarea.addEventListener('input', updateHighlighting);
    textarea.addEventListener('scroll', () => {
        highlightLayer.scrollTop = textarea.scrollTop;
        highlightLayer.scrollLeft = textarea.scrollLeft;
    });
    
    // Initial highlighting
    updateHighlighting();
    
    // Add change event to query type selector
    queryTypeSelect.addEventListener('change', updateHighlighting);
}

/**
 * Apply highlighting to query text
 * @param {string} query - The query text to highlight
 * @param {string} queryType - The type of query (sparql or turtle)
 * @returns {string} - HTML with syntax highlighting
 */
function applyHighlighting(query, queryType) {
    if (!query) return '';
    
    // Escape HTML to prevent XSS
    const escaped = query
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    if (queryType === 'sparql') {
        return applySparqlHighlighting(escaped);
    } else {
        return applyTurtleHighlighting(escaped);
    }
}

/**
 * Apply SPARQL syntax highlighting
 * @param {string} escaped - Escaped query text
 * @returns {string} - HTML with SPARQL syntax highlighting
 */
function applySparqlHighlighting(escaped) {
    // SPARQL keywords (expanded and organized list)
    const keywords = [
        // Main operation types
        'SELECT', 'CONSTRUCT', 'ASK', 'DESCRIBE', 'INSERT', 'DELETE', 'LOAD', 'CLEAR',
        'DROP', 'CREATE', 'ADD', 'MOVE', 'COPY', 'WITH',
        
        // Clauses and modifiers 
        'WHERE', 'FROM', 'INTO', 'TO', 'AS', 'GROUP', 'HAVING', 'ORDER', 'BY', 'LIMIT', 
        'OFFSET', 'VALUES', 'BIND', 'SERVICE', 'NAMED', 'DISTINCT', 'REDUCED',
        
        // Logical operators
        'OPTIONAL', 'UNION', 'MINUS', 'GRAPH', 'FILTER', 'NOT', 'EXISTS', 'IN', 
        
        // Prefix declarations
        'PREFIX', 'BASE',
        
        // Aggregates
        'COUNT', 'SUM', 'MIN', 'MAX', 'AVG', 'SAMPLE', 'GROUP_CONCAT',
        
        // Date/time functions
        'NOW', 'YEAR', 'MONTH', 'DAY', 'HOURS', 'MINUTES', 'SECONDS', 'TIMEZONE',
        
        // Conditional expressions
        'IF', 'COALESCE', 'EXISTS', 'BOUND'
    ];
    
    // Operators
    const operators = [
        '=', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '&&', '||', '!', '^'
    ];
    
    // RDF types and special literals
    const rdfTypes = ['a', 'true', 'false'];  // 'a' is a shorthand for rdf:type
    
    // Built-in SPARQL functions
    const functions = [
        'REGEX', 'REPLACE', 'STRLEN', 'SUBSTR', 'UCASE', 'LCASE', 'STRSTARTS', 'STRENDS',
        'STRBEFORE', 'STRAFTER', 'CONTAINS', 'ENCODE_FOR_URI', 'CONCAT', 'LANGMATCHES',
        'LANG', 'DATATYPE', 'BOUND', 'IRI', 'URI', 'BNODE', 'RAND', 'ABS', 'CEIL', 'FLOOR',
        'ROUND', 'STRLEN', 'STR', 'ISIRI', 'ISURI', 'ISBLANK', 'ISLITERAL', 'ISNUMERIC'
    ];
    
    // Process the SPARQL query line by line for better highlighting
    const lines = escaped.split('\n');
    const highlightedLines = lines.map(line => {
        // Check if the line is a comment
        if (line.trim().startsWith('#')) {
            return '<span class="comment">' + line + '</span>';
        }
        
        // Process individual line
        let highlighted = line;
        
        // Process the line character by character to handle nested structures properly
        let result = '';
        let inString = false;  // Track if we're inside a string literal
        let stringStart = '';  // Track what character opened the string (" or ')
        let i = 0;
        
        while (i < line.length) {
            const char = line.charAt(i);
            const nextChar = i < line.length - 1 ? line.charAt(i + 1) : '';
            
            // Handle comments (# to end of line)
            if (char === '#' && !inString) {
                const comment = line.substring(i);
                result += '<span class="comment">' + comment + '</span>';
                break;  // End of line processing
            }
            
            // Handle string literals (with proper escaping handling)
            if ((char === '"' || char === "'") && !inString) {
                // Starting a string
                inString = true;
                stringStart = char;
                result += '<span class="string">' + char;
                i++;
            } else if (inString && char === stringStart && line.charAt(i - 1) !== '\\') {
                // End of string
                result += char + '</span>';
                inString = false;
                i++;
                
                // Check for language tag or datatype after the string
                let j = i;
                // Skip whitespace
                while (j < line.length && /\s/.test(line.charAt(j))) j++;
                
                // Handle language tag (@en, @fr, etc.)
                if (j < line.length && line.charAt(j) === '@') {
                    let langTag = '@';
                    j++;
                    while (j < line.length && /[a-zA-Z0-9-]/.test(line.charAt(j))) {
                        langTag += line.charAt(j);
                        j++;
                    }
                    result += '<span class="language-tag">' + langTag + '</span>';
                    i = j;
                }
                // Handle datatype (^^xsd:string, etc.)
                else if (j < line.length - 1 && line.charAt(j) === '^' && line.charAt(j + 1) === '^') {
                    result += '<span class="operator">^^</span>';
                    i = j + 2;
                }
            } else if (inString) {
                // Inside a string, just add the character
                result += char;
                i++;
            }
            // Handle URI with angle brackets
            else if (char === '<' && !inString) {
                // Find the matching closing '>'
                let j = i + 1;
                let uri = '<';
                while (j < line.length && line.charAt(j) !== '>') {
                    uri += line.charAt(j);
                    j++;
                }
                if (j < line.length) uri += '>';
                
                result += '<span class="uri">' + uri + '</span>';
                i = j + 1;
            }
            // Handle variables with ? or $
            else if ((char === '?' || char === '$') && !inString) {
                let j = i + 1;
                let variable = char;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line.charAt(j))) {
                    variable += line.charAt(j);
                    j++;
                }
                result += '<span class="variable">' + variable + '</span>';
                i = j;
            }
            // Handle prefixed names (prefix:local)
            else if (/[a-zA-Z0-9_]/.test(char) && !inString) {
                let j = i;
                let term = '';
                // Collect the entire term
                while (j < line.length && /[a-zA-Z0-9_-]/.test(line.charAt(j))) {
                    term += line.charAt(j);
                    j++;
                }
                
                // Check if it's a keyword
                const upperTerm = term.toUpperCase();
                if (keywords.includes(upperTerm)) {
                    result += '<span class="keyword">' + term + '</span>';
                    i = j;
                }
                // Check if it's an RDF type
                else if (rdfTypes.includes(term.toLowerCase())) {
                    result += '<span class="boolean">' + term + '</span>';
                    i = j;
                }
                // Check if it's a function
                else if (functions.includes(upperTerm)) {
                    result += '<span class="function">' + term + '</span>';
                    i = j;
                }
                // Check if it's a prefixed name (prefix:local)
                else if (j < line.length && line.charAt(j) === ':') {
                    // It's a prefix
                    result += '<span class="prefix">' + term + ':</span>';
                    i = j + 1;
                    
                    // Now get the local part
                    let local = '';
                    j = i;
                    while (j < line.length && /[a-zA-Z0-9_-]/.test(line.charAt(j))) {
                        local += line.charAt(j);
                        j++;
                    }
                    if (local) {
                        result += '<span class="local-name">' + local + '</span>';
                        i = j;
                    }
                }
                else {
                    // Just a regular term, add it as is
                    result += term;
                    i = j;
                }
            }
            // Handle numbers (integers, decimals)
            else if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(nextChar))) {
                let j = i;
                let num = '';
                // Handle negative sign
                if (char === '-') {
                    num += char;
                    j++;
                }
                // Collect all digits
                while (j < line.length && /[0-9.]/.test(line.charAt(j))) {
                    num += line.charAt(j);
                    j++;
                }
                // Check for scientific notation
                if (j < line.length - 1 && 
                   (line.charAt(j).toLowerCase() === 'e') && 
                   (/[0-9+-]/.test(line.charAt(j + 1)))) {
                    num += line.charAt(j); // 'e' or 'E'
                    j++;
                    if (line.charAt(j) === '+' || line.charAt(j) === '-') {
                        num += line.charAt(j);
                        j++;
                    }
                    while (j < line.length && /[0-9]/.test(line.charAt(j))) {
                        num += line.charAt(j);
                        j++;
                    }
                }
                
                result += '<span class="number">' + num + '</span>';
                i = j;
            }
            // Handle operators
            else if (operators.includes(char) || 
                     (char === '!' && nextChar === '=') || 
                     (char === '<' && nextChar === '=') || 
                     (char === '>' && nextChar === '=') ||
                     (char === '&' && nextChar === '&') ||
                     (char === '|' && nextChar === '|')) {
                
                let operator = char;
                if ((char === '!' && nextChar === '=') || 
                    (char === '<' && nextChar === '=') || 
                    (char === '>' && nextChar === '=') ||
                    (char === '&' && nextChar === '&') ||
                    (char === '|' && nextChar === '|')) {
                    operator += nextChar;
                    i++;  // Skip the next character
                }
                
                result += '<span class="operator">' + operator + '</span>';
                i++;
            }
            // Handle punctuation
            else if (['.', ';', ',', '{', '}', '(', ')', '[', ']'].includes(char)) {
                result += '<span class="punctuation">' + char + '</span>';
                i++;
            }
            // Just add other characters
            else {
                result += char;
                i++;
            }
        }
        
        return result || highlighted;  // Fallback to the regex version if something goes wrong
    });
    
    return highlightedLines.join('\n');
}

/**
 * Apply Turtle syntax highlighting
 * @param {string} escaped - Escaped query text
 * @returns {string} - HTML with Turtle syntax highlighting
 */
function applyTurtleHighlighting(escaped) {
    // Process the Turtle line by line for better handling
    const lines = escaped.split('\n');
    const highlightedLines = lines.map(line => {
        // Check if the line is a comment
        if (line.trim().startsWith('#')) {
            return '<span class="comment">' + line + '</span>';
        }
        
        // Process individual line with character-by-character approach
        let result = '';
        let inString = false;  // Track if we're inside a string literal
        let stringStart = '';  // Track what character opened the string (" or ')
        let i = 0;
        
        while (i < line.length) {
            const char = line.charAt(i);
            const nextChar = i < line.length - 1 ? line.charAt(i + 1) : '';
            
            // Handle comments (# to end of line)
            if (char === '#' && !inString) {
                const comment = line.substring(i);
                result += '<span class="comment">' + comment + '</span>';
                break;  // End of line processing
            }
            
            // Handle string literals (with proper escaping handling)
            if ((char === '"' || char === "'") && !inString) {
                // Starting a string
                inString = true;
                stringStart = char;
                result += '<span class="string">' + char;
                i++;
            } else if (inString && char === stringStart && line.charAt(i - 1) !== '\\') {
                // End of string
                result += char + '</span>';
                inString = false;
                i++;
                
                // Check for language tag or datatype after the string
                let j = i;
                // Skip whitespace
                while (j < line.length && /\s/.test(line.charAt(j))) j++;
                
                // Handle language tag (@en, @fr, etc.)
                if (j < line.length && line.charAt(j) === '@') {
                    let langTag = '@';
                    j++;
                    while (j < line.length && /[a-zA-Z0-9-]/.test(line.charAt(j))) {
                        langTag += line.charAt(j);
                        j++;
                    }
                    result += '<span class="language-tag">' + langTag + '</span>';
                    i = j;
                }
                // Handle datatype (^^xsd:string, etc.)
                else if (j < line.length - 1 && line.charAt(j) === '^' && line.charAt(j + 1) === '^') {
                    result += '<span class="operator">^^</span>';
                    i = j + 2;
                    
                    // Skip whitespace
                    while (i < line.length && /\s/.test(line.charAt(i))) i++;
                    
                    // Check for prefixed name (e.g., xsd:string)
                    if (i < line.length && /[a-zA-Z0-9_]/.test(line.charAt(i))) {
                        let prefix = '';
                        while (i < line.length && /[a-zA-Z0-9_-]/.test(line.charAt(i))) {
                            prefix += line.charAt(i);
                            i++;
                        }
                        
                        if (i < line.length && line.charAt(i) === ':') {
                            result += '<span class="prefix">' + prefix + ':</span>';
                            i++;
                            
                            // Get the local name
                            let local = '';
                            while (i < line.length && /[a-zA-Z0-9_-]/.test(line.charAt(i))) {
                                local += line.charAt(i);
                                i++;
                            }
                            
                            if (local) {
                                result += '<span class="local-name">' + local + '</span>';
                            }
                        }
                    }
                }
            } else if (inString) {
                // Inside a string, just add the character
                result += char;
                i++;
            }
            // Handle URI with angle brackets
            else if (char === '<' && !inString) {
                // Find the matching closing '>'
                let j = i + 1;
                let uri = '<';
                while (j < line.length && line.charAt(j) !== '>') {
                    uri += line.charAt(j);
                    j++;
                }
                if (j < line.length) uri += '>';
                
                result += '<span class="uri">' + uri + '</span>';
                i = j + 1;
            }
            // Handle prefix declarations (@prefix or @base)
            else if (char === '@' && (line.substring(i, i + 7) === '@prefix' || line.substring(i, i + 5) === '@base')) {
                const isPrefix = line.substring(i, i + 7) === '@prefix';
                const keyword = isPrefix ? '@prefix' : '@base';
                result += '<span class="keyword">' + keyword + '</span>';
                i += keyword.length;
                
                // Skip whitespace
                while (i < line.length && /\s/.test(line.charAt(i))) {
                    result += line.charAt(i);
                    i++;
                }
                
                if (isPrefix) {
                    // Handle the prefix name (if any)
                    let prefixName = '';
                    while (i < line.length && /[a-zA-Z0-9_-]/.test(line.charAt(i))) {
                        prefixName += line.charAt(i);
                        i++;
                    }
                    
                    if (prefixName) {
                        result += '<span class="prefix">' + prefixName + '</span>';
                    }
                    
                    // Handle the colon
                    if (i < line.length && line.charAt(i) === ':') {
                        result += '<span class="punctuation">:</span>';
                        i++;
                    }
                }
            }
            // Handle 'a' as RDF type shorthand
            else if (char === 'a' && (i === 0 || /\s/.test(line.charAt(i - 1))) && 
                     (i === line.length - 1 || /[\s\.;,]/.test(line.charAt(i + 1)))) {
                result += '<span class="boolean">a</span>';
                i++;
            }
            // Handle prefixed names (prefix:local)
            else if (/[a-zA-Z0-9_]/.test(char)) {
                let j = i;
                let term = '';
                // Collect the entire term
                while (j < line.length && /[a-zA-Z0-9_-]/.test(line.charAt(j))) {
                    term += line.charAt(j);
                    j++;
                }
                
                // Check if it's a prefixed name (prefix:local)
                if (j < line.length && line.charAt(j) === ':') {
                    // It's a prefix
                    result += '<span class="prefix">' + term + ':</span>';
                    i = j + 1;
                    
                    // Now get the local part
                    let local = '';
                    j = i;
                    while (j < line.length && /[a-zA-Z0-9_-]/.test(line.charAt(j))) {
                        local += line.charAt(j);
                        j++;
                    }
                    if (local) {
                        result += '<span class="local-name">' + local + '</span>';
                        i = j;
                    }
                }
                else if (term === 'true' || term === 'false') {
                    result += '<span class="boolean">' + term + '</span>';
                    i = j;
                }
                else {
                    // Just a regular term, add it as is
                    result += term;
                    i = j;
                }
            }
            // Handle numbers (integers, decimals)
            else if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(nextChar))) {
                let j = i;
                let num = '';
                // Handle negative sign
                if (char === '-') {
                    num += char;
                    j++;
                }
                // Collect all digits
                while (j < line.length && /[0-9.]/.test(line.charAt(j))) {
                    num += line.charAt(j);
                    j++;
                }
                // Check for scientific notation
                if (j < line.length - 1 && 
                   (line.charAt(j).toLowerCase() === 'e') && 
                   (/[0-9+-]/.test(line.charAt(j + 1)))) {
                    num += line.charAt(j); // 'e' or 'E'
                    j++;
                    if (line.charAt(j) === '+' || line.charAt(j) === '-') {
                        num += line.charAt(j);
                        j++;
                    }
                    while (j < line.length && /[0-9]/.test(line.charAt(j))) {
                        num += line.charAt(j);
                        j++;
                    }
                }
                
                result += '<span class="number">' + num + '</span>';
                i = j;
            }
            // Handle punctuation
            else if (['.', ';', ',', '{', '}', '(', ')', '[', ']'].includes(char)) {
                result += '<span class="punctuation">' + char + '</span>';
                i++;
            }
            // Just add other characters
            else {
                result += char;
                i++;
            }
        }
        
        return result || line;  // Fallback to the original line if processing fails
    });
    
    return highlightedLines.join('\n');
}

/**
 * Update the query highlighting for an existing textarea
 * @param {HTMLTextAreaElement} textarea - The query input textarea
 * @param {string} queryType - The type of query
 */
function updateQueryHighlighting(textarea, queryType) {
    const container = textarea.parentNode;
    if (container && container.className === 'query-editor-container') {
        const highlightLayer = container.querySelector('.highlight-layer');
        if (highlightLayer) {
            const query = textarea.value;
            const highlightedCode = applyHighlighting(query, queryType);
            highlightLayer.innerHTML = highlightedCode;
        }
    }
}

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

// Utility function to get the selected format (copy from event-handlers.js to avoid dependency issues)
function getSelectedFormat(formatRadios) {
    for (const radio of formatRadios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return 'table'; // Default
}