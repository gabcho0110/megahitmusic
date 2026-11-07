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
        messages: 'messages'
    };

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

    async function seedAll() {
        const result = {};
        result.artists = await seedCollection('artists', ARTISTS_DATA);
        result.singles = await seedCollection('singles', SINGLES_DATA);
        result.events = await seedCollection('events', EVENTS_DATA);
        result.news = await seedCollection('news', NEWS_DATA);
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
        createItem: createItem,
        writeItem: writeItem,
        deleteItem: deleteItem,
        seedAll: seedAll
    };
})();

// Top-level `const` does not become a window property - expose explicitly
window.MHM_STORE = MHM_STORE;
