// ============================================
// MEGA HIT MUSIC - Authentication
// Passwords are never stored in plain text:
// PBKDF2-SHA256, 150 000 iterations, random salt.
// ============================================

const MHM_AUTH = (function () {

    const USERS_PATH = 'admin/users';
    const SESSION_KEY = 'mhm_session';
    const ATTEMPTS_KEY = 'mhm_login_attempts';
    const ITERATIONS = 150000;
    const SESSION_HOURS = 8;
    const MAX_ATTEMPTS = 5;
    const LOCK_MINUTES = 2;

    // ---------- crypto helpers ----------
    function b64ToBytes(b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    }

    function bytesToB64(bytes) {
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }

    function randomSalt() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return bytesToB64(bytes);
    }

    async function derive(password, saltB64, iterations) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('Браузърът не поддържа криптография. Използвайте HTTPS.');
        }
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
        );
        const bits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: b64ToBytes(saltB64),
                iterations: iterations || ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );
        return bytesToB64(new Uint8Array(bits));
    }

    async function makePasswordRecord(password) {
        const salt = randomSalt();
        const hash = await derive(password, salt, ITERATIONS);
        return { salt: salt, hash: hash, iterations: ITERATIONS };
    }

    function safeEqual(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return false;
        if (a.length !== b.length) return false;
        let diff = 0;
        for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
        return diff === 0;
    }

    // ---------- firebase helpers ----------
    function sdk() {
        return window.MHM || null;
    }

    async function readUsers() {
        const s = sdk();
        if (!s) throw new Error('Няма връзка с базата данни');
        const snap = await s.get(s.ref(s.db, USERS_PATH));
        if (!snap.exists()) return [];
        const val = snap.val();
        return Object.keys(val).map(function (key) {
            const u = val[key] || {};
            u.id = key;
            return u;
        });
    }

    // ---------- session ----------
    function getSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const s = JSON.parse(raw);
            if (!s || !s.expires || Date.now() > s.expires) {
                sessionStorage.removeItem(SESSION_KEY);
                return null;
            }
            return s;
        } catch (e) {
            return null;
        }
    }

    function setSession(user) {
        const session = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            expires: Date.now() + SESSION_HOURS * 3600 * 1000
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    // ---------- brute force protection ----------
    function readAttempts() {
        try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{}'); }
        catch (e) { return {}; }
    }

    function writeAttempts(obj) {
        localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(obj));
    }

    function isLocked(username) {
        const all = readAttempts();
        const rec = all[username];
        if (!rec) return 0;
        if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
            return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
        }
        return 0;
    }

    function registerFailure(username) {
        const all = readAttempts();
        const rec = all[username] || { count: 0 };
        rec.count = (rec.count || 0) + 1;
        if (rec.count >= MAX_ATTEMPTS) {
            rec.lockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
            rec.count = 0;
        }
        all[username] = rec;
        writeAttempts(all);
    }

    function clearFailures(username) {
        const all = readAttempts();
        delete all[username];
        writeAttempts(all);
    }

    // ---------- bootstrap ----------
    async function ensureDefaultAdmin() {
        const users = await readUsers();
        if (users.length > 0) return { created: false, users: users };

        const rec = await makePasswordRecord(DEFAULT_ADMIN.password);
        const s = sdk();
        const newRef = s.push(s.ref(s.db, USERS_PATH));
        await s.set(newRef, {
            username: DEFAULT_ADMIN.username,
            displayName: DEFAULT_ADMIN.displayName,
            role: DEFAULT_ADMIN.role,
            salt: rec.salt,
            hash: rec.hash,
            iterations: rec.iterations,
            createdAt: new Date().toISOString(),
            lastLogin: null
        });
        return { created: true, users: await readUsers() };
    }

    // ---------- login ----------
    async function login(username, password) {
        const uname = String(username || '').trim().toLowerCase();
        if (!uname || !password) {
            return { ok: false, error: 'Моля, въведете потребителско име и парола.' };
        }

        const lockedFor = isLocked(uname);
        if (lockedFor > 0) {
            return { ok: false, error: 'Твърде много опити. Опитайте отново след ' + lockedFor + ' сек.' };
        }

        let users;
        try {
            const boot = await ensureDefaultAdmin();
            users = boot.users;
        } catch (err) {
            return { ok: false, error: 'Няма връзка с базата данни. Проверете интернет връзката.' };
        }

        const user = users.find(function (u) {
            return String(u.username || '').toLowerCase() === uname;
        });

        if (!user) {
            registerFailure(uname);
            return { ok: false, error: 'Грешно потребителско име или парола.' };
        }

        let hash;
        try {
            hash = await derive(password, user.salt, user.iterations || ITERATIONS);
        } catch (err) {
            return { ok: false, error: err.message };
        }

        if (!safeEqual(hash, user.hash)) {
            registerFailure(uname);
            return { ok: false, error: 'Грешно потребителско име или парола.' };
        }

        clearFailures(uname);

        // update lastLogin (non blocking)
        try {
            const s = sdk();
            await s.update(s.ref(s.db, USERS_PATH + '/' + user.id), {
                lastLogin: new Date().toISOString()
            });
        } catch (e) { /* ignore */ }

        return { ok: true, session: setSession(user) };
    }

    // ---------- user management ----------
    async function listUsers() {
        const users = await readUsers();
        return users.map(function (u) {
            return {
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                role: u.role || 'editor',
                createdAt: u.createdAt || null,
                lastLogin: u.lastLogin || null
            };
        }).sort(function (a, b) {
            return String(a.username).localeCompare(String(b.username), 'bg');
        });
    }

    function validateUsername(username) {
        const u = String(username || '').trim();
        if (u.length < 3) return 'Потребителското име трябва да е поне 3 символа.';
        if (!/^[a-zA-Z0-9._-]+$/.test(u)) return 'Позволени са само латински букви, цифри, точка, тире и долно тире.';
        return null;
    }

    function validatePassword(password) {
        if (!password || password.length < 6) return 'Паролата трябва да е поне 6 символа.';
        return null;
    }

    async function createUser(data) {
        const username = String(data.username || '').trim().toLowerCase();
        const nameError = validateUsername(username);
        if (nameError) throw new Error(nameError);
        const passError = validatePassword(data.password);
        if (passError) throw new Error(passError);
        if (!data.displayName || !String(data.displayName).trim()) {
            throw new Error('Моля, въведете име и фамилия.');
        }

        const users = await readUsers();
        const exists = users.some(function (u) {
            return String(u.username || '').toLowerCase() === username;
        });
        if (exists) throw new Error('Вече съществува потребител с това име.');

        const rec = await makePasswordRecord(data.password);
        const s = sdk();
        const newRef = s.push(s.ref(s.db, USERS_PATH));
        await s.set(newRef, {
            username: username,
            displayName: String(data.displayName).trim(),
            role: data.role === 'admin' ? 'admin' : 'editor',
            salt: rec.salt,
            hash: rec.hash,
            iterations: rec.iterations,
            createdAt: new Date().toISOString(),
            lastLogin: null
        });
        return newRef.key;
    }

    async function updateUser(id, data) {
        const s = sdk();
        const patch = {};
        if (data.displayName !== undefined) {
            if (!String(data.displayName).trim()) throw new Error('Името не може да е празно.');
            patch.displayName = String(data.displayName).trim();
        }
        if (data.role !== undefined) {
            patch.role = data.role === 'admin' ? 'admin' : 'editor';
        }
        if (data.password) {
            const passError = validatePassword(data.password);
            if (passError) throw new Error(passError);
            const rec = await makePasswordRecord(data.password);
            patch.salt = rec.salt;
            patch.hash = rec.hash;
            patch.iterations = rec.iterations;
        }
        if (!Object.keys(patch).length) return;

        // Never allow removing the last admin
        if (patch.role === 'editor') {
            const users = await readUsers();
            const admins = users.filter(function (u) { return u.role === 'admin' && u.id !== id; });
            const target = users.find(function (u) { return u.id === id; });
            if (target && target.role === 'admin' && admins.length === 0) {
                throw new Error('Не може да премахнете последния администратор.');
            }
        }

        await s.update(s.ref(s.db, USERS_PATH + '/' + id), patch);
    }

    async function deleteUser(id) {
        const users = await readUsers();
        const target = users.find(function (u) { return u.id === id; });
        if (!target) throw new Error('Потребителят не е намерен.');

        const session = getSession();
        if (session && session.id === id) {
            throw new Error('Не може да изтриете собствения си профил.');
        }
        if (target.role === 'admin') {
            const otherAdmins = users.filter(function (u) {
                return u.role === 'admin' && u.id !== id;
            });
            if (otherAdmins.length === 0) {
                throw new Error('Не може да изтриете последния администратор.');
            }
        }
        const s = sdk();
        await s.remove(s.ref(s.db, USERS_PATH + '/' + id));
    }

    async function changeOwnPassword(userId, currentPassword, newPassword) {
        const users = await readUsers();
        const user = users.find(function (u) { return u.id === userId; });
        if (!user) throw new Error('Потребителят не е намерен.');

        const currentHash = await derive(currentPassword, user.salt, user.iterations || ITERATIONS);
        if (!safeEqual(currentHash, user.hash)) {
            throw new Error('Текущата парола е грешна.');
        }
        const passError = validatePassword(newPassword);
        if (passError) throw new Error(passError);

        const rec = await makePasswordRecord(newPassword);
        const s = sdk();
        await s.update(s.ref(s.db, USERS_PATH + '/' + user.id), {
            salt: rec.salt,
            hash: rec.hash,
            iterations: rec.iterations
        });
    }

    return {
        login: login,
        logout: logout,
        getSession: getSession,
        listUsers: listUsers,
        createUser: createUser,
        updateUser: updateUser,
        deleteUser: deleteUser,
        changeOwnPassword: changeOwnPassword,
        ensureDefaultAdmin: ensureDefaultAdmin
    };
})();

// Top-level `const` does not become a window property - expose explicitly
window.MHM_AUTH = MHM_AUTH;
