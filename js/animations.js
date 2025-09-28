document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // --- Page Transition Logic ---
    const handleLinkClick = (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.target !== '_blank' && link.href.includes('.html')) {
            e.preventDefault();
            const destination = link.href;

            // Add loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div>';
            body.appendChild(loadingIndicator);

            body.classList.add('page-exit');

            setTimeout(() => {
                fetch(destination)
                    .then(response => response.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const newDoc = parser.parseFromString(html, 'text/html');
                        const newBodyContent = newDoc.body.innerHTML;

                        // Replace body content
                        body.innerHTML = newBodyContent;
                        window.history.pushState({}, '', destination);

                        // Re-run scripts for the new page
                        const scripts = newDoc.body.querySelectorAll('script');
                        scripts.forEach(oldScript => {
                            const newScript = document.createElement('script');
                            if(oldScript.src) {
                                newScript.src = oldScript.src;
                            } else {
                                newScript.textContent = oldScript.innerHTML;
                            }
                            body.appendChild(newScript);
                        });

                        // Trigger page enter animation
                        body.classList.remove('page-exit');
                        body.classList.add('page-enter');

                        // Remove loading indicator
                        const indicator = document.getElementById('loading-indicator');
                        if(indicator) {
                           indicator.remove();
                        }

                        // Re-initialize any necessary components from the new page
                        if (window.initializePage) {
                            window.initializePage();
                        }
                    })
                    .catch(err => {
                        console.error('Failed to load page:', err);
                        window.location.href = destination; // Fallback to normal navigation
                    });
            }, 500); // Match CSS animation duration
        }
    };

    document.addEventListener('click', handleLinkClick);

    // --- Initial Page Load Animation ---
    body.classList.add('page-enter');
});

// A function to re-initialize scripts on new page content
function reinitializeScripts() {
    if (typeof setupBalanceCards === 'function') {
        setupBalanceCards();
    }
    if (typeof checkDailyStatus === 'function') {
        checkDailyStatus();
    }
    if (typeof renderCrimeOptions === 'function') {
        const data = updateBalances();
        const now = Date.now();

        document.getElementById('crimeArea').style.display = 'none';
        document.getElementById('resultContainer').style.display = 'none';
        document.getElementById('cooldownArea').style.display = 'none';

        if (data.crimeCooldownEnd > now) {
            startPostRefreshCooldown(data.crimeCooldownEnd);
        } else {
            renderCrimeOptions();
        }
    }
}

window.initializePage = reinitializeScripts;