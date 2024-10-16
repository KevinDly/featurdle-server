//TODO: WRITE DATA PACKAGE STANDARDS FOR ALL EVENTS SO I KNOW WHAT KEYS/VALUES ARE IN EACH PACK
//Websocket Events
export const WS_INITIAL_CONNECTION = "wsInitialData" //Send initial data.
export const WS_CLIENT_UPDATE_GAME = "wsClientUpdateGame" //Updating current gamestate from clients.
export const WS_SERVER_UPDATE_GAME = "wsServerUpdateGame" //Updating current gamestate from server.
export const WS_CONNECTING = "wsConnect" //First connect to queue update.
export const WS_CONNECTION_UPDATE = "wsConnectionUpdate" //Waiting in queue updates.
export const WS_PREGAME_DATA = "wsPregameData" //Sending initial match data.
export const WS_START_GAME = "wsStartGame" //Telling clients to begin game.
export const WS_CLIENT_SEARCH_DATA = "wsClientSearchData" //Search results from client.
export const WS_SEARCH_RESULT = "wsSearchResult" //Search result from a client search.

//Incoming Game Events
export const EVENT_SEARCH_TRACK = "eventSearchTrack"

//Outgoing Game Events
export const EVENT_UPDATE_TIMELINE = "eventUpdateTimeline"
export const EVENT_INVALID_CHOICE = "eventInvalidChoice"
export const EVENT_INVALID_TURN = "eventInvalidTurn"

//Game Variables
export const PLAYER1 = 0
export const PLAYER2 = 1

