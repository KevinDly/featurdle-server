//TODO: Find better way to import env.
import './env.js'

var artistIDsToTraverse = []
var visitedArtists = []
var visitedTracks = []
var IDtoName = {}
var IDtoCatalogue = {}

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token/'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1/'

connectAPIs()

async function searchSpotify(authentication, searchParameters) {
    const searchParameterObject = new URLSearchParams(searchParameters)
    const searchAPIURL = SPOTIFY_API_URL + 'search?' + searchParameters
    console.log(searchAPIURL)

    return fetch(searchAPIURL, {
        headers: {
            'Authorization': `Bearer ${authentication["access_token"]}`
        }
    }).then(res => res.json())
    .then(res => {
        console.log("Spotify Search Results: ")
        console.log(res)
        return res
    })
}

async function traverseArtists(res) {
    res.tracks.items.forEach(item => {
        const trackName = item.name
        const trackArtists = item.artists
        if (item.artists.length > 1) {
            var stringOfArtists = ""
            for (var artist of trackArtists) {
                stringOfArtists += `${artist.name} `
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
    /*authenticateSpotify().then(authenticationDetails => {
        //Search for artist details
        var trackLimit = 20
        const SEARCH_DETAILS = `type=track&q=artist:Kendrick Lamar&limit=${trackLimit}`
        return searchSpotify(authenticationDetails, SEARCH_DETAILS)
    }).then(artistDetails => {
        //Traverse the list of artists.
        //console.log(artistDetails)
        traverseArtists(artistDetails)
    })*/

    var authenticationDetails = await authenticateSpotify()

    var trackLimit = 20
    const SEARCH_DETAILS = `type=track&q=artist:Kendrick Lamar&limit=${trackLimit}`
    var artistDetails = await searchSpotify(authenticationDetails, SEARCH_DETAILS)

    traverseArtists(artistDetails)

}
