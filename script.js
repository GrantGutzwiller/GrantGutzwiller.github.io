document.addEventListener('DOMContentLoaded', () => {
    const showPage = () => {
        document.body.classList.remove('fade-out');
        document.body.classList.add('loaded');
    };

    // Fade in on page load with a brief delay so the transition is visible.
    requestAnimationFrame(() => {
        requestAnimationFrame(showPage);
    });

    // Back/forward cache restores the previous DOM state, so force visible.
    window.addEventListener('pageshow', showPage);

    // Live clock for footer.
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

    // Page transition: fade out on same-tab internal link clicks.
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        if (link.hasAttribute('download')) return;
        if (link.target && link.target !== '_self') return;

        // Skip external protocols, absolute URLs, and in-page anchors.
        if (
            href.startsWith('http') ||
            href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')
        ) {
            return;
        }

        link.addEventListener('click', (e) => {
            if (e.defaultPrevented) return;
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            e.preventDefault();
            document.body.classList.remove('loaded');
            document.body.classList.add('fade-out');

            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
});
