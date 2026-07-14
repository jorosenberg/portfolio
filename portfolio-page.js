/* jshint esversion: 8 */

let hasPlayedIntro = false;

function runPortfolioIntro() {
    const leftCol = document.getElementById('portfolio-left');
    const rightCol = document.getElementById('portfolio-right');
    const asciiWrapper = document.getElementById('ascii-wrapper');
    const titleContainer = document.getElementById('ascii-title-container');
    const uploadContainer = document.getElementById('ascii-upload-container');
    const controls = document.getElementById('ascii-controls');

    if (!leftCol || !rightCol) return;

    const allTransitioned = [leftCol, rightCol, titleContainer, uploadContainer, controls, asciiWrapper];

    // Step 1: Disable transitions so initial state is set instantly (no snap)
    allTransitioned.forEach(el => {
        if (el) el.classList.remove('layout-transition');
    });

    // Set initial centered state
    leftCol.classList.add('opacity-0', 'w-0', 'overflow-hidden');
    leftCol.classList.remove('lg:w-1/3');
    rightCol.classList.remove('lg:w-2/3');
    rightCol.classList.add('w-full');

    [titleContainer, uploadContainer, controls].forEach(el => {
        if (el) {
            el.classList.remove('grid-rows-[1fr]');
            el.classList.add('grid-rows-[0fr]', 'opacity-0');
        }
    });

    if (asciiWrapper) {
        asciiWrapper.classList.remove('h-[400px]');
        asciiWrapper.classList.add('h-[60vh]');
    }

    // Step 2: After two animation frames the browser has painted the initial state.
    // Re-enable transitions so the reveal animation is smooth.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            allTransitioned.forEach(el => {
                if (el) el.classList.add('layout-transition');
            });

            // Step 3: After 1.5s, animate everything into its final position
            setTimeout(() => {
                leftCol.classList.remove('w-0', 'overflow-hidden');
                leftCol.classList.add('lg:w-1/3');
                rightCol.classList.remove('w-full');
                rightCol.classList.add('lg:w-2/3');

                if (asciiWrapper) {
                    asciiWrapper.classList.remove('h-[60vh]');
                    asciiWrapper.classList.add('h-[400px]');
                }

                [titleContainer, uploadContainer, controls].forEach(el => {
                    if (el) {
                        el.classList.remove('grid-rows-[0fr]');
                        el.classList.add('grid-rows-[1fr]');
                    }
                });

                // Keep ASCII fitting the container throughout the transition
                const start = performance.now();
                const duration = 1250;
                function smoothFit(now) {
                    if (typeof fitAsciiToContainer === 'function') fitAsciiToContainer();
                    if (now - start < duration) requestAnimationFrame(smoothFit);
                }
                requestAnimationFrame(smoothFit);

                // After layout transition completes, fade in text/controls
                setTimeout(() => {
                    leftCol.classList.remove('opacity-0');
                    // Fade the projects panel in together with the About Me text,
                    // now that the video-to-ASCII intro animation has finished.
                    const projectPanel = document.getElementById('project-panel');
                    if (projectPanel) projectPanel.style.opacity = '1';
                    setTimeout(() => {
                        [titleContainer, uploadContainer, controls].forEach(el => {
                            if (el) el.classList.remove('opacity-0');
                        });
                    }, 100);
                }, 1200);

            }, 1500);
        });
    });
}

function toggleUI() {
    const titleContainer = document.getElementById('ascii-title-container');
    const uploadContainer = document.getElementById('ascii-upload-container');
    const controls = document.getElementById('ascii-controls');
    const button = document.getElementById('btn-toggle-options');

    const isHidden = titleContainer && titleContainer.classList.contains('grid-rows-[0fr]');

    [titleContainer, uploadContainer, controls].forEach(el => {
        if (el) {
            if (isHidden) {
                el.classList.remove('grid-rows-[0fr]', 'opacity-0');
                el.classList.add('grid-rows-[1fr]');
            } else {
                el.classList.remove('grid-rows-[1fr]');
                el.classList.add('grid-rows-[0fr]', 'opacity-0');
            }
        }
    });

    if (button) {
        button.textContent = isHidden ? 'Hide Options' : 'Show Options';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof contrastFactor !== 'undefined') {
        contrastFactor = 1.5;
        const contrastSlider = document.querySelector('input[oninput*="contrast"]');
        if (contrastSlider) contrastSlider.value = 1.5;
    }

    if (typeof loadDefaultVideo === 'function') loadDefaultVideo();

    if (!localStorage.getItem('hasPlayedIntro')) {
        localStorage.setItem('hasPlayedIntro', 'true');
        runPortfolioIntro();
    } else {
        // Return visit: the intro doesn't replay, so reveal the projects
        // panel immediately (no fade) instead of leaving it hidden.
        const projectPanel = document.getElementById('project-panel');
        if (projectPanel) {
            projectPanel.style.transition = 'none';
            projectPanel.style.opacity = '1';
        }
    }

    // Edge auto-scroll for the bottom-left project panel.
    // Moving the cursor into the top or bottom edge zone scrolls the list,
    // with speed proportional to how deep into the zone the cursor sits.
    initProjectAutoScroll();
});

function initProjectAutoScroll() {
    const scrollEl = document.getElementById('project-scroll');
    if (!scrollEl) return;

    const EDGE = 90;        // px height of the trigger zone at top & bottom
    const MAX_SPEED = 11;   // px per frame at the very edge
    let velocity = 0;
    let rafId = null;

    function frame() {
        if (velocity !== 0) {
            scrollEl.scrollTop += velocity;
            const atTop = scrollEl.scrollTop <= 0;
            const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
            if ((velocity < 0 && atTop) || (velocity > 0 && atBottom)) {
                velocity = 0;
            }
            rafId = requestAnimationFrame(frame);
        } else {
            rafId = null;
        }
    }

    function ensureRunning() {
        if (rafId === null && velocity !== 0) rafId = requestAnimationFrame(frame);
    }

    scrollEl.addEventListener('mousemove', (e) => {
        const rect = scrollEl.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = rect.height;

        if (y > h - EDGE) {
            const t = Math.min((y - (h - EDGE)) / EDGE, 1); // 0 -> 1 toward bottom
            velocity = t * MAX_SPEED;
        } else if (y < EDGE) {
            const t = Math.min((EDGE - y) / EDGE, 1);        // 0 -> 1 toward top
            velocity = -t * MAX_SPEED;
        } else {
            velocity = 0; // middle band: let the user read the card, no scroll
        }
        ensureRunning();
    });

    scrollEl.addEventListener('mouseleave', () => { velocity = 0; });
}
