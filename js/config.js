// Server configuration
const jenaServer = {
    // Updated to use LOD B3Kat SPARQL endpoint
    endpoint: 'https://lod.b3kat.de',
    queryPath: '/sparql',
    updatePath: '/sparql',
    datasetsPath: '/sparql',  // Path to get list of datasets
    datasets: {
        default: 'dataset',
        // These will be populated dynamically
    }
};

// Sample queries for quick testing
const sampleQueries = {
    sparql: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX bibo: <http://purl.org/ontology/bibo/>
PREFIX frbr: <http://purl.org/vocab/frbr/core#>
PREFIX event: <http://purl.org/NET/c4dm/event.owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX skos: <http://w3.org/2004/02/skos/core#>
PREFIX geonames: <http://www.geonames.org/ontology#>
PREFIX marcrel: <http://id.loc.gov/vocabulary/relators/>
PREFIX rdagr1: <http://rdvocab.info/Elements/>
PREFIX umbel: <http://umbel.org/umbel#>
PREFIX b3kat: <http://bsb-muenchen.de/ont/b3katOntology#>

SELECT * WHERE {
    ?s ?p ?o
    } 
LIMIT 50`,
    turtle: `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`
};