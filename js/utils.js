const userDB = new UserDB();

function formatNumber(num) {
    if (num < 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 't';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'b';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'm';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
    return num.toString();
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

async function getUserData() {
    const defaultData = {
        arcadeTokens: 0,
        goldenJoysticks: 0,
        lastDailyClaim: 0,
        dailyStreak: 0,
        crimeCooldownEnd: 0
    };
    try {
        let data = await userDB.get('user');
        if (!data) {
            data = defaultData;
            await userDB.set('user', data);
        }
        // Ensure all properties are initialized
        for (const key in defaultData) {
            if (data[key] === undefined) {
                data[key] = defaultData[key];
            }
        }
        return data;
    } catch (e) {
        console.error("Error retrieving user data:", e);
        return defaultData;
    }
}

async function saveUserData(data) {
    try {
        await userDB.set('user', data);
    } catch (e) {
        console.error("Error saving user data:", e);
        showToast("Error saving data!", 5000);
    }
}

async function updateBalances() {
    const data = await getUserData();

    const atBalance = data.arcadeTokens;
    document.querySelector('#at-card .abbreviated').textContent = formatNumber(atBalance);
    document.querySelector('#at-card .full').textContent = atBalance.toLocaleString();

    const gjBalance = data.goldenJoysticks;
    document.querySelector('#gj-card .abbreviated').textContent = formatNumber(gjBalance);
    document.querySelector('#gj-card .full').textContent = gjBalance.toLocaleString();

    return data;
}

function setupBalanceCards() {
    const cards = document.querySelectorAll('.balance-card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            cards.forEach(c => {
                if (c !== card) c.classList.remove('active');
            });
            this.classList.toggle('active');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.balance-card')) {
            cards.forEach(card => card.classList.remove('active'));
        }
    });
}