import { idToSocket, clientQueue, matches, server } from '../index.js';
import { createMatch } from './matchHandling.js'
import * as events from '../consts/eventNames.js'

export function handleClientDisconnect(client) {

    //Deleting ID list.
    const disconnectedID = client['ID']
    console.log(`${disconnectedID} disconnected from server.`)
    delete idToSocket[disconnectedID]

    //Handle disconnect logic for queue.
    //Attempting to remove from queue.
    const queueIndex = clientQueue.indexOf(disconnectedID)
    if (queueIndex != -1) {
        console.log(`Removing ${disconnectedID} from queue.`)
        clientQueue = clientQueue.splice(clientQueue, 1)
    }

    //Handle disconnect logic for matching.
    const clientMatchID = client['currentMatchID']
    if (clientMatchID != -1) {
        console.log(`Ending match with ID of ${clientMatchID}`)
        let matchToEnd = matches[clientMatchID]
        delete matches[clientMatchID]
        const idToWin = matchToEnd['player2'] === disconnectedID ? matchToEnd['player1'] : matchToEnd['player2']
        idToSocket[idToWin]['currentMatchID'] = -1
        //TODO: Send correct data to opposing client to signify opponent disconnect + player win.
    }

}

export function enableHeartbeat() {
    return setInterval(function ping() {
        server.clients.forEach(function each(socket) {
            console.log("Pinging")

            if (socket.isAlive === false) return socket.terminate()

            socket.isAlive = false
            socket.ping()
        })
    }, 30000)
}

export function configureClientConnection(client) {
    console.log("Connection!")
    console.log(client)

    //Generate ID per socket.
    //TODO: Replace random with actual unique IDs.
    const socketID = Math.floor(Math.random() * 100000)
    client.ID = socketID
    client.currentMatchID = -1

    idToSocket[socketID] = client
    //Setup variable for heartbeats.
    client.isAlive = true

    //Give client the initial connection ID.
    const connectionPacket = {
        event: events.WS_INITIAL_CONNECTION,
        data: {
            ID: socketID
        }
    }

    client.onclose = (closeEvent) => {
        handleClientDisconnect(closeEvent.target)
    }

    client.send(JSON.stringify(connectionPacket))

    client.on('message', (message) => {
        //TODO: Add code for connecting.
        // Need code for events:
        // Entering queue, sending game moves.

        handleClientMessage(client, message)
    })

    client.on('close', (message, _) => {
        //TODO: Need to properly handle cleanup for related client.
        // Check what information the message sends.

        console.log('Client close!')
        console.log(`Code: ${message}`)
    })

    client.on('pong', function heartbeat() {
        this.isAlive = true
    })
}

export function handleClientMessage(client, message) {
    console.log('Client message!')
    console.log(message)

    const messageJSON = JSON.parse(message)

    const messageEvent = messageJSON['event']
    const messageData = messageJSON['data']

    switch (messageEvent) {
        case events.WS_CONNECTING:
            const clientID = client.ID
            console.log(clientID)
            if (clientQueue.length == 0) {
                clientQueue.push(clientID)
            }
            else {
                createMatch(clientQueue.shift(), clientID)
            }
            break;
        default:
            console.log(`Unhandled event ${currentEvent}`)
            console.log(messageData)
    }
}