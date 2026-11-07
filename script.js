/**
 * 67B67T — Apple-Inspired Interactive Controller
 * Ultra-lightweight, high frame-rate responsiveness
 */

document.addEventListener('DOMContentLoaded', () => {
    /* --------------------------------------------------------------------------
       0. 2-Second Cinematic Opening Animation Sequence
       -------------------------------------------------------------------------- */
    const introCurtain = document.getElementById('intro-curtain');
    const introFill = document.getElementById('intro-progress-fill');
    const introStatus = document.getElementById('intro-status');

    if (introCurtain && introFill) {
        const introStart = performance.now();
        const introDuration = 1400; // Progress finishes in 1.4s

        function stepIntro(now) {
            const elapsed = now - introStart;
            const pct = Math.min(100, (elapsed / introDuration) * 100);
            introFill.style.width = `${pct}%`;

            if (elapsed > 700 && elapsed < 1200 && introStatus) {
                introStatus.textContent = 'KẾT NỐI MẠNG LƯỚI...';
            } else if (elapsed >= 1200 && introStatus) {
                introStatus.textContent = 'HỆ THỐNG SẴN SÀNG!';
            }

            if (elapsed < introDuration) {
                requestAnimationFrame(stepIntro);
            } else {
                // Curtain dissolves smoothly at ~1.8s, reaching 2s completion
                setTimeout(() => {
                    introCurtain.classList.add('intro-hidden');
                    document.body.classList.remove('loading');
                    setTimeout(() => {
                        introCurtain.remove();
                    }, 700);
                }, 350);
            }
        }

        requestAnimationFrame(stepIntro);
    } else {
        document.body.classList.remove('loading');
    }

    // DOM Elements
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const toastHub = document.getElementById('toast-hub');
    const rulesModal = document.getElementById('rules-modal');
    const btnShowRules = document.getElementById('btn-show-rules');
    const btnCloseModal = document.getElementById('modal-close');
    const btnOkModal = document.getElementById('modal-ok-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const copyIpBtns = document.querySelectorAll('.copy-ip-btn');

    /* --------------------------------------------------------------------------
       1. Apple Dynamic Island Style HUD Toast
       -------------------------------------------------------------------------- */
    function showAppleToast(message) {
        // Clear existing toasts to maintain single Dynamic Island HUD focus
        toastHub.innerHTML = '';

        const toast = document.createElement('div');
        toast.className = 'apple-toast';
        
        const checkIcon = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;

        toast.innerHTML = `${checkIcon}<span>${message}</span>`;
        toastHub.appendChild(toast);

        // Disappear smoothly after 2.8 seconds
        setTimeout(() => {
            toast.classList.add('leaving');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            }, { once: true });
        }, 2800);
    }

    /* --------------------------------------------------------------------------
       2. Tactile Clipboard Copy
       -------------------------------------------------------------------------- */
    async function copyToClipboard(text, feedbackMsg) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const tempTextArea = document.createElement('textarea');
                tempTextArea.value = text;
                tempTextArea.style.position = 'fixed';
                tempTextArea.style.left = '-9999px';
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                document.execCommand('copy');
                tempTextArea.remove();
            }
            showAppleToast(feedbackMsg || `Đã sao chép: ${text}`);
        } catch (err) {
            console.error('Không thể sao chép:', err);
            showAppleToast(`Sao chép: ${text}`);
        }
    }

    // Attach copy events to all copy buttons
    copyIpBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const ip = btn.getAttribute('data-ip') || '67b67t.site';
            
            // Micro-interaction bounce
            btn.style.transform = 'scale(0.96)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 120);

            copyToClipboard(ip, `Đã sao chép IP máy chủ: ${ip}`);
        });
    });

    /* --------------------------------------------------------------------------
       3. Mobile Navigation Menu
       -------------------------------------------------------------------------- */
    function toggleMobileMenu() {
        const isOpen = navMenu.classList.toggle('open');
        mobileToggle.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function closeMobileMenu() {
        if (navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            mobileToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('open') && 
            !navMenu.contains(e.target) && 
            !mobileToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });

    /* --------------------------------------------------------------------------
       4. Active Navigation Observer
       -------------------------------------------------------------------------- */
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === `#${id}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-10% 0px -60% 0px'
    });

    sections.forEach(sec => observer.observe(sec));

    /* --------------------------------------------------------------------------
       5. Rules Sheet Modal
       -------------------------------------------------------------------------- */
    function openRules() {
        rulesModal.classList.add('active');
        rulesModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeRules() {
        rulesModal.classList.remove('active');
        rulesModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (btnShowRules) btnShowRules.addEventListener('click', openRules);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeRules);
    if (btnOkModal) btnOkModal.addEventListener('click', closeRules);
    if (modalOverlay) modalOverlay.addEventListener('click', closeRules);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && rulesModal.classList.contains('active')) {
            closeRules();
        }
    });

    /* --------------------------------------------------------------------------
       6. Interactive Ambient Canvas (Minecraft Void Dust / Starfield)
       -------------------------------------------------------------------------- */
    const canvas = document.getElementById('ambient-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = 0;
        let height = 0;
        let particles = [];
        const particleCount = window.innerWidth < 768 ? 22 : 42;
        const mouse = { x: -1000, y: -1000, radius: 130 };
        let animFrameId = null;

        function resizeCanvas() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        class Particle {
            constructor() {
                this.reset(true);
            }
            reset(randomY = false) {
                this.x = Math.random() * width;
                this.y = randomY ? Math.random() * height : height + 10;
                this.size = Math.random() * 1.8 + 0.8;
                this.speedY = -(Math.random() * 0.45 + 0.15);
                this.speedX = (Math.random() - 0.5) * 0.25;
                this.baseAlpha = Math.random() * 0.35 + 0.18;
                this.alpha = this.baseAlpha;
                this.color = Math.random() > 0.4 ? 'rgba(65, 160, 255,' : 'rgba(191, 90, 242,';
                this.pulseSpeed = Math.random() * 0.02 + 0.008;
                this.pulseAngle = Math.random() * Math.PI * 2;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.pulseAngle += this.pulseSpeed;
                this.alpha = this.baseAlpha + Math.sin(this.pulseAngle) * 0.12;

                // Mouse vicinity reaction
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    this.x -= (dx / dist) * force * 1.8;
                    this.y -= (dy / dist) * force * 1.8;
                    this.alpha = Math.min(0.9, this.alpha + 0.25);
                }

                if (this.y < -15 || this.x < -15 || this.x > width + 15) {
                    this.reset(false);
                }
            }
            draw() {
                ctx.fillStyle = `${this.color}${Math.max(0.05, this.alpha)})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animFrameId = requestAnimationFrame(animate);
        }

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            resizeCanvas();
            initParticles();
            animate();

            window.addEventListener('resize', resizeCanvas, { passive: true });

            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            }, { passive: true });

            window.addEventListener('mouseleave', () => {
                mouse.x = -1000;
                mouse.y = -1000;
            });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    cancelAnimationFrame(animFrameId);
                } else {
                    animate();
                }
            });
        }
    }

    /* --------------------------------------------------------------------------
       7. Scroll Progress Indicator
       -------------------------------------------------------------------------- */
    const scrollProgressBar = document.getElementById('scroll-progress');
    if (scrollProgressBar) {
        function updateScrollProgress() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            scrollProgressBar.style.width = `${progress}%`;
        }
        window.addEventListener('scroll', updateScrollProgress, { passive: true });
        updateScrollProgress();
    }

    /* --------------------------------------------------------------------------
       8. Cursor Spotlight Tracker for Cards
       -------------------------------------------------------------------------- */
    const spotlightCards = document.querySelectorAll('.spotlight-card');
    if (spotlightCards.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        spotlightCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }, { passive: true });
        });
    }

    /* --------------------------------------------------------------------------
       9. Scroll Reveal Observer & Number Counter
       -------------------------------------------------------------------------- */
    function animateCounter(el) {
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';

        const target = parseFloat(el.getAttribute('data-target'));
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1600;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out expo curve
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = target * easeProgress;

            el.textContent = current.toFixed(decimals) + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target.toFixed(decimals) + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');

                    // If contains counters, trigger count-up
                    const counters = entry.target.querySelectorAll('.counter');
                    counters.forEach(counter => animateCounter(counter));

                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -30px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    /* --------------------------------------------------------------------------
       10. 3D Tilt Hover Controller (Tactile Micro-interactions)
       -------------------------------------------------------------------------- */
    const tiltCards = document.querySelectorAll('.tilt-card');
    if (tiltCards.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        tiltCards.forEach(card => {
            let isHovered = false;

            card.addEventListener('mouseenter', () => {
                isHovered = true;
            });

            card.addEventListener('mousemove', (e) => {
                if (!isHovered) return;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Subtle smooth 3D tilt
                const rotateX = ((y - centerY) / centerY) * -6.5;
                const rotateY = ((x - centerX) / centerX) * 6.5;

                card.style.transform = `perspective(950px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.018, 1.018, 1.018)`;
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                isHovered = false;
                card.style.transform = 'perspective(950px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });
    }

    /* --------------------------------------------------------------------------
       11. Magnetic Button Hover Interaction
       -------------------------------------------------------------------------- */
    const magneticBtns = document.querySelectorAll('.btn');
    if (magneticBtns.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const pullX = x * 0.18;
                const pullY = y * 0.18;
                btn.style.transform = `translate3d(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px, 0)`;
            }, { passive: true });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate3d(0, 0, 0)';
            });
        });
    }
});
