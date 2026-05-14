/**
 * The Scriptorium Logic
 * A place for quiet interactions and smooth navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Peace be with you, traveler. You have entered the archives.");

    // Handle smooth transitions for internal anchors
    const links = document.querySelectorAll('.toc-title');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // If the link is an internal section on the same page
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // Otherwise, let the browser navigate to the new .html file
        });
    });
});