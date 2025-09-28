const ONE_DAY = 24 * 60 * 60 * 1000;
const BASE_REWARD = 1000;
const STREAK_BONUS = 100;
let timerInterval;

function calculateReward(streak) {
    return BASE_REWARD + (streak * STREAK_BONUS);
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

async function checkDailyStatus() {
    const data = await updateBalances();
    const now = Date.now();
    const claimButton = document.getElementById('claimButton');
    const timerDiv = document.getElementById('timer');
    const rewardDiv = document.getElementById('dailyReward');
    const streakDiv = document.getElementById('dailyStreak');

    const lastClaim = data.lastDailyClaim || 0;
    let currentStreak = data.dailyStreak || 0;

    // Check for broken streak (more than 48 hours since last claim)
    const TWO_DAYS = 2 * ONE_DAY;
    if (lastClaim !== 0 && now - lastClaim > TWO_DAYS) {
        currentStreak = 0; // Reset streak if lapse is > 48 hours
        data.dailyStreak = 0; // Update data in memory
        await saveUserData(data);
        showToast("Your daily streak was lost!", 5000);
    }

    const reward = calculateReward(currentStreak);

    // Update UI with current streak and reward
    streakDiv.textContent = `Current Streak: ${currentStreak} Day(s)`;
    rewardDiv.textContent = `Reward: ${reward.toLocaleString()} AT`;

    if (now - lastClaim >= ONE_DAY) {
        // Claim is available
        claimButton.disabled = false;
        claimButton.textContent = "Claim Daily Reward";
        timerDiv.style.display = 'none';

        // Optional: Update reward text to reflect potential new streak
        if (lastClaim !== 0 && now - lastClaim < TWO_DAYS) {
            const nextReward = calculateReward(currentStreak + 1);
            rewardDiv.textContent = `Next Reward: ${nextReward.toLocaleString()} AT`;
        } else {
            rewardDiv.textContent = `Reward: ${reward.toLocaleString()} AT`;
        }

    } else {
        // Claim is not available
        claimButton.disabled = true;
        claimButton.textContent = "Claim Not Yet Available";
        timerDiv.style.display = 'block';

        const updateTimer = () => {
            const remaining = ONE_DAY - (Date.now() - lastClaim);
            if (remaining <= 0) {
                clearInterval(timerInterval);
                checkDailyStatus(); // Re-check status to enable button
                return;
            }
            timerDiv.textContent = `Next claim in: ${formatTime(remaining)}`;
        };

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }
}

async function handleClaim() {
    const data = await getUserData();
    const now = Date.now();

    if (now - data.lastDailyClaim >= ONE_DAY) {
        // Determine if streak should continue
        const lastClaim = data.lastDailyClaim || 0;
        const TWO_DAYS = 2 * ONE_DAY;
        let currentStreak = data.dailyStreak || 0;

        if (lastClaim !== 0 && now - lastClaim < TWO_DAYS) {
            currentStreak += 1; // Streak continues
        } else {
            currentStreak = 0; // Fresh start
        }

        const reward = calculateReward(currentStreak);

        // Update data
        data.arcadeTokens += reward;
        data.lastDailyClaim = now;
        data.dailyStreak = currentStreak;

        await saveUserData(data);
        showToast(`SUCCESS! Claimed ${reward.toLocaleString()} AT. Streak: ${currentStreak} Day(s)!`);
        checkDailyStatus(); // Update UI and timer
    } else {
        showToast("Not yet available. Please wait.", 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('claimButton').addEventListener('click', handleClaim);

    userDB.open().then(() => {
        checkDailyStatus(); // Check status and load balances
    }).catch(e => {
        console.error("DB Initialization Failed:", e);
        showToast("Failed to load user data from storage!", 8000);
    });

    setupBalanceCards();

    // Auto-update balances periodically
    setInterval(updateBalances, 30000);
});