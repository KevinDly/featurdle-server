//TODO: Find better way to import env.
import { authenticateSpotify, populateSpotifyData } from './src/apis/spotifyAPI.js'
import './src/env.js'
import fs from 'fs'
import { WebSocketServer } from 'ws'
import { enableHeartbeat, configureClientConnection } from './src/utils/socketHandling.js'
import { loadDataFromFile, saveDataToFile } from './src/utils/fileIO.js'
import { artistsToExplore, visitedArtists, tracksToArtist } from './src/utils/gameData.js'

//Websocket Data
export let idToSocket = {}
export let clientQueue = []
export let matches = {}

//File IO
const DATA_FOLDER = process.env.DATA_FOLDER
const DATA_FILENAME = process.env.DATA_FILENAME
const fileLocation = DATA_FOLDER + '/' + DATA_FILENAME

const SERVER_PORT = Number(process.env.SERVER_PORT)
const SECONDS_TO_DAY = 86400

const server = new WebSocketServer({ port: SERVER_PORT })

//TODO: Might need to move these to a config or something instead of env?
const MAX_DAYS_FROM_WRITE = Number(process.env.MAX_DAYS_FROM_WRITE)
const ALWAYS_UPDATE_SPOTIFY = process.env.ALWAYS_UPDATE_SPOTIFY === 'true'

initializeServer()

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
        saveDataToFile(fileLocation)
    }
    else { //If the file is still recent enough, load from file.
        console.log("Loading artist and track data from file.")
        await loadDataFromFile(fileLocation)
    }

    console.log(artistsToExplore)
    console.log(visitedArtists)
    console.log(tracksToArtist)
}

//TODO: Implement heartbeat detection to determine if connection closed.
async function initializeServer() {
    await initializeData()

    //TODO: Delete when server is off.
    const interval = enableHeartbeat(server)

    server.on('connection', (client) => {
        configureClientConnection(client)
    })

}
