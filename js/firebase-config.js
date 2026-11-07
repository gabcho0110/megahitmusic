// ============================================
// MEGA HIT MUSIC - Firebase bootstrap (ES module)
// MUST be loaded with <script type="module">
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
    getDatabase, ref, push, set, get, update, remove, child, onValue, off
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBbIDqR3RHHqQoWdlk-ZXyW2lQr5_FHFrM",
    authDomain: "mega-hit-music-7a72c.firebaseapp.com",
    databaseURL: "https://mega-hit-music-7a72c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mega-hit-music-7a72c",
    storageBucket: "mega-hit-music-7a72c.firebasestorage.app",
    messagingSenderId: "158729031976",
    appId: "1:158729031976:web:9ee2c83ddd7a644c9e801d",
    measurementId: "G-ECT09H4B3R"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Analytics is optional and must never break the app
isSupported().then(ok => {
    if (ok) {
        try { getAnalytics(app); } catch (e) { /* ignore */ }
    }
}).catch(() => {});

// Single global bridge for the classic scripts
window.MHM = {
    app, db,
    ref, push, set, get, update, remove, child, onValue, off,
    ready: true
};

// Notify listeners. Classic scripts run before this module, so they listen
// for this event; scripts loaded later can simply read window.MHM.
// Dispatched on window only (a document event would bubble here twice).
window.dispatchEvent(new CustomEvent('mhm:ready', { detail: window.MHM }));
