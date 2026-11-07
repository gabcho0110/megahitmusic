// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase, ref, push, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
try {
    analytics = getAnalytics(app);
} catch(e) {
    console.log("Analytics not available");
}

const db = getDatabase(app);

// Export for use in other scripts
window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseRef = ref;
window.firebasePush = push;
window.firebaseSet = set;
window.firebaseGet = get;
window.firebaseChild = child;
