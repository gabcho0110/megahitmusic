// ============================================
// MEGA HIT MUSIC - Main Application Logic
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // ============================================
    // Navigation
    // ============================================
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.getElementById('navbar');

    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ============================================
    // Page Navigation System
    // ============================================
    function navigateToPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        // Show target page
        const targetPage = document.getElementById('page-' + pageName);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector('[data-page="' + pageName + '"]');
        if (activeLink) {
            activeLink.classList.add('active');
        }
        // Close mobile menu
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle all navigation clicks
    document.addEventListener('click', function(e) {
        // Page navigation
        if (e.target.dataset.page) {
            e.preventDefault();
            navigateToPage(e.target.dataset.page);
        }
        // Event navigation
        if (e.target.dataset.event) {
            e.preventDefault();
            navigateToPage('events');
            selectEvent(e.target.dataset.event);
        }
    });

    // ============================================
    // Render Artists
    // ============================================
    function renderArtistsPreview() {
        const container = document.getElementById('artistsPreview');
        if (!container) return;
        container.innerHTML = ARTISTS_DATA.map(artist => `
            <div class="artist-card" data-artist-id="${artist.id}">
                <div class="artist-avatar">
                    <span>${artist.emoji}</span>
                </div>
                <div class="artist-info">
                    <div class="artist-name">${artist.name}</div>
                    <div class="artist-role">${artist.role}</div>
                    <p class="artist-bio-short">${artist.shortBio}</p>
                    <a href="#artists" class="artist-link" data-page="artists">Виж повече &#8594;</a>
                </div>
            </div>
        `).join('');
    }

    function renderArtistsFull() {
        const container = document.getElementById('artistsContainer');
        if (!container) return;
        container.innerHTML = ARTISTS_DATA.map(artist => `
            <div class="artist-full" id="${artist.id}">
                <div class="artist-full-header">
                    <div class="artist-full-avatar">
                        <span>${artist.emoji}</span>
                    </div>
                    <div class="artist-full-title">
                        <h2>${artist.name}</h2>
                        <span class="artist-role-tag">${artist.role}</span>
                    </div>
                </div>
                <div class="artist-full-body">
                    ${artist.bio.map(p => '<p>' + p + '</p>').join('')}
                    <h3>Ключови моменти:</h3>
                    <ul class="artist-highlights">
                        ${artist.highlights.map(h => '<li>' + h + '</li>').join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // Render Singles
    // ============================================
    function renderSingles() {
        const container = document.getElementById('singlesContainer');
        if (!container) return;

        // Try Firebase first
        if (window.firebaseDB && window.firebaseGet) {
            window.firebaseGet(window.firebaseRef(window.firebaseDB, 'singles'))
                .then(snapshot => {
                    if (snapshot.exists()) {
                        const firebaseSingles = Object.values(snapshot.val());
                        renderSinglesFromData([...firebaseSingles, ...SINGLES_DATA]);
                    } else {
                        renderSinglesFromData(SINGLES_DATA);
                    }
                })
                .catch(() => {
                    renderSinglesFromData(SINGLES_DATA);
                });
        } else {
            renderSinglesFromData(SINGLES_DATA);
        }
    }

    function renderSinglesFromData(singles) {
        const container = document.getElementById('singlesContainer');
        if (!container) return;
        if (singles.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>Все още няма публикувани сингли.</p></div>';
            return;
        }
        container.innerHTML = singles.map(single => `
            <div class="single-card">
                <div class="single-cover">
                    <span>${single.emoji || '🎵'}</span>
                </div>
                <div class="single-info">
                    <div class="single-title">${single.title}</div>
                    <div class="single-artist">${single.artist}</div>
                    <div class="single-year">${single.year || ''}</div>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // Render Events
    // ============================================
    function renderEvents() {
        Object.keys(EVENTS_DATA).forEach(eventKey => {
            const container = document.getElementById('event-' + eventKey);
            if (!container) return;
            const event = EVENTS_DATA[eventKey];

            let juryHTML = '';
            if (eventKey === 'magic-bulgaria' || eventKey === 'magic-folklore') {
                juryHTML = `
                    <h3>🧑‍⚖️ Жури</h3>
                    <div class="jury-grid">
                        ${JURY_DATA.map(j => `
                            <div class="jury-card">
                                <div class="jury-header">
                                    <div class="jury-avatar">${j.emoji}</div>
                                    <div>
                                        <div class="jury-name">${j.name}</div>
                                        <div class="jury-role">${j.role}</div>
                                    </div>
                                </div>
                                <div class="jury-bio">
                                    <p>${j.bio}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <p>📌 Членове на журито не оценяват свои ученици. В такъв случай оценката се удвоява от председателя или друг член.</p>
                `;
            }

            container.innerHTML = `
                <h2>${event.title}</h2>
                <p><strong>Организатори:</strong> ${event.organizers}</p>
                ${event.content}
                ${juryHTML}
            `;
        });
    }

    // Event tab switching
    function selectEvent(eventKey) {
        document.querySelectorAll('.event-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.event-detail').forEach(d => d.classList.remove('active'));
        const tab = document.querySelector('[data-event-tab="' + eventKey + '"]');
        const detail = document.getElementById('event-' + eventKey);
        if (tab) tab.classList.add('active');
        if (detail) detail.classList.add('active');
    }

    document.querySelectorAll('.event-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            selectEvent(this.dataset.eventTab);
        });
    });

    // ============================================
    // Render News
    // ============================================
    function renderNews() {
        const container = document.getElementById('newsContainer');
        if (!container) return;

        // Try Firebase first
        if (window.firebaseDB && window.firebaseGet) {
            window.firebaseGet(window.firebaseRef(window.firebaseDB, 'news'))
                .then(snapshot => {
                    if (snapshot.exists()) {
                        const firebaseNews = Object.values(snapshot.val());
                        renderNewsFromData([...firebaseNews, ...NEWS_DATA].sort((a, b) => new Date(b.date) - new Date(a.date)));
                    } else {
                        renderNewsFromData(NEWS_DATA);
                    }
                })
                .catch(() => {
                    renderNewsFromData(NEWS_DATA);
                });
        } else {
            renderNewsFromData(NEWS_DATA);
        }
    }

    function renderNewsFromData(news) {
        const container = document.getElementById('newsContainer');
        if (!container) return;
        if (news.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📰</div><p>Все още няма публикувани новини.</p></div>';
            return;
        }
        container.innerHTML = news.map(item => `
            <div class="news-card">
                <div class="news-image">
                    <span>${item.emoji || '📰'}</span>
                </div>
                <div class="news-content">
                    <div class="news-date">${formatDate(item.date)}</div>
                    <div class="news-title">${item.title}</div>
                    <p class="news-excerpt">${item.excerpt}</p>
                </div>
            </div>
        `).join('');
    }

    function formatDate(dateStr) {
        const months = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
        const d = new Date(dateStr);
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    // ============================================
    // Contact Form - Firebase Integration
    // ============================================
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formMessage = document.getElementById('formMessage');
            const formData = {
                name: document.getElementById('cf-name').value,
                email: document.getElementById('cf-email').value,
                phone: document.getElementById('cf-phone').value,
                subject: document.getElementById('cf-subject').value,
                message: document.getElementById('cf-message').value,
                timestamp: new Date().toISOString()
            };

            // Show loading
            formMessage.className = 'form-message';
            formMessage.textContent = 'Изпращане...';
            formMessage.style.display = 'block';

            // Save to Firebase
            if (window.firebaseDB && window.firebasePush && window.firebaseRef) {
                const messagesRef = window.firebaseRef(window.firebaseDB, 'messages');
                window.firebasePush(messagesRef, formData)
                    .then(() => {
                        formMessage.className = 'form-message success';
                        formMessage.textContent = '✓ Съобщението е изпратено успешно! Ще се свържем с вас скоро.';
                        contactForm.reset();
                    })
                    .catch(error => {
                        console.error('Firebase error:', error);
                        formMessage.className = 'form-message error';
                        formMessage.textContent = '✕ Възникна грешка при изпращането. Моля опитайте отново или ни пишете на имейл.';
                    });
            } else {
                // Fallback - mailto
                const subject = encodeURIComponent('Съобщение от ' + formData.name);
                const body = encodeURIComponent(
                    'Име: ' + formData.name + '\n' +
                    'Имейл: ' + formData.email + '\n' +
                    'Телефон: ' + formData.phone + '\n' +
                    'Относно: ' + formData.subject + '\n\n' +
                    formData.message
                );
                window.location.href = 'mailto:office.megahit.music@gmail.com?subject=' + subject + '&body=' + body;
                formMessage.className = 'form-message success';
                formMessage.textContent = '✓ Отваряме имейл клиента ви...';
            }

            // Hide message after 5 seconds
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        });
    }

    // ============================================
    // Initialize
    // ============================================
    renderArtistsPreview();
    renderArtistsFull();
    renderSingles();
    renderEvents();
    renderNews();

    // Handle URL hash for direct page access
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        if (hash.startsWith('page-')) {
            navigateToPage(hash.replace('page-', ''));
        }
    }
});
