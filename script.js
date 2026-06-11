const searchBtn = document.getElementById("searchBtn");
const searchBox = document.getElementById("searchBox");
const result = document.getElementById("result");

function formatName(url) {
    try {
        const domain = new URL(url).hostname.replace("www.", "");

        const map = {
            "itch.io": "Itch.io",
            "github.com": "GitHub",
            "wikipedia.org": "Wikipedia",
            "store.steampowered.com": "Steam",
            "developer.mozilla.org": "MDN Web Docs",
            "unity.com": "Unity",
            "python.org": "Python.org",
            "youtube.com": "YouTube"
        };

        return map[domain] || domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
    } catch {
        return url;
    }
}

function isTutorial(query) {
    const keywords = [
        "tutorial",
        "how to",
        "learn",
        "guide",
        "setup",
        "make",
        "build",
        "create",
        "recipe"
    ];
    return keywords.some(k => query.toLowerCase().includes(k));
}

async function getWikiTitle(query) {
    const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`
    );

    const data = await res.json();
    if (!data.query.search.length) return null;

    return data.query.search[0].title;
}

async function getWikiSummary(title) {
    const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );

    return await res.json();
}

async function getOfficialSiteFromWikidata(title) {
    const pageRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageprops&format=json&origin=*`
    );

    const pageData = await pageRes.json();
    const pageId = Object.keys(pageData.query.pages)[0];

    const wikidataId = pageData.query.pages[pageId].pageprops?.wikibase_item;
    if (!wikidataId) return null;

    const dataRes = await fetch(
        `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`
    );

    const data = await dataRes.json();
    const entity = data.entities[wikidataId];

    return entity?.claims?.P856?.[0]?.mainsnak?.datavalue?.value || null;
}

async function getExtraLinks(title) {
    const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=externallinks&format=json&origin=*`
    );

    const data = await res.json();

    if (!data.parse?.externallinks) return [];

    return data.parse.externallinks
        .filter(l => l.startsWith("http"))
        .filter(l => !l.includes("wikipedia.org"))
        .slice(0, 2)
        .map(l => ({
            title: formatName(l),
            url: l
        }));
}

function getYouTube(query) {
    return [
        {
            title: "Search YouTube Tutorials",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        }
    ];
}

async function search() {
    const query = searchBox.value.trim();

    if (!query) {
        result.innerHTML = "<p>Type something first.</p>";
        return;
    }

    result.innerHTML = "<p>Searching...</p>";

    try {
        const title = await getWikiTitle(query);

        if (!title) {
            result.innerHTML = "<p>No results found.</p>";
            return;
        }

        const wiki = await getWikiSummary(title);
        const official = await getOfficialSiteFromWikidata(title);

        let extra = [];

        if (isTutorial(query)) {
            extra = getYouTube(query);
        } else {
            extra = await getExtraLinks(title);
        }

        result.innerHTML = `
            <h2>${wiki.title}</h2>
            ${wiki.thumbnail ? `<img src="${wiki.thumbnail.source}">` : ""}
            <p>${wiki.extract || ""}</p>

            <h3>Sources</h3>

            <div class="card">
                📘 Wikipedia<br>
                <a href="${wiki.content_urls.desktop.page}" target="_blank">
                    Wikipedia Page
                </a>
            </div>

            ${official ? `
                <div class="card">
                    🌐 Official Website<br>
                    <a href="${official}" target="_blank">
                        ${formatName(official)}
                    </a>
                </div>
            ` : ""}

            ${extra.map(l => `
                <div class="card">
                    🌐 ${l.title}<br>
                    <a href="${l.url}" target="_blank">${l.url}</a>
                </div>
            `).join("")}
        `;

    } catch (e) {
        result.innerHTML = "<p>Something went wrong.</p>";
    }
}

searchBtn.addEventListener("click", search);

searchBox.addEventListener("keydown", e => {
    if (e.key === "Enter") search();
});