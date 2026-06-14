const searchBtn = document.getElementById("searchBtn");
const searchBox = document.getElementById("searchBox");
const result = document.getElementById("result");

let images = [];
let page = 0;
const perPage = 10;

function score(title, query) {
    const t = title.toLowerCase();
    const words = query.toLowerCase().split(/\s+/);

    let s = 0;

    for (const word of words) {
        if (t === word) s += 100;
        else if (t.includes(word)) s += 20;
    }

    return s;
}

async function searchImages() {
    const query = searchBox.value.trim();

    if (!query) return;

    result.innerHTML = "<p>Searching...</p>";

    try {
        const res = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=500&prop=imageinfo&iiprop=url&format=json&origin=*`
        );

        const data = await res.json();

        const pages = Object.values(data.query?.pages || {});

        images = pages
            .filter(p => p.imageinfo?.[0]?.url)
            .filter(p => {
                const title = p.title.toLowerCase();

                if (title.includes("diagram")) return false;
                if (title.includes("icon")) return false;
                if (title.includes("logo")) return false;
                if (title.includes("coat of arms")) return false;
                if (title.includes("flag")) return false;
                if (title.includes("map")) return false;
                if (title.includes("skeleton")) return false;
                if (title.includes("skull")) return false;
                if (title.includes("dead")) return false;
                if (title.includes("carcass")) return false;
                if (title.includes("corpse")) return false;

                return true;
            })
            .sort((a, b) =>
                score(b.title, query) - score(a.title, query)
            )
            .map(p => ({
                title: p.title,
                url: p.imageinfo[0].url
            }));

        page = 0;

        renderPage();

    } catch {
        result.innerHTML = "<p>Search failed.</p>";
    }
}

function renderPage() {
    const start = page * perPage;
    const end = start + perPage;

    const current = images.slice(start, end);

    if (!current.length) {
        result.innerHTML = "<p>No images found.</p>";
        return;
    }

    result.innerHTML = `
        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
            gap:12px;
            margin-top:20px;
        ">
            ${current.map(img => `
                <div>
                    <img
                        src="${img.url}"
                        alt="${img.title}"
                        loading="lazy"
                        onerror="this.parentElement.remove()"
                        style="
                            width:100%;
                            height:220px;
                            object-fit:cover;
                            border:1px solid #ddd;
                            border-radius:6px;
                        "
                    >
                </div>
            `).join("")}
        </div>

        <div style="
            display:flex;
            justify-content:center;
            gap:10px;
            margin-top:20px;
        ">
            ${page > 0 ? `<button id="prevBtn">Previous Page</button>` : ""}
            ${end < images.length ? `<button id="nextBtn">Next Page</button>` : ""}
        </div>

        <div style="
            text-align:center;
            margin-top:10px;
        ">
            Page ${page + 1} of ${Math.max(1, Math.ceil(images.length / perPage))}
        </div>
    `;

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) {
        prevBtn.onclick = () => {
            page--;
            renderPage();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            page++;
            renderPage();
        };
    }
}

searchBtn.addEventListener("click", searchImages);

searchBox.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        searchImages();
    }
});
