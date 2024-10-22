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
            name: "Test Data",
            attrs: [
                {name: "Age", type: 'numeric'},
                {name: "Gender", type: 'categorical'},
                {name: "ZipCode", type: 'categorical'},
                {name: "Income", type: 'numeric'},
            ]
        }]
    };

    codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext',
        values: dataSetDescription
    }).then(response => {
        if (response.success) {
            console.log("Data context created successfully.");
            addExampleData();
        } else {
            console.error("Failed to create data context.");
        }
    });
}

function addExampleData() {
    const exampleData = [
        {Age: 34, Gender: "Male", ZipCode: "12345", Income: 100000},
        {Age: 29, Gender: "Female", ZipCode: "23456", Income: 120000},
        {Age: 45, Gender: "Male", ZipCode: "12345", Income: 150000},
        {Age: 19, Gender: "Female", ZipCode: "12345", Income: 200000},
        {Age: 64, Gender: "Male", ZipCode: "23456", Income: 250000},
        {Age: 39, Gender: "Female", ZipCode: "23456", Income: 300000},
    ];

    codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext[privacyData].item',
        values: exampleData.map(item => ({ values: item }))
    }).then(response => {
        if (response.success) {
            console.log("Example data added successfully.");
        } else {
            console.error("Failed to add example data.");
        }
    });
}

function openCodapConfigs(ruleTitle) {
    const tableConfig = {
        type: 'caseTable',
        title: `${ruleTitle} Table`,
        dimensions: {width: 400, height: 225},
        dataContext : 'privacyData'
    };

    const graphConfig = {
        type: 'graph',
        title: `${ruleTitle} Graph`,
        dimensions: {width: 400, height: 300},
        xAttributeName : 'Age',
        yAttributeName : 'Income',
        dataContext : 'privacyData'
    };

    codapInterface.sendRequest({
        action : 'create',
        resource : 'component',
        values : tableConfig
    }).then(response => {
       if (response.success) {
           console.log(`${ruleTitle} table created successfully.`);
       } else {
           console.error(`Failed to create ${ruleTitle} table.`);
       }
   });

   codapInterface.sendRequest({
       action : 'create',
       resource : 'component',
       values : graphConfig
   }).then(response => {
       if (response.success) {
           console.log(`${ruleTitle} graph created successfully.`);
       } else {
           console.error(`Failed to create ${ruleTitle} graph.`);
       }
   });
}