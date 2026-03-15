// web/static/js/api.js

function unescape(str) {
    return str.replace(/&amp;#34;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

async function fetchAnnounce() {
    try {
        const response = await fetch("/api/random_announce");
        const data = await response.json();
        
        const author = data.Author ? `<figcaption class="blockquote-footer">${data.Author}</figcaption>` : "";
        const button = `<button id="update_announce" class="btn btn-outline-secondary btn-sm fa-solid fa-arrow-rotate-right float-md-end ms-2"></button>`;
        
        document.getElementById("random_announce").innerHTML = `
            <figure class="text-end">
                <p class="h5">${button}${data.Title}</p>
                <p id="announce_contents" class="fs-6"></p>
                ${author}
            </figure>`;
            
        document.getElementById("announce_contents").textContent = unescape(data.Content);
        document.getElementById("update_announce").addEventListener('click', fetchAnnounce);
    } catch (error) {
        console.error("Error fetching announce:", error);
    }
}

async function fetchAchievement() {
    try {
        const response = await fetch("/api/random_achievement");
        const data = await response.json();
        
        const button = `<button id="update_achievement" class="btn btn-outline-secondary btn-sm fa-solid fa-arrow-rotate-right float-md-end ms-2"></button>`;
        
        document.getElementById("random_achievement").innerHTML = `
            <figure class="text-end">
                <p class="h5">${button}${data.Title}</p>
                <p id="achievement_contents" class="fs-6"></p>
                <figcaption class="blockquote-footer">
                    ${data.Key} as ${data.Name}
                </figcaption>
            </figure>`;
            
        document.getElementById("achievement_contents").textContent = unescape(data.Desc);
        document.getElementById("update_achievement").addEventListener('click', fetchAchievement);
    } catch (error) {
        console.error("Error fetching achievement:", error);
    }
}

async function fetchFlavor() {
    try {
        const response = await fetch("/api/random_flavor");
        const data = await response.json();
        
        const button = `<button id="update_flavor" class="btn btn-outline-secondary btn-sm fa-solid fa-arrow-rotate-right float-md-end ms-2"></button>`;
        
        document.getElementById("random_flavor").innerHTML = `
            <figure class="text-end">
                <p class="h5">${button}${data.Name}</p>
                <p id="flavor_contents" class="fs-6"></p>
                <figcaption class="blockquote-footer" style="text-transform:capitalize;">
                    ${data.Gender}, ${data.Age}, ${data.Species}
                </figcaption>
            </figure>`;
            
        document.getElementById("flavor_contents").textContent = unescape(data.Flavor);
        document.getElementById("update_flavor").addEventListener('click', fetchFlavor);
    } catch (error) {
        console.error("Error fetching flavor:", error);
    }
}

async function fetchLastPhrase() {
    try {
        const response = await fetch("/api/random_last_phrase");
        const data = await response.json();
        
        const button = `<button id="update_last_phrase" class="btn btn-outline-secondary btn-sm fa-solid fa-arrow-rotate-right float-md-end ms-2"></button>`;
        
        document.getElementById("random_last_phrase").innerHTML = `
            <figure class="text-end">
                <p class="h5">${button}Перед смертью в ${data.TimeOfDeath}</p>
                <p class="fs-6"><span style='font-weight: 500;'>${data.Name}</span>: "${data.Phrase}"</p>
                <figcaption class="blockquote-footer">
                    Round #${data.RoundID}
                </figcaption>
            </figure>`;
            
        document.getElementById("update_last_phrase").addEventListener('click', fetchLastPhrase);
    } catch (error) {
        console.error("Error fetching last phrase:", error);
    }
}

async function fetchChronicles(dateFrom, dateTo) {
    try {
        const response = await fetch(`/api/chronicles_daytime?dateFrom=${dateFrom}&dateTo=${dateTo}`);
        const data = await response.json();
        
        const chroniclesMap = {};
        const eventsByDate = {};

        for (const [key, value] of Object.entries(data)) {
            const dateOnly = key.split('T')[0];
            if (!eventsByDate[dateOnly]) {
                eventsByDate[dateOnly] = [];
            }
            eventsByDate[dateOnly].push(value);
        }

        for (const [date, events] of Object.entries(eventsByDate)) {
            if (events.length === 1) {
                chroniclesMap[date] = events[0];
            } else {
                chroniclesMap[date] = events.join(' | ');
            }
        }
        return chroniclesMap;
    } catch (error) {
        console.error("Error fetching chronicles:", error);
        return {};
    }
}

async function fetchChartData(endpoint, dateFrom, dateTo) {
    try {
        const response = await fetch(`/api/${endpoint}?dateFrom=${dateFrom}&dateTo=${dateTo}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching chart data from ${endpoint}:`, error);
        return null; // Return null to identify errors gracefully
    }
}
