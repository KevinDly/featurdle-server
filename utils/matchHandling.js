import { idToSocket, matches, visitedArtists, tracksToArtist } from '../index.js';
import { createPacket } from './socketHandling.js';
import * as events from '../consts/eventNames.js'

/* createMatch creates the underlying data for a match.
The underlying data includes assigning each player to their player number
as well as creating a unique identifier for the match.
The match will then call a seperate function to initialize the match.

Inputs
ID1: The ID of the first player of the match (player1)
ID2: The ID of the second play of the match (player2)

Outputs
None
*/
//TODO: Create actual unique iD

export function createMatch(ID1, ID2) {
    console.log("Match being created!")
    //Create match ID
    //TODO: Create unique match IDs.
    const matchID = Math.floor(Math.random() * 100000)

    const playerIDs = [ID1, ID2]
    console.log(playerIDs)

    //Associate clients to matchID
    for(const playerID of playerIDs) 
        idToSocket[playerID].currentMatchID = matchID
    

    //Initialize actual match data.
    //TODO: For actual match logic, put the data in for the artists and tracks.
    const matchData = {
        player1: ID1,
        player2: ID2,
        tracksUsed: [],
        artistConnectionCount: {},
        currentPlayer: 0
    }

    //Insert match into list.
    matches[matchID] = matchData

    //Initiate coinflip for first player.
    const coinFlip = Math.floor(Math.random())
    const coinWinnerID = coinFlip ? ID1 : ID2

    //Determine initial artist.
    const randomArrayIndex = Math.floor(Math.random() * visitedArtists.size)
    const visitedArtistsArray = Array.from(visitedArtists)
    const initialArtist = visitedArtistsArray[randomArrayIndex]
    matchData['artistConnectionCount'][initialArtist] = 0
    matchData['tracksUsed'] = [[initialArtist]]

    //Send match data to clients.
    console.log("Sending initial data to clients.")
    for(const playerID of playerIDs) {

        const playerClient = idToSocket[playerID]
        const isPlayerFirst = coinWinnerID === playerID ? 0 : 1

        console.log(`${playerID} is ${isPlayerFirst}`)
        let playerInitialData = {
            matchID: matchID,
            playerOrder: isPlayerFirst,
            firstArtist: initialArtist
        }

        if(!isPlayerFirst) {
            console.log("Updating first player data.")
            matchData["currentPlayer"] = playerID
        }

        //TODO: Check if you need to await this before starting game.
        playerClient.send(createPacket(events.WS_PREGAME_DATA, playerInitialData))
    }

    //Call function to begin match.
    startGame(matchID)
}

//Function that tells the clients to start the game.
function startGame(matchID) {
    const matchData = matches[matchID]
    const playerIDs = [matchData.player1, matchData.player2]

    for(const playerID of playerIDs) {
        console.log(playerID)
        const playerClient = idToSocket[playerID]
        playerClient.send(createPacket(events.WS_START_GAME))
    }
}

//Function that updates the game.
export function updateGame(gamePacket) {
    console.log("Updating game")
    const matchID = gamePacket["matchID"]

    const matchData = matches[matchID]
    const playerSentOrder = gamePacket['playerNumber']

    const playerSentID = gamePacket['playerID']
    const playerSocket = idToSocket[playerSentID]

    console.log(`${matchID} ${playerSentOrder}`)
    console.log(gamePacket)
    console.log(matchData['currentPlayer'])

    console.log(playerSentID)
    //Check if the player sending the data's turn is current.
    if(matchData['currentPlayer'] !== playerSentID) {
        playerSocket.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_INVALID_TURN
        }))

        return
    }

    //Check packet information.
        //Need to grab what data they sent.
    const gameEvent = gamePacket['event']


    //Check if the player that sent the
}