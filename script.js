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
        const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
        const data = await res.json();

        if (!data.Valute[selected]) throw new Error("Курс не найден");

        const rate = data.Valute[selected].Value.toFixed(2);
        document.getElementById("rates").innerHTML = `<p>${selected}: ${rate} ₽</p>`;
        document.getElementById("update-time").textContent =
            (currentLang === 'ru' ? 'Обновлено: ' : 'Updated: ') +
            new Date(data.Date).toLocaleDateString();
    } catch (err) {
        console.error("Ошибка:", err);
        document.getElementById("rates").innerHTML = "<p>Ошибка загрузки данных.</p>";
        document.getElementById("update-time").textContent = "";
    }
}

async function fetchChart() {
    const selected = currencySelect.value;
    const days = parseInt(rangeSelect.value);
    const labels = [];
    const dataPoints = [];

    const today = new Date();
    const fetchDay = async (offset) => {
        const date = new Date(today);
        date.setDate(date.getDate() - offset);
        if (date > new Date()) return { label: "", value: null }; // будущее — пропускаем

        const ymd = date.toISOString().split("T")[0].replace(/-/g, "/"); // YYYY/MM/DD
        const label = date.toISOString().slice(5, 10);

        try {
            const res = await fetch(`https://www.cbr-xml-daily.ru/archive/${ymd}/daily_json.js`);
            if (!res.ok) throw new Error("Недоступен");

            const json = await res.json();
            const value = json?.Valute?.[selected]?.Value;
            return { label, value: value ? value.toFixed(2) : null };
        } catch {
            // Ошибки CORS, 404 и другие игнорируются
            return { label, value: null };
        }
    };

    const results = await Promise.all(
        Array.from({ length: days }, (_, i) => fetchDay(days - 1 - i))
    );

    results.forEach(({ label, value }) => {
        labels.push(label);
        dataPoints.push(value);
    });

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
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });
}

function updateAll() {
    fetchRates();
    fetchChart();
}

updateTexts();
updateAll();
setInterval(fetchRates, 3600000);
