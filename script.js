document.addEventListener('DOMContentLoaded', () => {
    console.log("Peace be with you, traveler. You have entered the archives.");

    const toggle = document.getElementById("projects-toggle");
    const section = document.getElementById("projects-section");

    if (toggle && section) {
        const toggleSection = (e) => {
            e.preventDefault();
            section.classList.toggle("expanded");
        };

        toggle.addEventListener("click", toggleSection);
        toggle.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                toggleSection(e);
            }
        });
    }

    const links = document.querySelectorAll('.toc-title');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});