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


fs.writeFileSync(
    "mini-engine/data/tickets.json",
    JSON.stringify(tickets, null, 2)
);