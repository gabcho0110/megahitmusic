// ============================================
// MEGA HIT MUSIC - Data store
// Reads/writes content in Firebase Realtime DB.
// Falls back to static seed data when offline
// or when a collection is still empty.
// ============================================

const MHM_STORE = (function () {

    const COLLECTIONS = {
        artists: 'artists',
        singles: 'singles',
        events: 'events',
        news: 'news',
        messages: 'messages',
        activities: 'activities',
        academyCourses: 'academy/courses',
        academyPlans: 'academy/plans'
    };

    const ACADEMY_SETTINGS_PATH = 'academy/settings';

    // Presentations are stored as base64 data URLs in their own branch so the
    // activity list stays light - a file is only downloaded when someone asks.
    const ACTIVITY_FILES_PATH = 'activityFiles';

    // Realtime Database rejects writes above 16 MB. Base64 inflates by ~33%,
    // so 8 MB of raw file is a safe ceiling.
    const MAX_FILE_BYTES = 8 * 1024 * 1024;

    function sdk() {
        return window.MHM || null;
    }

    function hasDB() {
        const s = sdk();
        return !!(s && s.db);
    }

    function toArray(val) {
        if (!val) return [];
        return Object.keys(val).map(function (key) {
            const item = val[key] || {};
            item.id = key;
            return item;
        });
    }

    function byOrder(a, b) {
        const oa = Number(a.order);
        const ob = Number(b.order);
        const na = isNaN(oa) ? 9999 : oa;
        const nb = isNaN(ob) ? 9999 : ob;
        if (na !== nb) return na - nb;
        return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), 'bg');
    }

    // ---------- generic ----------
    async function readCollection(name) {
        if (!hasDB()) return null;
        const s = sdk();
        try {
            const snap = await s.get(s.ref(s.db, COLLECTIONS[name]));
            if (!snap.exists()) return [];
            return toArray(snap.val());
        } catch (err) {
            console.warn('[MHM_STORE] read failed for ' + name, err);
            return null;
        }
    }

    async function writeItem(name, id, obj) {
        const s = sdk();
        if (!s) throw new Error('Firebase не е наличен');
        await s.set(s.ref(s.db, COLLECTIONS[name] + '/' + id), obj);
        return id;
    }

    async function createItem(name, obj) {
        const s = sdk();
        if (!s) throw new Error('Firebase не е наличен');
        const newRef = s.push(s.ref(s.db, COLLECTIONS[name]));
        await s.set(newRef, obj);
        return newRef.key;
    }

    async function deleteItem(name, id) {
        const s = sdk();
        if (!s) throw new Error('Firebase не е наличен');
        await s.remove(s.ref(s.db, COLLECTIONS[name] + '/' + id));
    }

    function slugify(text) {
        const map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
            'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
            'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a',
            'ь': 'y', 'ю': 'yu', 'я': 'ya'
        };
        return String(text || '')
            .toLowerCase()
            .split('')
            .map(function (ch) { return map[ch] !== undefined ? map[ch] : ch; })
            .join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 50) || 'item';
    }

    // ---------- public API ----------

    // Artists
    async function getArtists() {
        const remote = await readCollection('artists');
        if (remote && remote.length) return remote.slice().sort(byOrder);
        return ARTISTS_DATA.slice().sort(byOrder);
    }

    // Singles
    async function getSingles() {
        const remote = await readCollection('singles');
        if (remote && remote.length) return remote.slice().sort(byOrder);
        return SINGLES_DATA.slice().sort(byOrder);
    }

    // Events
    async function getEvents() {
        const remote = await readCollection('events');
        if (remote && remote.length) return remote.slice().sort(byOrder);
        return EVENTS_DATA.slice().sort(byOrder);
    }

    // News
    async function getNews() {
        const remote = await readCollection('news');
        if (remote && remote.length) {
            return remote.slice().sort(function (a, b) {
                return new Date(b.date || 0) - new Date(a.date || 0);
            });
        }
        return NEWS_DATA.slice().sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
    }

    // Messages
    async function getMessages() {
        const remote = await readCollection('messages');
        if (!remote) return [];
        return remote.sort(function (a, b) {
            return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
        });
    }

    async function addMessage(data) {
        return createItem('messages', data);
    }

    async function markMessageRead(id, read) {
        const s = sdk();
        if (!s) throw new Error('Firebase не е наличен');
        await s.update(s.ref(s.db, 'messages/' + id), { read: !!read });
    }

    async function deleteMessage(id) {
        return deleteItem('messages', id);
    }

    // ---------- academy ----------
    async function getAcademySettings() {
        const s = sdk();
        if (!s) return Object.assign({}, ACADEMY_SETTINGS);
        try {
            const snap = await s.get(s.ref(s.db, ACADEMY_SETTINGS_PATH));
            if (!snap.exists()) return Object.assign({}, ACADEMY_SETTINGS);
            return Object.assign({}, ACADEMY_SETTINGS, snap.val());
        } catch (err) {
            console.warn('[MHM_STORE] academy settings failed', err);
            return Object.assign({}, ACADEMY_SETTINGS);
        }
    }

    async function saveAcademySettings(data) {
        const s = sdk();
        if (!s) throw new Error('Firebase не е наличен');
        await s.set(s.ref(s.db, ACADEMY_SETTINGS_PATH), data);
    }

    async function getAcademyCourses() {
        const remote = await readCollection('academyCourses');
        if (remote && remote.length) return remote.slice().sort(byOrder);
        return ACADEMY_COURSES.slice().sort(byOrder);
    }

    async function getAcademyPlans() {
        const remote = await readCollection('academyPlans');
        if (remote && remote.length) return remote.slice().sort(byOrder);
        return ACADEMY_PLANS.slice().sort(byOrder);
    }

    // ---------- extracurricular activities ----------
    async function getActivities() {
        const remote = await readCollection('activities');
        if (remote && remote.length) {
            return remote.slice().sort(function (a, b) {
                const da = new Date(a.date || 0).getTime();
                const db = new Date(b.date || 0).getTime();
                if (da !== db && !isNaN(da) && !isNaN(db)) return db - da;
                return byOrder(a, b);
            });
        }
        return ACTIVITIES_DATA.slice().sort(byOrder);
    }

    function readAsDataUrl(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () { resolve(reader.result); };
            reader.onerror = function () { reject(new Error('Файлът не може да бъде прочетен.')); };
            reader.readAsDataURL(file);
        });
    }

    function formatBytes(bytes) {
        const n = Number(bytes) || 0;
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
        return (n / (1024 * 1024)).toFixed(1).replace(/\.0$/, '') + ' MB';
    }

    // Uploads one presentation. Returns the metadata stored on the activity.
    async function uploadActivityFile(file) {
        const s = sdk();
        if (!s) throw new Error('Firebase не е наличен');
        if (!file) throw new Error('Не е избран файл.');
        if (file.size > MAX_FILE_BYTES) {
            throw new Error('„' + file.name + '“ е ' + formatBytes(file.size) +
                '. Максималният размер е ' + formatBytes(MAX_FILE_BYTES) + '.');
        }

        const dataUrl = await readAsDataUrl(file);
        const newRef = s.push(s.ref(s.db, ACTIVITY_FILES_PATH));
        await s.set(newRef, {
            name: file.name,
            size: file.size,
            type: file.type || '',
            data: dataUrl,
            uploadedAt: new Date().toISOString()
        });
        return {
            id: newRef.key,
            name: file.name,
            size: file.size,
            type: file.type || ''
        };
    }

    async function getActivityFile(fileId) {
        const s = sdk();
        if (!s) throw new Error('Firebase не е наличен');
        const snap = await s.get(s.ref(s.db, ACTIVITY_FILES_PATH + '/' + fileId));
        if (!snap.exists()) throw new Error('Файлът вече не е наличен.');
        return snap.val();
    }

    async function deleteActivityFile(fileId) {
        const s = sdk();
        if (!s) return;
        try {
            await s.remove(s.ref(s.db, ACTIVITY_FILES_PATH + '/' + fileId));
        } catch (err) {
            console.warn('[MHM_STORE] delete file failed', err);
        }
    }

    // Deletes an activity together with all of its presentations.
    async function deleteActivity(id, files) {
        const list = Array.isArray(files) ? files : [];
        for (let i = 0; i < list.length; i++) {
            if (list[i] && list[i].id) await deleteActivityFile(list[i].id);
        }
        return deleteItem('activities', id);
    }

    // ---------- seeding ----------
    async function seedCollection(name, items) {
        const existing = await readCollection(name);
        if (existing === null) return false;      // no DB
        if (existing.length) return false;        // already has data
        for (let i = 0; i < items.length; i++) {
            const item = Object.assign({}, items[i]);
            const id = item.id || slugify(item.title || item.name);
            delete item.id;
            await writeItem(name, id, item);
        }
        return true;
    }

    async function seedAcademySettings() {
        const s = sdk();
        if (!s) return false;
        try {
            const snap = await s.get(s.ref(s.db, ACADEMY_SETTINGS_PATH));
            if (snap.exists()) return false;
            await s.set(s.ref(s.db, ACADEMY_SETTINGS_PATH), ACADEMY_SETTINGS);
            return true;
        } catch (err) {
            console.warn('[MHM_STORE] seed settings failed', err);
            return false;
        }
    }

    async function seedAll() {
        const result = {};
        result.artists = await seedCollection('artists', ARTISTS_DATA);
        result.singles = await seedCollection('singles', SINGLES_DATA);
        result.events = await seedCollection('events', EVENTS_DATA);
        result.news = await seedCollection('news', NEWS_DATA);
        result.activities = await seedCollection('activities', ACTIVITIES_DATA);
        result.academyCourses = await seedCollection('academyCourses', ACADEMY_COURSES);
        result.academyPlans = await seedCollection('academyPlans', ACADEMY_PLANS);
        result.academySettings = await seedAcademySettings();
        return result;
    }

    return {
        hasDB: hasDB,
        slugify: slugify,
        getArtists: getArtists,
        getSingles: getSingles,
        getEvents: getEvents,
        getNews: getNews,
        getMessages: getMessages,
        addMessage: addMessage,
        markMessageRead: markMessageRead,
        deleteMessage: deleteMessage,
        getActivities: getActivities,
        uploadActivityFile: uploadActivityFile,
        getActivityFile: getActivityFile,
        deleteActivityFile: deleteActivityFile,
        deleteActivity: deleteActivity,
        formatBytes: formatBytes,
        maxFileBytes: MAX_FILE_BYTES,
        getAcademySettings: getAcademySettings,
        saveAcademySettings: saveAcademySettings,
        getAcademyCourses: getAcademyCourses,
        getAcademyPlans: getAcademyPlans,
        createItem: createItem,
        writeItem: writeItem,
        deleteItem: deleteItem,
        seedAll: seedAll
    };
})();

// Top-level `const` does not become a window property - expose explicitly
window.MHM_STORE = MHM_STORE;
