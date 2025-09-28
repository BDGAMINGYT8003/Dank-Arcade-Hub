document.addEventListener('DOMContentLoaded', () => {
    userDB.open().then(() => {
        updateBalances();
    }).catch(e => {
        console.error("DB Initialization Failed:", e);
        // Fallback or user notification
    });

    setupBalanceCards();

    // Auto-update balances periodically
    setInterval(updateBalances, 30000);
});