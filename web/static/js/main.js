// web/static/js/main.js

const State = {
    showChronicles: true,
    chroniclesData: {}
};

function formatDateString(date) {
    let month = date.getMonth() + 1;
    if (month < 10) month = "0" + month;
    let day = date.getDate();
    if (day < 10) day = "0" + day;
    return `${date.getFullYear()}-${month}-${day}`;
}

async function loadAllCharts() {
    const dateStartNode = document.getElementById('date_start');
    const dateEndNode = document.getElementById('date_end');
    
    if(!dateStartNode || !dateEndNode) return;

    const menuDateStart = dateStartNode.value;
    const menuDateEnd = dateEndNode.value;

    const currentDatesSpan = document.getElementById('online-stat-current-dates');
    if (currentDatesSpan) {
        currentDatesSpan.innerHTML = `
            <span class="text-danger">${menuDateStart}</span> - <span class="text-success">${menuDateEnd}</span>
        `;
    }

    // Destroy existing charts to overwrite them later
    for (let id of ['online-stat-all-weeks', 'online-stat-daytime', 'online-stat-month']) {
        let existingChart = Chart.getChart(id);
        if (existingChart) {
            existingChart.destroy();
        }
    }

    State.chroniclesData = await fetchChronicles(menuDateStart, menuDateEnd);

    const dateTo = new Date();
    const dateFrom = new Date();
    dateTo.setDate(dateTo.getDate() - 1); // without today
    dateFrom.setDate(dateTo.getDate() - 90);

    const formatFrom = formatDateString(dateFrom);
    const formatTo = formatDateString(dateTo);

    try {
        // Run all API requests concurrently for massive performance boost
        const [
            dataWeeksAvg,
            dataWeeksMax,
            dataDaytime,
            dataMonthAvg,
            dataMonthMax
        ] = await Promise.all([
            fetchChartData("online_stat_weeks", menuDateStart, menuDateEnd),
            fetchChartData("online_stat_weeks_max", menuDateStart, menuDateEnd),
            fetchChartData("online_stat_daytime", menuDateStart, menuDateEnd),
            fetchChartData("online_stat", formatFrom, formatTo),
            fetchChartData("online_stat_max", formatFrom, formatTo)
        ]);
        
        // --- Render Week Charts ---
        if (dataWeeksAvg) {
            const chroniclesRanges = getChroniclesForWeeks(Object.keys(dataWeeksAvg), State.chroniclesData);
            renderChart("online-stat-all-weeks", "online_stat_weeks", dataWeeksAvg, "players, avg", chroniclesRanges, State);
        }
        if (dataWeeksMax) {
            const chroniclesRanges = getChroniclesForWeeks(Object.keys(dataWeeksMax), State.chroniclesData);
            renderChart("online-stat-all-weeks", "online_stat_weeks_max", dataWeeksMax, "players, max", chroniclesRanges, State);
        }
        
        // --- Render Daytime Chart ---
        if (dataDaytime) {
            const chroniclesRanges = getChroniclesInRange(Object.keys(dataDaytime), menuDateStart, menuDateEnd, State.chroniclesData);
            renderChart("online-stat-daytime", "online_stat_daytime", dataDaytime, "players, avg", chroniclesRanges, State);
        }
        
        // --- Render Monthly Charts ---
        if (dataMonthAvg) {
            const chroniclesRanges = getChroniclesInRange(Object.keys(dataMonthAvg), formatFrom, formatTo, State.chroniclesData);
            renderChart("online-stat-month", "online_stat", dataMonthAvg, "players, avg", chroniclesRanges, State);
        }
        if (dataMonthMax) {
            const chroniclesRanges = getChroniclesInRange(Object.keys(dataMonthMax), formatFrom, formatTo, State.chroniclesData);
            renderChart("online-stat-month", "online_stat_max", dataMonthMax, "players, max", chroniclesRanges, State);
        }
    } catch(err) {
        console.error("Failed to fetch and render chart data:", err);
    }
}

// Initialization and Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    fetchAnnounce();
    fetchAchievement();
    fetchLastPhrase();
    fetchFlavor();
    
    // Attempt to load charts initially
    loadAllCharts();

    const dateStartInput = document.getElementById("date_start");
    const dateEndInput = document.getElementById("date_end");
    const toggleChroniclesCheckbox = document.getElementById("toggleChronicles");

    if (dateStartInput) {
        dateStartInput.addEventListener("change", loadAllCharts);
    }
    
    if (dateEndInput) {
        dateEndInput.addEventListener("change", loadAllCharts);
    }

    if (toggleChroniclesCheckbox) {
        toggleChroniclesCheckbox.addEventListener("change", function() {
            State.showChronicles = this.checked;
            
            // Update all charts visuals
            ['online-stat-all-weeks', 'online-stat-daytime', 'online-stat-month'].forEach(id => {
                const chart = Chart.getChart(id);
                if (chart) {
                    chart.update();
                }
            });
        });
    }
});
