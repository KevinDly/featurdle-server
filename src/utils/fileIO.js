//import { artistsToExplore, visitedArtists, tracksToArtist, setArtistsToExplore, setTracksToArtist, setVisitedArtists } from '../../index.js';
import * as gameData from './gameData.js'
import FileSystemHandle from 'fs/promises'
import '../env.js'
import fs from 'fs'

export async function loadDataFromFile(fileLocation) {
    try {
        let fileData = await FileSystemHandle.readFile(fileLocation)
        let jsonFileData = JSON.parse(fileData)

        gameData.setArtistsToExplore(jsonFileData['artistsToExplore'])
        gameData.setVisitedArtists(new Set(jsonFileData['visitedArtists']))
        gameData.setTracksToArtist(jsonFileData['tracksToArtist'])
    }
    catch (e) {
        console.log(e)
    }
}

export function saveDataToFile(fileLocation) {
    const spotifyDataObject = {
        "visitedArtists": Array.from(gameData.visitedArtists),
        "tracksToArtist": gameData.tracksToArtist,
        "artistsToExplore": gameData.artistsToExplore
    }

    try {
        fs.writeFile(fileLocation, JSON.stringify(spotifyDataObject), (err) => {
            if (err) throw err;
            console.log(`Saved file to ${fileLocation}`)
        })
    }
    catch (e) {
        console.error(e)
    }
}