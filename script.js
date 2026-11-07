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
    const introPct = document.getElementById('intro-pct');
    const introStatus = document.getElementById('intro-status');
    const introShockwave = document.getElementById('intro-shockwave');

    if (introCurtain && introFill) {
        const introStart = performance.now();
        const introDuration = 1350; // Progress finishes in 1.35s

        function stepIntro(now) {
            const elapsed = now - introStart;
            const pct = Math.min(100, (elapsed / introDuration) * 100);
            introFill.style.width = `${pct}%`;
            if (introPct) introPct.textContent = `${Math.floor(pct)}%`;

            if (elapsed < 600 && introStatus) {
                introStatus.textContent = 'ĐANG KHỞI CHẠY THẾ GIỚI...';
            } else if (elapsed >= 600 && elapsed < 1000 && introStatus) {
                introStatus.textContent = 'ĐỒNG BỘ PROTOCOL 1.21.11...';
            } else if (elapsed >= 1000 && elapsed < 1350 && introStatus) {
                introStatus.textContent = 'KẾT NỐI MẠNG LƯỚI...';
            }

            if (elapsed < introDuration) {
                requestAnimationFrame(stepIntro);
            } else {
                // Hit 100% - Fire shockwave & ready status
                if (introPct) introPct.textContent = '100%';
                if (introStatus) {
                    introStatus.textContent = '✦ HỆ THỐNG SẴN SÀNG! ✦';
                    introStatus.classList.add('ready');
                }
                if (introShockwave) {
                    introShockwave.classList.add('trigger');
                }

                // Dissolve curtain at ~1.85s, completing 2.0s experience
                setTimeout(() => {
                    introCurtain.classList.add('intro-hidden');
                    document.body.classList.remove('loading');
                    setTimeout(() => {
                        introCurtain.remove();
                    }, 650);
                }, 480);
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
       10. Velvety 3D Tilt & Specular Glare (Spring Lerp Physics)
       -------------------------------------------------------------------------- */
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    const tiltCards = document.querySelectorAll('.tilt-card');
    if (tiltCards.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        tiltCards.forEach(card => {
            // Inject specular glare overlay if missing
            let glare = card.querySelector('.card-glare');
            if (!glare) {
                glare = document.createElement('div');
                glare.className = 'card-glare';
                card.appendChild(glare);
            }

            const state = {
                currentRotX: 0,
                currentRotY: 0,
                targetRotX: 0,
                targetRotY: 0,
                currentScale: 1,
                targetScale: 1,
                glareX: 50,
                glareY: 50,
                targetGlareX: 50,
                targetGlareY: 50,
                isHovered: false,
                animId: null
            };

            function updateTilt() {
                state.currentRotX = lerp(state.currentRotX, state.targetRotX, 0.12);
                state.currentRotY = lerp(state.currentRotY, state.targetRotY, 0.12);
                state.currentScale = lerp(state.currentScale, state.targetScale, 0.12);
                state.glareX = lerp(state.glareX, state.targetGlareX, 0.15);
                state.glareY = lerp(state.glareY, state.targetGlareY, 0.15);

                card.style.transform = `perspective(1000px) rotateX(${state.currentRotX.toFixed(2)}deg) rotateY(${state.currentRotY.toFixed(2)}deg) scale3d(${state.currentScale.toFixed(3)}, ${state.currentScale.toFixed(3)}, ${state.currentScale.toFixed(3)})`;
                card.style.setProperty('--glare-x', `${state.glareX.toFixed(1)}%`);
                card.style.setProperty('--glare-y', `${state.glareY.toFixed(1)}%`);

                const delta = Math.abs(state.currentRotX - state.targetRotX) + Math.abs(state.currentRotY - state.targetRotY) + Math.abs(state.currentScale - state.targetScale);
                if (state.isHovered || delta > 0.01) {
                    state.animId = requestAnimationFrame(updateTilt);
                } else {
                    state.animId = null;
                }
            }

            card.addEventListener('mouseenter', () => {
                state.isHovered = true;
                state.targetScale = 1.02;
                if (!state.animId) {
                    state.animId = requestAnimationFrame(updateTilt);
                }
            });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                state.targetRotX = ((y - centerY) / centerY) * -7;
                state.targetRotY = ((x - centerX) / centerX) * 7;
                state.targetGlareX = (x / rect.width) * 100;
                state.targetGlareY = (y / rect.height) * 100;

                if (!state.animId) {
                    state.animId = requestAnimationFrame(updateTilt);
                }
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                state.isHovered = false;
                state.targetRotX = 0;
                state.targetRotY = 0;
                state.targetScale = 1;
                state.targetGlareX = 50;
                state.targetGlareY = 50;
                if (!state.animId) {
                    state.animId = requestAnimationFrame(updateTilt);
                }
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
                const pullX = x * 0.22;
                const pullY = y * 0.22;
                btn.style.transform = `translate3d(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px, 0)`;
            }, { passive: true });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate3d(0, 0, 0)';
            });
        });
    }

    /* --------------------------------------------------------------------------
       12. Satisfying Click Sparks / Particle Burst System
       -------------------------------------------------------------------------- */
    const sparksCanvas = document.getElementById('sparks-canvas');
    if (sparksCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const sCtx = sparksCanvas.getContext('2d');
        let sparks = [];
        let sWidth = 0;
        let sHeight = 0;
        let sAnimId = null;

        function resizeSparksCanvas() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            sWidth = window.innerWidth;
            sHeight = window.innerHeight;
            sparksCanvas.width = sWidth * dpr;
            sparksCanvas.height = sHeight * dpr;
            sCtx.scale(dpr, dpr);
        }
        resizeSparksCanvas();
        window.addEventListener('resize', resizeSparksCanvas, { passive: true });

        function createSparkBurst(x, y, count = 26) {
            const colors = ['#2997ff', '#30d158', '#bf5af2', '#ffffff', '#ffd60a', '#60a5fa'];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 2.5;
                sparks.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - Math.random() * 2,
                    size: Math.random() * 3.5 + 1.5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1,
                    friction: 0.93,
                    gravity: 0.22,
                    life: Math.random() * 15 + 35,
                    maxLife: 50
                });
            }
            if (!sAnimId) {
                sAnimId = requestAnimationFrame(animateSparks);
            }
        }

        function animateSparks() {
            sCtx.clearRect(0, 0, sWidth, sHeight);
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.x += s.vx;
                s.y += s.vy;
                s.vx *= s.friction;
                s.vy = s.vy * s.friction + s.gravity;
                s.size *= 0.97;
                s.life--;
                s.alpha = Math.max(0, s.life / s.maxLife);

                sCtx.save();
                sCtx.shadowBlur = 8;
                sCtx.shadowColor = s.color;
                sCtx.fillStyle = s.color;
                sCtx.globalAlpha = s.alpha;
                sCtx.beginPath();
                sCtx.arc(s.x, s.y, Math.max(0.6, s.size), 0, Math.PI * 2);
                sCtx.fill();
                sCtx.restore();

                if (s.life <= 0 || s.size <= 0.4) {
                    sparks.splice(i, 1);
                }
            }

            if (sparks.length > 0) {
                sAnimId = requestAnimationFrame(animateSparks);
            } else {
                sCtx.clearRect(0, 0, sWidth, sHeight);
                sAnimId = null;
            }
        }

        // Trigger on any click across the page
        window.addEventListener('pointerdown', (e) => {
            const isCopyBtn = e.target.closest('.copy-ip-btn');
            const sparkCount = isCopyBtn ? 42 : 18;
            createSparkBurst(e.clientX, e.clientY, sparkCount);
        });
    }

    /* --------------------------------------------------------------------------
       13. Liquid Interactive Cursor Aura (Smooth spring follower)
       -------------------------------------------------------------------------- */
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(pointer: fine)').matches) {
        let mouseX = -500;
        let mouseY = -500;
        let glowX = -500;
        let glowY = -500;
        let isMoving = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!isMoving) {
                isMoving = true;
                cursorGlow.classList.add('active');
                requestAnimationFrame(updateCursor);
            }
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            cursorGlow.classList.remove('active');
        });

        function updateCursor() {
            glowX = lerp(glowX, mouseX, 0.16);
            glowY = lerp(glowY, mouseY, 0.16);

            cursorGlow.style.left = `${glowX.toFixed(1)}px`;
            cursorGlow.style.top = `${glowY.toFixed(1)}px`;

            if (isMoving) {
                requestAnimationFrame(updateCursor);
            }
        }

        // Expand aura on interactive elements
        const interactiveTargets = document.querySelectorAll('a, button, .tilt-card, .spec-item, .logo');
        interactiveTargets.forEach(el => {
            el.addEventListener('mouseenter', () => cursorGlow.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursorGlow.classList.remove('hovering'));
        });
    }
});
