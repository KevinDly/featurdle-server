import '../env.js'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token/'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1/'
const ARTIST_DEGREE = process.env.SEARCH_DEGREE

export async function searchSpotify(authentication, searchURL) {
    return fetch(searchURL, {
        headers: {
            'Authorization': `Bearer ${authentication["access_token"]}`
        }
    }).then(res => {
        if (res.status !== 200) {
            throw new Error(`Status code error ${res.status}, ${res.message}`);
        }
        return res.json();
    })
        .then(res => {
            return res;
        });
}

//TODO: Implement limit of how many features can be added to the artistList per artist.
export function traverseArtists(res, artistList, artistExplored, musicToArtist) {
    //Iterate through all tracks in res.
    res.tracks.items.forEach(track => {
        //Iterate through each artist if more than one exists (if the song contains features)
        const trackName = track.name;
        const trackArtists = track.artists;
        const trackID = track.id;
        const trackAlbum = track.album;
        const trackImage = trackAlbum.images[0].url;

        //Check if song has no features or related artists, if it doesn't then return.
        if (track.artists.length <= 1) {
            return;
        }

        //Check if the track exists in the list, if not initialize it in the table with an empty object.
        if (!(trackName in musicToArtist)) {
            musicToArtist[trackName] = {};
        }

        //Create key out of artist names.
        let artistNames = trackArtists.map(artist => artist.name);
        const artistsNameString = artistNames.sort().toString();

        //Check if same track exists with the same features.
        if (artistsNameString in musicToArtist[trackName]) {
            return;
        }

        let trackList = musicToArtist[trackName];

        //Add artists to list.
        let trackInformation = {};

        //Add all related artists to the list of artists to explore.
        for (const artistName of artistNames) {
            //Only add if we haven't explored the artist before and if the artist isn't set to be explored in the future.
            if (!artistList.includes(artistName) && !artistExplored.has(artistName)) {
                artistList.push(artistName);
            }
        }

        //Input track information
        trackInformation['artists'] = artistNames;
        trackInformation['imageURL'] = trackImage;

        //Add tracks to list if it is unique.
        trackList[artistsNameString] = trackInformation;
    });
}
export async function authenticateSpotify() {
    const SPOTIFY_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    const spotify_parameters = {
        'grant_type': 'client_credentials',
        'client_id': SPOTIFY_ID,
        'client_secret': SPOTIFY_SECRET
    };

    //Format parameters for the fetch.
    const formatted_parameters = new URLSearchParams(spotify_parameters);

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
            return res;
        });
}
export async function populateSpotifyData(spotifyAuthentication, artistsToExplore, visitedArtists, tracksToArtist) {
    const offset = 0
    const trackLimit = 50

    let maxToExplore = artistsToExplore.length
    let currExplored = 0
    let currentDegree = 0

    const start = Date.now()
    try {
        while (artistsToExplore.length > 0 && currentDegree <= ARTIST_DEGREE) {
            const currentArtistName = artistsToExplore.shift()

            //Create search query for Spotify
            //let SEARCH_DETAILS = SPOTIFY_API_URL + 'search?' + `type=track&q=artist:${currentArtistName}&limit=${trackLimit}&offset=${offset}`
            const SEARCH_URL = SPOTIFY_API_URL + 'search?'
            const SEARCH_PARAMS = new URLSearchParams({
                type: "track",
                q: `artist:${currentArtistName}`,
                limit: `${trackLimit}`,
                offset: `${offset}`
            })
            let SEARCH_DETAILS = SEARCH_URL + SEARCH_PARAMS
            //Iterate until search pagination is done.
            while (SEARCH_DETAILS != null) {
                try {
                    //Add the current artist to list of names to traverse.
                    var artistDetails = await searchSpotify(spotifyAuthentication, SEARCH_DETAILS)

                    //Check if there are still more songs to traverse for the current artist, if there are dont add to list and put the artist back onto the front of the list.
                    visitedArtists.add(currentArtistName)

                    //Look through the featured artists.
                    traverseArtists(artistDetails, artistsToExplore, visitedArtists, tracksToArtist)
                    SEARCH_DETAILS = artistDetails['tracks']['next']
                }
                catch (e) {
                    console.log("Error")
                    console.log("visitedArtists")
                    console.log(visitedArtists)
                    console.log(visitedArtists.size)
                    console.log("artistsToExplore")
                    console.log(artistsToExplore)
                    console.log(artistsToExplore.length)
                    console.log("Previous Search")
                    console.log(`${SEARCH_DETAILS}`)
                    console.log("Tracks to Artist")
                    console.log(tracksToArtist)
                    throw e
                }
            }
            //TODO: Figure out if we need to add the if statements into the try/catch
            currExplored++

            //Update the degrees outward from the original artist we are.
            if (currExplored >= maxToExplore) {
                console.log(`Updated degree from previous: ${currentDegree}`)
                currentDegree++
                maxToExplore = artistsToExplore.length
                currExplored = 0
            }
        }
    }
    catch (e) {
        console.error(e)
        //console.log(artistsToExplore)
    }

    const stop = Date.now()
    console.log(`seconds elapsed = ${Math.floor((stop - start) / 1000)}`)
}

