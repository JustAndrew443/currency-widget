const currencySelect = document.getElementById("currency");
const rangeSelect = document.getElementById("range");
const langToggle = document.getElementById("lang-toggle");
const refreshBtn = document.getElementById("refresh");
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

function updateTexts() {
    langToggle.textContent = currentLang === 'ru' ? 'EN' : 'RU';
    document.getElementById("title").textContent = currentLang === 'ru' ? 'Курсы валют' : 'Exchange Rates';
    document.querySelector("label[for='currency']").textContent = currentLang === 'ru' ? 'Выберите валюту:' : 'Choose currency:';
    document.querySelector("label[for='range']").textContent = currentLang === 'ru' ? 'Диапазон:' : 'Range:';
    refreshBtn.textContent = currentLang === 'ru' ? '🔄 Обновить' : '🔄 Refresh';
}
function updateAll() {
    fetchTodayRate();
    fetchChart();
}
async function fetchTodayRate() {
    const selected = currencySelect.value;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateReq = `${dd}/${mm}/${yyyy}`;
    const url = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${dateReq}`;
    try {
        const response = await fetch("https://cors-anywhere.herokuapp.com/" + url);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");

        const valute = [...xml.getElementsByTagName("Valute")].find(
            v => v.getElementsByTagName("CharCode")[0].textContent === selected
        );

        if (!valute) throw new Error("Нет данных для валюты");

        const value = valute.getElementsByTagName("Value")[0].textContent.replace(",", ".");
        const rate = parseFloat(value).toFixed(2);

        document.getElementById("rates").innerHTML = `<p>${selected}: ${rate} ₽</p>`;
        document.getElementById("update-time").textContent =
            (currentLang === 'ru' ? 'Обновлено: ' : 'Updated: ') +
            `${dd}.${mm}.${yyyy}`;
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

    let current = new Date();
    let collected = 0;

    while (collected < days) {
        const dd = String(current.getDate()).padStart(2, '0');
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const yyyy = current.getFullYear();
        const dateReq = `${dd}/${mm}/${yyyy}`;
        const url = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${dateReq}`;

        try {
            const response = await fetch("https://cors-anywhere.herokuapp.com/" + url);
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, "text/xml");

            const valute = [...xml.getElementsByTagName("Valute")].find(
                v => v.getElementsByTagName("CharCode")[0].textContent === selected
            );

            if (valute) {
                const value = valute.getElementsByTagName("Value")[0].textContent.replace(",", ".");
                const rate = parseFloat(value).toFixed(2);
                labels.unshift(`${dd}.${mm}`);
                dataPoints.unshift(rate);
                collected++;
            }
        } catch (e) {
            console.warn("Пропуск даты:", dd, mm, yyyy);
        }

        current.setDate(current.getDate() - 1); // предыдущий день
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
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}
// Инициализация
function updateTexts() {
    langToggle.textContent = currentLang === 'ru' ? 'EN' : 'RU';
    document.getElementById("title").textContent = currentLang === 'ru' ? 'Курсы валют' : 'Exchange Rates';
    document.querySelector("label[for='currency']").textContent = currentLang === 'ru' ? 'Выберите валюту:' : 'Choose currency:';
    document.querySelector("label[for='range']").textContent = currentLang === 'ru' ? 'Диапазон:' : 'Range:';
    refreshBtn.textContent = currentLang === 'ru' ? '🔄 Обновить' : '🔄 Refresh';
    themeToggle.textContent = currentLang === 'ru' 
        ? (document.body.classList.contains("dark-mode") ? "☀ Тема" : "🌙 Тема") 
        : (document.body.classList.contains("dark-mode") ? "☀ Theme" : "🌙 Theme");

    // Обновляем валюты
    currencySelect.options[0].text = currentLang === 'ru' ? 'USD (доллар)' : 'USD (dollar)';
    currencySelect.options[1].text = currentLang === 'ru' ? 'EUR (евро)' : 'EUR (euro)';
    currencySelect.options[2].text = currentLang === 'ru' ? 'CNY (юань)' : 'CNY (yuan)';

    // Обновляем диапазон
    rangeSelect.options[0].text = currentLang === 'ru' ? '7 дней' : '7 days';
    rangeSelect.options[1].text = currentLang === 'ru' ? '30 дней' : '30 days';
}
updateAll();
setInterval(fetchTodayRate, 60 * 60 * 1000); // раз в час
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "☀ Тема" : "🌙 Тема";
});