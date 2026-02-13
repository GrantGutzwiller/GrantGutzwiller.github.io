// Gallery images from the Gallary folder
const galleryImages = [
    'Gallary/0KuEgQlTXkS7FOjUzkICjl2EDJQ.avif',
    'Gallary/3dqP2foegJzpcdjvkl5ds4cJw.avif',
    'Gallary/5YLYwH2DsvIQJ4iKo4Aun8VInjA.avif',
    'Gallary/5jRRixcDqNiXckjpB5lCdhYNyY.avif',
    'Gallary/85MN0xpWc5pr5xuRS7eg8XUh3ak.avif',
    'Gallary/AazJEg5FnyK4RYzsf4EwSOFMMxU.avif',
    'Gallary/BU9fQZ41pzWT9kTsSruMa2nq5NI.avif',
    'Gallary/DejzxMmbmy9uToDLDMb5KEg3U.webp',
    'Gallary/Ffwhs0nFQc0XRDQdWWeXcBGGIE.avif',
    'Gallary/FwVtXQeJH4JBtoKxbCIVsd0tE20.webp',
    'Gallary/GtNz2NMw4NNfzNtrq3m4CnuBv64.webp',
    'Gallary/HSWjOWs7rycy8esoIwnIwMWKxAM.avif',
    'Gallary/HgHjaMYzFtDXWefK7nbMEY80X2w.avif',
    'Gallary/IWDwZJvbUDKBKLpbnezw2IH7OY4.webp',
    'Gallary/J8SdecTNPF7Kd21gevdFJdC4MYs.avif',
    'Gallary/JqDRic5hDVT8U0SxrtUGPNAuo8.avif',
    'Gallary/LBRP3f5c98LKKSsL4z1F20KyvB4.avif',
    'Gallary/UDo73K0niAdUrBsi1NiInKtNfc.webp',
    'Gallary/WoWHiz1DKAhkHbnVI5lr7ocGK0.avif',
    'Gallary/XGAuupIZrMQpfI7T9BGvWnnbUM.avif',
    'Gallary/XgQgK6AB3LQW5Gj2LBGDl1xW6I.webp',
    'Gallary/Y82tuyBT7NVHGEGZ8eLIVlYsgxs.avif',
    'Gallary/YrOy0mqzAt5NgfbM9Cl8QTQzliM.avif',
    'Gallary/Z7Q9zq2SKgRFKliVHPCCRcARFU.avif',
    'Gallary/ZryINgYiArWtkHKcPFIfIZ16tUQ.avif',
    'Gallary/a4deOxR2OjOTCE6UBMB9QvQn9o.avif',
    'Gallary/bPy4rMKhtloLCN3QJ6t5Hh4M090.webp',
    'Gallary/iDqBMvkfKN9pwLUdTLzosTOEcSA.avif',
    'Gallary/iLEWkO2ivsESGxM4tot6DK5m7w.avif',
    'Gallary/iSfrE8conyfWHE3gdZ7Iz3TKRk.avif',
    'Gallary/iWWvqxJkbkSIcmtp3urM9ZyBX1s.avif',
    'Gallary/igD9KH7scozIZUdTKVwpDkCQE.avif',
    'Gallary/ix4IUNYm9BzseU8mX3tPhiKGA.avif',
    'Gallary/j3scyw1mPvupvhCGkVUwMUUjE4.avif',
    'Gallary/jvYEz21lkCdeyoJUvk0S70Wd0o.avif',
    'Gallary/l0lCN9sdfXZW4KEoqxrniXSf3ic.avif',
    'Gallary/mRHPf4LoegV7kJ8dqT6gZmIUmU.avif',
    'Gallary/mmfmk98XHw9sBJZgfVe6YlgNmk.webp',
    'Gallary/pKDpVzArKDnqQO1UU2MABLzUry4.avif',
    'Gallary/sBcz6LEfqowWyR5XPDE67aWOBhY.avif',
    'Gallary/tQwG36X9Sg9kwaqihywNvUeHnc.avif',
    'Gallary/wVZFV074JxYH6AI6M4I10JgarEM.avif'
];

// Load gallery images
function loadGallery() {
    const gallery = document.getElementById('gallery');

    galleryImages.forEach((imagePath, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = `Photo from Grant's gallery (${index + 1} of ${galleryImages.length})`;
        img.loading = 'lazy';
        img.dataset.index = index;

        img.addEventListener('click', () => openLightbox(index));

        item.appendChild(img);
        gallery.appendChild(item);
    });
}

// Lightbox functionality
let currentImageIndex = 0;

function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    lightboxImg.src = galleryImages[index];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function navigateImage(direction) {
    currentImageIndex += direction;

    if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    } else if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    }

    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = galleryImages[currentImageIndex];
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();

    // Close lightbox
    document.querySelector('.close-lightbox').addEventListener('click', closeLightbox);

    // Navigation buttons
    document.querySelector('.prev-btn').addEventListener('click', () => navigateImage(-1));
    document.querySelector('.next-btn').addEventListener('click', () => navigateImage(1));

    // Close on background click
    document.getElementById('lightbox').addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!document.getElementById('lightbox').classList.contains('active')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateImage(-1);
        if (e.key === 'ArrowRight') navigateImage(1);
    });
});
