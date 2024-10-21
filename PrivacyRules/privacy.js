function startCodapConnection() {
    var config = {
        title: "Privacy Rules Plugin",
        version: "0.1",
        dimensions: {width: 500, height: 600}
    };

    codapInterface.init(config).then(() => {
        console.log("CODAP connection established.");
        initializeDataSet();
    }).catch(msg => {
        console.error('CODAP connection error: ' + msg);
    });
}

function initializeDataSet() {
    const dataSetDescription = {
        name: "privacyData",
        title: "Privacy Data",
        description: "Dataset for applying privacy rules",
        collections: [{
            name: "data",
            attrs: [
                {name: "attribute1", type: 'numeric'},
                {name: "attribute2", type: 'categorical'},
                // Add more attributes as needed
            ]
        }]
    };

    pluginHelper.initDataSet(dataSetDescription);
}


function openCodapTable(ruleTitle) {
    const tableConfig = {
        type: 'caseTable',
        title: `${ruleTitle} Table`,
        dimensions: {width: 400, height: 300}
    };

    const graphConfig = {
        type: 'graph',
        title: `${ruleTitle} Graph`,
        dimensions: {width: 400, height: 300},
        xAttributeName: 'attribute1',
        yAttributeName: 'attribute2'
    };

    codapInterface.sendRequest({
        action: 'create',
        resource: 'component',
        values: tableConfig
    }).then(response => {
        if (response.success) {
            console.log(`${ruleTitle} table created successfully.`);
        } else {
            console.error(`Failed to create ${ruleTitle} table.`);
        }
    });

    codapInterface.sendRequest({
        action: 'create',
        resource: 'component',
        values: graphConfig
    }).then(response => {
        if (response.success) {
            console.log(`${ruleTitle} graph created successfully.`);
        } else {
            console.error(`Failed to create ${ruleTitle} graph.`);
        }
    });
}