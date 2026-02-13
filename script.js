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
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        // Skip external links, anchors, and javascript
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript')) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('loaded');
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
});
