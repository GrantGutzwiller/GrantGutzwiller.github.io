// Book covers from the Bookshelf folder
const books = [
    'Bookshelf/0az76CWMscq9Sceop9ersmPRM.avif',
    'Bookshelf/5amIvhpTBLZKIdvl1rt6V8jmBk.jpg',
    'Bookshelf/7cB94cluz69cLE2Sesp5nnWA.avif',
    'Bookshelf/ATfWZWZg0qYlCAyfBU9KRTqqE.jpg',
    'Bookshelf/BtKNKQ9JjzXJ7Zg3dE4Nn0hVixw.avif',
    'Bookshelf/DsIfpMJbvONdBoUzCgS6x4zegk.avif',
    'Bookshelf/N96debEB9dwzTOCH5tZ7tWTu4.jpg',
    'Bookshelf/NnxkAdmeZivBlWyq0iwmGz2lqc.jpg',
    'Bookshelf/R7bdHGgyCGVvEgUZKWUMNLo3Cvs.jpg',
    'Bookshelf/RCMizTI58k3tmM0khkvTqINx7nw.avif',
    'Bookshelf/SB1NP3E8MAN4qgDqPbLzwZkw.avif',
    'Bookshelf/YlWDT0vFEPnurHsYCN0oBOVE5E.avif',
    'Bookshelf/daq3FLvNZpiir3PdZuy9g3A0p1w.jpg',
    'Bookshelf/fsDio4MpgthB7u7dQZI4itgI6E.avif',
    'Bookshelf/fsbCzFCmfj4ZVThSASu4WsWlk.avif',
    'Bookshelf/hpKFuMWaDHgZbEYf11Gv5XoPs.jpg',
    'Bookshelf/iedClvlVgSMtTYBBY3EdyuAaU.avif',
    'Bookshelf/oOLZvex7ETLQSMC7kuJALBW1NLM.avif',
    'Bookshelf/syi5PJWdB5hK4tz1GCkyLDhLc.avif',
    'Bookshelf/vgxu1cH88RLvl0BZUIia6GltiI4.avif',
    'Bookshelf/x7NVUVd0AJYdWq4uijTqVxP0ig.jpg'
];

// Load bookshelf
function loadBookshelf() {
    const bookshelf = document.getElementById('bookshelf');

    books.forEach((bookPath, index) => {
        const item = document.createElement('div');
        item.className = 'book-item';

        const img = document.createElement('img');
        img.src = bookPath;
        img.alt = `Book ${index + 1}`;
        img.loading = 'lazy';

        item.appendChild(img);
        bookshelf.appendChild(item);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadBookshelf);
