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
    //TODO: Possibly store the sockets instead of the IDs?
    const matchData = {
        matchID: matchID,
        players: [idToSocket[ID1], idToSocket[ID2]],
        tracksUsed: [],
        artistConnectionCount: {},
        playerHealth: {
            [ID1]: 3,
            [ID2]: 3
        },
        currentPlayer: 0,
        currTimer: null
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
        const isPlayerFirst = coinWinnerID === playerID ? events.PLAYER1 : events.PLAYER2

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
    const playerIDs = [matchData.players[0].ID, matchData.players[1].ID]

    //Set Timer for first turn.
    const turnEndTime = resetTimer(matchData);

    for(const playerID of playerIDs) {
        console.log(playerID)
        const playerClient = idToSocket[playerID]
        playerClient.send(createPacket(events.WS_START_GAME, {
            timerEnd: turnEndTime
        }))
    }
}

function resetTimer(matchData) {
    const turnTimeinMilis = events.turnTimeinSeconds * 1000;
    const turnIntervalEnd = setTimeout(() => handleTimerEnd(matchData), turnTimeinMilis);
    const turnEndTime = Date.now() + (turnTimeinMilis);
    matchData['currTimer'] = turnIntervalEnd;
    return turnEndTime;
}

//Handle the turn timer ending.
function handleTimerEnd(matchData) {
    //Subtract health from current player's healthbar
    const currentPlayer = matchData['currentPlayer']
    const playerHealth = matchData['playerHealth']

    playerHealth[currentPlayer] = playerHealth[currentPlayer] - 1

    //TODO: Trigger other player win if health reaches 0.
    if(playerHealth[currentPlayer] <= 0) {
        triggerGameEnd(matchData, currentPlayer)
    }
    else {
        swapCurrentPlayer(matchData)
    }
}

//TODO: Implement game ending scenario.
function triggerGameEnd(matchData, losingPlayerID) {
    //Send corresponding win/loss trigger to the winning/losing player.
    for(const client of matchData['players']) {
        client.send(createPacket(events.WS_MATCH_END, {
            event: client.ID == losingPlayerID ? events.EVENT_LOSS : events.EVENT_WIN
        }))
    }

    //Handle match deletion.
    cleanupMatch(matchData, losingPlayerID)
}

//Function that updates the game.
export function updateGame(gamePacket, client) {
    //TODO: Check if player is even in match.
    console.log("Updating game")
    if(!('currentMatchID' in client)) {
        console.log("Player is not in a game!")
        playerSocket.send(createPacket(events.WS_ERROR))

        return
    }
    const matchID = gamePacket["matchID"]

    const matchData = matches[matchID]
    const playerSentOrder = gamePacket['playerNumber']

    const playerSentID = client.ID
    const playerSocket = idToSocket[playerSentID]

    console.log(`${matchID} ${playerSentOrder}`)
    console.log(gamePacket)
    console.log(matchData['currentPlayer'])
    console.log(playerSentID)
    
    //Check if the player sending the data's turn is current.
    if(matchData['currentPlayer'] !== playerSentID) {
        console.log("Update was not send by the correct player.")
        playerSocket.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_INVALID_TURN
        }))
        return
    }

    //Check packet information.
        //Need to grab what data they sent.
    const gameEvent = gamePacket['event']
    console.log(`Game event: ${gameEvent}`)
    //Determine event given the outcome.
    switch(gameEvent) {
        case events.EVENT_PLAYER_TRACK_SUBMISSION:
            console.log("Checking if track information!")
            handlePlayerTrackSubmission(gamePacket, matchData, client)
            break
        default:
            break
    }
}

//TODO: Split the function.
function handlePlayerTrackSubmission(gamePacket, matchData, incomingClient) {
    const submittedTrack = gamePacket['track']
    console.log(`${incomingClient.ID} has submitted ${submittedTrack}`)

    //Filter the tracks we have based on the given input.
    let tracks = Object.keys(tracksToArtist)
    let potentialTracks = tracks.filter((track) => {
        return track.includes(submittedTrack)
    })

    console.log(`Potential Tracks: ${potentialTracks}`)

    //Check if the sent track doesn't match.
    if(potentialTracks.length === 0) {
        //If it doesn't match any tracks send an invalid search packet to the original client.
        incomingClient.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_INVALID_CHOICE
        }))

        return
    }

    //Clear timer.
    clearTimeout(matchData['timerEnd'])

    //Send client data to update the current list of tracks.
    //Update current tracks in system.
    const firstTrack = potentialTracks[0]
    console.log(`First Track: ${firstTrack}`)

    //TODO: Update this for when we have a UI
    //Will need to check the features of the track rather than grabbing the first track.
    const relatedArtistKey = Object.keys(tracksToArtist[firstTrack])[0]
    console.log(`Related Artist Key: ${relatedArtistKey}`)
    const track = tracksToArtist[firstTrack][relatedArtistKey]
    const relatedArtists = tracksToArtist[firstTrack][relatedArtistKey]["artists"]
    const tracksUsed = matchData['tracksUsed']
    console.log(`Related Artists: ${relatedArtists}`)
    const currentArtists = tracksUsed[tracksUsed.length - 1]
    console.log(`Current Artists: ${currentArtists}`)

    const artistLinks = relatedArtists.filter(artist => currentArtists.includes(artist))
    console.log(`Links Made: ${artistLinks}`)
    if(artistLinks.length == 0) {
        console.log(`No artists links found with track ${firstTrack}`)
        incomingClient.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_INVALID_CHOICE
        }))

        return
    }

    console.log(artistLinks)
    //Put the track into the list.
    tracksUsed.push(track)
    //Then put the links that were made into the list.
    tracksUsed.push(artistLinks)
    //Finally, update the links in artistConnectionCount
    const artistConnectionCount = matchData['artistConnectionCount']
    for(const artist of artistLinks) {
        artistConnectionCount[artist] = !(artist in artistConnectionCount) ? 1 : artistConnectionCount[artist] + 1
    }

    console.log(matchData)

    //Send the new data to each player.
    const updatedData = [track, artistLinks]

    for(const client of matchData['players']) {
        client.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_UPDATE_TIMELINE,
            trackUpdates: updatedData,
        }))
    }

    //Swap whoever is the current player.
    swapCurrentPlayer(matchData)

    console.log(matchData)
}

function swapCurrentPlayer(matchData) {
    const firstPlayer = matchData['players'][0]
    const secondPlayer = matchData['players'][1]

    matchData['currentPlayer'] = matchData['currentPlayer'] == firstPlayer.ID ? secondPlayer.ID : firstPlayer.ID

    //TODO: Add timer.
    const turnEnd = resetTimer(matchData)
    
    for(const client of matchData['players']) {
        client.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_UPDATE_TURN,
            currentTurn: matchData['currentPlayer'] == client.ID ? events.PLAYER1 : events.PLAYER2,
            turnEnd: turnEnd
        }))
    }
}

export function cleanupMatch(matchData, losingID, disconnect = false) {
    const clientMatchID = matchData['matchID']

    if (matchData['currTimer'] != null)
        clearTimeout(matchData['currTimer']);

    //Remove the match from the list.
    delete matches[clientMatchID]

    //Grant win to player.
    const idToWin = matchData['players'][1]['ID'] === losingID ? matchData['players'][0]['ID'] : matchData['players'][1]['ID']
    idToSocket[idToWin]['currentMatchID'] = -1

    if(!disconnect) {
        idToSocket[losingID]['currentMatchID'] = -1
    }
}
