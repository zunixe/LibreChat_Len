// Override logo di halaman login
(function() {
    const observer = new MutationObserver(() => {
        const svgs = document.querySelectorAll('svg');
        svgs.forEach(svg => {
            if (svg.getAttribute('width') === '300' || svg.getAttribute('viewBox')?.includes('0 0 100 100')) {
                svg.style.display = 'none';
                const img = document.createElement('img');
                img.src = '/images/logo-len.png';
                img.style.width = '200px';
                img.style.height = 'auto';
                svg.parentNode.insertBefore(img, svg);
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
