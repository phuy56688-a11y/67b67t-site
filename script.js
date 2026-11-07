/**
 * 67B67T — Apple-Inspired Interactive Controller
 * Ultra-lightweight, high frame-rate responsiveness
 */

document.addEventListener('DOMContentLoaded', () => {
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
});
