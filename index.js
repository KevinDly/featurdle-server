//TODO: Find better way to import env.
import './env.js'

var artistsToExplore = ["Kendrick Lamar"]
var visitedArtists = new Set([])
var visitedTracks = []
var IDtoName = {}
var IDtoCatalogue = {}

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token/'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1/'
const ARTIST_DEGREE = process.env.SEARCH_DEGREE

connectAPIs()

async function searchSpotify(authentication, searchParameters) {
    const searchParameterObject = new URLSearchParams(searchParameters)
    const searchAPIURL = SPOTIFY_API_URL + 'search?' + searchParameters
    //console.log(searchAPIURL)

    return fetch(searchAPIURL, {
        headers: {
            'Authorization': `Bearer ${authentication["access_token"]}`
        }
    }).then(res => res.json())
    .then(res => {
        //console.log("Spotify Search Results: ")
        //console.log(res)
        return res
    })
}

function traverseArtists(res, artistList, artistExplored) {
    res.tracks.items.forEach(item => {
        const trackName = item.name
        const trackArtists = item.artists
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

    const formatted_parameters = new URLSearchParams(spotify_parameters)


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
    var authenticationDetails = await authenticateSpotify()
    var offset = 0
    var currentDegree = 0
    var maxToExplore = artistsToExplore.length
    var currExplored = 0
    var trackLimit = 5

    while(artistsToExplore.length > 0 && currentDegree <= ARTIST_DEGREE) {
        const currentArtistName = artistsToExplore.shift()

        //Create search query for Spotify
        const SEARCH_DETAILS = `type=track&q=artist:${currentArtistName}&limit=${trackLimit}&offset=${offset}`

        //Add the current artist to list of names to traverse.
        var artistDetails = await searchSpotify(authenticationDetails, SEARCH_DETAILS)

        //Check if there are still more songs to traverse for the current artist, if there are dont add to list and put the artist back onto the front of the list.
        visitedArtists.add(currentArtistName)

        //Look through the featured artists.
        traverseArtists(artistDetails, artistsToExplore, visitedArtists)
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
