import { idToSocket, matches } from '../index.js';

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
    const matchID = Math.floor(Math.random() * 100000)

    //Associate clients to matchID
    idToSocket[ID1]['currentMatchID'] = matchID
    idToSocket[ID2]['currentMatchID'] = matchID

    //Initialize actual match data.
    //TODO: For actual match logic, put the data in for the artists and tracks.
    const matchData = {
        player1: ID1,
        player2: ID2
    }

    //Insert match into list.
    matches[matchID] = matchData

    //TODO: Call function to begin match.
}
