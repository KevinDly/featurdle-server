//TODO: Find better way to import env.
import { authenticateSpotify, populateSpotifyData } from './apis/spotifyAPI.js'
import './env.js'
import fs from 'fs'
import FileSystemHandle from 'fs/promises'
import { WebSocket, WebSocketServer } from 'ws'

let artistsToExplore = [process.env.INITIAL_ARTIST]
let visitedArtists = new Set([])
let tracksToArtist = {}

const SERVER_PORT = Number(process.env.SERVER_PORT)
const DATA_FOLDER = process.env.DATA_FOLDER
const DATA_FILENAME = process.env.DATA_FILENAME
const fileLocation = DATA_FOLDER + '/' + DATA_FILENAME
const SECONDS_TO_DAY = 86400
const server = new WebSocketServer({ port: SERVER_PORT })

//TODO: Might need to move these to a config or something instead of env?
const MAX_DAYS_FROM_WRITE = Number(process.env.MAX_DAYS_FROM_WRITE)
const ALWAYS_UPDATE_SPOTIFY = process.env.ALWAYS_UPDATE_SPOTIFY === 'true'

initializeServer()

async function loadDataFromFile() {
    try {
        let fileData = await FileSystemHandle.readFile(fileLocation)
        let jsonFileData = JSON.parse(fileData)

        artistsToExplore = jsonFileData['artistsToExplore']
        visitedArtists = new Set(jsonFileData['visitedArtists'])
        tracksToArtist = jsonFileData['tracksToArtist']
    }
    catch(e) {
        console.log(e)
    }
}

function saveDataToFile() {
    const spotifyDataObject = {
        "visitedArtists": Array.from(visitedArtists),
        "tracksToArtist": tracksToArtist,
        "artistsToExplore": artistsToExplore
    }

    console.log(visitedArtists)
    try{
        fs.writeFile(fileLocation, JSON.stringify(spotifyDataObject), (err) => {
            if (err) throw err;
            console.log(`Saved file to ${fileLocation}`)
        })
    }
    catch(e){
        console.error(e)
    }
}

async function initializeData() {
    let dataStats = null
    try { //Check the datafile's metadata, if it exists.
        dataStats = fs.statSync(fileLocation)
    }
    catch (e) {
        console.log(`${fileLocation} does not exist!`)
    }

    //If the file existed check the amount of time in days since last modification.
    let lastModified = dataStats == null ? '' : dataStats.mtime
    let differenceInDays = -1
    if (lastModified != '') {
        let previousDate = new Date(lastModified)
        let currentDate = new Date()
        let previousDateMS = previousDate.getTime()
        let currentDateMS = currentDate.getTime()

        differenceInDays = ((currentDateMS - previousDateMS) / 1000) / SECONDS_TO_DAY
    }

    //If the file didnt exist, or the amount of time is greater than the set time, connect to Spotify to gather data then rewrite file.
    if (ALWAYS_UPDATE_SPOTIFY || differenceInDays == -1 || differenceInDays > MAX_DAYS_FROM_WRITE) {
        console.log("Grabbing authentication from Spotify.")
        let spotifyAuthentication = await authenticateSpotify()

        console.log("Grabbing artist and track data from Spotify.")
        await populateSpotifyData(spotifyAuthentication, artistsToExplore, visitedArtists, tracksToArtist)

        console.log("Saving data from Spotify.")
        saveDataToFile()
    }
    else { //If the file is still recent enough, load from file.
        console.log("Loading artist and track data from file.")
        await loadDataFromFile()
    }

    //TODO: Write basic server functionality for connection.
    console.log(artistsToExplore)
    console.log(visitedArtists)
    console.log(tracksToArtist)
}

async function initializeServer() {

    await initializeData()

    server.on('connection', (client) => {
        console.log("Connection!")
        console.log(client)
        client.on('message', (message) => {
            //TODO: Add code for connecting.
            // Need code for events:
            // Entering queue, sending game moves.
            console.log('Client message!')
            console.log(message)
        })

        client.on('close', (message) => {
            //TODO: Need to properly handle cleanup for related client.
            // Check what information the message sends.
            console.log('Client message!')
            console.log(message)
        })
    })

}




