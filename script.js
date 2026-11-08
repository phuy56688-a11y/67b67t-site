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

    // Shared spark burst hook
    let triggerSparkBurst = () => {};

    // DOM Elements
    const brandLogo = document.getElementById('brand-logo') || document.querySelector('.logo');
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

    // Logo Click Handler: Reload page with satisfying feedback
    if (brandLogo) {
        brandLogo.addEventListener('click', (e) => {
            e.preventDefault();
            triggerSparkBurst(e.clientX, e.clientY, 38);
            brandLogo.style.transform = 'scale(0.85) rotate(-18deg)';
            sessionStorage.setItem('justReloaded', 'true');

            setTimeout(() => {
                window.location.reload();
            }, 180);
        });
    }

    // Check if reloaded from logo click
    if (sessionStorage.getItem('justReloaded')) {
        sessionStorage.removeItem('justReloaded');
        setTimeout(() => {
            showAppleToast('✦ Đã làm mới hệ thống 67B67T! ✦', 2000);
        }, 2050);
    }

    /* --------------------------------------------------------------------------
       1. Apple Dynamic Island Style HUD Toast
       -------------------------------------------------------------------------- */
    function showAppleToast(message, duration = 2000) {
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

        // Disappear smoothly after exactly 2 seconds with in & out animations
        setTimeout(() => {
            dismissToast();
        }, duration);

        function dismissToast() {
            if (toast.classList.contains('leaving')) return;
            toast.classList.add('leaving');

            const handleAnimEnd = () => {
                if (toast.parentElement) {
                    toast.remove();
                }
            };
            toast.addEventListener('animationend', handleAnimEnd, { once: true });
            
            // Fallback safety timeout
            setTimeout(handleAnimEnd, 460);
        }
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

    const faqOpenRules = document.getElementById('faq-open-rules');
    if (faqOpenRules) {
        faqOpenRules.addEventListener('click', (e) => {
            e.preventDefault();
            openRules();
        });
    }

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
        triggerSparkBurst = createSparkBurst;

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
        const interactiveTargets = document.querySelectorAll('a, button, .tilt-card, .spec-item, .logo, .faq-summary, .hardware-server-frame');
        interactiveTargets.forEach(el => {
            el.addEventListener('mouseenter', () => cursorGlow.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursorGlow.classList.remove('hovering'));
        });
    }

    /* --------------------------------------------------------------------------
       12. Modern FAQ Accordion Interactive Enhancement
       -------------------------------------------------------------------------- */
    const faqSummaries = document.querySelectorAll('.faq-summary');
    faqSummaries.forEach(summary => {
        summary.addEventListener('click', (e) => {
            triggerSparkBurst(e.clientX, e.clientY, 12);
        });
    });

    // Fallback for older browsers not supporting native exclusive details[name]
    if (!('name' in HTMLDetailsElement.prototype)) {
        const faqItems = document.querySelectorAll('.faq-item[name="faq-accordion"]');
        faqItems.forEach(item => {
            item.addEventListener('toggle', () => {
                if (item.open) {
                    faqItems.forEach(other => {
                        if (other !== item && other.open) {
                            other.open = false;
                        }
                    });
                }
            });
        });
    }

    /* --------------------------------------------------------------------------
       13. Server Hardware Image Lightbox & Interactive Zoom
       -------------------------------------------------------------------------- */
    const serverTrigger = document.getElementById('server-frame-trigger');
    const lightboxDialog = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxViewport = document.getElementById('lightbox-viewport');
    const btnZoomIn = document.getElementById('lightbox-zoom-in');
    const btnZoomOut = document.getElementById('lightbox-zoom-out');
    const btnReset = document.getElementById('lightbox-reset');
    const btnCloseLightbox = document.getElementById('lightbox-close');
    const zoomValLabel = document.getElementById('lightbox-zoom-val');

    if (serverTrigger && lightboxDialog && lightboxImg) {
        let scale = 1;
        let posX = 0;
        let posY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        function updateTransform() {
            lightboxImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
            if (zoomValLabel) {
                zoomValLabel.textContent = `${Math.round(scale * 100)}%`;
            }
            if (scale > 1) {
                lightboxImg.classList.add('zoomed');
            } else {
                lightboxImg.classList.remove('zoomed');
                posX = 0;
                posY = 0;
                lightboxImg.style.transform = `translate(0px, 0px) scale(${scale})`;
            }
        }

        function setZoom(newScale) {
            scale = Math.min(3.5, Math.max(1, Math.round(newScale * 100) / 100));
            if (scale === 1) {
                posX = 0;
                posY = 0;
            }
            updateTransform();
        }

        function openLightbox() {
            scale = 1;
            posX = 0;
            posY = 0;
            updateTransform();
            if (typeof lightboxDialog.showModal === 'function') {
                lightboxDialog.showModal();
            } else {
                lightboxDialog.setAttribute('open', '');
            }
        }

        function closeLightbox() {
            if (typeof lightboxDialog.close === 'function') {
                lightboxDialog.close();
            } else {
                lightboxDialog.removeAttribute('open');
            }
        }

        serverTrigger.addEventListener('click', (e) => {
            triggerSparkBurst(e.clientX, e.clientY, 16);
            openLightbox();
        });

        serverTrigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox();
            }
        });

        if (btnCloseLightbox) {
            btnCloseLightbox.addEventListener('click', closeLightbox);
        }

        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', () => setZoom(scale + 0.35));
        }

        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', () => setZoom(scale - 0.35));
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => setZoom(1));
        }

        // Mouse wheel zoom over viewport
        if (lightboxViewport) {
            lightboxViewport.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.25 : -0.25;
                setZoom(scale + delta);
            }, { passive: false });
        }

        // Click image toggles 1x and 2x zoom
        lightboxImg.addEventListener('click', (e) => {
            if (isDragging) return;
            if (scale === 1) {
                setZoom(2);
            } else {
                setZoom(1);
            }
        });

        // Pan / Drag image when zoomed
        lightboxImg.addEventListener('mousedown', (e) => {
            if (scale <= 1) return;
            isDragging = true;
            startX = e.clientX - posX;
            startY = e.clientY - posY;
            lightboxImg.classList.add('grabbing');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            posX = e.clientX - startX;
            posY = e.clientY - startY;
            updateTransform();
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                lightboxImg.classList.remove('grabbing');
            }
        });

        // Mobile touch drag & pinch
        let lastTouchDist = 0;
        lightboxViewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && scale > 1) {
                isDragging = true;
                startX = e.touches[0].clientX - posX;
                startY = e.touches[0].clientY - posY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: true });

        lightboxViewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging && scale > 1) {
                posX = e.touches[0].clientX - startX;
                posY = e.touches[0].clientY - startY;
                updateTransform();
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (lastTouchDist > 0) {
                    const diff = (dist - lastTouchDist) * 0.008;
                    setZoom(scale + diff);
                }
                lastTouchDist = dist;
            }
        }, { passive: true });

        lightboxViewport.addEventListener('touchend', () => {
            isDragging = false;
            lastTouchDist = 0;
        });

        // Light dismiss fallback per modern web guidance for dialogs without closedBy support
        if (!('closedBy' in HTMLDialogElement.prototype)) {
            const isOutside = (e, dialog) => {
                const r = dialog.getBoundingClientRect();
                return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
            };
            let pressedOutside = false;
            lightboxDialog.addEventListener('pointerdown', (e) => {
                pressedOutside = isOutside(e, lightboxDialog);
            });
            lightboxDialog.addEventListener('pointerup', (e) => {
                if (pressedOutside && isOutside(e, lightboxDialog)) {
                    closeLightbox();
                }
                pressedOutside = false;
            });
        }
    }

    /* --------------------------------------------------------------------------
       14. Store Controller & Automatic ZaloPay Provisioning
       -------------------------------------------------------------------------- */
    const storeUsernameInput = document.getElementById('store-mc-username');
    const storeAvatarImg = document.getElementById('store-avatar-img');
    const storeInputStatus = document.getElementById('store-input-status');
    const storeInputHint = document.getElementById('store-input-hint');
    const btnOpenCheckout = document.getElementById('btn-open-checkout');
    const btnOpenLookup = document.getElementById('btn-open-lookup');

    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
    const checkoutModalClose = document.getElementById('checkout-modal-close');
    const checkoutModalBody = document.getElementById('checkout-modal-body');

    const lookupModal = document.getElementById('lookup-modal');
    const lookupModalOverlay = document.getElementById('lookup-modal-overlay');
    const lookupModalClose = document.getElementById('lookup-modal-close');
    const lookupInput = document.getElementById('lookup-input');
    const btnDoLookup = document.getElementById('btn-do-lookup');
    const lookupResults = document.getElementById('lookup-results');

    // API Resolver Helper
    function resolveApiUrl(path) {
        if (window.location.port === '5000') {
            return '/api' + path;
        }
        const isLocal = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.protocol === 'file:';
        const base = isLocal ? 'http://localhost:5000/api' : '/api';
        return base + path;
    }

    // Modal Handlers
    function openCheckoutModal() {
        if (!checkoutModal) return;
        checkoutModal.classList.add('active');
        checkoutModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeCheckoutModal() {
        if (!checkoutModal) return;
        checkoutModal.classList.remove('active');
        checkoutModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (activePollingInterval) {
            clearInterval(activePollingInterval);
            activePollingInterval = null;
        }
    }

    function openLookupModal() {
        if (!lookupModal) return;
        lookupModal.classList.add('active');
        lookupModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (lookupInput) {
            setTimeout(() => lookupInput.focus(), 150);
        }
    }

    function closeLookupModal() {
        if (!lookupModal) return;
        lookupModal.classList.remove('active');
        lookupModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (checkoutModalOverlay) checkoutModalOverlay.addEventListener('click', closeCheckoutModal);
    if (checkoutModalClose) checkoutModalClose.addEventListener('click', closeCheckoutModal);
    if (lookupModalOverlay) lookupModalOverlay.addEventListener('click', closeLookupModal);
    if (lookupModalClose) lookupModalClose.addEventListener('click', closeLookupModal);
    if (btnOpenLookup) btnOpenLookup.addEventListener('click', openLookupModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (checkoutModal && checkoutModal.classList.contains('active')) closeCheckoutModal();
            if (lookupModal && lookupModal.classList.contains('active')) closeLookupModal();
        }
    });

    // Username Validation & Avatar Skin Loading
    const MC_NAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;
    let avatarDebounceTimer = null;

    if (storeUsernameInput) {
        storeUsernameInput.addEventListener('input', () => {
            clearTimeout(avatarDebounceTimer);
            const val = storeUsernameInput.value.trim();

            if (!val) {
                if (storeInputStatus) storeInputStatus.className = 'store-input-status';
                if (storeAvatarImg) storeAvatarImg.src = 'https://mc-heads.net/avatar/MHF_Steve/48';
                if (storeInputHint) {
                    storeInputHint.textContent = 'Nhập từ 3 - 16 ký tự (chữ cái, chữ số, gạch dưới)';
                    storeInputHint.style.color = 'var(--text-tertiary)';
                }
                return;
            }

            const isValid = MC_NAME_REGEX.test(val);
            if (storeInputStatus) {
                storeInputStatus.className = 'store-input-status ' + (isValid ? 'valid' : 'invalid');
            }

            if (isValid) {
                if (storeInputHint) {
                    storeInputHint.textContent = 'Tên Minecraft hợp lệ: ' + val;
                    storeInputHint.style.color = '#30d158';
                }
                avatarDebounceTimer = setTimeout(() => {
                    if (storeAvatarImg) {
                        storeAvatarImg.src = 'https://mc-heads.net/avatar/' + encodeURIComponent(val) + '/48';
                    }
                }, 300);
            } else {
                if (storeInputHint) {
                    storeInputHint.textContent = 'Tên Minecraft không hợp lệ (chỉ gồm 3-16 ký tự a-z, 0-9, _)';
                    storeInputHint.style.color = '#ff6961';
                }
            }
        });
    }

    let activePollingInterval = null;

    // Checkout Flow: Triggered on "Mua Bằng ZaloPay"
    if (btnOpenCheckout) {
        btnOpenCheckout.addEventListener('click', async () => {
            const username = storeUsernameInput ? storeUsernameInput.value.trim() : '';

            if (!MC_NAME_REGEX.test(username)) {
                if (storeUsernameInput) {
                    storeUsernameInput.focus();
                    storeUsernameInput.parentElement.classList.add('shake');
                    setTimeout(() => storeUsernameInput.parentElement.classList.remove('shake'), 400);
                }
                showAppleToast('Vui lòng nhập tên Minecraft hợp lệ (3-16 ký tự)!', 2500);
                return;
            }

            // Open Checkout Modal with Loading skeleton
            openCheckoutModal();
            checkoutModalBody.innerHTML = '<div style="text-align: center; padding: 40px 10px;">' +
                '<div class="pulse-dot" style="margin: 0 auto 16px; width: 14px; height: 14px; background: #2997ff;"></div>' +
                '<p style="color: var(--text-secondary); font-size: 0.95rem;">Đang kết nối cổng ZaloPay & khởi tạo đơn hàng...</p>' +
                '</div>';

            try {
                const response = await fetch(resolveApiUrl('/payment/create'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, rankId: 'plus' })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    renderCheckoutError(data.message || 'Không thể tạo đơn hàng');
                    return;
                }

                // Render Checkout State based on configuration
                renderCheckoutView(data, username);

            } catch (err) {
                console.error('[Create Order Error]', err);
                renderCheckoutError('Không thể kết nối đến Backend máy chủ (Port 5000). Vui lòng đảm bảo backend đang chạy.');
            }
        });
    }

    function renderCheckoutError(errMsg) {
        checkoutModalBody.innerHTML = '<div class="payment-unconfigured-banner" style="border-color: rgba(255, 69, 58, 0.4); background: rgba(255, 69, 58, 0.08);">' +
            '<div class="alert-icon">⚠️</div>' +
            '<h4 style="color: #ff6961;">Lỗi Khởi Tạo Giao Dịch</h4>' +
            '<p>' + errMsg + '</p>' +
            '<button type="button" class="btn btn-apple-subtle" onclick="document.getElementById(\'checkout-modal-close\').click()" style="margin-top: 12px;">' +
            '<span>Đóng</span>' +
            '</button>' +
            '</div>';
    }

    function renderCheckoutView(orderData, username) {
        const orderId = orderData.order_id;
        const formattedAmount = (orderData.amount || 50000).toLocaleString('vi-VN');
        const isConfigured = orderData.configured === true;

        let contentHtml = '<div class="checkout-order-summary">' +
            '<img src="https://mc-heads.net/avatar/' + encodeURIComponent(username) + '/52" alt="' + username + '" class="checkout-avatar" onerror="this.src=\'https://mc-heads.net/avatar/MHF_Steve/52\'">' +
            '<div class="checkout-meta">' +
            '<strong>' + username + ' &bull; Rank Plus</strong>' +
            '<div class="checkout-order-id">Mã đơn: ' + orderId + '</div>' +
            '<div class="checkout-amount">' + formattedAmount + ' VNĐ</div>' +
            '</div>' +
            '</div>';

        if (!isConfigured) {
            // Unconfigured State: Show graceful alert banner, no fake payment simulation
            contentHtml += '<div class="payment-unconfigured-banner">' +
                '<div class="alert-icon">⚙️</div>' +
                '<h4>CỔNG ZALOPAY ĐANG CHỜ CẤU HÌNH API</h4>' +
                '<p>Hệ thống máy chủ đã ghi nhận đơn hàng nhưng Cổng thanh toán ZaloPay Merchant đang chờ quản trị viên điền App ID và Secret Key vào <code>backend/.env</code>.</p>' +
                '<p style="font-size: 0.82rem; color: var(--text-tertiary);">Tuyệt đối không giả lập thanh toán ảo hoặc xác nhận qua ảnh chụp màn hình để bảo đảm an toàn dữ liệu.</p>' +
                '<div style="margin-top: 14px;">' +
                '<span class="order-notice-code">Mã đơn lưu trữ: ' + orderId + '</span>' +
                '</div>' +
                '</div>' +
                '<div style="display: flex; gap: 10px;">' +
                '<button type="button" class="btn btn-apple-primary btn-block" onclick="document.getElementById(\'checkout-modal-close\').click()">' +
                '<span>Đã Hiểu</span>' +
                '</button>' +
                '</div>';
            checkoutModalBody.innerHTML = contentHtml;
        } else {
            // Configured State: Show dynamic QR code & start real-time polling
            const qrUrl = orderData.qr_code || ('https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(orderData.order_url || orderId));
            const payUrl = orderData.order_url || '#';

            contentHtml += '<div class="payment-qr-container">' +
                '<div class="payment-qr-frame">' +
                '<img src="' + qrUrl + '" alt="Mã QR ZaloPay" id="zalopay-qr-code">' +
                '</div>' +
                '<div class="payment-status-pulsing">' +
                '<span class="pulse-dot"></span>' +
                '<span>Đang chờ bạn quét mã thanh toán ZaloPay...</span>' +
                '</div>' +
                '<div class="payment-countdown" id="checkout-countdown">Đơn hàng tự động hết hạn sau 15:00</div>' +
                '<a href="' + payUrl + '" target="_blank" rel="noopener noreferrer" class="btn-zalopay-open">' +
                '<svg class="zalopay-icon-svg" viewBox="0 0 32 32" fill="currentColor">' +
                '<path d="M4 8a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zm7.5 4.5v1.8h4.8L11.5 20v1.8h9v-1.8h-4.8l4.8-5.7v-1.8h-9z"/>' +
                '</svg>' +
                '<span>Mở Trực Tiếp Bằng ZaloPay</span>' +
                '</a>' +
                '</div>';
            checkoutModalBody.innerHTML = contentHtml;

            // Start countdown timer
            let remainingSec = 15 * 60;
            const timerEl = document.getElementById('checkout-countdown');
            const countdownInterval = setInterval(() => {
                remainingSec--;
                if (remainingSec <= 0) {
                    clearInterval(countdownInterval);
                    if (timerEl) timerEl.textContent = 'Đơn hàng đã hết hạn!';
                    if (activePollingInterval) clearInterval(activePollingInterval);
                    return;
                }
                const m = Math.floor(remainingSec / 60).toString().padStart(2, '0');
                const s = (remainingSec % 60).toString().padStart(2, '0');
                if (timerEl) timerEl.textContent = 'Đơn hàng tự động hết hạn sau ' + m + ':' + s;
            }, 1000);

            // Start real-time status polling every 3 seconds
            startOrderPolling(orderId, username, countdownInterval);
        }
    }

    function startOrderPolling(orderId, username, countdownInterval) {
        if (activePollingInterval) clearInterval(activePollingInterval);

        activePollingInterval = setInterval(async () => {
            try {
                const res = await fetch(resolveApiUrl('/order/status/' + encodeURIComponent(orderId)));
                if (!res.ok) return;
                const data = await res.json();

                if (data.success && data.order) {
                    const status = data.order.status;
                    if (status === 'PAID' || status === 'DELIVERED') {
                        // Payment Confirmed!
                        clearInterval(activePollingInterval);
                        if (countdownInterval) clearInterval(countdownInterval);
                        renderPaymentSuccess(data.order, username);
                    }
                }
            } catch (e) {
                // Ignore transient network errors during polling
            }
        }, 3000);
    }

    function renderPaymentSuccess(order, username) {
        triggerSparkBurst(window.innerWidth / 2, window.innerHeight / 2, 60);
        showAppleToast('✦ Kích hoạt Rank Plus thành công! ✦', 3000);

        const rconDelivered = order.rcon_delivered === 1 || order.status === 'DELIVERED';
        const rconMsg = rconDelivered
            ? '<span style="color: #30d158;">✔ Đã tự động kích hoạt quyền lợi trực tiếp trong máy chủ Minecraft!</span>'
            : '<span style="color: #ff9f0a;">⏳ Đơn hàng đã ghi nhận! Server sẽ tự động cấp quyền bù khi online.</span>';

        checkoutModalBody.innerHTML = '<div class="payment-success-card">' +
            '<div class="payment-success-badge">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="20 6 9 17 4 12"></polyline>' +
            '</svg>' +
            '</div>' +
            '<h4>THANH TOÁN THÀNH CÔNG!</h4>' +
            '<p>Cảm ơn bạn đã ủng hộ máy chủ 67B67T. Tài khoản <strong>' + username + '</strong> đã được nâng cấp lên <strong>Rank Plus</strong>.</p>' +
            '<div class="payment-success-details">' +
            '<div class="detail-row"><span>Mã đơn hàng:</span><strong class="mono-code">' + order.order_id + '</strong></div>' +
            '<div class="detail-row"><span>Số tiền:</span><strong style="color: #30d158;">' + (order.amount || 50000).toLocaleString('vi-VN') + ' VNĐ</strong></div>' +
            '<div class="detail-row"><span>Trạng thái máy chủ:</span><div>' + rconMsg + '</div></div>' +
            '</div>' +
            '<div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem; color: var(--text-secondary);">' +
            '👉 Vào máy chủ và gõ lệnh <code>/checkrank</code> hoặc <code>/ec 2</code> để trải nghiệm ngay quyền lợi mới!' +
            '</div>' +
            '<button type="button" class="btn btn-apple-primary btn-block" onclick="document.getElementById(\'checkout-modal-close\').click()">' +
            '<span>Hoàn Tất</span>' +
            '</button>' +
            '</div>';
    }

    // Lookup Handler
    async function doLookup() {
        if (!lookupInput || !lookupResults) return;
        const query = lookupInput.value.trim();
        if (!query) {
            lookupResults.innerHTML = '<p class="lookup-placeholder" style="color: #ff6961;">Vui lòng nhập tên người chơi hoặc mã đơn hàng.</p>';
            return;
        }

        lookupResults.innerHTML = '<div style="text-align: center; padding: 30px;">' +
            '<div class="pulse-dot" style="margin: 0 auto 12px;"></div>' +
            '<p style="color: var(--text-secondary); font-size: 0.85rem;">Đang tìm kiếm dữ liệu đơn hàng...</p>' +
            '</div>';

        try {
            const res = await fetch(resolveApiUrl('/order/lookup?q=' + encodeURIComponent(query)));
            const data = await res.json();

            if (!res.ok || !data.success || !data.orders || data.orders.length === 0) {
                lookupResults.innerHTML = '<div class="lookup-placeholder">' +
                    '<p>Không tìm thấy giao dịch nào phù hợp với từ khóa: <strong>' + query + '</strong></p>' +
                    '</div>';
                return;
            }

            let html = '';
            data.orders.forEach(ord => {
                let badgeClass = 'badge-pending';
                let badgeText = 'Chờ thanh toán';

                if (ord.status === 'DELIVERED') {
                    badgeClass = 'badge-delivered';
                    badgeText = 'Đã cấp Rank Plus';
                } else if (ord.status === 'PAID') {
                    badgeClass = 'badge-paid';
                    badgeText = 'Đã thanh toán';
                } else if (ord.status === 'FAILED') {
                    badgeClass = 'badge-failed';
                    badgeText = 'Thất bại';
                }

                const createdDate = ord.created_at ? new Date(ord.created_at).toLocaleString('vi-VN') : 'Mới tạo';

                html += '<div class="lookup-order-card">' +
                    '<div class="lookup-order-top">' +
                    '<span class="lookup-order-id">' + ord.order_id + '</span>' +
                    '<span class="order-badge ' + badgeClass + '">' + badgeText + '</span>' +
                    '</div>' +
                    '<div class="lookup-order-bottom">' +
                    '<span>Tài khoản: <strong>' + ord.username + '</strong></span>' +
                    '<span>' + (ord.amount || 50000).toLocaleString('vi-VN') + ' đ &bull; ' + createdDate + '</span>' +
                    '</div>' +
                    '</div>';
            });

            lookupResults.innerHTML = html;

        } catch (err) {
            console.error('[Lookup Error]', err);
            lookupResults.innerHTML = '<p class="lookup-placeholder" style="color: #ff6961;">Lỗi kết nối máy chủ khi tra cứu. Vui lòng thử lại sau.</p>';
        }
    }

    if (btnDoLookup) btnDoLookup.addEventListener('click', doLookup);
    if (lookupInput) {
        lookupInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doLookup();
            }
        });
    }

});
