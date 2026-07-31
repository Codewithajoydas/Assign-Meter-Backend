const clients = [];

function addClient(res) {
    clients.push(res);
}

function removeClient(res) {
    const index = clients.indexOf(res);

    if (index !== -1) {
        clients.splice(index, 1);
    }
}

function broadcast(event, data) {
    clients.forEach((client) => {
        client.write(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        );
    });
}

module.exports = {
    addClient,
    removeClient,
    broadcast,
};