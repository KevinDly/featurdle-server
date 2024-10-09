
//Websocket Events
export const WS_INITIAL_CONNECTION = "wsInitialConnect"
export const WS_CLIENT_UPDATE_GAME = "wsClientUpdateGame" //Updating current gamestate from clients.
export const WS_SERVER_UPDATE_GAME = "wsServerUpdateGame" //Updating current gamestate from server.
export const WS_CONNECTING = "wsConnect" //First connect to queue update.
export const WS_CONNECTION_UPDATE = "wsConnectionUpdate" //Waiting in queue updates.
export const WS_START_GAME = "wsStartGame" //Initializing gamestate variables.

//Incoming Game Events
export const EVENT_SEARCH_TRACK = "eventSearchTrack"

//Outgoing Game Events
export const EVENT_UPDATE_TIMELINE = "eventUpdateTimeline"
export const EVENT_INVALID_CHOICE = "eventInvalidChoice"

//Game Variables
export const PLAYER1 = 0
export const PLAYER2 = 1

