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
    // First paint from static data (instant)
    // ============================================
    const staticArtists = ARTISTS_DATA.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    renderArtistsPreview(staticArtists);
    renderArtistsFull(staticArtists);
    renderSingles(SINGLES_DATA);
    renderEventsPreview(EVENTS_DATA);
    renderEventsPage(EVENTS_DATA);
    renderNews(NEWS_DATA);

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
                window.MHM_STORE.getNews()
            ]);
            renderArtistsPreview(results[0]);
            renderArtistsFull(results[0]);
            renderSingles(results[1]);
            renderEventsPreview(results[2]);
            renderEventsPage(results[2]);
            renderNews(results[3]);
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
