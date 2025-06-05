const currencySelect = document.getElementById("currency");
const rangeSelect = document.getElementById("range");
const langToggle = document.getElementById("lang-toggle");
const refreshBtn = document.getElementById("refresh");
const themeToggle = document.getElementById("theme-toggle");

let currentLang = 'ru';
let chart = null;

currencySelect.addEventListener("change", updateAll);
rangeSelect.addEventListener("change", fetchChart);
langToggle.addEventListener("click", () => {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    updateTexts();
    updateAll();
});
refreshBtn.addEventListener("click", updateAll);
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = currentLang === 'ru'
        ? (isDark ? "☀ Тема" : "🌙 Тема")
        : (isDark ? "☀ Theme" : "🌙 Theme");
});

function updateTexts() {
    langToggle.textContent = currentLang === 'ru' ? 'EN' : 'RU';
    document.getElementById("title").textContent = currentLang === 'ru' ? 'Курсы валют' : 'Exchange Rates';
    document.querySelector("label[for='currency']").textContent = currentLang === 'ru' ? 'Выберите валюту:' : 'Choose currency:';
    document.querySelector("label[for='range']").textContent = currentLang === 'ru' ? 'Диапазон:' : 'Range:';
    refreshBtn.textContent = currentLang === 'ru' ? '🔄 Обновить' : '🔄 Refresh';
    themeToggle.textContent = document.body.classList.contains("dark-mode")
        ? (currentLang === 'ru' ? "☀ Тема" : "☀ Theme")
        : (currentLang === 'ru' ? "🌙 Тема" : "🌙 Theme");
    currencySelect.options[0].text = currentLang === 'ru' ? 'USD (доллар)' : 'USD (dollar)';
    currencySelect.options[1].text = currentLang === 'ru' ? 'EUR (евро)' : 'EUR (euro)';
    currencySelect.options[2].text = currentLang === 'ru' ? 'CNY (юань)' : 'CNY (yuan)';
    rangeSelect.options[0].text = currentLang === 'ru' ? '7 дней' : '7 days';
    rangeSelect.options[1].text = currentLang === 'ru' ? '30 дней' : '30 days';
}

async function fetchRates() {
    const selected = currencySelect.value;
    try {
        const response = await fetch(`https://api.exchangerate.host/latest?base=RUB&symbols=${selected}`);
        const data = await response.json();
        const rate = (1 / data.rates[selected]).toFixed(2);
        document.getElementById("rates").innerHTML = `<p>${selected}: ${rate} ₽</p>`;
        document.getElementById("update-time").textContent =
            (currentLang === 'ru' ? 'Обновлено: ' : 'Updated: ') +
            new Date(data.date).toLocaleDateString();
    } catch (error) {
        document.getElementById("rates").innerHTML = "<p>Ошибка загрузки данных.</p>";
        console.error("Ошибка загрузки курса:", error);
    }
}

async function fetchChart() {
    const selected = currencySelect.value;
    const days = parseInt(rangeSelect.value);
    const labels = [];
    const dataPoints = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formatted = date.toISOString().split("T")[0];

        try {
            const response = await fetch(`https://api.exchangerate.host/${formatted}?base=RUB&symbols=${selected}`);
            const data = await response.json();
            const rate = data.rates[selected] ? (1 / data.rates[selected]).toFixed(2) : null;
            labels.push(formatted.slice(5));
            dataPoints.push(rate);
        } catch (err) {
            labels.push("-");
            dataPoints.push(null);
        }
    }

    const ctx = document.getElementById("chart").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `${selected} / RUB`,
                data: dataPoints,
                borderColor: '#0066cc',
                fill: false,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

function updateAll() {
    fetchRates();
    fetchChart();
}

updateTexts();
updateAll();
setInterval(fetchRates, 60 * 60 * 1000);
