//TODO: Find better way to import env.
import './env.js'

var artistsToExplore = [process.env.INITIAL_ARTIST]
var visitedArtists = new Set([])
var visitedTracks = []
var IDtoName = {}
var IDtoCatalogue = {}

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token/'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1/'
const ARTIST_DEGREE = process.env.SEARCH_DEGREE

connectAPIs()

async function searchSpotify(authentication, searchURL) {
    //console.log(searchAPIURL)

    return fetch(searchURL, {
        headers: {
            'Authorization': `Bearer ${authentication["access_token"]}`
        }
    }).then(res => res.json())
    .then(res => {
        //console.log("Spotify Search Results: ")
        //console.log(res)
        if(res.hasOwnProperty("error")) {
            throw new Error(res['error']['message'])
        }
        return res
    })
}

function traverseArtists(res, artistList, artistExplored) {
    //Iterate through all tracks in res.
    res.tracks.items.forEach(item => {
        const trackName = item.name
        const trackArtists = item.artists

        //Iterate through each artist if more than one exists (if the song contains features)
        if (item.artists.length > 1) {
            var stringOfArtists = ""
            for (var artist of trackArtists) {
                const artistName = artist.name
                stringOfArtists += `${artistName} `
                if(!artistList.includes(artistName) && !artistExplored.has(artistName)){
                    artistList.push(artistName)
                }
            }

            console.log(`Name: ${trackName}`)
            console.log(`Artists: ${stringOfArtists}`)
        }
    })
}

async function authenticateSpotify() {
    var SPOTIFY_ID = process.env.SPOTIFY_CLIENT_ID
    var SPOTIFY_SECRET = process.env.SPOTIFY_CLIENT_SECRET

    const spotify_parameters = {
        'grant_type': 'client_credentials',
        'client_id': SPOTIFY_ID,
        'client_secret': SPOTIFY_SECRET
    }

    //Format parameters for the fetch.
    const formatted_parameters = new URLSearchParams(spotify_parameters)

    //Fetch the data.
    //TODO: Convert to await form?
    return fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formatted_parameters
    }).then(res => res.json())
    .then(res => {
        return res
    })
}

async function connectAPIs() {

    //Get Spotify API Authentication Details
    const authenticationDetails = await authenticateSpotify()

    const offset = 0
    const trackLimit = 50

    let maxToExplore = artistsToExplore.length
    let currExplored = 0
    let currentDegree = 0


    while(artistsToExplore.length > 0 && currentDegree <= ARTIST_DEGREE) {
        const currentArtistName = artistsToExplore.shift()

        //Create search query for Spotify
        let SEARCH_DETAILS = SPOTIFY_API_URL + 'search?' + `type=track&q=artist:${currentArtistName}&limit=${trackLimit}&offset=${offset}`

        //Iterate until search pagination is done.
        while(SEARCH_DETAILS != null) {
            try {
                //Add the current artist to list of names to traverse.
                //TODO: Make into while loop, check the "next" key if its null or to continue loop or not.
                var artistDetails = await searchSpotify(authenticationDetails, SEARCH_DETAILS) 
                
                //Check if there are still more songs to traverse for the current artist, if there are dont add to list and put the artist back onto the front of the list.
                visitedArtists.add(currentArtistName)

                //Look through the featured artists.
                traverseArtists(artistDetails, artistsToExplore, visitedArtists)
                SEARCH_DETAILS = artistDetails['tracks']['next']
            }
            catch(e) {
                console.log("Error")
                console.error(e)
            }
        }

        //TODO: Figure out if we need to add the if statements into the try/catch
        currExplored++

        //Update the degrees outward from the original artist we are.
        if(currExplored >= maxToExplore) {
            currentDegree++
            maxToExplore = artistsToExplore.length
            currExplored = 0
        }
    }

    console.log(visitedArtists)
    console.log(artistsToExplore)
}
