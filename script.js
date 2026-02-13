document.addEventListener('DOMContentLoaded', () => {
    // Fade in on page load with a brief delay so the transition is visible
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.add('loaded');
        });
    });

    // Live clock for footer
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        function updateTime() {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'America/Los_Angeles'
            });
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Page transition: fade out on internal link clicks
    document.querySelectorAll('a').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;

        const isExternal = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
        if (isExternal || href.startsWith('#') || href.startsWith('javascript')) return;

        link.addEventListener('click', (e) => {
            // Preserve expected browser behavior for new tab/window and downloads.
            if (
                e.defaultPrevented ||
                e.button !== 0 ||
                e.metaKey ||
                e.ctrlKey ||
                e.shiftKey ||
                e.altKey ||
                link.hasAttribute('download') ||
                (link.target && link.target !== '_self')
            ) {
                return;
            }

            e.preventDefault();
            document.body.classList.remove('loaded');
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
});
