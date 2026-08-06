const fs = require("fs");


const jiraData = JSON.parse(
    fs.readFileSync("jira-response.json", "utf8")
);


const tickets = jiraData.issues.map(issue => {

    return {
        id: issue.key,
        title: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority.name
    };

});

const output = {
    lastUpdated: new Date().toISOString(),
    tickets: tickets
};

fs.writeFileSync(
    "mini-engine/data/tickets.json",
    JSON.stringify(output, null, 2)
);