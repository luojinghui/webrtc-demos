const API_PORT = '3002';

const API_ROOT = `https://localhost:${API_PORT}`;
// const API_ROOT = `https://www.luojh.com:${API_PORT}`;

const DEFAULT_ICE_SERVER = {
  url: 'turn:47.52.156.68:3478',
  credential: 'zmecust',
  username: 'zmecust',
};

// var iceServer = {
//     "iceServers": [{
//         "urls" : ["stun:stun.l.google.com:19302"]
//     }, {
//         "urls" : ["turn:numb.viagenie.ca"],
//         "username" : "webrtc@live.com",
//         "credential" : "muazkh"
//     }]
// };

module.exports = { API_PORT, API_ROOT, DEFAULT_ICE_SERVER };
