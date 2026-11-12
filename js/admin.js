// ============================================
// MEGA HIT MUSIC - Admin panel
// ============================================

(function () {

    'use strict';

    // ---------- element refs ----------
    const loginView = document.getElementById('loginView');
    const adminView = document.getElementById('adminView');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const togglePass = document.getElementById('togglePass');
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarNav = document.getElementById('sidebarNav');
    const sidebar = document.getElementById('adminSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const panelContent = document.getElementById('panelContent');
    const topbarTitle = document.getElementById('topbarTitle');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    const msgBadge = document.getElementById('msgBadge');
    const modalRoot = document.getElementById('modalRoot');
    const toastRoot = document.getElementById('toastRoot');

    // ---------- state ----------
    const state = {
        session: null,
        panel: 'dashboard',
        data: {
            artists: [],
            singles: [],
            events: [],
            news: [],
            messages: [],
            activities: [],
            users: [],
            academySettings: {},
            academyCourses: [],
            academyPlans: []
        },
        loading: false
    };

    // ---------- helpers ----------
    function esc(str) {
        return String(str === undefined || str === null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function toast(message, type) {
        const el = document.createElement('div');
        el.className = 'toast ' + (type || 'success');
        el.innerHTML = '<span>' + (type === 'error' ? '✕' : '✓') + '</span><span>' + esc(message) + '</span>';
        toastRoot.appendChild(el);
        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transform = 'translateX(24px)';
            el.style.transition = 'all .3s ease';
            setTimeout(function () { el.remove(); }, 300);
        }, 3600);
    }

    function fmtDate(value) {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return esc(value);
        const pad = function (n) { return String(n).padStart(2, '0'); };
        return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function truncate(str, len) {
        const s = String(str || '');
        return s.length > len ? s.slice(0, len) + '…' : s;
    }

    function isAdmin() {
        return state.session && state.session.role === 'admin';
    }

    // ============================================
    // Modal system
    // ============================================
    function closeModal() {
        modalRoot.innerHTML = '';
    }

    function openModal(options) {
        const opts = options || {};
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        overlay.innerHTML = '' +
            '<div class="modal ' + (opts.size === 'sm' ? 'modal-sm' : '') + '" role="dialog" aria-modal="true">' +
                '<div class="modal-head">' +
                    '<h3>' + esc(opts.title || '') + '</h3>' +
                    '<button type="button" class="modal-close" data-close="1" aria-label="Затвори">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    (opts.body || '') +
                '</div>' +
                '<div class="modal-foot">' +
                    (opts.footer || '') +
                '</div>' +
            '</div>';

        modalRoot.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay || e.target.dataset.close) closeModal();
        });

        document.addEventListener('keydown', function onKey(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', onKey);
            }
        });

        return overlay;
    }

    function confirmDialog(title, message, confirmLabel) {
        return new Promise(function (resolve) {
            const overlay = openModal({
                title: title,
                size: 'sm',
                body: '<p style="font-size:.92rem;color:var(--text-secondary);line-height:1.7">' + esc(message) + '</p>',
                footer: '<button type="button" class="btn btn-outline" data-cancel="1">Отказ</button>' +
                        '<button type="button" class="btn" data-confirm="1" style="background:#ef4444;color:#fff">' +
                        esc(confirmLabel || 'Изтрий') + '</button>'
            });

            overlay.addEventListener('click', function (e) {
                if (e.target.dataset.confirm) { closeModal(); resolve(true); }
                if (e.target.dataset.cancel || e.target.dataset.close || e.target === overlay) {
                    closeModal(); resolve(false);
                }
            });
        });
    }

    // ============================================
    // Field schemas
    // ============================================
    const SCHEMAS = {
        artists: {
            singular: 'изпълнител',
            plural: 'изпълнители',
            titleField: 'name',
            fields: [
                { key: 'name', label: 'Име', type: 'text', required: true, span: 2 },
                { key: 'role', label: 'Роля / позиция', type: 'text', span: 2 },
                { key: 'emoji', label: 'Емоджи', type: 'text', hint: 'Един емоджи, напр. 🎤' },
                { key: 'order', label: 'Подредба', type: 'number', hint: 'По-малко = по-напред' },
                { key: 'shortBio', label: 'Кратко описание (начална страница)', type: 'textarea', rows: 3, span: 2 },
                { key: 'bio', label: 'Биография', type: 'lines', rows: 8, span: 2, hint: 'Всеки абзац на нов ред' },
                { key: 'highlights', label: 'Ключови моменти', type: 'lines', rows: 4, span: 2, hint: 'Всеки на нов ред' }
            ]
        },
        singles: {
            singular: 'сингъл',
            plural: 'сингли',
            titleField: 'title',
            fields: [
                { key: 'title', label: 'Заглавие', type: 'text', required: true, span: 2 },
                { key: 'artist', label: 'Изпълнител', type: 'text', span: 2 },
                { key: 'year', label: 'Година', type: 'text' },
                { key: 'emoji', label: 'Емоджи', type: 'text', hint: 'напр. 🎵' },
                { key: 'link', label: 'Линк (YouTube / Spotify)', type: 'url', span: 2 },
                { key: 'description', label: 'Описание', type: 'textarea', rows: 3, span: 2 },
                { key: 'order', label: 'Подредба', type: 'number' }
            ]
        },
        events: {
            singular: 'събитие',
            plural: 'събития',
            titleField: 'title',
            fields: [
                { key: 'title', label: 'Заглавие', type: 'text', required: true, span: 2 },
                { key: 'tabLabel', label: 'Кратко име (за таб)', type: 'text', span: 2, hint: 'Показва се в таба на страница „Събития“' },
                { key: 'tag', label: 'Етикет', type: 'text', hint: 'Конкурс / Фестивал' },
                { key: 'emoji', label: 'Емоджи', type: 'text' },
                { key: 'date', label: 'Дата', type: 'text', hint: 'напр. 22.07.2026' },
                { key: 'order', label: 'Подредба', type: 'number' },
                { key: 'organizers', label: 'Организатори', type: 'text', span: 2 },
                { key: 'formLink', label: 'Линк към форма', type: 'url', span: 2 },
                { key: 'bankAccount', label: 'Банкова сметка', type: 'text', span: 2 },
                { key: 'showJury', label: 'Показвай жури', type: 'checkbox', span: 2 },
                { key: 'content', label: 'Съдържание', type: 'html', rows: 16, span: 2, hint: 'Позволен е HTML (h3, p, ul, li, div.event-box…)' }
            ]
        },
        news: {
            singular: 'новина',
            plural: 'новини',
            titleField: 'title',
            fields: [
                { key: 'title', label: 'Заглавие', type: 'text', required: true, span: 2 },
                { key: 'date', label: 'Дата', type: 'date', span: 2 },
                { key: 'emoji', label: 'Емоджи', type: 'text' },
                { key: 'order', label: 'Подредба', type: 'number' },
                { key: 'link', label: 'Линк', type: 'url', span: 2 },
                { key: 'excerpt', label: 'Кратко резюме', type: 'textarea', rows: 4, span: 2 }
            ]
        },
        users: {
            singular: 'потребител',
            plural: 'потребители',
            titleField: 'displayName',
            fields: [
                { key: 'displayName', label: 'Име и фамилия', type: 'text', required: true, span: 2 },
                { key: 'username', label: 'Потребителско име', type: 'text', hint: 'Латински букви, цифри, . _ -' },
                { key: 'role', label: 'Роля', type: 'select', options: [
                    { value: 'admin', label: 'Администратор (пълен достъп)' },
                    { value: 'editor', label: 'Редактор (само съдържание)' }
                ] },
                { key: 'password', label: 'Парола', type: 'password', span: 2 }
            ]
        },
        activities: {
            singular: 'дейност',
            plural: 'дейности',
            titleField: 'title',
            fields: [
                { key: 'title', label: 'Заглавие', type: 'text', required: true, span: 2 },
                { key: 'date', label: 'Дата', type: 'date', span: 2 },
                { key: 'organizer', label: 'Организатор', type: 'text', span: 2, hint: 'Кой организира дейността' },
                { key: 'participants', label: 'Участници', type: 'textarea', rows: 3, span: 2, hint: 'Кой участва — клас, група, имена' },
                { key: 'location', label: 'Място', type: 'text', span: 2 },
                { key: 'emoji', label: 'Емоджи', type: 'text', hint: 'напр. 🎭' },
                { key: 'order', label: 'Подредба', type: 'number' },
                { key: 'link', label: 'Външен линк (по избор)', type: 'url', span: 2, hint: 'Напр. Google Drive папка с материали' },
                { key: 'description', label: 'Описание', type: 'textarea', rows: 5, span: 2 }
            ]
        },
        academyCourses: {
            singular: 'дисциплина',
            plural: 'дисциплини',
            titleField: 'title',
            fields: [
                { key: 'title', label: 'Име на дисциплината', type: 'text', required: true, span: 2 },
                { key: 'emoji', label: 'Емоджи', type: 'text', hint: 'напр. 🎤' },
                { key: 'order', label: 'Подредба', type: 'number' },
                { key: 'description', label: 'Описание', type: 'textarea', rows: 3, span: 2 },
                { key: 'age', label: 'Възраст', type: 'text', hint: 'напр. от 5 г.' },
                { key: 'duration', label: 'Продължителност', type: 'text', hint: 'напр. 45 мин' }
            ]
        },
        academyPlans: {
            singular: 'ценово ниво',
            plural: 'ценови нива',
            titleField: 'name',
            fields: [
                { key: 'name', label: 'Име на нивото', type: 'text', required: true, span: 2 },
                { key: 'price', label: 'Цена', type: 'text', required: true, hint: 'напр. 60 €' },
                { key: 'period', label: 'Период', type: 'text', hint: 'напр. на месец' },
                { key: 'badge', label: 'Етикет', type: 'text', hint: 'напр. Препоръчваме (по избор)' },
                { key: 'order', label: 'Подредба', type: 'number' },
                { key: 'featured', label: 'Откроявай това ниво', type: 'checkbox', span: 2 },
                { key: 'description', label: 'Кратко описание', type: 'textarea', rows: 2, span: 2 },
                { key: 'features', label: 'Какво включва', type: 'lines', rows: 5, span: 2, hint: 'Всяка точка на нов ред' }
            ]
        }
    };

    // Academy settings are edited in an inline form (not a modal)
    const ACADEMY_SETTINGS_FIELDS = [
        { key: 'emoji', label: 'Емоджи', type: 'text' },
        { key: 'title', label: 'Заглавие', type: 'text', required: true },
        { key: 'subtitle', label: 'Подзаглавие', type: 'text', span: 2 },
        { key: 'intro', label: 'Въведение', type: 'textarea', rows: 3, span: 2 },
        { key: 'description', label: 'Блок „Какво включва обучението“ (HTML)', type: 'html', rows: 8, span: 2 },
        { key: 'ctaTitle', label: 'Заглавие на призива', type: 'text' },
        { key: 'ctaText', label: 'Текст на призива', type: 'text' },
        { key: 'note', label: 'Бележка под цените', type: 'textarea', rows: 2, span: 2 },
        { key: 'phone', label: 'Телефон', type: 'text' },
        { key: 'email', label: 'Имейл', type: 'text' }
    ];

    // ============================================
    // Form building
    // ============================================
    function renderField(field, value) {
        const id = 'f_' + field.key;
        const span = field.span === 2 ? ' span-2' : '';
        let input = '';

        if (field.type === 'textarea' || field.type === 'html' || field.type === 'lines') {
            const rows = field.rows || 4;
            const val = field.type === 'lines'
                ? (Array.isArray(value) ? value.join('\n') : (value || ''))
                : (value || '');
            input = '<textarea id="' + id + '" name="' + field.key + '" rows="' + rows + '"' +
                (field.type === 'html' ? ' class="code-area"' : '') + '>' + esc(val) + '</textarea>';
        } else if (field.type === 'select') {
            input = '<select id="' + id + '" name="' + field.key + '">' +
                (field.options || []).map(function (o) {
                    return '<option value="' + esc(o.value) + '"' +
                        (String(value) === String(o.value) ? ' selected' : '') + '>' +
                        esc(o.label) + '</option>';
                }).join('') + '</select>';
        } else if (field.type === 'checkbox') {
            return '<div class="field-check' + span + '">' +
                '<input type="checkbox" id="' + id + '" name="' + field.key + '"' + (value ? ' checked' : '') + '>' +
                '<label for="' + id + '">' + esc(field.label) + '</label>' +
                '</div>';
        } else {
            const type = field.type === 'number' ? 'number'
                : field.type === 'password' ? 'password'
                : field.type === 'date' ? 'date'
                : field.type === 'url' ? 'url' : 'text';
            input = '<input type="' + type + '" id="' + id + '" name="' + field.key + '"' +
                ' value="' + esc(value === undefined || value === null ? '' : value) + '"' +
                (field.required ? ' required' : '') +
                (type === 'number' ? ' step="1"' : '') + '>';
        }

        return '<div class="form-group' + span + '">' +
            '<label for="' + id + '">' + esc(field.label) +
            (field.required ? ' <span style="color:#f87171">*</span>' : '') + '</label>' +
            input +
            (field.hint ? '<span class="field-hint">' + esc(field.hint) + '</span>' : '') +
            '</div>';
    }

    function openEntityForm(collection, item) {
        if (collection === 'activities') { openActivityForm(item); return; }
        const schema = SCHEMAS[collection];
        if (!schema) return;
        const isEdit = !!item;
        const values = item ? Object.assign({}, item) : {};
        if (collection === 'users' && !isEdit) values.role = 'editor';

        const fieldsHTML = schema.fields.map(function (f) {
            let val = values[f.key];
            if (collection === 'users') {
                if (f.key === 'username' && isEdit) {
                    return '<div class="form-group span-2">' +
                        '<label>Потребителско име</label>' +
                        '<input type="text" value="' + esc(values.username || '') + '" disabled>' +
                        '<span class="field-hint">Потребителското име не може да се променя.</span>' +
                        '</div>';
                }
                if (f.key === 'password') {
                    return '<div class="form-group span-2">' +
                        '<label for="f_password">' + (isEdit ? 'Нова парола' : 'Парола') +
                        (isEdit ? '' : ' <span style="color:#f87171">*</span>') + '</label>' +
                        '<input type="password" id="f_password" name="password" autocomplete="new-password"' +
                        (isEdit ? '' : ' required') + ' placeholder="' + (isEdit ? 'Оставете празно, за да не се променя' : 'Минимум 6 символа') + '">' +
                        '</div>';
                }
            }
            if (f.key === 'date' && collection === 'news' && val) {
                val = String(val).slice(0, 10);
            }
            return renderField(f, val);
        }).join('');

        const overlay = openModal({
            title: (isEdit ? 'Редакция на ' : 'Нов ') + schema.singular,
            body: '<form id="entityForm" class="form-grid" autocomplete="off">' +
                    fieldsHTML +
                    '<div class="form-error" id="entityError" hidden></div>' +
                  '</form>',
            footer: '<button type="button" class="btn btn-outline" data-close="1">Отказ</button>' +
                    '<button type="button" class="btn btn-primary" id="saveEntityBtn">' +
                    (isEdit ? 'Запази промените' : 'Създай') + '</button>'
        });

        const form = overlay.querySelector('#entityForm');
        const errorBox = overlay.querySelector('#entityError');
        const saveBtn = overlay.querySelector('#saveEntityBtn');

        saveBtn.addEventListener('click', async function () {
            errorBox.hidden = true;
            saveBtn.disabled = true;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Запазване...';

            try {
                const data = collectForm(form, schema.fields, collection, isEdit);
                if (collection === 'users') {
                    if (isEdit) {
                        await window.MHM_AUTH.updateUser(item.id, data);
                        toast('Потребителят е обновен.');
                    } else {
                        await window.MHM_AUTH.createUser(data);
                        toast('Потребителят е създаден.');
                    }
                } else if (isEdit) {
                    await saveEntity(collection, item.id, data);
                    toast('Промените са запазени.');
                } else {
                    await createEntity(collection, data);
                    toast('Успешно добавено.');
                }
                closeModal();
                await refreshPanel();
            } catch (err) {
                errorBox.hidden = false;
                errorBox.textContent = err && err.message ? err.message : 'Възникна грешка.';
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }
        });
    }

    function collectForm(form, fields, collection, isEdit) {
        const data = {};
        fields.forEach(function (f) {
            const el = form.querySelector('[name="' + f.key + '"]');
            if (!el) return;

            if (f.type === 'checkbox') {
                data[f.key] = el.checked;
                return;
            }
            const raw = el.value;
            if (f.required && !String(raw).trim()) {
                throw new Error('Полето „' + f.label + '“ е задължително.');
            }
            if (f.type === 'number') {
                data[f.key] = raw === '' ? 0 : Number(raw);
            } else if (f.type === 'lines') {
                data[f.key] = String(raw).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
            } else {
                data[f.key] = String(raw).trim();
            }
        });

        if (collection === 'users') {
            if (isEdit && !data.password) delete data.password;
            if (!isEdit && !data.password) throw new Error('Паролата е задължителна.');
        }
        if (collection === 'events' && !data.tabLabel) {
            data.tabLabel = truncate(data.title, 26);
        }
        if (collection === 'news' && !data.date) {
            data.date = new Date().toISOString().slice(0, 10);
        }
        return data;
    }

    // ============================================
    // Activity form (fields + presentation uploads)
    // ============================================
    function openActivityForm(item) {
        const schema = SCHEMAS.activities;
        const isEdit = !!item;
        const values = item ? Object.assign({}, item) : {};

        let existingFiles = Array.isArray(values.files) ? values.files.slice() : [];
        let removedFiles = [];
        let stagedFiles = [];

        const fieldsHTML = schema.fields.map(function (f) {
            let val = values[f.key];
            if (f.key === 'date' && val) val = String(val).slice(0, 10);
            return renderField(f, val);
        }).join('');

        const overlay = openModal({
            title: (isEdit ? 'Редакция на дейност' : 'Нова дейност'),
            body: '<form id="activityForm" class="form-grid" autocomplete="off">' +
                    fieldsHTML +
                    '<div class="form-group span-2">' +
                        '<label>Презентации и файлове</label>' +
                        '<label class="upload-zone" for="activityFileInput">' +
                            '<span class="upload-zone-icon">&#128206;</span>' +
                            '<span class="upload-zone-title">Избери файлове за качване</span>' +
                            '<span class="upload-zone-hint">PDF, PowerPoint, Word, изображения · до ' +
                                window.MHM_STORE.formatBytes(window.MHM_STORE.maxFileBytes) + ' на файл</span>' +
                        '</label>' +
                        '<input type="file" id="activityFileInput" multiple hidden>' +
                        '<div class="file-rows" id="activityFileRows"></div>' +
                        '<span class="field-hint">Файловете се качват при натискане на „Запази“.</span>' +
                    '</div>' +
                    '<div class="form-error" id="activityError" hidden></div>' +
                  '</form>',
            footer: '<button type="button" class="btn btn-outline" data-close="1">Отказ</button>' +
                    '<button type="button" class="btn btn-primary" id="saveActivityBtn">' +
                    (isEdit ? 'Запази промените' : 'Създай') + '</button>'
        });

        const form = overlay.querySelector('#activityForm');
        const errorBox = overlay.querySelector('#activityError');
        const saveBtn = overlay.querySelector('#saveActivityBtn');
        const input = overlay.querySelector('#activityFileInput');
        const rows = overlay.querySelector('#activityFileRows');

        function renderFileRows() {
            const parts = [];

            existingFiles.forEach(function (f, i) {
                parts.push('<div class="file-row">' +
                    '<span class="file-row-icon">&#128196;</span>' +
                    '<span class="file-row-name">' + esc(f.name || 'файл') + '</span>' +
                    '<span class="file-row-size">' + esc(window.MHM_STORE.formatBytes(f.size)) + '</span>' +
                    '<button type="button" class="icon-btn danger" data-remove-existing="' + i + '" title="Премахни">&#128465;</button>' +
                    '</div>');
            });

            stagedFiles.forEach(function (f, i) {
                parts.push('<div class="file-row pending">' +
                    '<span class="file-row-icon">&#9203;</span>' +
                    '<span class="file-row-name">' + esc(f.name) + '</span>' +
                    '<span class="file-row-size">' + esc(window.MHM_STORE.formatBytes(f.size)) + ' · нов</span>' +
                    '<button type="button" class="icon-btn danger" data-remove-staged="' + i + '" title="Премахни">&#10005;</button>' +
                    '</div>');
            });

            rows.innerHTML = parts.length
                ? parts.join('')
                : '<span class="file-empty">Няма прикачени файлове.</span>';

            rows.querySelectorAll('[data-remove-existing]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const idx = Number(btn.dataset.removeExisting);
                    const removed = existingFiles.splice(idx, 1)[0];
                    if (removed) removedFiles.push(removed);
                    renderFileRows();
                });
            });
            rows.querySelectorAll('[data-remove-staged]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    stagedFiles.splice(Number(btn.dataset.removeStaged), 1);
                    renderFileRows();
                });
            });
        }

        renderFileRows();

        input.addEventListener('change', function () {
            const max = window.MHM_STORE.maxFileBytes;
            const rejected = [];
            Array.prototype.forEach.call(input.files, function (file) {
                if (file.size > max) {
                    rejected.push('„' + file.name + '“ (' + window.MHM_STORE.formatBytes(file.size) + ')');
                    return;
                }
                stagedFiles.push(file);
            });
            input.value = '';
            renderFileRows();

            if (rejected.length) {
                errorBox.hidden = false;
                errorBox.textContent = 'Тези файлове са над ' + window.MHM_STORE.formatBytes(max) +
                    ' и не са добавени: ' + rejected.join(', ');
            } else {
                errorBox.hidden = true;
            }
        });

        saveBtn.addEventListener('click', async function () {
            errorBox.hidden = true;
            const originalText = saveBtn.textContent;

            let data;
            try {
                data = collectForm(form, schema.fields, 'activities', isEdit);
            } catch (err) {
                errorBox.hidden = false;
                errorBox.textContent = err.message || 'Проверете полетата.';
                return;
            }

            saveBtn.disabled = true;

            try {
                for (let i = 0; i < removedFiles.length; i++) {
                    if (removedFiles[i] && removedFiles[i].id) {
                        await window.MHM_STORE.deleteActivityFile(removedFiles[i].id);
                    }
                }

                data.files = existingFiles.slice();
                for (let i = 0; i < stagedFiles.length; i++) {
                    saveBtn.textContent = stagedFiles.length > 1
                        ? 'Качване ' + (i + 1) + '/' + stagedFiles.length + '…'
                        : 'Качване…';
                    const meta = await window.MHM_STORE.uploadActivityFile(stagedFiles[i]);
                    data.files.push(meta);
                }

                if (!data.files.length) delete data.files;
                if (!data.emoji) data.emoji = '🎭';

                saveBtn.textContent = 'Запазване…';
                if (isEdit) {
                    await saveEntity('activities', item.id, data);
                    toast('Промените са запазени.');
                } else {
                    await createEntity('activities', data);
                    toast('Дейността е създадена.');
                }

                closeModal();
                await refreshPanel();
            } catch (err) {
                errorBox.hidden = false;
                errorBox.textContent = err && err.message ? err.message : 'Възникна грешка при запазването.';
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }
        });
    }

    // ============================================
    // CRUD
    // ============================================
    async function createEntity(collection, data) {
        let id = window.MHM_STORE.slugify(data.title || data.name || 'item');
        const existing = state.data[collection] || [];
        let candidate = id;
        let n = 2;
        while (existing.some(function (i) { return i.id === candidate; })) {
            candidate = id + '-' + n;
            n++;
        }
        await window.MHM_STORE.writeItem(collection, candidate, data);
        return candidate;
    }

    async function saveEntity(collection, id, data) {
        await window.MHM_STORE.writeItem(collection, id, data);
    }

    async function removeEntity(collection, id, title) {
        const schema = SCHEMAS[collection];
        const ok = await confirmDialog(
            'Изтриване',
            'Сигурни ли сте, че искате да изтриете „' + (title || id) + '“? Това действие е необратимо.',
            'Изтрий'
        );
        if (!ok) return;
        try {
            if (collection === 'activities') {
                const item = (state.data.activities || []).find(function (i) { return i.id === id; });
                await window.MHM_STORE.deleteActivity(id, item ? item.files : []);
            } else {
                await window.MHM_STORE.deleteItem(collection, id);
            }
            toast('Изтрито успешно.');
            await refreshPanel();
        } catch (err) {
            toast(err.message || 'Грешка при изтриване.', 'error');
        }
    }

    async function removeUser(id, name) {
        const ok = await confirmDialog(
            'Изтриване на потребител',
            'Сигурни ли сте, че искате да изтриете потребителя „' + (name || id) + '“?',
            'Изтрий'
        );
        if (!ok) return;
        try {
            await window.MHM_AUTH.deleteUser(id);
            toast('Потребителят е изтрит.');
            await refreshPanel();
        } catch (err) {
            toast(err.message || 'Грешка при изтриване.', 'error');
        }
    }

    // ============================================
    // Data loading
    // ============================================
    async function loadAll() {
        state.loading = true;
        const S = window.MHM_STORE;
        const results = await Promise.all([
            S.getArtists(), S.getSingles(), S.getEvents(), S.getNews(), S.getMessages(),
            S.getAcademySettings(), S.getAcademyCourses(), S.getAcademyPlans(), S.getActivities()
        ]);
        state.data.artists = results[0] || [];
        state.data.singles = results[1] || [];
        state.data.events = results[2] || [];
        state.data.news = results[3] || [];
        state.data.messages = results[4] || [];
        state.data.academySettings = results[5] || {};
        state.data.academyCourses = results[6] || [];
        state.data.academyPlans = results[7] || [];
        state.data.activities = results[8] || [];

        if (isAdmin()) {
            try {
                state.data.users = await window.MHM_AUTH.listUsers();
            } catch (e) {
                state.data.users = [];
            }
        }
        state.loading = false;
        updateMessageBadge();
    }

    function updateMessageBadge() {
        const unread = (state.data.messages || []).filter(function (m) { return !m.read; }).length;
        if (!msgBadge) return;
        if (unread > 0) {
            msgBadge.textContent = unread > 99 ? '99+' : String(unread);
            msgBadge.hidden = false;
        } else {
            msgBadge.hidden = true;
        }
    }

    // ============================================
    // Panels
    // ============================================
    const PANEL_TITLES = {
        dashboard: 'Табло',
        artists: 'Изпълнители',
        singles: 'Сингли',
        events: 'Събития',
        news: 'Новини',
        activities: 'Извънкласни дейности',
        messages: 'Съобщения',
        users: 'Потребители',
        account: 'Моят профил',
        academySettings: 'Академия — настройки',
        academyCourses: 'Академия — дисциплини',
        academyPlans: 'Академия — цени'
    };

    function setPanel(name) {
        state.panel = name;
        topbarTitle.textContent = PANEL_TITLES[name] || '';
        sidebarNav.querySelectorAll('.sidebar-link').forEach(function (b) {
            b.classList.toggle('active', b.dataset.panel === name);
        });
        sidebar.classList.remove('open');
        renderPanel();
    }

    async function refreshPanel() {
        await loadAll();
        renderPanel();
    }

    function renderPanel() {
        switch (state.panel) {
            case 'dashboard': renderDashboard(); break;
            case 'artists': renderList('artists'); break;
            case 'singles': renderList('singles'); break;
            case 'events': renderList('events'); break;
            case 'news': renderList('news'); break;
            case 'activities': renderList('activities'); break;
            case 'messages': renderMessages(); break;
            case 'users': renderUsers(); break;
            case 'account': renderAccount(); break;
            case 'academySettings': renderAcademySettings(); break;
            case 'academyCourses': renderList('academyCourses'); break;
            case 'academyPlans': renderList('academyPlans'); break;
            default: renderDashboard();
        }
    }

    // ---------- dashboard ----------
    function renderDashboard() {
        const d = state.data;
        const unread = d.messages.filter(function (m) { return !m.read; }).length;
        const recent = d.messages.slice(0, 4);

        panelContent.innerHTML = '' +
            '<div class="panel-head">' +
                '<div>' +
                    '<h2>Добре дошъл, ' + esc((state.session.displayName || '').split(' ')[0] || 'админ') + ' 👋</h2>' +
                    '<p>Управлявай съдържанието на сайта от едно място.</p>' +
                '</div>' +
                '<div class="panel-actions">' +
                    '<a href="index.html" target="_blank" rel="noopener" class="btn btn-outline">Отвори сайта</a>' +
                '</div>' +
            '</div>' +

            '<div class="stats-grid">' +
                statCard('🎤', d.artists.length, 'Изпълнители') +
                statCard('🎵', d.singles.length, 'Сингли') +
                statCard('🎪', d.events.length, 'Събития') +
                statCard('📰', d.news.length, 'Новини') +
                statCard('🎉', d.activities.length, 'Дейности') +
                statCard('🎓', d.academyCourses.length, 'Дисциплини') +
                statCard('✉️', unread, 'Непрочетени') +
            '</div>' +

            '<div class="panel-head" style="margin-top:8px">' +
                '<div><h2 style="font-size:1.2rem">Последни съобщения</h2></div>' +
                '<div class="panel-actions">' +
                    '<button class="btn btn-outline btn-sm" data-goto="messages">Виж всички</button>' +
                '</div>' +
            '</div>' +

            (recent.length
                ? '<div class="msg-list">' + recent.map(messageCard).join('') + '</div>'
                : '<div class="data-card"><div class="panel-empty">' +
                  '<div class="panel-empty-icon">📭</div><p>Все още няма съобщения.</p></div></div>');

        panelContent.querySelectorAll('[data-goto]').forEach(function (btn) {
            btn.addEventListener('click', function () { setPanel(this.dataset.goto); });
        });
        bindMessageActions();
    }

    function statCard(icon, value, label) {
        return '<div class="stat-card">' +
            '<div class="stat-card-icon">' + icon + '</div>' +
            '<div class="stat-card-value">' + value + '</div>' +
            '<div class="stat-card-label">' + esc(label) + '</div>' +
            '</div>';
    }

    // ---------- generic list ----------
    const LIST_CONFIG = {
        artists: {
            columns: [
                { label: '', render: function (i) { return '<span class="cell-emoji">' + esc(i.emoji || '🎤') + '</span>'; } },
                { label: 'Име', render: function (i) { return '<span class="cell-title">' + esc(i.name) + '</span>'; } },
                { label: 'Роля', render: function (i) { return esc(i.role || '—'); }, hideMobile: true },
                { label: 'Подредба', render: function (i) { return '<span class="cell-muted">' + esc(i.order || 0) + '</span>'; }, hideMobile: true }
            ]
        },
        singles: {
            columns: [
                { label: '', render: function (i) { return '<span class="cell-emoji">' + esc(i.emoji || '🎵') + '</span>'; } },
                { label: 'Заглавие', render: function (i) { return '<span class="cell-title">' + esc(i.title) + '</span>'; } },
                { label: 'Изпълнител', render: function (i) { return esc(i.artist || '—'); }, hideMobile: true },
                { label: 'Година', render: function (i) { return '<span class="cell-muted">' + esc(i.year || '—') + '</span>'; }, hideMobile: true }
            ]
        },
        events: {
            columns: [
                { label: '', render: function (i) { return '<span class="cell-emoji">' + esc(i.emoji || '🎪') + '</span>'; } },
                { label: 'Заглавие', render: function (i) { return '<span class="cell-title">' + esc(truncate(i.title, 60)) + '</span>'; } },
                { label: 'Етикет', render: function (i) { return esc(i.tag || '—'); }, hideMobile: true },
                { label: 'Дата', render: function (i) { return '<span class="cell-muted">' + esc(i.date || '—') + '</span>'; } }
            ]
        },
        news: {
            columns: [
                { label: '', render: function (i) { return '<span class="cell-emoji">' + esc(i.emoji || '📰') + '</span>'; } },
                { label: 'Заглавие', render: function (i) { return '<span class="cell-title">' + esc(truncate(i.title, 60)) + '</span>'; } },
                { label: 'Дата', render: function (i) { return '<span class="cell-muted">' + esc(i.date || '—') + '</span>'; } }
            ]
        },
        activities: {
            columns: [
                { label: '', render: function (i) { return '<span class="cell-emoji">' + esc(i.emoji || '🎭') + '</span>'; } },
                { label: 'Дейност', render: function (i) { return '<span class="cell-title">' + esc(truncate(i.title, 55)) + '</span>'; } },
                { label: 'Организатор', render: function (i) { return esc(truncate(i.organizer || '—', 40)); }, hideMobile: true },
                { label: 'Дата', render: function (i) { return '<span class="cell-muted">' + esc(i.date || '—') + '</span>'; }, hideMobile: true },
                { label: 'Файлове', render: function (i) {
                    const n = Array.isArray(i.files) ? i.files.length : 0;
                    return '<span class="cell-muted">' + (n ? '📎 ' + n : '—') + '</span>';
                } }
            ]
        },
        academyCourses: {
            columns: [
                { label: '', render: function (i) { return '<span class="cell-emoji">' + esc(i.emoji || '🎵') + '</span>'; } },
                { label: 'Дисциплина', render: function (i) { return '<span class="cell-title">' + esc(i.title) + '</span>'; } },
                { label: 'Възраст', render: function (i) { return '<span class="cell-muted">' + esc(i.age || '—') + '</span>'; }, hideMobile: true },
                { label: 'Времетраене', render: function (i) { return '<span class="cell-muted">' + esc(i.duration || '—') + '</span>'; }, hideMobile: true }
            ]
        },
        academyPlans: {
            columns: [
                { label: 'Ниво', render: function (i) { return '<span class="cell-title">' + esc(i.name) + '</span>' + (i.featured ? ' <span class="msg-subject">активно</span>' : ''); } },
                { label: 'Цена', render: function (i) { return '<span class="cell-title" style="color:var(--accent)">' + esc(i.price || '—') + '</span>'; } },
                { label: 'Период', render: function (i) { return '<span class="cell-muted">' + esc(i.period || '—') + '</span>'; }, hideMobile: true },
                { label: 'Точки', render: function (i) {
                    const n = Array.isArray(i.features) ? i.features.length : 0;
                    return '<span class="cell-muted">' + n + '</span>';
                }, hideMobile: true }
            ]
        }
    };

    function renderList(collection) {
        const schema = SCHEMAS[collection];
        const config = LIST_CONFIG[collection];
        const items = state.data[collection] || [];

        let tableHTML;
        if (!items.length) {
            tableHTML = '<div class="panel-empty">' +
                '<div class="panel-empty-icon">📄</div>' +
                '<p>Все още няма добавени ' + esc(schema.plural) + '.</p>' +
                '<button class="btn btn-primary" data-add="1">Добави ' + esc(schema.singular) + '</button>' +
                '</div>';
        } else {
            tableHTML = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
                config.columns.map(function (c) {
                    return '<th' + (c.hideMobile ? ' class="col-hide-mobile"' : '') + '>' + esc(c.label) + '</th>';
                }).join('') +
                '<th style="text-align:right">Действия</th>' +
                '</tr></thead><tbody>' +
                items.map(function (item) {
                    return '<tr>' +
                        config.columns.map(function (c) {
                            return '<td' + (c.hideMobile ? ' class="col-hide-mobile"' : '') + '>' + c.render(item) + '</td>';
                        }).join('') +
                        '<td><div class="row-actions">' +
                            '<button class="icon-btn" title="Редактирай" data-edit="' + esc(item.id) + '">✏️</button>' +
                            '<button class="icon-btn danger" title="Изтрий" data-del="' + esc(item.id) + '">🗑️</button>' +
                        '</div></td>' +
                        '</tr>';
                }).join('') +
                '</tbody></table></div>';
        }

        panelContent.innerHTML = '' +
            '<div class="panel-head">' +
                '<div>' +
                    '<h2>' + esc(PANEL_TITLES[collection]) + '</h2>' +
                    '<p>' + items.length + ' записа в базата данни</p>' +
                '</div>' +
                '<div class="panel-actions">' +
                    '<button class="btn btn-primary" data-add="1">+ Добави</button>' +
                '</div>' +
            '</div>' +
            '<div class="data-card">' + tableHTML + '</div>';

        const addBtn = panelContent.querySelector('[data-add]');
        if (addBtn) addBtn.addEventListener('click', function () { openEntityForm(collection, null); });

        panelContent.querySelectorAll('[data-edit]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const item = items.find(function (i) { return i.id === btn.dataset.edit; });
                if (item) openEntityForm(collection, item);
            });
        });

        panelContent.querySelectorAll('[data-del]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const item = items.find(function (i) { return i.id === btn.dataset.del; });
                if (item) removeEntity(collection, item.id, item[schema.titleField] || item.title || item.name);
            });
        });
    }

    // ---------- messages ----------
    const SUBJECT_LABELS = {
        general: 'Общо запитване',
        participation: 'Участие в конкурс',
        academy: 'Академия',
        collaboration: 'Сътрудничество'
    };

    function messageCard(m) {
        const subject = m.subject
            ? (SUBJECT_LABELS[m.subject] || m.subject)
            : '';
        return '<div class="msg-item' + (m.read ? '' : ' unread') + '">' +
            '<div class="msg-top">' +
                '<span class="msg-from">' + esc(m.name || 'Без име') + '</span>' +
                '<span class="msg-email">' + esc(m.email || '') + '</span>' +
                (subject ? '<span class="msg-subject">' + esc(subject) + '</span>' : '') +
                '<span class="msg-date">' + fmtDate(m.timestamp) + '</span>' +
            '</div>' +
            '<div class="msg-body">' + esc(m.message || '') + '</div>' +
            (m.phone ? '<div class="cell-muted">📞 ' + esc(m.phone) + '</div>' : '') +
            '<div class="msg-actions" style="margin-top:10px">' +
                '<button class="btn btn-outline btn-sm" data-read="' + esc(m.id) + '">' +
                    (m.read ? 'Маркирай като ново' : 'Маркирай като прочетено') + '</button>' +
                '<a class="btn btn-outline btn-sm" href="mailto:' + esc(m.email || '') + '">Отговори</a>' +
                '<button class="btn btn-outline btn-sm" data-msgdel="' + esc(m.id) + '">Изтрий</button>' +
            '</div>' +
        '</div>';
    }

    function renderMessages() {
        const messages = state.data.messages || [];
        panelContent.innerHTML = '' +
            '<div class="panel-head">' +
                '<div>' +
                    '<h2>Съобщения</h2>' +
                    '<p>' + messages.length + ' общо · ' +
                        messages.filter(function (m) { return !m.read; }).length + ' непрочетени</p>' +
                '</div>' +
                '<div class="panel-actions">' +
                    '<button class="btn btn-outline" id="refreshMsgs">Опресни</button>' +
                '</div>' +
            '</div>' +
            (messages.length
                ? '<div class="msg-list">' + messages.map(messageCard).join('') + '</div>'
                : '<div class="data-card"><div class="panel-empty">' +
                  '<div class="panel-empty-icon">📭</div><p>Все още няма съобщения от контактната форма.</p></div></div>');

        const refreshBtn = document.getElementById('refreshMsgs');
        if (refreshBtn) refreshBtn.addEventListener('click', refreshPanel);

        bindMessageActions();
    }

    function bindMessageActions() {
        panelContent.querySelectorAll('[data-read]').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                const msg = state.data.messages.find(function (m) { return m.id === btn.dataset.read; });
                if (!msg) return;
                try {
                    await window.MHM_STORE.markMessageRead(msg.id, !msg.read);
                    msg.read = !msg.read;
                    updateMessageBadge();
                    renderPanel();
                } catch (err) {
                    toast('Грешка при обновяване.', 'error');
                }
            });
        });

        panelContent.querySelectorAll('[data-msgdel]').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                const ok = await confirmDialog('Изтриване', 'Да изтрия ли това съобщение?', 'Изтрий');
                if (!ok) return;
                try {
                    await window.MHM_STORE.deleteMessage(btn.dataset.msgdel);
                    toast('Съобщението е изтрито.');
                    await refreshPanel();
                } catch (err) {
                    toast('Грешка при изтриване.', 'error');
                }
            });
        });
    }

    // ---------- users ----------
    function renderUsers() {
        if (!isAdmin()) {
            panelContent.innerHTML = '<div class="data-card"><div class="panel-empty">' +
                '<div class="panel-empty-icon">🔒</div><p>Само администратори имат достъп до тази секция.</p></div></div>';
            return;
        }
        const users = state.data.users || [];

        panelContent.innerHTML = '' +
            '<div class="panel-head">' +
                '<div>' +
                    '<h2>Потребители</h2>' +
                    '<p>' + users.length + ' профила с достъп до панела</p>' +
                '</div>' +
                '<div class="panel-actions">' +
                    '<button class="btn btn-primary" id="addUserBtn">+ Нов потребител</button>' +
                '</div>' +
            '</div>' +
            '<div class="data-card"><div class="table-wrap"><table class="data-table">' +
                '<thead><tr>' +
                    '<th>Име</th><th>Потребителско име</th><th>Роля</th>' +
                    '<th>Създаден</th><th>Последен вход</th><th style="text-align:right">Действия</th>' +
                '</tr></thead><tbody>' +
                users.map(function (u) {
                    const isSelf = state.session && state.session.id === u.id;
                    return '<tr>' +
                        '<td><span class="cell-title">' + esc(u.displayName || '—') + '</span>' +
                            (isSelf ? ' <span class="cell-muted">(ти)</span>' : '') + '</td>' +
                        '<td>' + esc(u.username) + '</td>' +
                        '<td>' + (u.role === 'admin'
                            ? '<span class="msg-subject">Администратор</span>'
                            : '<span class="cell-muted">Редактор</span>') + '</td>' +
                        '<td><span class="cell-muted">' + fmtDate(u.createdAt) + '</span></td>' +
                        '<td><span class="cell-muted">' + fmtDate(u.lastLogin) + '</span></td>' +
                        '<td><div class="row-actions">' +
                            '<button class="icon-btn" title="Редактирай" data-edituser="' + esc(u.id) + '">✏️</button>' +
                            (isSelf ? '' : '<button class="icon-btn danger" title="Изтрий" data-deluser="' + esc(u.id) + '">🗑️</button>') +
                        '</div></td>' +
                    '</tr>';
                }).join('') +
                '</tbody></table></div></div>';

        const addBtn = document.getElementById('addUserBtn');
        if (addBtn) addBtn.addEventListener('click', function () { openEntityForm('users', null); });

        panelContent.querySelectorAll('[data-edituser]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const user = users.find(function (u) { return u.id === btn.dataset.edituser; });
                if (user) openEntityForm('users', user);
            });
        });

        panelContent.querySelectorAll('[data-deluser]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const user = users.find(function (u) { return u.id === btn.dataset.deluser; });
                if (user) removeUser(user.id, user.displayName || user.username);
            });
        });
    }

    // ---------- academy settings ----------
    function renderAcademySettings() {
        const s = state.data.academySettings || {};

        const fieldsHTML = ACADEMY_SETTINGS_FIELDS.map(function (f) {
            return renderField(f, s[f.key]);
        }).join('');

        panelContent.innerHTML = '' +
            '<div class="panel-head">' +
                '<div>' +
                    '<h2>Академия — настройки</h2>' +
                    '<p>Заглавие, въведение и текстове на страницата.</p>' +
                '</div>' +
                '<div class="panel-actions">' +
                    '<a href="index.html#academy" target="_blank" rel="noopener" class="btn btn-outline">Виж страницата</a>' +
                '</div>' +
            '</div>' +
            '<div class="data-card" style="padding:24px;max-width:820px">' +
                '<form id="academySettingsForm" class="form-grid" autocomplete="off">' +
                    fieldsHTML +
                    '<div class="form-error" id="academySettingsError" hidden></div>' +
                    '<div class="span-2" style="display:flex;gap:10px;margin-top:8px">' +
                        '<button type="submit" class="btn btn-primary">Запази промените</button>' +
                        '<button type="button" class="btn btn-outline" id="academySettingsReset">Отмени</button>' +
                    '</div>' +
                '</form>' +
            '</div>';

        const form = document.getElementById('academySettingsForm');
        const errorBox = document.getElementById('academySettingsError');

        document.getElementById('academySettingsReset').addEventListener('click', function () {
            renderAcademySettings();
        });

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errorBox.hidden = true;

            let data;
            try {
                data = collectForm(form, ACADEMY_SETTINGS_FIELDS, 'academySettings', true);
            } catch (err) {
                errorBox.hidden = false;
                errorBox.textContent = err.message;
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            const original = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Запазване...';

            try {
                await window.MHM_STORE.saveAcademySettings(data);
                state.data.academySettings = Object.assign({}, s, data);
                toast('Настройките са запазени.');
                renderAcademySettings();
            } catch (err) {
                errorBox.hidden = false;
                errorBox.textContent = err.message || 'Грешка при запазване.';
                btn.disabled = false;
                btn.textContent = original;
            }
        });
    }

    // ---------- account ----------
    function renderAccount() {
        const s = state.session;
        panelContent.innerHTML = '' +
            '<div class="panel-head">' +
                '<div><h2>Моят профил</h2><p>Данни за твоя акаунт и смяна на паролата.</p></div>' +
            '</div>' +

            '<div class="data-card" style="padding:24px;margin-bottom:20px">' +
                '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">' +
                    '<div class="topbar-avatar" style="width:56px;height:56px;font-size:1.3rem">' +
                        esc((s.displayName || 'A').charAt(0).toUpperCase()) + '</div>' +
                    '<div>' +
                        '<div class="cell-title" style="font-size:1.1rem">' + esc(s.displayName) + '</div>' +
                        '<div class="cell-muted">@' + esc(s.username) + ' · ' +
                            (s.role === 'admin' ? 'Администратор' : 'Редактор') + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="data-card" style="padding:24px;max-width:520px">' +
                '<h3 style="font-family:Montserrat,sans-serif;font-size:1.05rem;margin-bottom:16px">Смяна на парола</h3>' +
                '<form id="passForm" autocomplete="off">' +
                    '<div class="form-group">' +
                        '<label for="curPass">Текуща парола</label>' +
                        '<input type="password" id="curPass" required autocomplete="current-password">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="newPass">Нова парола</label>' +
                        '<input type="password" id="newPass" required minlength="6" autocomplete="new-password">' +
                        '<span class="field-hint">Минимум 6 символа</span>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label for="newPass2">Повтори новата парола</label>' +
                        '<input type="password" id="newPass2" required minlength="6" autocomplete="new-password">' +
                    '</div>' +
                    '<div class="form-error" id="passError" hidden></div>' +
                    '<button type="submit" class="btn btn-primary">Смени паролата</button>' +
                '</form>' +
            '</div>';

        const form = document.getElementById('passForm');
        const errorBox = document.getElementById('passError');

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errorBox.hidden = true;
            const cur = document.getElementById('curPass').value;
            const p1 = document.getElementById('newPass').value;
            const p2 = document.getElementById('newPass2').value;

            if (p1 !== p2) {
                errorBox.hidden = false;
                errorBox.textContent = 'Новите пароли не съвпадат.';
                return;
            }
            try {
                await window.MHM_AUTH.changeOwnPassword(state.session.id, cur, p1);
                toast('Паролата е сменена успешно.');
                form.reset();
            } catch (err) {
                errorBox.hidden = false;
                errorBox.textContent = err.message || 'Грешка при смяна на паролата.';
            }
        });
    }

    // ============================================
    // Session / views
    // ============================================
    function applySessionUI() {
        const s = state.session;
        userNameEl.textContent = s.displayName || s.username;
        userRoleEl.textContent = s.role === 'admin' ? 'Администратор' : 'Редактор';
        userAvatarEl.textContent = (s.displayName || s.username || 'A').charAt(0).toUpperCase();

        sidebarNav.querySelectorAll('[data-admin-only]').forEach(function (el) {
            el.hidden = s.role !== 'admin';
        });
    }

    function showAdmin(session) {
        state.session = session;
        loginView.hidden = true;
        adminView.hidden = false;
        applySessionUI();
        loadAll().then(function () {
            setPanel('dashboard');
        });
    }

    function showLogin() {
        state.session = null;
        adminView.hidden = true;
        loginView.hidden = false;
        loginError.hidden = true;
        loginForm.reset();
    }

    // ============================================
    // Events
    // ============================================
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        loginError.hidden = true;

        if (!window.MHM_AUTH) {
            loginError.hidden = false;
            loginError.textContent = 'Няма връзка с базата данни. Презаредете страницата.';
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Проверка...';

        const username = document.getElementById('loginUser').value;
        const password = document.getElementById('loginPass').value;

        try {
            const result = await window.MHM_AUTH.login(username, password);
            if (!result.ok) {
                loginError.hidden = false;
                loginError.textContent = result.error;
                loginBtn.disabled = false;
                loginBtn.textContent = 'Влез';
                return;
            }

            loginBtn.textContent = 'Зареждане...';

            // Import the seed content on the very first run
            try {
                const seeded = await window.MHM_STORE.seedAll();
                const any = seeded && Object.keys(seeded).some(function (k) { return seeded[k]; });
                if (any) toast('Началното съдържание е импортирано в базата.');
            } catch (err) {
                console.warn('Seed failed', err);
            }

            showAdmin(result.session);
        } catch (err) {
            loginError.hidden = false;
            loginError.textContent = err.message || 'Възникна неочаквана грешка.';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Влез';
            return;
        }

        loginBtn.disabled = false;
        loginBtn.textContent = 'Влез';
    });

    togglePass.addEventListener('click', function () {
        const input = document.getElementById('loginPass');
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        this.textContent = isPass ? '🙈' : '👁';
    });

    logoutBtn.addEventListener('click', function () {
        window.MHM_AUTH.logout();
        showLogin();
        toast('Излязохте от панела.');
    });

    sidebarNav.addEventListener('click', function (e) {
        const btn = e.target.closest('.sidebar-link');
        if (!btn) return;
        if (btn.hidden) return;
        setPanel(btn.dataset.panel);
    });

    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
    });

    // ============================================
    // Init
    // ============================================
    function init() {
        if (!window.MHM || !window.MHM_STORE || !window.MHM_AUTH) {
            loginError.hidden = false;
            loginError.textContent = 'Няма връзка с базата данни. Проверете интернет връзката и презаредете страницата.';
            loginBtn.disabled = true;
            return;
        }

        const session = window.MHM_AUTH.getSession();
        if (session) {
            showAdmin(session);
        } else {
            showLogin();
        }
    }

    if (window.MHM) {
        init();
    } else {
        window.addEventListener('mhm:ready', init, { once: true });
        // Safety net: if Firebase could not load, show a clear message
        setTimeout(function () {
            if (!window.MHM) init();
        }, 5000);
    }

})();
