fetch("data/tickets.json")
.then(response => response.json())
.then(tickets => {


    const columns = {
        "To Do": document.getElementById("todo"),
        "In Progress": document.getElementById("progress"),
        "Done": document.getElementById("done")
    };


    tickets.forEach(ticket => {

        const card = `
            <div class="ticket">

                <strong>${ticket.id}</strong>

                <p>
                    ${ticket.title}
                </p>

                <small>
                    Priority: ${ticket.priority}
                </small>

            </div>
        `;


        if(columns[ticket.status]) {

            columns[ticket.status].innerHTML += card;

        }
        else {

            console.log(
                "Unknown Jira status:",
                ticket.status
            );
            
        }
    });
});