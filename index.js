//TODO: Find better way to import env.
import { authenticateSpotify, populateSpotifyData } from './apis/spotifyAPI.js'
import './env.js'
import fs from 'fs'
import FileSystemHandle from 'fs/promises'

let artistsToExplore = [process.env.INITIAL_ARTIST]
let visitedArtists = new Set([])
let tracksToArtist = {}

const DATA_FOLDER = process.env.DATA_FOLDER
const DATA_FILENAME = process.env.DATA_FILENAME
const fileLocation = DATA_FOLDER + '/' + DATA_FILENAME
const SECONDS_TO_DAY = 86400
const MAX_DAYS_FROM_WRITE = 2

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

async function initializeServer() {
    let dataStats = null
    try { //Check the datafile's metadata, if it exists.
        dataStats = fs.statSync(fileLocation)
    }
    catch(e) {
        console.log(`${fileLocation} does not exist!`)
    }

    //If the file existed check the amount of time in days since last modification.
    let lastModified = dataStats == null ? '' : dataStats.mtime
    let differenceInDays = -1
    if(lastModified != '') {
        let previousDate = new Date(lastModified)
        let currentDate = new Date()
        let previousDateMS = previousDate.getTime()
        let currentDateMS = currentDate.getTime()

        differenceInDays = ((currentDateMS - previousDateMS)/1000)/SECONDS_TO_DAY
    }

    //If the file didnt exist, or the amount of time is greater than the set time, connect to Spotify to gather data then rewrite file.
    if(differenceInDays == -1 || differenceInDays > MAX_DAYS_FROM_WRITE) {
        let spotifyAuthentication = await authenticateSpotify()

        await populateSpotifyData(spotifyAuthentication, artistsToExplore, visitedArtists, tracksToArtist)
        saveDataToFile()
    }
    else { //If the file is still recent enough, load from file.
        await loadDataFromFile()
    }
}


