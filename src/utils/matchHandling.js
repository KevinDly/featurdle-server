import { idToSocket, matches } from '../../index.js';
import { visitedArtists, tracksToArtist } from './gameData.js'
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
        timeline: [],
        artistConnectionCount: {},
        playerHealth: {
            [ID1]: 3,
            [ID2]: 3
        },
        tracksUsed: new Set(),
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
    matchData['timeline'] = [[initialArtist]]

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
    console.log(`Reset Timer: ${Date.now()}`)
    const turnIntervalEnd = setTimeout(() => handleTimerEnd(matchData), turnTimeinMilis);
    const turnEndTime = Date.now() + (turnTimeinMilis);
    matchData['currTimer'] = turnIntervalEnd;
    return turnEndTime;
}

//Handle the turn timer ending.
function handleTimerEnd(matchData) {
    console.log(`Handling Timer End: ${Date.now()}`)
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

//TODO: Decouple cleaning up the match from triggering a game end.
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
            console.log("Checking if track information is correct!")
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

    //TODO: Update this for when we have a UI
    //Will need to check the features of the track rather than grabbing the first track.
    const firstTrack = potentialTracks[0]
    console.log(`First Track: ${firstTrack}`)

    //Check if we've used the sent track before.
    const tracksUsed = matchData['tracksUsed']
    if(tracksUsed.has(firstTrack)) {
        incomingClient.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_INVALID_CHOICE
        }))

        return
    }

    //Add the current track to our set of used tracks.
    tracksUsed.add(firstTrack)

    //Grab the track data from the table.
    const relatedArtistKey = Object.keys(tracksToArtist[firstTrack])[0]
    console.log(`Related Artist Key: ${relatedArtistKey}`)
    const track = tracksToArtist[firstTrack][relatedArtistKey]

    //Grab the artists of the current track.
    const relatedArtists = tracksToArtist[firstTrack][relatedArtistKey]["artists"]
    const timeline = matchData['timeline']
    console.log(`Related Artists: ${relatedArtists}`)

    //If there is no elements besides the artist, grab the first artist in the timeline, otherwise grab the artists of the previous track.
    const currentArtists = timeline.length === 1 ? timeline[timeline.length - 1] : timeline[timeline.length - 2]['artists']
    console.log(`Current Artists: ${currentArtists}`)

    //Check for the links.
    const artistLinks = relatedArtists.filter(artist => currentArtists.includes(artist))
    console.log(`Links Made: ${artistLinks}`)

    //Check if there are valid artist links, if not return invalid choice.
    if(artistLinks.length == 0) {
        console.log(`No artists links found with track ${firstTrack}`)
        incomingClient.send(createPacket(events.WS_SERVER_UPDATE_GAME, {
            event: events.EVENT_INVALID_CHOICE
        }))

        return
    }

    //Clear timer since artist was valid.
    clearTimeout(matchData['currTimer'])
    console.log(`After timeout clear: ${matchData['currTimer']}`)

    console.log(artistLinks)
    //Put the track into the list.
    timeline.push(track)
    //Then put the links that were made into the list.
    timeline.push(artistLinks)
    //Finally, update the links in artistConnectionCount
    const artistConnectionCount = matchData['artistConnectionCount']
    for(const artist of artistLinks) {
        artistConnectionCount[artist] = !(artist in artistConnectionCount) ? 1 : artistConnectionCount[artist] + 1
    }

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
    const winningClient = idToSocket[idToWin]
    winningClient['currentMatchID'] = -1
    console.log(`Reset match ID: ${idToWin} ${idToSocket[idToWin]['currentMatchID']}`)

    if(!disconnect) {
        idToSocket[losingID]['currentMatchID'] = -1
        console.log(`Reset match ID: ${losingID} ${idToSocket[losingID]['currentMatchID']}`)
    }
    else {
        //Send win to player if the other player was a disconnect.
        winningClient.send(createPacket(events.WS_MATCH_END, {
            event: events.EVENT_WIN
        }))
    }

    console.log(matches)
}
