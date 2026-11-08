// Loads the official Firebase SDK (web, v12) and exposes window.FBNET for the game.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase, ref, set, update, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const api = { initializeApp, getAuth, signInAnonymously, getDatabase, ref, set, update, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect };
window.FBNET = { makeRoom: cfg => window.makeRoomWith(api, cfg) };
