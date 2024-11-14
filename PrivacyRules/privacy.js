// Function to start the CODAP connection
function startCodapConnection() {
    var config = {
        title: "Privacy Rules Plugin",
        version: "0.1",
        dimensions: {width: 800, height: 800}
    };

    codapInterface.init(config).then(() => {
        console.log('CODAP connection established.');
        loadCSVDataInData('lite_adult_with_pii.csv');
    }).catch(msg => {
        console.error('CODAP connection error: ' + msg);
    });
}

// Function to load the CSV data from a URL
function loadCSVDataInData(datasetName) {
    const csvURL = `https://raw.githubusercontent.com/Ruze-alt/privacy/refs/heads/main/data/${datasetName}`;

    codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContextFromURL',
        values: {
            URL: csvURL,
        }
    }).then(response => {
        if (response.success) {
            console.log('CSV data loaded successfully.');
        } else {
            console.error('Failed to load CSV data.');
        }
    }).catch(error => {
        console.error('Error loading CSV:', error);
    });
}

// Function to show a module
function showModule(moduleID) {
    const modules = document.querySelectorAll('.privacyModule, #main');
    modules.forEach(module => module.style.display = 'none');
    document.getElementById(moduleID).style.display = 'block';

    if (moduleID === 'differentialPrivacyIntro') {
        getTrueCount().then(trueCount => {
            document.getElementById('trueResult').textContent = trueCount;
        });

        // Chain initialization of Noise and NoisyAge attributes, then open the graph
        initializeNoiseAttribute().then(() => {
            return initializeNoisyAgeAttribute();
        }).then(() => {
            openGraph(); // Open graph after both attributes are initialized
        }).catch(error => {
            console.error('Error during initialization:', error);
        });

        displayOriginalDistribution('Marital Status');
    }
}

// Function to update the epsilon value
function updateEpsilon(epsilonValue) {
    document.getElementById('epsilonValue').textContent = parseFloat(epsilonValue).toFixed(1);
}

// Function to update the sensitivity value
function updateSensitivity(sensitivityValue) {
    document.getElementById('sensitivityValue').textContent = parseFloat(sensitivityValue).toFixed(1);
}

// Function to apply differential privacy and update only the Noise column
function applyDifferentialPrivacy() {
    const epsilon = parseFloat(document.getElementById('epsilonValue').textContent);
    const sensitivity = parseFloat(document.getElementById('sensitivityValue').textContent);

    getTrueCount().then(trueCount => { // Get the true count
        const noisyCount = trueCount + laplaceNoise(sensitivity, epsilon); // Add noise to the true count
        document.getElementById('noisyResult').textContent = noisyCount.toFixed(2); // Display the noisy count
    });

    // Retrieve all cases and update only the Noise column
    getAllCases().then(cases => {
        const updatedCases =cases.map(item => {
            const noise = laplaceNoise(sensitivity, epsilon);
            return {
                id: item.case.id,
                values: { Noise: noise.toFixed(2) }
            };
        });
        
        // Update Noise values
        codapInterface.sendRequest({
            action: 'update',
            resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
            values: updatedCases
        }).then(response => {
            if (response.success) {
                console.log('Noise values updated successfully.');
            } else {
                console.error('Failed to update Noise values.');
            }
        });
    });
}

// Function to generate Laplace noise for a given sensitivity and epsilon
function laplaceNoise(sensitivity, epsilon) {
    const scale = sensitivity / epsilon;
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

// Function to get all cases 
function getAllCases() {
    return codapInterface.sendRequest({
        action: 'get',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].allCases'
    }).then(response => {
        if (response.success) {
            const cases = response.values.cases;  // Access the 'cases' array inside 'values'
            //console.log(cases);
            return cases;  // Return the cases array
        } else {
            console.error('Failed to retrieve cases.');
            return [];  // Return an empty array in case of failure
        }
    });
}

// Function to initialize Noise column (returns a Promise)
function initializeNoiseAttribute() {
    return codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].attribute',
        values: {
            name: 'Noise',
            type: 'numeric',
            precision: 2,
            description: 'Noise Generated'
        }
    }).then(response => {
        if (response.success) {
            console.log('Noise attribute created successfully.');
            
            // Get all cases asynchronously and then update them
            return getAllCases().then(cases => {
                const updatedCases = cases.map(item => ({
                    id: item.case.id,
                    values: { Noise: 0 }
                }));

                // Update dataset with Noise values set to 0
                return codapInterface.sendRequest({
                    action: 'update',
                    resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
                    values: updatedCases
                });
            }).then(response => {
                if (response.success) {
                    console.log('All Noise values initialized to 0.');
                } else {
                    console.error('Failed to initialize Noise values.');
                }
            });
        } else {
            console.error('Failed to create Noise attribute.');
        }
    });
}

// Function to initialize NoisyAge column (returns a Promise)
function initializeNoisyAgeAttribute() {
    return codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].attribute',
        values: {
            name: 'NoisyAge',
            type: 'numeric',
            precision: 2,
            formula: 'Age + Noise', // Formula that automatically updates NoisyAge
            description: 'Noisy Age'
        }
    }).then(response => {
        if (response.success) {
            console.log('Noisy Age attribute created successfully.');
        } else {
            console.error('Failed to create Noisy Age attribute.');
        }
    });
}

// Function to open a graph in CODAP
function openGraph() {
    const graphConfig = {
        type: 'graph',
        title: 'Differential Privacy Graph',
        dimensions: {width: 800, height: 500},
        xAttributeName : 'Age',
        yAttributeName : 'NoisyAge',
        dataContext : 'lite_adult_with_pii'
    };

    codapInterface.sendRequest({
        action : 'create',
        resource : 'component',
        values : graphConfig
    }).then(response => {
        if (response.success) {
            console.log('Differential Privacy graph created successfully.');
        } else {
            console.error('Failed to create Differential Privacy graph.');
        }
    });
}

// Function to retrieve the true count of cases
function getTrueCount() {
    return codapInterface.sendRequest({
        action: 'get',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].caseFormulaSearch[Age >= 40]'
    }).then(response => {
        if (response.success) {
            return response.values.length;
        } else {
            console.error('Failed to retrieve true count.');
            return 0;
        }
    });
}

// Function to generate laplace noise for a given sensitivity and epsilon
function laplaceNoise(sensitivity, epsilon) {
    const scale = sensitivity / epsilon;
    const u = Math.random() - 0.5;
    return 0.0 - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
} 


// Function to highlight the query data in CODAP
function highlightQueryData() {
    codapInterface.sendRequest({
        action: 'get',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].caseFormulaSearch[Age >= 40]'
    }).then(response => {
        if (response.success) {
            const caseIDs = response.values.map(item => item.id); 
            codapInterface.sendRequest({
                action: 'create',
                resource: 'dataContext[lite_adult_with_pii].selectionList',
                values: caseIDs 
            }).then(response => {
                if (response.success) {
                    console.log("Noisy data highlighted in CODAP.");
                } else {
                    console.error("Failed to highlight noisy data.");
                }
            });
        } else {
            console.error('Failed to retrieve cases for highlighting.');
        }
    });
}

// Get Categorical Features (Unique Categories and All Cases)
function getCategoricalFeatures(attribute) {
    return codapInterface.sendRequest({
        action: 'get',
        resource: `dataContext[lite_adult_with_pii].collection[cases].caseFormulaSearch[\"${attribute}\"]`
    }).then(response => {
        if (response.success) {
            const allCases = response.values.map(item => item.values[attribute]); 
            const uniqueCategories = [...new Set(allCases)]; 
            //console.log("Categories:", uniqueCategories);
            return [allCases, uniqueCategories]; 
        } else {
            console.error(`Failed to retrieve ${attribute} data.`);
            return [[], []];
        }
    });
}

// Function to display the original distribution for a categorical attribute
function displayOriginalDistribution(attribute) {
    getCategoricalFeatures(attribute).then(caseFeatures => {
        const allCases = caseFeatures[0]; 
        const uniqueCategories = caseFeatures[1];
        console.log("Categories:", uniqueCategories); 

        const originalDistribution = uniqueCategories.reduce((acc, category) => {
            acc[category] = score(allCases, category)*1000;
            return acc;
        }, {});

        const totalCases = allCases.length;
        const normalizedDistribution = {};
        for (const [category, count] of Object.entries(originalDistribution)) {
            normalizedDistribution[category] = ((count / totalCases) * 100).toFixed(1) + '%'; // Convert to percentage
        }

        let originalText = "";
        for (const [category, percentage] of Object.entries(normalizedDistribution)) {
            originalText += `${category}: ${percentage}\n`;
        }
        
        console.log(originalText);
        document.getElementById('originalDistribution').textContent = originalText;
    });
}

// Function to generate a noisy distribution for a categorical attribute and display it
function generateNoisyCategoryDistribution(attribute, iterations = 1000) {
    getCategoricalFeatures(attribute).then(caseFeatures => {
        const allCases = caseFeatures[0]; // All cases for this attribute
        const uniqueCategories = caseFeatures[1]; // Unique categories
        const scores = uniqueCategories.map(category => score(allCases, category));

        const categoryFrequency = {};
        uniqueCategories.forEach(category => categoryFrequency[category] = 0);

        for (let i = 0; i < iterations; i++) {
            const noisyCategory = exponentialMechanism(uniqueCategories, scores);
            if (noisyCategory !== "undefined") {
                categoryFrequency[noisyCategory]++;
            }
        }

        let noisyText = "";
        let totalCount = "";
        for (const [category, count] of Object.entries(categoryFrequency)) {
            noisyText += `${category}: ${(count / iterations * 100).toFixed(1)}%\n`; 
        }
        
        for (const [category, count] of Object.entries(categoryFrequency)) {
            totalCount += `${category}: ${count}\n`;
        }

        console.log(noisyText);
        //console.log(totalCount);
        document.getElementById('noisyCategoryDistribution').textContent = noisyText;
    });
}

// Scoring Function for Categories (Frequency)
function score(data, option) {
    const counts = data.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    return counts[option]/1000 || 0; 
}

// Exponential Mechanism Implementation
function exponentialMechanism(categories, scores) {
    const epsilon = parseFloat(document.getElementById('epsilonValue').textContent);
    const sensitivity = parseFloat(document.getElementById('sensitivityValue').textContent);

    const probabilities = scores.map(score => Math.exp(epsilon * score / (2 * sensitivity)));

    const sumProbabilities = probabilities.reduce((a, b) => a + b, 0);
    const normalizedProbabilities = probabilities.map(p => p / sumProbabilities);

    let cumulativeProbability = 0;
    const randomValue = Math.random();

    for (let i = 0; i < categories.length; i++) {
        cumulativeProbability += normalizedProbabilities[i];
        if (randomValue <= cumulativeProbability) {
            return categories[i];
        }
    }
    return "undefined"; 
}

// L-Diversity Function
function applyLDiversity() {
    const diversityLevel = document.getElementById('diversity-level').value;
    const attributeCount = document.getElementById('attribute-count').value;

    if (!diversityLevel || !attributeCount){
        alert(`Please enter both L-Diversity Level and Attribute Count.`);
        return;
    }

    alert(`Applying L-Diversity with Level: ${diversityLevel} and Attribute Count: ${attributeCount}`)
}