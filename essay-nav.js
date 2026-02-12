document.addEventListener('DOMContentLoaded', () => {
    const tocItems = document.querySelectorAll('.toc-item');
    const sections = [];

    tocItems.forEach(item => {
        const id = item.getAttribute('href').slice(1);
        const section = document.getElementById(id);
        if (section) sections.push({ el: section, link: item });
    });

    if (sections.length === 0) return;

    function updateActive() {
        // If user has scrolled to the bottom, activate the last section
        const atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50);

        let current;
        if (atBottom) {
            current = sections[sections.length - 1];
        } else {
            current = sections[0];
            for (const s of sections) {
                if (s.el.getBoundingClientRect().top <= 120) {
                    current = s;
                }
            }
        }

        tocItems.forEach(item => item.classList.remove('active'));
        current.link.classList.add('active');
    }

    window.addEventListener('scroll', updateActive);
    updateActive();
});
