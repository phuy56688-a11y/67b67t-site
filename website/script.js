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
       14. Hệ Thống Tài Khoản, Đăng Nhập, Duyệt Đơn Thủ Công & Admin Dashboard
       -------------------------------------------------------------------------- */

    // Helper: Định vị API URL (tự động thích ứng local/production)
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

    // --- Quản Lý Phiên Đăng Nhập (Auth State Management) ---
    const AUTH_TOKEN_KEY = '67b67t_auth_token';
    const AUTH_USER_KEY = '67b67t_user_profile';

    function getAuthToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }

    function setAuthSession(token, user) {
        if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
        if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        updateAuthUI(user);
    }

    function clearAuthSession() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        updateAuthUI(null);
        showAppleToast('Đã đăng xuất tài khoản.', 2000);
    }

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(AUTH_USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    // DOM Elements - Auth & Dropdown
    const userAuthWidget = document.getElementById('user-auth-widget');
    const btnOpenAuth = document.getElementById('btn-open-auth');
    const navUserAvatar = document.getElementById('nav-user-avatar');
    const navAuthIcon = document.getElementById('nav-auth-icon');
    const navAuthLabel = document.getElementById('nav-auth-label');
    const navAdminCrown = document.getElementById('nav-admin-crown');

    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    const dropdownUserAvatar = document.getElementById('dropdown-user-avatar');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const dropdownUserRole = document.getElementById('dropdown-user-role');
    const btnDropdownAdmin = document.getElementById('btn-dropdown-admin');
    const btnDropdownMyOrders = document.getElementById('btn-dropdown-my-orders');
    const btnDropdownLogout = document.getElementById('btn-dropdown-logout');

    // Modals
    const authModal = document.getElementById('auth-modal');
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const authModalClose = document.getElementById('auth-modal-close');
    const authAlertBox = document.getElementById('auth-alert-box');

    const adminModal = document.getElementById('admin-modal');
    const adminModalOverlay = document.getElementById('admin-modal-overlay');
    const adminModalClose = document.getElementById('admin-modal-close');

    const myOrdersModal = document.getElementById('my-orders-modal');
    const myOrdersOverlay = document.getElementById('my-orders-overlay');
    const myOrdersClose = document.getElementById('my-orders-close');
    const myOrdersContent = document.getElementById('my-orders-content');

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

    // Generic Modal Open/Close helpers
    function openModal(el) {
        if (!el) return;
        el.classList.add('active');
        el.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(el) {
        if (!el) return;
        el.classList.remove('active');
        el.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Modal close listeners
    if (authModalOverlay) authModalOverlay.addEventListener('click', () => closeModal(authModal));
    if (authModalClose) authModalClose.addEventListener('click', () => closeModal(authModal));
    if (adminModalOverlay) adminModalOverlay.addEventListener('click', () => closeModal(adminModal));
    if (adminModalClose) adminModalClose.addEventListener('click', () => closeModal(adminModal));
    if (myOrdersOverlay) myOrdersOverlay.addEventListener('click', () => closeModal(myOrdersModal));
    if (myOrdersClose) myOrdersClose.addEventListener('click', () => closeModal(myOrdersModal));
    if (checkoutModalOverlay) checkoutModalOverlay.addEventListener('click', () => {
        closeModal(checkoutModal);
        stopOrderPolling();
    });
    if (checkoutModalClose) checkoutModalClose.addEventListener('click', () => {
        closeModal(checkoutModal);
        stopOrderPolling();
    });
    if (lookupModalOverlay) lookupModalOverlay.addEventListener('click', () => closeModal(lookupModal));
    if (lookupModalClose) lookupModalClose.addEventListener('click', () => closeModal(lookupModal));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [authModal, adminModal, myOrdersModal, checkoutModal, lookupModal].forEach(m => {
                if (m && m.classList.contains('active')) closeModal(m);
            });
            stopOrderPolling();
            closeUserDropdown();
        }
    });

    // Cập nhật giao diện thanh điều hướng theo trạng thái đăng nhập
    function updateAuthUI(user) {
        if (user && user.email) {
            // Đã đăng nhập
            if (navAuthIcon) navAuthIcon.style.display = 'none';
            if (navUserAvatar) {
                navUserAvatar.style.display = 'inline-block';
                navUserAvatar.src = user.avatar || 'https://mc-heads.net/avatar/MHF_Steve/32';
            }
            if (navAuthLabel) {
                navAuthLabel.textContent = user.name ? user.name.split(' ')[0] : user.email.split('@')[0];
            }

            // Kiểm tra quyền Admin (Chỉ duy nhất phuy56688@gmail.com)
            const isAdmin = user.role === 'ADMIN';
            if (navAdminCrown) {
                navAdminCrown.style.display = isAdmin ? 'inline-block' : 'none';
            }

            // Dropdown Menu
            if (dropdownUserAvatar) dropdownUserAvatar.src = user.avatar || 'https://mc-heads.net/avatar/MHF_Steve/48';
            if (dropdownUserName) dropdownUserName.textContent = user.name || user.email.split('@')[0];
            if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
            if (dropdownUserRole) {
                dropdownUserRole.textContent = isAdmin ? '👑 QUẢN TRỊ VIÊN' : 'THÀNH VIÊN';
                dropdownUserRole.className = 'badge-role ' + (isAdmin ? 'role-admin' : '');
            }
            if (btnDropdownAdmin) {
                btnDropdownAdmin.style.display = isAdmin ? 'flex' : 'none';
            }
        } else {
            // Khách chưa đăng nhập
            if (navAuthIcon) navAuthIcon.style.display = 'inline-block';
            if (navUserAvatar) navUserAvatar.style.display = 'none';
            if (navAuthLabel) navAuthLabel.textContent = 'Đăng Nhập';
            if (navAdminCrown) navAdminCrown.style.display = 'none';
            if (btnDropdownAdmin) btnDropdownAdmin.style.display = 'none';
        }
    }

    // Toggle Dropdown Menu
    function toggleUserDropdown() {
        if (!userDropdownMenu) return;
        const isActive = userDropdownMenu.classList.toggle('active');
        userDropdownMenu.setAttribute('aria-hidden', !isActive);
    }

    function closeUserDropdown() {
        if (userDropdownMenu && userDropdownMenu.classList.contains('active')) {
            userDropdownMenu.classList.remove('active');
            userDropdownMenu.setAttribute('aria-hidden', 'true');
        }
    }

    if (btnOpenAuth) {
        btnOpenAuth.addEventListener('click', (e) => {
            e.stopPropagation();
            const user = getCurrentUser();
            if (user) {
                toggleUserDropdown();
            } else {
                openModal(authModal);
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (userAuthWidget && !userAuthWidget.contains(e.target)) {
            closeUserDropdown();
        }
    });

    if (btnDropdownLogout) {
        btnDropdownLogout.addEventListener('click', () => {
            closeUserDropdown();
            clearAuthSession();
        });
    }

    if (btnDropdownMyOrders) {
        btnDropdownMyOrders.addEventListener('click', () => {
            closeUserDropdown();
            openMyOrdersModal();
        });
    }

    if (btnDropdownAdmin) {
        btnDropdownAdmin.addEventListener('click', () => {
            closeUserDropdown();
            openAdminDashboardModal();
        });
    }

    // --- Hệ Thống Xác Thực & Quản Lý Tài Khoản (Đa Môi Trường: Cục Bộ + Máy Chủ) ---
    const LOCAL_USERS_KEY = '67b67t_users_db_v6';

    function getLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
        } catch (_) {
            return [];
        }
    }

    function saveLocalUsers(list) {
        try {
            localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list));
        } catch (_) {}
    }

    // Kiểm tra phiên đăng nhập từ máy chủ khi load trang
    async function checkServerSession() {
        const token = getAuthToken();
        if (!token) {
            updateAuthUI(null);
            return;
        }

        // Phiên đăng nhập nội bộ (bắt đầu bằng token_) luôn được duy trì mượt mà
        if (token.startsWith('token_') || token.startsWith('jwt_')) {
            const cachedUser = getCurrentUser();
            if (cachedUser) {
                updateAuthUI(cachedUser);
                return;
            }
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(resolveApiUrl('/auth/me'), {
                headers: { 'Authorization': 'Bearer ' + token },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.success && data.user) {
                    setAuthSession(token, data.user);
                    return;
                }
            }
            if (res.status === 401) {
                clearAuthSession();
            } else {
                updateAuthUI(getCurrentUser());
            }
        } catch (_) {
            updateAuthUI(getCurrentUser());
        }
    }
    checkServerSession();

    // --- Tabs Trong Auth Modal ---
    const tabBtnLogin = document.getElementById('tab-btn-login');
    const tabBtnRegister = document.getElementById('tab-btn-register');
    const tabBtnForgot = document.getElementById('tab-btn-forgot');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const formForgot = document.getElementById('form-forgot');

    function switchAuthTab(tabName) {
        if (authAlertBox) authAlertBox.style.display = 'none';
        [tabBtnLogin, tabBtnRegister, tabBtnForgot].forEach(btn => btn && btn.classList.remove('active'));
        [formLogin, formRegister, formForgot].forEach(form => form && form.classList.remove('active'));

        if (tabName === 'login') {
            if (tabBtnLogin) tabBtnLogin.classList.add('active');
            if (formLogin) formLogin.classList.add('active');
        } else if (tabName === 'register') {
            if (tabBtnRegister) tabBtnRegister.classList.add('active');
            if (formRegister) formRegister.classList.add('active');
        } else if (tabName === 'forgot') {
            if (tabBtnForgot) tabBtnForgot.classList.add('active');
            if (formForgot) formForgot.classList.add('active');
        }
    }

    if (tabBtnLogin) tabBtnLogin.addEventListener('click', () => switchAuthTab('login'));
    if (tabBtnRegister) tabBtnRegister.addEventListener('click', () => switchAuthTab('register'));
    if (tabBtnForgot) tabBtnForgot.addEventListener('click', () => switchAuthTab('forgot'));

    function showAuthAlert(msg, isSuccess = false) {
        if (!authAlertBox) return;
        authAlertBox.className = 'auth-alert ' + (isSuccess ? 'alert-success' : 'alert-error');
        authAlertBox.textContent = msg;
        authAlertBox.style.display = 'block';
        // Hiển thị thêm Toast để người dùng luôn thấy ngay cả khi đang cuộn trang
        if (!isSuccess) {
            showAppleToast('⚠️ ' + msg, 2500);
        }
    }

    // --- Hàm Đăng Nhập Hoàn Chỉnh ---
    async function executeLogin(e) {
        if (e) e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const btnSubmit = document.getElementById('btn-submit-login');

        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const password = passInput ? passInput.value : '';

        if (!email) return showAuthAlert('Vui lòng nhập địa chỉ email');
        if (!email.includes('@') || !email.includes('.')) return showAuthAlert('Địa chỉ email không đúng định dạng');
        if (!password) return showAuthAlert('Vui lòng nhập mật khẩu');
        if (password.length < 6 || password.length > 30) {
            return showAuthAlert('Mật khẩu phải từ 6 đến 30 ký tự');
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span>Đang xác thực...</span>';
        }

        const isAdmin = (email === 'phuy56688@gmail.com');
        let isSuccess = false;

        // 1. Thử gửi lên máy chủ Backend nếu có
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(resolveApiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    setAuthSession(data.token, data.user);
                    isSuccess = true;
                }
            } else {
                const data = await res.json().catch(() => ({}));
                if (data && data.message) {
                    showAuthAlert(data.message);
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = '<span>Đăng Nhập</span>';
                    }
                    return;
                }
            }
        } catch (_) {
            // Máy chủ offline hoặc môi trường tĩnh
        }

        // 2. Chế độ cục bộ dự phòng nếu backend không kết nối
        if (!isSuccess) {
            const users = getLocalUsers();
            let matched = users.find(u => u.email === email);

            if (isAdmin) {
                // Tự động nhận diện tài khoản Admin tuyệt đối
                matched = matched || {
                    id: 1,
                    email: 'phuy56688@gmail.com',
                    name: 'Huy Phạm',
                    role: 'ADMIN',
                    password: password,
                    avatar: 'https://mc-heads.net/avatar/MHF_Steve/64'
                };
                matched.password = password;
                matched.role = 'ADMIN';
                if (!users.some(u => u.email === email)) {
                    users.push(matched);
                    saveLocalUsers(users);
                }
                const mockToken = 'token_adm_' + Date.now();
                setAuthSession(mockToken, matched);
                isSuccess = true;
            } else {
                if (!matched || matched.password !== password) {
                    showAuthAlert('Email hoặc mật khẩu không chính xác');
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = '<span>Đăng Nhập</span>';
                    }
                    return;
                }
                const mockToken = 'token_usr_' + Date.now();
                setAuthSession(mockToken, matched);
                isSuccess = true;
            }
        }

        closeModal(authModal);
        const welcomeMsg = isAdmin ? '👑 Đăng nhập Quản trị viên thành công!' : '✦ Đăng nhập thành công! ✦';
        showAppleToast(welcomeMsg, 3000);

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>Đăng Nhập</span>';
        }
    }

    if (formLogin) formLogin.addEventListener('submit', executeLogin);
    const btnSubmitLogin = document.getElementById('btn-submit-login');
    if (btnSubmitLogin) btnSubmitLogin.addEventListener('click', executeLogin);

    // --- Hàm Đăng Ký Hoàn Chỉnh ---
    async function executeRegister(e) {
        if (e) e.preventDefault();
        const nameInput = document.getElementById('reg-name');
        const emailInput = document.getElementById('reg-email');
        const passInput = document.getElementById('reg-password');
        const btnSubmit = document.getElementById('btn-submit-register');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const password = passInput ? passInput.value : '';

        if (!email) return showAuthAlert('Vui lòng nhập địa chỉ email của bạn');
        if (!email.includes('@') || !email.includes('.')) {
            return showAuthAlert('Địa chỉ email không đúng định dạng (ví dụ: email@gmail.com)');
        }
        if (!password || password.length < 6 || password.length > 30) {
            return showAuthAlert('Mật khẩu phải từ 6 đến 30 ký tự (Hiện có: ' + (password ? password.length : 0) + ' ký tự)');
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span>Đang tạo tài khoản...</span>';
        }

        const isAdmin = (email === 'phuy56688@gmail.com');
        const displayName = name || (isAdmin ? 'Huy Phạm' : email.split('@')[0]);

        const newUser = {
            id: 'u_' + Date.now(),
            email: email,
            name: displayName,
            role: isAdmin ? 'ADMIN' : 'USER',
            password: password,
            avatar: 'https://mc-heads.net/avatar/MHF_Steve/64'
        };

        let isRegistered = false;

        // 1. Thử gửi lên máy chủ backend
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(resolveApiUrl('/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: displayName, email: email, password: password }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    newUser.id = data.user.id;
                    newUser.role = data.user.role;
                    isRegistered = true;
                    setAuthSession(data.token, data.user);
                }
            } else if (res.status === 409) {
                showAuthAlert('Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập.');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<span>Tạo Tài Khoản Mới</span>';
                }
                return;
            }
        } catch (_) {
            // Máy chủ chưa chạy hoặc tĩnh
        }

        // 2. Lưu tài khoản cục bộ đảm bảo luôn thành công
        if (!isRegistered) {
            const localUsers = getLocalUsers();
            const existingIdx = localUsers.findIndex(u => u.email === email);
            if (existingIdx !== -1) {
                if (isAdmin) {
                    localUsers[existingIdx].password = password;
                    localUsers[existingIdx].role = 'ADMIN';
                } else {
                    showAuthAlert('Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập.');
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = '<span>Tạo Tài Khoản Mới</span>';
                    }
                    return;
                }
            } else {
                localUsers.push(newUser);
            }
            saveLocalUsers(localUsers);

            const mockToken = (isAdmin ? 'token_adm_' : 'token_usr_') + Date.now();
            setAuthSession(mockToken, newUser);
        }

        closeModal(authModal);
        const successMsg = isAdmin
            ? '👑 Tạo tài khoản Quản trị viên thành công! Chào mừng Huy Phạm'
            : '✦ Tạo tài khoản thành công! Chào mừng ' + displayName + ' ✦';
        showAppleToast(successMsg, 3500);

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>Tạo Tài Khoản Mới</span>';
        }
    }

    if (formRegister) formRegister.addEventListener('submit', executeRegister);
    const btnSubmitRegister = document.getElementById('btn-submit-register');
    if (btnSubmitRegister) btnSubmitRegister.addEventListener('click', executeRegister);

    // --- Quên Mật Khẩu ---
    const btnSendResetCode = document.getElementById('btn-send-reset-code');
    const forgotStep1 = document.getElementById('forgot-step-1');
    const forgotStep2 = document.getElementById('forgot-step-2');
    const btnSubmitNewPassword = document.getElementById('btn-submit-new-password');

    if (btnSendResetCode) {
        btnSendResetCode.addEventListener('click', async () => {
            const emailInput = document.getElementById('forgot-email');
            const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
            if (!email) return showAuthAlert('Vui lòng nhập địa chỉ email');

            btnSendResetCode.disabled = true;
            try {
                const res = await fetch(resolveApiUrl('/auth/forgot-password'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                showAuthAlert(data.message + (data.reset_code_dev ? ' (Mã: ' + data.reset_code_dev + ')' : ''), true);
                if (forgotStep1) forgotStep1.style.display = 'none';
                if (forgotStep2) forgotStep2.style.display = 'block';
            } catch (_) {
                const mockCode = String(Math.floor(100000 + Math.random() * 900000));
                localStorage.setItem('local_reset_' + email, mockCode);
                showAuthAlert('Mã xác nhận khôi phục của bạn là: ' + mockCode, true);
                if (forgotStep1) forgotStep1.style.display = 'none';
                if (forgotStep2) forgotStep2.style.display = 'block';
                const codeInput = document.getElementById('reset-code');
                if (codeInput) codeInput.value = mockCode;
            } finally {
                btnSendResetCode.disabled = false;
            }
        });
    }

    if (btnSubmitNewPassword) {
        btnSubmitNewPassword.addEventListener('click', async () => {
            const email = (document.getElementById('forgot-email')?.value || '').trim().toLowerCase();
            const code = (document.getElementById('reset-code')?.value || '').trim();
            const newPassword = document.getElementById('reset-new-password')?.value || '';

            if (!code || !newPassword || newPassword.length < 6 || newPassword.length > 30) {
                return showAuthAlert('Vui lòng nhập mã xác nhận và mật khẩu mới từ 6 đến 30 ký tự');
            }
            btnSubmitNewPassword.disabled = true;
            try {
                const res = await fetch(resolveApiUrl('/auth/reset-password'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code, newPassword })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    showAuthAlert(data.message || 'Không thể đặt lại mật khẩu');
                    return;
                }
                showAuthAlert(data.message, true);
                setTimeout(() => switchAuthTab('login'), 1500);
            } catch (_) {
                const savedCode = localStorage.getItem('local_reset_' + email);
                if (savedCode && savedCode === code) {
                    const users = getLocalUsers();
                    const u = users.find(x => x.email === email);
                    if (u) {
                        u.password = newPassword;
                        saveLocalUsers(users);
                    }
                    showAuthAlert('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.', true);
                    setTimeout(() => switchAuthTab('login'), 1500);
                } else {
                    showAuthAlert('Mã xác nhận không chính xác');
                }
            } finally {
                btnSubmitNewPassword.disabled = false;
            }
        });
    }

    
    // --- Cửa Hàng Rank Plus (Giá Mới: 5.000 VNĐ - Giảm 90%) ---

    const storeUsernameInput = document.getElementById('store-mc-username');
    const storeAvatarImg = document.getElementById('store-avatar-img');
    const storeInputStatus = document.getElementById('store-input-status');
    const storeInputHint = document.getElementById('store-input-hint');
    const btnOpenCheckout = document.getElementById('btn-open-checkout');
    const btnOpenLookup = document.getElementById('btn-open-lookup');

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
    function stopOrderPolling() {
        if (activePollingInterval) {
            clearInterval(activePollingInterval);
            activePollingInterval = null;
        }
    }

    // Mua Rank Plus: Kích hoạt quy trình tạo đơn hàng
    if (btnOpenCheckout) {
        btnOpenCheckout.addEventListener('click', async () => {
            // 1. Yêu cầu đăng nhập trước khi mua
            const currentUser = getCurrentUser();
            if (!currentUser || !currentUser.email) {
                showAppleToast('⚠️ Bạn chưa đăng nhập! Vui lòng đăng ký tài khoản trước khi mua Rank Plus.', 3500);
                switchAuthTab('register');
                openModal(authModal);
                return;
            }

            // 2. Yêu cầu nhập đúng tên nhân vật Minecraft in-game
            const username = storeUsernameInput ? storeUsernameInput.value.trim() : '';
            if (!username || !MC_NAME_REGEX.test(username)) {
                if (storeUsernameInput) {
                    storeUsernameInput.focus();
                    storeUsernameInput.parentElement.classList.add('shake');
                    setTimeout(() => storeUsernameInput.parentElement.classList.remove('shake'), 400);
                }
                showAppleToast('⚠️ Vui lòng nhập đúng tên nhân vật Minecraft in-game (3-16 ký tự, chỉ gồm chữ, số, _)!', 3500);
                return;
            }

            // 3. Nội dung chuyển khoản ngẫu nhiên từ 1 đến 670: {random}-{username} (Ví dụ: 456-{username})
            const randomCode = Math.floor(Math.random() * 670) + 1;
            const transferContent = randomCode + '-' + username;

            openModal(checkoutModal);
            checkoutModalBody.innerHTML = '<div style="text-align: center; padding: 40px 10px;">' +
                '<div class="pulse-dot" style="margin: 0 auto 16px; width: 14px; height: 14px; background: #2997ff;"></div>' +
                '<p style="color: var(--text-secondary); font-size: 0.95rem;">Đang tạo đơn hàng Rank Plus (5.000 VNĐ)...</p>' +
                '</div>';

            const localOrderId = '261108_' + Math.floor(1000000000 + Math.random() * 9000000000);
            let orderCreatedData = {
                order_id: localOrderId,
                username: username,
                amount: 5000,
                old_amount: 50000,
                discount_percent: 90,
                manual_payment: {
                    bankName: 'ZaloPay',
                    accountNo: '0388311614',
                    accountName: 'PHAN NGUYEN GIA HUY',
                    transferContent: transferContent,
                    qrUrl: 'assets/qr-payment.png'
                }
            };

            try {
                const token = getAuthToken();
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = 'Bearer ' + token;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const response = await fetch(resolveApiUrl('/payment/create'), {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ username: username, transferContent: transferContent }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.success) {
                        orderCreatedData = data;
                        if (orderCreatedData.manual_payment) {
                            orderCreatedData.manual_payment.transferContent = transferContent;
                            orderCreatedData.manual_payment.qrUrl = 'assets/qr-payment.png';
                        }
                    }
                }
            } catch (_) {
                // Tiếp tục với dữ liệu dự phòng không bao giờ lỗi
            }

            // Render giao diện thanh toán với QR code của bạn và nội dung chuyển ngẫu nhiên 1-670-username
            renderManualCheckoutView(orderCreatedData, username, transferContent);
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

    // Render quy trình thanh toán thủ công 5.000 VNĐ + QR Image + Nội dung CK random
    function renderManualCheckoutView(orderData, username, customTransferContent) {
        const orderId = orderData.order_id;
        const amount = orderData.amount || 5000;
        const oldAmount = orderData.old_amount || 50000;
        const transferContent = customTransferContent || (orderData.manual_payment ? orderData.manual_payment.transferContent : (Math.floor(Math.random() * 670) + 1 + '-' + username));

        const manual = {
            bankName: (orderData.manual_payment && orderData.manual_payment.bankName) || 'ZaloPay',
            accountNo: (orderData.manual_payment && orderData.manual_payment.accountNo) || '0388311614',
            accountName: (orderData.manual_payment && orderData.manual_payment.accountName) || 'PHAN NGUYEN GIA HUY',
            transferContent: transferContent,
            qrUrl: 'assets/qr-payment.png'
        };

        let html = '<div class="checkout-order-summary">' +
            '<img src="https://mc-heads.net/avatar/' + encodeURIComponent(username) + '/52" alt="' + username + '" class="checkout-avatar" onerror="this.src=\'https://mc-heads.net/avatar/MHF_Steve/52\'">' +
            '<div class="checkout-meta">' +
            '<strong>' + username + ' &bull; Rank Plus</strong>' +
            '<div class="checkout-order-id">Mã đơn: ' + orderId + '</div>' +
            '<div class="checkout-amount"><del style="color: var(--text-tertiary); font-size: 0.88rem; margin-right: 6px;">' + oldAmount.toLocaleString('vi-VN') + ' đ</del> <span style="color: #30d158; font-weight: 800;">' + amount.toLocaleString('vi-VN') + ' VNĐ</span> <span class="badge-tag-discount">-90%</span></div>' +
            '</div>' +
            '</div>';

        html += '<div class="manual-payment-box">' +
            '<div style="text-align: center; margin-bottom: 14px;">' +
            '<span style="font-size: 0.82rem; font-weight: 700; color: #ff9f0a; letter-spacing: 0.06em; text-transform: uppercase;">BƯỚC 1: QUÉT MÃ QR & CHUYỂN KHOẢN 5.000 VNĐ</span>' +
            '</div>' +
            '<div style="text-align: center; margin-bottom: 16px;">' +
            '<div class="payment-qr-frame" style="display: inline-block; padding: 10px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">' +
            '<img src="' + manual.qrUrl + '" alt="QR Thanh toán Rank Plus" style="width: 210px; height: 210px; display: block; border-radius: 8px; object-fit: contain;">' +
            '</div>' +
            '<p style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 8px;">Quét mã QR bằng App Ngân Hàng, ZaloPay hoặc MoMo</p>' +
            '</div>' +
            '<div class="manual-bank-row">' +
            '<span>Ngân hàng:</span><span class="bank-val">' + manual.bankName + '</span>' +
            '</div>' +
            '<div class="manual-bank-row">' +
            '<span>Số tài khoản:</span>' +
            '<div><span class="bank-val">' + manual.accountNo + '</span><button type="button" class="btn-copy-mini" onclick="navigator.clipboard.writeText(\'' + manual.accountNo + '\'); showAppleToast(\'Đã sao chép số tài khoản!\', 2000);">Sao Chép</button></div>' +
            '</div>' +
            '<div class="manual-bank-row">' +
            '<span>Chủ tài khoản:</span><span class="bank-val">' + manual.accountName + '</span>' +
            '</div>' +
            '<div class="manual-bank-row">' +
            '<span>Số tiền:</span><span class="bank-val" style="color: #30d158; font-weight: 800; font-size: 1.05rem;">5.000 VNĐ</span>' +
            '</div>' +
            '<div class="manual-bank-row" style="background: rgba(41, 151, 255, 0.12); border: 1.5px solid rgba(41, 151, 255, 0.4); border-radius: 12px; padding: 12px 14px; margin-top: 10px;">' +
            '<span style="font-weight: 700; color: #ffffff;">Nội dung CK:</span>' +
            '<div><span class="bank-val" style="color: #2997ff; font-weight: 800; font-size: 1.15rem; letter-spacing: 0.5px;">' + manual.transferContent + '</span><button type="button" class="btn-copy-mini" onclick="navigator.clipboard.writeText(\'' + manual.transferContent + '\'); showAppleToast(\'Đã sao chép nội dung: ' + manual.transferContent + '\', 2500);" style="margin-left: 8px;">Sao Chép</button></div>' +
            '</div>' +
            '<p style="font-size: 0.78rem; color: #ff9f0a; margin-top: 6px; text-align: center;">⚠️ Bắt buộc ghi đúng nội dung <strong>' + manual.transferContent + '</strong> khi chuyển tiền để Admin duyệt đúng nhân vật Minecraft của bạn.</p>' +
            '</div>';

        // Form BƯỚC 2: Gửi biên lai
        html += '<form id="form-submit-receipt" class="receipt-upload-form">' +
            '<h5>BƯỚC 2: GỬI BIÊN LAI XÁC NHẬN CHO ADMIN</h5>' +
            '<p>Sau khi chuyển khoản 5.000đ với nội dung <strong>' + manual.transferContent + '</strong>, vui lòng tải ảnh chụp màn hình hoặc nhập mã giao dịch để Admin kiểm tra và duyệt rank.</p>' +
            '<div class="file-input-wrap">' +
            '<label for="receipt-file-input" class="custom-file-upload" id="receipt-file-label">' +
            '📷 Nhấp để tải ảnh biên lai (PNG, JPG)' +
            '</label>' +
            '<input type="file" id="receipt-file-input" accept="image/*" style="display: none;">' +
            '</div>' +
            '<div style="margin-bottom: 14px;">' +
            '<input type="text" id="receipt-note-input" class="store-input" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; width: 100%; font-size: 0.88rem;" placeholder="Mã giao dịch ngân hàng / tên người chuyển...">' +
            '</div>' +
            '<button type="submit" class="btn btn-apple-primary btn-block" id="btn-send-receipt">' +
            '<span>Gửi Biên Lai Xác Nhận</span>' +
            '</button>' +
            '</form>';

        html += '<div id="checkout-dynamic-status" style="margin-top: 14px;"></div>';

        checkoutModalBody.innerHTML = html;

        // Xử lý đổi tên file khi chọn ảnh
        const fileInput = document.getElementById('receipt-file-input');
        const fileLabel = document.getElementById('receipt-file-label');
        if (fileInput && fileLabel) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files && fileInput.files[0]) {
                    fileLabel.textContent = '✔ Đã chọn: ' + fileInput.files[0].name;
                    fileLabel.style.borderColor = '#30d158';
                    fileLabel.style.color = '#30d158';
                }
            });
        }

        // Xử lý nộp form biên lai
        const formReceipt = document.getElementById('form-submit-receipt');
        if (formReceipt) {
            formReceipt.addEventListener('submit', async (e) => {
                e.preventDefault();
                const note = document.getElementById('receipt-note-input').value.trim();
                const file = fileInput && fileInput.files ? fileInput.files[0] : null;
                const btnSubmit = document.getElementById('btn-send-receipt');

                if (!file && !note) {
                    showAppleToast('⚠️ Vui lòng chọn ảnh chụp biên lai hoặc nhập mã giao dịch!', 3000);
                    return;
                }

                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = '<span>Đang gửi biên lai...</span>';
                }

                let submittedSuccess = false;
                try {
                    const formData = new FormData();
                    if (file) formData.append('receipt_image', file);
                    if (note) formData.append('receipt_note', note);

                    const res = await fetch(resolveApiUrl('/order/' + encodeURIComponent(orderId) + '/submit-receipt'), {
                        method: 'POST',
                        body: formData
                    });
                    const resData = await res.json();
                    if (res.ok && resData.success) {
                        submittedSuccess = true;
                    }
                } catch (_) {
                    // Fallback cục bộ
                }

                // Lưu vào lịch sử đơn hàng của người dùng trên máy
                const localOrdersKey = '67b67t_local_orders';
                const localOrders = JSON.parse(localStorage.getItem(localOrdersKey) || '[]');
                localOrders.unshift({
                    order_id: orderId,
                    username: username,
                    rank_name: 'Rank Plus',
                    amount: 5000,
                    status: 'AWAITING_REVIEW',
                    transfer_content: manual.transferContent,
                    receipt_note: note || (file ? file.name : ''),
                    created_at: new Date().toLocaleString('vi-VN')
                });
                localStorage.setItem(localOrdersKey, JSON.stringify(localOrders));

                // Hiển thị trạng thái CHỜ DUYỆT
                renderAwaitingReviewState(orderId, username);
            });
        }
    }

    
    // Hiển thị trạng thái CHỜ DUYỆT & bắt đầu Polling kiểm tra Admin duyệt
    function renderAwaitingReviewState(orderId, username, messageText) {
        checkoutModalBody.innerHTML = '<div style="text-align: center; padding: 20px 10px;">' +
            '<div style="font-size: 2.8rem; margin-bottom: 12px;">⏳</div>' +
            '<h4 style="color: #ff9f0a; font-size: 1.25rem; font-weight: 750; margin-bottom: 10px;">ĐANG CHỜ DUYỆT ĐƠN HÀNG</h4>' +
            '<div style="background: rgba(255, 159, 10, 0.08); border: 1px solid rgba(255, 159, 10, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 20px; text-align: left; line-height: 1.6; font-size: 0.92rem; color: #f5f5f7;">' +
            '<p style="margin-bottom: 10px;">' + (messageText || 'Thanh toán của bạn đã được ghi nhận và đang chờ quản trị viên kiểm tra.<br>Rank Plus của bạn sẽ được xét duyệt trong vòng 24 giờ.<br>Vui lòng giữ lại biên lai thanh toán.') + '</p>' +
            '<div style="font-size: 0.82rem; color: var(--text-tertiary);">' +
            'Mã đơn: <code class="mono-code" style="color: #2997ff;">' + orderId + '</code> &bull; Nhân vật: <strong>' + username + '</strong>' +
            '</div>' +
            '</div>' +
            '<div class="payment-status-pulsing" style="margin-bottom: 20px;">' +
            '<span class="pulse-dot"></span>' +
            '<span>Hệ thống đang tự động theo dõi trạng thái duyệt...</span>' +
            '</div>' +
            '<div style="display: flex; gap: 10px;">' +
            '<button type="button" class="btn btn-apple-primary btn-block" onclick="document.getElementById(\'checkout-modal-close\').click()">' +
            '<span>Đóng Cửa Sổ</span>' +
            '</button>' +
            '</div>' +
            '</div>';

        // Bắt đầu Polling định kỳ 4 giây kiểm tra xem Admin đã duyệt hay từ chối chưa
        startOrderPolling(orderId, username);
    }

    function startOrderPolling(orderId, username) {
        stopOrderPolling();
        activePollingInterval = setInterval(async () => {
            try {
                const res = await fetch(resolveApiUrl('/order/status/' + encodeURIComponent(orderId)));
                if (!res.ok) return;
                const data = await res.json();
                if (data.success && data.order) {
                    const status = data.order.status;
                    if (status === 'APPROVED' || status === 'DELIVERED') {
                        stopOrderPolling();
                        renderOrderApproved(data.order, username);
                    } else if (status === 'REJECTED') {
                        stopOrderPolling();
                        renderOrderRejected(data.order, username);
                    }
                }
            } catch (_) {}
        }, 4000);
    }

    function renderOrderApproved(order, username) {
        triggerSparkBurst(window.innerWidth / 2, window.innerHeight / 2, 70);
        showAppleToast('✦ Đơn hàng đã được duyệt thành công! ✦', 3500);

        checkoutModalBody.innerHTML = '<div class="payment-success-card">' +
            '<div class="payment-success-badge">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="20 6 9 17 4 12"></polyline>' +
            '</svg>' +
            '</div>' +
            '<h4 style="color: #30d158; font-size: 1.4rem; font-weight: 800;">ĐƠN HÀNG ĐÃ ĐƯỢC DUYỆT!</h4>' +
            '<p style="margin: 12px 0 18px; font-size: 0.95rem; color: #ffffff;">' +
            'Chúc mừng! Đơn hàng của bạn đã được duyệt. Rank Plus đã được cấp cho tài khoản Minecraft của bạn.' +
            '</p>' +
            '<div class="payment-success-details">' +
            '<div class="detail-row"><span>Mã đơn hàng:</span><strong class="mono-code">' + order.order_id + '</strong></div>' +
            '<div class="detail-row"><span>Tài khoản Minecraft:</span><strong>' + username + '</strong></div>' +
            '<div class="detail-row"><span>Đặc quyền đã mở:</span><strong style="color: #30d158;">4 Home &amp; 5 Ender Chest</strong></div>' +
            '</div>' +
            '<div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem; color: var(--text-secondary);">' +
            '👉 Bạn có thể vào máy chủ <strong>67b67t.site</strong> và gõ lệnh <code>/checkrank</code> hoặc <code>/ec 2</code> ngay bây giờ!' +
            '</div>' +
            '<button type="button" class="btn btn-apple-primary btn-block" onclick="document.getElementById(\'checkout-modal-close\').click()">' +
            '<span>Hoàn Tất</span>' +
            '</button>' +
            '</div>';
    }

    function renderOrderRejected(order, username) {
        checkoutModalBody.innerHTML = '<div style="text-align: center; padding: 24px 10px;">' +
            '<div style="font-size: 3rem; margin-bottom: 12px;">❌</div>' +
            '<h4 style="color: #ff6961; font-size: 1.3rem; font-weight: 750;">ĐƠN HÀNG BỊ TỪ CHỐI</h4>' +
            '<p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">Đơn hàng của bạn không thể được duyệt do thông tin chưa trùng khớp.</p>' +
            '<div style="background: rgba(255, 69, 58, 0.08); border: 1px solid rgba(255, 69, 58, 0.3); border-radius: 10px; padding: 16px; margin-bottom: 20px; text-align: left;">' +
            '<strong style="color: #ff6961; display: block; margin-bottom: 4px;">Lý do từ chối:</strong>' +
            '<span style="font-size: 0.88rem; color: #ffffff;">' + (order.rejection_reason || 'Chưa nhận được giao dịch hoặc thông tin biên lai không hợp lệ.') + '</span>' +
            '</div>' +
            '<button type="button" class="btn btn-apple-subtle btn-block" onclick="document.getElementById(\'checkout-modal-close\').click()">' +
            '<span>Đóng</span>' +
            '</button>' +
            '</div>';
    }

    // --- Admin Dashboard Controller (Dành riêng cho phuy56688@gmail.com) ---
    const adminOrdersContainer = document.getElementById('admin-orders-container');
    const adminStatTotal = document.getElementById('admin-stat-total');
    const adminStatPending = document.getElementById('admin-stat-pending');
    const adminStatApproved = document.getElementById('admin-stat-approved');
    const adminStatRevenue = document.getElementById('admin-stat-revenue');
    const btnAdminRefresh = document.getElementById('btn-admin-refresh');
    const adminSearchInput = document.getElementById('admin-search-input');
    const filterPills = document.querySelectorAll('.filter-pill');

    let currentAdminFilter = 'ALL';

    function openAdminDashboardModal() {
        const user = getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            alert('Quyền hạn bị từ chối! Bạn không phải là quản trị viên hệ thống.');
            return;
        }
        openModal(adminModal);
        loadAdminDashboardData();
    }

    async function loadAdminDashboardData() {
        const token = getAuthToken();
        if (!token) return;

        try {
            // 1. Tải số liệu thống kê Dashboard
            const resStats = await fetch(resolveApiUrl('/admin/dashboard'), {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const dataStats = await resStats.json();
            if (resStats.ok && dataStats.success && dataStats.stats) {
                const s = dataStats.stats;
                if (adminStatTotal) adminStatTotal.textContent = s.totalOrders || 0;
                if (adminStatPending) adminStatPending.textContent = s.pendingReview || 0;
                if (adminStatApproved) adminStatApproved.textContent = s.approvedOrders || 0;
                if (adminStatRevenue) adminStatRevenue.textContent = (s.totalRevenue || 0).toLocaleString('vi-VN') + ' đ';
            }

            // 2. Tải danh sách đơn hàng
            loadAdminOrdersList();

        } catch (err) {
            console.error('[Load Admin Dashboard Error]', err);
        }
    }

    async function loadAdminOrdersList() {
        if (!adminOrdersContainer) return;
        const token = getAuthToken();
        if (!token) return;

        const q = adminSearchInput ? adminSearchInput.value.trim() : '';
        const url = resolveApiUrl('/admin/orders?status=' + encodeURIComponent(currentAdminFilter) + '&q=' + encodeURIComponent(q));

        adminOrdersContainer.innerHTML = '<div class="text-center" style="padding: 30px;"><div class="pulse-dot" style="margin: 0 auto 12px;"></div><p style="color: var(--text-secondary); font-size: 0.85rem;">Đang tải danh sách đơn...</p></div>';

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();

            if (!res.ok || !data.success || !data.orders || data.orders.length === 0) {
                adminOrdersContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-tertiary);"><p>Không có đơn hàng nào phù hợp với bộ lọc hiện tại.</p></div>';
                return;
            }

            let html = '';
            data.orders.forEach(ord => {
                let badgeClass = 'badge-pending';
                let badgeText = 'Chờ thanh toán';

                if (ord.status === 'AWAITING_REVIEW') {
                    badgeClass = 'badge-awaiting';
                    badgeText = '⚡ Chờ Admin Duyệt';
                } else if (ord.status === 'APPROVED' || ord.status === 'DELIVERED') {
                    badgeClass = 'badge-approved';
                    badgeText = '✔ Đã Duyệt (Cấp Rank)';
                } else if (ord.status === 'APPROVED_PENDING_DELIVERY') {
                    badgeClass = 'badge-approved';
                    badgeText = '⏳ Đã Duyệt (Chờ Server Online)';
                } else if (ord.status === 'REJECTED') {
                    badgeClass = 'badge-rejected';
                    badgeText = '✖ Đã Từ Chối';
                }

                const createdDate = ord.created_at ? new Date(ord.created_at).toLocaleString('vi-VN') : '';
                const buyerEmail = ord.buyer_email || 'Khách vãng lai';

                let receiptSection = '<span style="color: var(--text-tertiary);">Chưa nộp biên lai</span>';
                if (ord.receipt_url || ord.receipt_note) {
                    receiptSection = '<div class="admin-receipt-preview">';
                    if (ord.receipt_url) {
                        receiptSection += '<a href="' + ord.receipt_url + '" target="_blank" class="admin-receipt-link">📷 Xem ảnh biên lai đính kèm</a><br>';
                    }
                    if (ord.receipt_note) {
                        receiptSection += '<span style="font-size: 0.8rem; color: #dfdfe2;">Ghi chú: ' + ord.receipt_note + '</span>';
                    }
                    receiptSection += '</div>';
                }

                const isApproved = ord.status === 'APPROVED' || ord.status === 'DELIVERED' || ord.status === 'APPROVED_PENDING_DELIVERY';

                let actionBtns = '';
                if (!isApproved) {
                    actionBtns += '<button type="button" class="btn-admin-approve" onclick="adminApproveOrder(\'' + ord.order_id + '\')">✔ Duyệt Đơn &amp; Cấp Rank</button>';
                    actionBtns += '<button type="button" class="btn-admin-reject" onclick="adminRejectOrder(\'' + ord.order_id + '\')">✖ Từ Chối</button>';
                } else {
                    actionBtns += '<span style="color: #30d158; font-size: 0.82rem; font-weight: 600;">✔ Đã duyệt bởi ' + (ord.reviewed_by || 'Admin') + '</span>';
                }

                html += '<div class="admin-order-card">' +
                    '<div class="admin-order-header">' +
                    '<div class="admin-order-user-info">' +
                    '<img src="https://mc-heads.net/avatar/' + encodeURIComponent(ord.username) + '/44" alt="' + ord.username + '" class="admin-mc-avatar" onerror="this.src=\'https://mc-heads.net/avatar/MHF_Steve/44\'">' +
                    '<div class="admin-mc-meta">' +
                    '<strong>' + ord.username + '</strong>' +
                    '<span>' + buyerEmail + ' &bull; ' + createdDate + '</span>' +
                    '</div>' +
                    '</div>' +
                    '<div>' +
                    '<span class="admin-order-id-badge">#' + ord.order_id + '</span> ' +
                    '<span class="order-badge ' + badgeClass + '">' + badgeText + '</span>' +
                    '</div>' +
                    '</div>' +
                    '<div class="admin-order-body">' +
                    '<div>' +
                    '<strong style="display: block; font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 4px;">Chứng từ thanh toán:</strong>' +
                    receiptSection +
                    '</div>' +
                    '<div style="text-align: right;">' +
                    '<strong style="display: block; font-size: 1.15rem; color: #30d158;">' + (ord.amount || 5000).toLocaleString('vi-VN') + ' đ</strong>' +
                    '<span style="font-size: 0.78rem; color: var(--text-tertiary);">Gói Rank Plus</span>' +
                    '</div>' +
                    '</div>' +
                    '<div class="admin-order-actions">' +
                    actionBtns +
                    '</div>' +
                    '</div>';
            });

            adminOrdersContainer.innerHTML = html;

        } catch (err) {
            console.error('[Load Admin Orders Error]', err);
            adminOrdersContainer.innerHTML = '<p class="text-center" style="color: #ff6961;">Lỗi tải dữ liệu đơn hàng.</p>';
        }
    }

    // Các hàm duyệt & từ chối đơn hàng toàn cục cho Admin
    window.adminApproveOrder = async function(orderId) {
        if (!confirm('Xác nhận DUYỆT đơn hàng #' + orderId + ' và gửi lệnh cấp Rank Plus ngay lập tức vào máy chủ Minecraft?')) {
            return;
        }
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(resolveApiUrl('/admin/orders/' + encodeURIComponent(orderId) + '/approve'), {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || 'Lỗi duyệt đơn hàng');
                return;
            }
            alert(data.message);
            loadAdminDashboardData();
        } catch (err) {
            alert('Lỗi kết nối khi duyệt đơn');
        }
    };

    window.adminRejectOrder = async function(orderId) {
        const reason = prompt('Nhập lý do từ chối đơn hàng #' + orderId + ':', 'Biên lai không hợp lệ hoặc chưa nhận được tiền trong tài khoản.');
        if (reason === null) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(resolveApiUrl('/admin/orders/' + encodeURIComponent(orderId) + '/reject'), {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || 'Lỗi từ chối đơn hàng');
                return;
            }
            alert('Đã từ chối đơn hàng #' + orderId);
            loadAdminDashboardData();
        } catch (err) {
            alert('Lỗi kết nối khi từ chối đơn');
        }
    };

    // Filter pills click
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentAdminFilter = pill.getAttribute('data-status') || 'ALL';
            loadAdminOrdersList();
        });
    });

    if (btnAdminRefresh) btnAdminRefresh.addEventListener('click', loadAdminDashboardData);
    if (adminSearchInput) {
        adminSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadAdminOrdersList();
            }
        });
    }

    // --- My Orders Modal Controller (Lịch Sử Đơn Hàng Của Tôi) ---
    async function openMyOrdersModal() {
        const token = getAuthToken();
        if (!token) {
            openModal(authModal);
            return;
        }

        openModal(myOrdersModal);
        if (!myOrdersContent) return;

        myOrdersContent.innerHTML = '<div style="text-align: center; padding: 30px;"><div class="pulse-dot" style="margin: 0 auto 12px;"></div><p style="color: var(--text-secondary); font-size: 0.85rem;">Đang tải danh sách đơn của bạn...</p></div>';

        try {
            const res = await fetch(resolveApiUrl('/order/my-orders'), {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();

            if (!res.ok || !data.success || !data.orders || data.orders.length === 0) {
                myOrdersContent.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-tertiary);"><p>Bạn chưa có đơn hàng nào.</p><a href="#store" onclick="document.getElementById(\'my-orders-close\').click();" class="btn btn-apple-primary" style="margin-top: 14px; display: inline-block;"><span>Đến Cửa Hàng Mua Rank Plus</span></a></div>';
                return;
            }

            let html = '';
            data.orders.forEach(ord => {
                let badgeClass = 'badge-pending';
                let badgeText = 'Chờ thanh toán';
                let statusNotice = 'Đang chờ bạn chuyển khoản 5.000đ và gửi biên lai.';

                if (ord.status === 'AWAITING_REVIEW') {
                    badgeClass = 'badge-awaiting';
                    badgeText = '⚡ Đang Chờ Admin Duyệt';
                    statusNotice = 'Thanh toán của bạn đã được ghi nhận và đang chờ quản trị viên kiểm tra.<br>Rank Plus của bạn sẽ được xét duyệt trong vòng 24 giờ. Vui lòng giữ lại biên lai thanh toán.';
                } else if (ord.status === 'APPROVED' || ord.status === 'DELIVERED') {
                    badgeClass = 'badge-approved';
                    badgeText = '✔ Đã Duyệt (Cấp Rank)';
                    statusNotice = 'Chúc mừng! Đơn hàng của bạn đã được duyệt. Rank Plus đã được cấp cho tài khoản Minecraft của bạn.';
                } else if (ord.status === 'APPROVED_PENDING_DELIVERY') {
                    badgeClass = 'badge-approved';
                    badgeText = '⏳ Đã Duyệt (Chờ Server Online)';
                    statusNotice = 'Đơn hàng của bạn đã được duyệt! Server Minecraft đang khởi động lại và sẽ tự động cấp rank ngay khi online.';
                } else if (ord.status === 'REJECTED') {
                    badgeClass = 'badge-rejected';
                    badgeText = '✖ Bị Từ Chối';
                    statusNotice = 'Đơn hàng đã bị từ chối. Lý do: ' + (ord.rejection_reason || 'Thông tin thanh toán không hợp lệ.');
                }

                const createdDate = ord.created_at ? new Date(ord.created_at).toLocaleString('vi-VN') : '';

                html += '<div class="lookup-order-card" style="margin-bottom: 14px;">' +
                    '<div class="lookup-order-top">' +
                    '<span class="lookup-order-id">#' + ord.order_id + '</span>' +
                    '<span class="order-badge ' + badgeClass + '">' + badgeText + '</span>' +
                    '</div>' +
                    '<div class="lookup-order-bottom" style="margin-bottom: 10px;">' +
                    '<span>Nhân vật: <strong>' + ord.username + '</strong></span>' +
                    '<span style="color: #30d158; font-weight: 700;">' + (ord.amount || 5000).toLocaleString('vi-VN') + ' đ &bull; ' + createdDate + '</span>' +
                    '</div>' +
                    '<div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 10px; font-size: 0.82rem; color: #dfdfe2; line-height: 1.45;">' +
                    statusNotice +
                    '</div>' +
                    '</div>';
            });

            myOrdersContent.innerHTML = html;

        } catch (err) {
            console.error('[My Orders Error]', err);
            myOrdersContent.innerHTML = '<p class="text-center" style="color: #ff6961;">Lỗi tải lịch sử đơn hàng.</p>';
        }
    }

    // --- Tra Cứu Công Khai (Lookup Handler) ---
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

                if (ord.status === 'AWAITING_REVIEW') {
                    badgeClass = 'badge-awaiting';
                    badgeText = '⚡ Chờ Duyệt';
                } else if (ord.status === 'APPROVED' || ord.status === 'DELIVERED') {
                    badgeClass = 'badge-approved';
                    badgeText = '✔ Đã Cấp Rank Plus';
                } else if (ord.status === 'APPROVED_PENDING_DELIVERY') {
                    badgeClass = 'badge-approved';
                    badgeText = '⏳ Đã Duyệt (Chờ Server Online)';
                } else if (ord.status === 'REJECTED') {
                    badgeClass = 'badge-rejected';
                    badgeText = '✖ Thất Bại / Từ Chối';
                }

                const createdDate = ord.created_at ? new Date(ord.created_at).toLocaleString('vi-VN') : 'Mới tạo';

                html += '<div class="lookup-order-card">' +
                    '<div class="lookup-order-top">' +
                    '<span class="lookup-order-id">#' + ord.order_id + '</span>' +
                    '<span class="order-badge ' + badgeClass + '">' + badgeText + '</span>' +
                    '</div>' +
                    '<div class="lookup-order-bottom">' +
                    '<span>Tài khoản: <strong>' + ord.username + '</strong></span>' +
                    '<span>' + (ord.amount || 5000).toLocaleString('vi-VN') + ' đ &bull; ' + createdDate + '</span>' +
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

    if (btnOpenLookup) btnOpenLookup.addEventListener('click', () => openModal(lookupModal));
});
