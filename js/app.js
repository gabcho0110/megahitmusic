// ============================================
// MEGA HIT MUSIC - Public site logic
// ============================================

document.addEventListener('DOMContentLoaded', function () {

    // ============================================
    // Navigation
    // ============================================
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.getElementById('navbar');

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // ============================================
    // Page routing
    // ============================================
    function navigateToPage(pageName) {
        document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
        const target = document.getElementById('page-' + pageName);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
        const activeLink = document.querySelector('.nav-link[data-page="' + pageName + '"]');
        if (activeLink) activeLink.classList.add('active');

        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.addEventListener('click', function (e) {
        const academyEl = e.target.closest('[data-academy-tab]');
        if (academyEl) {
            e.preventDefault();
            navigateToPage('academy');
            setAcademyTab(academyEl.dataset.academyTab);
            return;
        }
        const pageEl = e.target.closest('[data-page]');
        if (pageEl) {
            e.preventDefault();
            navigateToPage(pageEl.dataset.page);
            return;
        }
        const eventEl = e.target.closest('[data-event]');
        if (eventEl) {
            e.preventDefault();
            navigateToPage('events');
            selectEvent(eventEl.dataset.event);
            return;
        }
        const fileEl = e.target.closest('[data-file]');
        if (fileEl) {
            e.preventDefault();
            downloadActivityFile(fileEl);
            return;
        }
    });

    // ============================================
    // Helpers
    // ============================================
    function esc(str) {
        return String(str === undefined || str === null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDate(dateStr) {
        const months = ['януари', 'февруари', 'март', 'април', 'май', 'юни',
            'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return esc(dateStr || '');
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    // ============================================
    // Artists
    // ============================================
    function renderArtistsPreview(artists) {
        const container = document.getElementById('artistsPreview');
        if (!container) return;
        if (!artists.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎤</div><p>Все още няма добавени изпълнители.</p></div>';
            return;
        }
        container.innerHTML = artists.map(function (a) {
            return '' +
                '<div class="artist-card">' +
                    '<div class="artist-avatar"><span>' + esc(a.emoji || '🎤') + '</span></div>' +
                    '<div class="artist-info">' +
                        '<div class="artist-name">' + esc(a.name) + '</div>' +
                        '<div class="artist-role">' + esc(a.role || '') + '</div>' +
                        '<p class="artist-bio-short">' + esc(a.shortBio || '') + '</p>' +
                        '<a href="#artists" class="artist-link" data-page="artists">Виж повече &#8594;</a>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function renderArtistsFull(artists) {
        const container = document.getElementById('artistsContainer');
        if (!container) return;
        if (!artists.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎤</div><p>Все още няма добавени изпълнители.</p></div>';
            return;
        }
        container.innerHTML = artists.map(function (a) {
            const bio = Array.isArray(a.bio) ? a.bio : (a.bio ? [a.bio] : []);
            const highlights = Array.isArray(a.highlights) ? a.highlights : (a.highlights ? [a.highlights] : []);
            return '' +
                '<div class="artist-full">' +
                    '<div class="artist-full-header">' +
                        '<div class="artist-full-avatar"><span>' + esc(a.emoji || '🎤') + '</span></div>' +
                        '<div class="artist-full-title">' +
                            '<h2>' + esc(a.name) + '</h2>' +
                            '<span class="artist-role-tag">' + esc(a.role || '') + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="artist-full-body">' +
                        bio.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
                        (highlights.length
                            ? '<h3>Ключови моменти:</h3><ul class="artist-highlights">' +
                              highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') +
                              '</ul>'
                            : '') +
                    '</div>' +
                '</div>';
        }).join('');
    }

    // ============================================
    // Singles
    // ============================================
    function renderSingles(singles) {
        const container = document.getElementById('singlesContainer');
        if (!container) return;
        if (!singles.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>Все още няма публикувани сингли.</p></div>';
            return;
        }
        container.innerHTML = singles.map(function (s) {
            const title = s.link
                ? '<a href="' + esc(s.link) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>'
                : esc(s.title);
            return '' +
                '<div class="single-card">' +
                    '<div class="single-cover"><span>' + esc(s.emoji || '🎵') + '</span></div>' +
                    '<div class="single-info">' +
                        '<div class="single-title">' + title + '</div>' +
                        '<div class="single-artist">' + esc(s.artist || '') + '</div>' +
                        (s.description ? '<p class="single-desc">' + esc(s.description) + '</p>' : '') +
                        '<div class="single-year">' + esc(s.year || '') + '</div>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    // ============================================
    // Events
    // ============================================
    function renderEventsPreview(events) {
        const container = document.getElementById('eventsPreview');
        if (!container) return;
        const list = events.slice(0, 3);
        if (!list.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎪</div><p>Все още няма добавени събития.</p></div>';
            return;
        }
        container.innerHTML = list.map(function (ev) {
            return '' +
                '<div class="event-card" data-event="' + esc(ev.id) + '">' +
                    '<div class="event-card-tag">' + esc(ev.tag || 'Събитие') + '</div>' +
                    '<div class="event-card-icon">' + esc(ev.emoji || '🎪') + '</div>' +
                    '<h3>' + esc(ev.title) + '</h3>' +
                    '<p class="event-card-desc">' + esc(ev.organizers || '') + '</p>' +
                    '<div class="event-card-date"><span>&#128197;</span> ' + esc(ev.date || '') + '</div>' +
                    '<a href="#events" class="event-card-link" data-event="' + esc(ev.id) + '">Виж повече &#8594;</a>' +
                '</div>';
        }).join('');
    }

    function renderEventsPage(events) {
        const tabsEl = document.getElementById('eventTabs');
        const detailsEl = document.getElementById('eventDetails');
        if (!tabsEl || !detailsEl) return;

        if (!events.length) {
            tabsEl.innerHTML = '';
            detailsEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎪</div><p>Все още няма добавени събития.</p></div>';
            return;
        }

        tabsEl.innerHTML = events.map(function (ev, i) {
            return '<button class="event-tab' + (i === 0 ? ' active' : '') +
                '" data-event-tab="' + esc(ev.id) + '">' + esc(ev.tabLabel || ev.title) + '</button>';
        }).join('');

        detailsEl.innerHTML = events.map(function (ev, i) {
            let juryHTML = '';
            if (ev.showJury) {
                juryHTML = '' +
                    '<h3>🧑‍⚖️ Жури</h3>' +
                    '<div class="jury-grid">' +
                        JURY_DATA.map(function (j) {
                            return '' +
                                '<div class="jury-card">' +
                                    '<div class="jury-header">' +
                                        '<div class="jury-avatar">' + esc(j.emoji) + '</div>' +
                                        '<div>' +
                                            '<div class="jury-name">' + esc(j.name) + '</div>' +
                                            '<div class="jury-role">' + esc(j.role) + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="jury-bio"><p>' + esc(j.bio) + '</p></div>' +
                                '</div>';
                        }).join('') +
                    '</div>' +
                    '<p>📌 Членове на журито не оценяват свои ученици. В такъв случай оценката се удвоява от председателя или друг член.</p>';
            }

            return '' +
                '<div class="event-detail' + (i === 0 ? ' active' : '') + '" id="event-' + esc(ev.id) + '">' +
                    '<h2>' + esc(ev.title) + '</h2>' +
                    (ev.organizers ? '<p><strong>Организатори:</strong> ' + esc(ev.organizers) + '</p>' : '') +
                    '<div class="event-content">' + (ev.content || '') + '</div>' +
                    (ev.formLink
                        ? '<div class="event-cta"><a href="' + esc(ev.formLink) + '" target="_blank" rel="noopener" class="event-form-link">📥 Форма за записване</a></div>'
                        : '') +
                    (ev.bankAccount
                        ? '<div class="bank-info">💳 Банкова сметка: ' + esc(ev.bankAccount) + '</div>'
                        : '') +
                    juryHTML +
                '</div>';
        }).join('');

        tabsEl.querySelectorAll('.event-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                selectEvent(this.dataset.eventTab);
            });
        });
    }

    function selectEvent(eventKey) {
        const tabsEl = document.getElementById('eventTabs');
        if (!tabsEl) return;
        tabsEl.querySelectorAll('.event-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.event-detail').forEach(function (d) { d.classList.remove('active'); });

        const tab = tabsEl.querySelector('[data-event-tab="' + eventKey + '"]');
        const detail = document.getElementById('event-' + eventKey);
        if (tab) tab.classList.add('active');
        if (detail) detail.classList.add('active');
    }

    // ============================================
    // News
    // ============================================
    function renderNews(news) {
        const container = document.getElementById('newsContainer');
        if (!container) return;
        if (!news.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📰</div><p>Все още няма публикувани новини.</p></div>';
            return;
        }
        container.innerHTML = news.map(function (item) {
            const title = item.link
                ? '<a href="' + esc(item.link) + '" target="_blank" rel="noopener">' + esc(item.title) + '</a>'
                : esc(item.title);
            return '' +
                '<div class="news-card">' +
                    '<div class="news-image"><span>' + esc(item.emoji || '📰') + '</span></div>' +
                    '<div class="news-content">' +
                        '<div class="news-date">' + formatDate(item.date) + '</div>' +
                        '<div class="news-title">' + title + '</div>' +
                        '<p class="news-excerpt">' + esc(item.excerpt || '') + '</p>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    // ============================================
    // Extracurricular activities
    // ============================================
    function fileIcon(name) {
        const ext = String(name || '').split('.').pop().toLowerCase();
        if (ext === 'pdf') return '📄';
        if (ext === 'ppt' || ext === 'pptx' || ext === 'pps' || ext === 'ppsx') return '📊';
        if (ext === 'doc' || ext === 'docx' || ext === 'rtf') return '📝';
        if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return '📈';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].indexOf(ext) >= 0) return '🖼️';
        if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv') return '🎬';
        return '📎';
    }

    function formatBytes(bytes) {
        const n = Number(bytes) || 0;
        if (!n) return '';
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
        return (n / (1024 * 1024)).toFixed(1).replace(/\.0$/, '') + ' MB';
    }

    function dataUrlToBlob(dataUrl) {
        const parts = String(dataUrl || '').split(',');
        const match = parts[0].match(/data:([^;]+)/);
        const mime = match ? match[1] : 'application/octet-stream';
        const binary = atob(parts[1] || '');
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mime });
    }

    async function downloadActivityFile(btn) {
        const fileId = btn.dataset.file;
        const fallbackName = btn.dataset.filename || 'presentation';
        if (!fileId || !window.MHM_STORE) return;

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.classList.add('loading');
        btn.innerHTML = '<span class="file-chip-icon">⏳</span> Зареждане…';

        try {
            const record = await window.MHM_STORE.getActivityFile(fileId);
            const blob = dataUrlToBlob(record.data);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = record.name || fallbackName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
        } catch (err) {
            console.error(err);
            alert(err && err.message ? err.message : 'Файлът не може да бъде изтеглен.');
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
            btn.innerHTML = originalHTML;
        }
    }

    function activityMetaRow(label, value) {
        if (!value) return '';
        return '<div class="activity-meta-item">' +
            '<span class="activity-meta-label">' + esc(label) + '</span>' +
            '<span class="activity-meta-value">' + esc(value) + '</span>' +
            '</div>';
    }

    function renderActivities(activities) {
        const container = document.getElementById('activitiesContainer');
        if (!container) return;

        if (!activities || !activities.length) {
            container.innerHTML = '<div class="empty-state">' +
                '<div class="empty-state-icon">🎭</div>' +
                '<p>Все още няма публикувани извънкласни дейности.</p>' +
                '</div>';
            return;
        }

        container.innerHTML = activities.map(function (a) {
            const files = Array.isArray(a.files) ? a.files : [];
            const filesHTML = files.length
                ? '<div class="activity-files">' +
                    '<span class="activity-files-label">Презентации</span>' +
                    '<div class="activity-files-list">' +
                    files.map(function (f) {
                        const size = formatBytes(f.size);
                        return '<button type="button" class="file-chip" data-file="' + esc(f.id) + '"' +
                            ' data-filename="' + esc(f.name || 'file') + '"' +
                            ' title="Изтегли ' + esc(f.name || '') + '">' +
                            '<span class="file-chip-icon">' + fileIcon(f.name) + '</span>' +
                            '<span class="file-chip-name">' + esc(f.name || 'файл') + '</span>' +
                            (size ? '<span class="file-chip-size">' + esc(size) + '</span>' : '') +
                            '<span class="file-chip-dl">↓</span>' +
                            '</button>';
                    }).join('') +
                    '</div></div>'
                : '';

            const linkHTML = a.link
                ? '<a class="btn btn-outline btn-sm activity-link" href="' + esc(a.link) +
                    '" target="_blank" rel="noopener">🔗 Отвори материалите</a>'
                : '';

            return '' +
                '<article class="activity-card">' +
                    '<div class="activity-head">' +
                        '<div class="activity-emoji">' + esc(a.emoji || '🎭') + '</div>' +
                        '<div class="activity-head-text">' +
                            (a.date ? '<div class="activity-date">' + formatDate(a.date) + '</div>' : '') +
                            '<h3 class="activity-title">' + esc(a.title || '') + '</h3>' +
                        '</div>' +
                    '</div>' +
                    (a.description ? '<p class="activity-desc">' + esc(a.description) + '</p>' : '') +
                    '<div class="activity-meta">' +
                        activityMetaRow('Организатор', a.organizer) +
                        activityMetaRow('Участници', a.participants) +
                        activityMetaRow('Място', a.location) +
                    '</div>' +
                    filesHTML +
                    (linkHTML ? '<div class="activity-actions">' + linkHTML + '</div>' : '') +
                '</article>';
        }).join('');
    }

    // ============================================
    // Academy
    // ============================================
    function renderAcademy(settings, courses, plans) {
        const s = settings || {};

        const set = function (id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value || '';
        };

        set('academyTitle', s.title);
        set('academySubtitle', s.subtitle);
        set('academyIntro', s.intro);
        set('academyCtaTitle', s.ctaTitle);
        set('academyCtaText', s.ctaText);
        set('academyNote', s.note);

        const emojiEl = document.getElementById('academyEmoji');
        if (emojiEl) emojiEl.textContent = s.emoji || '🎓';

        const descEl = document.getElementById('academyDescription');
        if (descEl) descEl.innerHTML = s.description || '';

        const phoneEl = document.getElementById('academyPhone');
        if (phoneEl && s.phone) {
            phoneEl.textContent = s.phone;
            phoneEl.href = 'tel:' + String(s.phone).replace(/[^0-9+]/g, '');
        }
        const emailEl = document.getElementById('academyEmail');
        if (emailEl && s.email) {
            emailEl.textContent = s.email;
            emailEl.href = 'mailto:' + s.email;
        }

        const coursesEl = document.getElementById('academyCourses');
        if (coursesEl) {
            if (!courses || !courses.length) {
                coursesEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎓</div><p>Все още няма добавени дисциплини.</p></div>';
            } else {
                coursesEl.innerHTML = courses.map(function (c) {
                    return '' +
                        '<div class="course-card">' +
                            '<div class="course-emoji">' + esc(c.emoji || '🎵') + '</div>' +
                            '<div class="course-title">' + esc(c.title) + '</div>' +
                            '<p class="course-desc">' + esc(c.description || '') + '</p>' +
                            '<div class="course-meta">' +
                                (c.age ? '<span class="course-tag">' + esc(c.age) + '</span>' : '') +
                                (c.duration ? '<span class="course-tag">' + esc(c.duration) + '</span>' : '') +
                            '</div>' +
                        '</div>';
                }).join('');
            }
        }

        const plansEl = document.getElementById('academyPlans');
        if (plansEl) {
            if (!plans || !plans.length) {
                plansEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💳</div><p>Все още няма добавени цени.</p></div>';
            } else {
                plansEl.innerHTML = plans.map(function (p) {
                    const features = Array.isArray(p.features) ? p.features : (p.features ? [p.features] : []);
                    return '' +
                        '<div class="pricing-card' + (p.featured ? ' pricing-featured' : '') + '">' +
                            (p.badge ? '<div class="pricing-badge">' + esc(p.badge) + '</div>' : '') +
                            '<div class="pricing-header">' +
                                '<h3>' + esc(p.name) + '</h3>' +
                                '<div class="pricing-price">' + esc(p.price || '') + '</div>' +
                                (p.period ? '<div class="pricing-period">' + esc(p.period) + '</div>' : '') +
                            '</div>' +
                            (p.description ? '<p class="pricing-desc">' + esc(p.description) + '</p>' : '') +
                            '<ul class="pricing-features">' +
                                features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') +
                            '</ul>' +
                            '<a href="#contact" class="btn ' + (p.featured ? 'btn-primary' : 'btn-outline') +
                                '" data-page="contact">Запиши се</a>' +
                        '</div>';
                }).join('');
            }
        }
    }

    function setAcademyTab(tab) {
        const name = tab === 'prices' ? 'prices' : 'home';
        document.querySelectorAll('.academy-tab').forEach(function (b) {
            b.classList.toggle('active', b.dataset.academyTab === name);
        });
        document.querySelectorAll('.academy-view').forEach(function (v) {
            v.classList.remove('active');
        });
        const view = document.getElementById('academy-' + name);
        if (view) view.classList.add('active');

        const crumb = document.getElementById('academyCrumb');
        if (crumb) crumb.textContent = name === 'prices' ? 'Цени' : 'Начална страница';

        if (window.history && window.history.replaceState) {
            history.replaceState(null, '', name === 'prices' ? '#academy-prices' : '#academy');
        }
    }

    // ============================================
    // First paint from static data (instant)
    // ============================================
    const staticArtists = ARTISTS_DATA.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    renderArtistsPreview(staticArtists);
    renderArtistsFull(staticArtists);
    renderSingles(SINGLES_DATA);
    renderEventsPreview(EVENTS_DATA);
    renderEventsPage(EVENTS_DATA);
    renderNews(NEWS_DATA);
    renderActivities(ACTIVITIES_DATA);
    renderAcademy(ACADEMY_SETTINGS, ACADEMY_COURSES, ACADEMY_PLANS);

    // ============================================
    // Then refresh from Firebase
    // ============================================
    async function refreshFromDatabase() {
        if (!window.MHM_STORE || !window.MHM_STORE.hasDB()) return;
        try {
            const results = await Promise.all([
                window.MHM_STORE.getArtists(),
                window.MHM_STORE.getSingles(),
                window.MHM_STORE.getEvents(),
                window.MHM_STORE.getNews(),
                window.MHM_STORE.getAcademySettings(),
                window.MHM_STORE.getAcademyCourses(),
                window.MHM_STORE.getAcademyPlans(),
                window.MHM_STORE.getActivities()
            ]);
            renderArtistsPreview(results[0]);
            renderArtistsFull(results[0]);
            renderSingles(results[1]);
            renderEventsPreview(results[2]);
            renderEventsPage(results[2]);
            renderNews(results[3]);
            renderAcademy(results[4], results[5], results[6]);
            renderActivities(results[7]);
        } catch (err) {
            console.warn('Неуспешно зареждане от базата, използвам локални данни.', err);
        }
    }

    if (window.MHM) refreshFromDatabase();
    else window.addEventListener('mhm:ready', refreshFromDatabase, { once: true });

    // ============================================
    // Contact form
    // ============================================
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formMessage = document.getElementById('formMessage');
            const formData = {
                name: document.getElementById('cf-name').value.trim(),
                email: document.getElementById('cf-email').value.trim(),
                phone: document.getElementById('cf-phone').value.trim(),
                subject: document.getElementById('cf-subject').value,
                message: document.getElementById('cf-message').value.trim(),
                read: false,
                timestamp: new Date().toISOString()
            };

            formMessage.className = 'form-message';
            formMessage.style.display = 'block';
            formMessage.textContent = 'Изпращане...';

            if (window.MHM_STORE && window.MHM_STORE.hasDB()) {
                window.MHM_STORE.addMessage(formData)
                    .then(function () {
                        formMessage.className = 'form-message success';
                        formMessage.textContent = '✓ Съобщението е изпратено успешно! Ще се свържем с вас скоро.';
                        contactForm.reset();
                    })
                    .catch(function (error) {
                        console.error(error);
                        formMessage.className = 'form-message error';
                        formMessage.textContent = '✕ Възникна грешка. Моля, пишете ни на office.megahit.music@gmail.com';
                    });
            } else {
                const subject = encodeURIComponent('Съобщение от ' + formData.name);
                const body = encodeURIComponent(
                    'Име: ' + formData.name + '\n' +
                    'Имейл: ' + formData.email + '\n' +
                    'Телефон: ' + formData.phone + '\n\n' + formData.message
                );
                window.location.href = 'mailto:office.megahit.music@gmail.com?subject=' + subject + '&body=' + body;
                formMessage.className = 'form-message success';
                formMessage.textContent = '✓ Отваряме имейл клиента ви...';
            }

            setTimeout(function () { formMessage.style.display = 'none'; }, 6000);
        });
    }

    // ============================================
    // Deep links
    // ============================================
    function handleHash() {
        const hash = (window.location.hash || '').replace('#', '');
        if (!hash) return;
        if (hash === 'privacy') { navigateToPage('privacy'); return; }
        if (hash === 'academy-prices') {
            navigateToPage('academy');
            setAcademyTab('prices');
            return;
        }
        if (hash === 'academy') {
            navigateToPage('academy');
            setAcademyTab('home');
            return;
        }
        if (hash.indexOf('event-') === 0) {
            navigateToPage('events');
            selectEvent(hash.replace('event-', ''));
            return;
        }
        if (document.getElementById('page-' + hash)) navigateToPage(hash);
    }
    handleHash();
    window.addEventListener('hashchange', handleHash);
});
