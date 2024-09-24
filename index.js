//TODO: Find better way to import env.
import './env.js'

const snoopDoggID = '7hJcb9fa4alzcOq3EaNPoG'
var artistIDsToTraverse = [snoopDoggID]
var IDtoName = {}
var IDtoCatalogue = {}

connectAPIs()

async function authenticateSpotify() {
    var SPOTIFY_ID = process.env.SPOTIFY_CLIENT_ID
    var SPOTIFY_SECRET = process.env.SPOTIFY_CLIENT_SECRET


    const spotify_parameters = {
        'grant_type': 'client_credentials',
        'client_id': SPOTIFY_ID,
        'client_secret': SPOTIFY_SECRET
    }

    const formatted_parameters = new URLSearchParams(spotify_parameters)

    var spotify_url = 'https://accounts.spotify.com/api/token/'

    return fetch(spotify_url, {
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
    authenticateSpotify().then(res => {
        var authenticationDetails = res
        const access_token = authenticationDetails['access_token']
        console.log(res)
    })
}
/*var options = {
    hostname: 'https://accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
    }
}

var req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`)
    console.log(`headers: ${res.headers}`)

    res.on('data', (data) => {
        console.log(data)
    })
})*/
