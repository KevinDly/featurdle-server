import '../env.js'

export let artistsToExplore = [process.env.INITIAL_ARTIST]
export let visitedArtists = new Set([])
export let tracksToArtist = {}

export function setArtistsToExplore(explored) {
    artistsToExplore = explored
}

export function setVisitedArtists(artists) {
    visitedArtists = artists
}

export function setTracksToArtist(tracks) {
    tracksToArtist = tracks
}