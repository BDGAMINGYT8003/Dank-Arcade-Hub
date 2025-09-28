const CRIME_ACTIVITIES_DATA = [
    { name: "Pickpocketing", icon: "fa-solid fa-person-walking-arrow-right", successRate: 0.60, rewardRange: [2000, 4000], fineRange: [500, 1000], successOutcomes: ["You snagged a wallet without anyone noticing.", "A quick hand and a distracted tourist made for an easy score.", "You found a hefty roll of tokens in someone's back pocket."], failureOutcomes: ["Your target felt your hand and shouted, forcing you to flee empty-handed.", "You were caught by a security guard but managed to get away with just a warning.", "You picked an empty pocket. Bad luck."] },
    { name: "Shoplifting", icon: "fa-solid fa-bag-shopping", successRate: 0.35, rewardRange: [6000, 10000], fineRange: [1500, 3000], successOutcomes: ["You slipped a valuable item into your bag and walked out casually.", "The cashier was busy. You took your chance and it paid off.", "You successfully swapped the price tags on a high-value item and sold it."], failureOutcomes: ["The store's security alarm went off! You dropped everything and ran.", "An employee spotted you and you had to pay a 're-stocking fee' to avoid trouble.", "You got greedy and the item you took was a worthless display model."] },
    { name: "Tax Evasion", icon: "fa-solid fa-file-invoice-dollar", successRate: 0.40, rewardRange: [12000, 20000], fineRange: [3000, 6000], successOutcomes: ["Your creative accounting skills fooled the auditors completely.", "You found a legal loophole that saved you a huge chunk of tokens.", "You 'forgot' to declare some income and got away with it."], failureOutcomes: ["An audit was triggered and you had to pay back taxes plus a hefty penalty.", "Your accountant made a mistake and now you owe the government.", "You were too obvious and got hit with a fine for tax fraud."] },
    { name: "Hacking", icon: "fa-solid fa-laptop-code", successRate: 0.20, rewardRange: [20000, 40000], fineRange: [5000, 10000], successOutcomes: ["You breached the firewall of a major corporation and siphoned off some tokens.", "You found an exploit in the crypto market and made a massive profit.", "You successfully executed a phishing scam on a wealthy individual."], failureOutcomes: ["Your IP was traced! You had to pay a fine to the cyber-police to make it go away.", "The system's anti-cheat detected you and froze a portion of your assets.", "You triggered a honeypot and wasted hours for nothing."] },
    { name: "Bank Robbery", icon: "fa-solid fa-vault", successRate: 0.10, rewardRange: [30000, 60000], fineRange: [8000, 15000], successOutcomes: ["The heist went perfectly! You and your crew are rich!", "You cracked the vault and made off with bags of tokens.", "Your getaway driver was a pro. A clean escape with a huge score."], failureOutcomes: ["The silent alarm was tripped. You barely escaped and had to bribe a guard to forget your face.", "A dye pack exploded in one of the bags, ruining most of the score and costing you to clean up.", "Your plan was flawed from the start. You got away but lost more in gear than you could steal."] }
];

const CRIME_COOLDOWN_SECONDS = 25;
let cooldownInterval;

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRandomSelection(array) { return array[Math.floor(Math.random() * array.length)]; }
function selectRandomActivities(data, count) { const shuffled = data.sort(() => 0.5 - Math.random()); return shuffled.slice(0, count); }

function createActivityButton(activityData) {
    const button = document.createElement('button');
    button.className = 'crime-activity-button';
    button.innerHTML = `<i class="${activityData.icon} activity-icon"></i><div class="activity-name">${activityData.name}</div>`;
    button.addEventListener('click', () => handleCrime(button, activityData));
    return button;
}

function renderCrimeOptions() {
    const crimeGrid = document.getElementById('crimeGrid');
    crimeGrid.innerHTML = '';
    const activities = selectRandomActivities(CRIME_ACTIVITIES_DATA, 3);
    activities.forEach(activity => { crimeGrid.appendChild(createActivityButton(activity)); });
    document.getElementById('crimeArea').style.display = 'block';
}

function startPostCrimeCooldown(endTime) {
    clearInterval(cooldownInterval);
    const commitAgainButton = document.getElementById('commitAgainButton');
    const cooldownTimer = document.getElementById('postCrimeCooldownTimer');

    const updateTimer = () => {
        const remainingMs = endTime - Date.now();
        if (remainingMs <= 0) {
            clearInterval(cooldownInterval);
            commitAgainButton.disabled = false;
            cooldownTimer.style.display = 'none';
            return;
        }
        commitAgainButton.disabled = true;
        cooldownTimer.style.display = 'block';
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        cooldownTimer.textContent = `You can commit another crime in ${remainingSeconds} seconds.`;
    };
    updateTimer();
    cooldownInterval = setInterval(updateTimer, 1000);
}

function startPostRefreshCooldown(endTime) {
    clearInterval(cooldownInterval);
    const cooldownArea = document.getElementById('cooldownArea');
    const cooldownTimer = document.getElementById('postRefreshCooldownTimer');
    cooldownArea.style.display = 'block';

    const updateTimer = () => {
        const remainingMs = endTime - Date.now();
        if (remainingMs <= 0) {
            clearInterval(cooldownInterval);
            cooldownArea.style.display = 'none';
            renderCrimeOptions();
            return;
        }
        cooldownTimer.style.display = 'block';
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        cooldownTimer.textContent = `You need to lie low for ${remainingSeconds} more seconds.`;
    };
    updateTimer();
    cooldownInterval = setInterval(updateTimer, 1000);
}

async function handleCrime(button, activityData) {
    document.querySelectorAll('.crime-activity-button').forEach(btn => btn.disabled = true);

    const data = await getUserData();
    let isSuccess = Math.random() < activityData.successRate;
    let message = '';
    let changeAmount = 0;

    if (isSuccess) {
        changeAmount = getRandomInt(activityData.rewardRange[0], activityData.rewardRange[1]);
        message = getRandomSelection(activityData.successOutcomes);
        data.arcadeTokens += changeAmount;
        button.classList.add('success');
    } else {
        const fine = getRandomInt(activityData.fineRange[0], activityData.fineRange[1]);
        // Safety Net: Ensure balance doesn't go negative
        changeAmount = Math.min(data.arcadeTokens, fine);
        message = getRandomSelection(activityData.failureOutcomes);
        data.arcadeTokens -= changeAmount;
        button.classList.add('fail');
    }

    const cooldownEndTime = Date.now() + (CRIME_COOLDOWN_SECONDS * 1000);
    data.crimeCooldownEnd = cooldownEndTime;

    await saveUserData(data);
    await updateBalances();

    // Display the immediate result
    document.getElementById('crimeArea').style.display = 'none';
    const resultContainer = document.getElementById('resultContainer');
    const resultChangeEl = document.getElementById('resultChange');

    document.getElementById('resultTitle').textContent = isSuccess ? "GETAWAY!" : "BUSTED!";
    document.getElementById('resultMessage').textContent = message;

    if (isSuccess) {
        resultChangeEl.textContent = `${changeAmount.toLocaleString()} AT Earned`;
        resultChangeEl.className = 'success';
    } else {
        resultChangeEl.textContent = `${changeAmount.toLocaleString()} AT Lost`;
        resultChangeEl.className = 'fail';
    }

    resultContainer.style.display = 'block';
    startPostCrimeCooldown(cooldownEndTime);
}

document.addEventListener('DOMContentLoaded', async () => {
    await userDB.open().catch(e => {
        console.error("DB Initialization Failed:", e);
        showToast("Failed to load user data from storage!", 8000);
    });

    const data = await updateBalances();
    const now = Date.now();

    document.getElementById('crimeArea').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('cooldownArea').style.display = 'none';

    if (data.crimeCooldownEnd > now) {
        startPostRefreshCooldown(data.crimeCooldownEnd);
    } else {
        renderCrimeOptions();
    }

    setupBalanceCards();
});