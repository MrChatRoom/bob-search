const searchBtn = document.getElementById("searchBtn");
const searchBox = document.getElementById("searchBox");
const result = document.getElementById("result");

let images = [];
let page = 0;
const perPage = 10;

async function searchImages() {
    const query = searchBox.value.trim();
    if (!query) return;

    result.innerHTML = "<p>Searching images...</p>";

    try {
        const res = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=100&prop=imageinfo&iiprop=url&format=json&origin=*`
        );

        const data = await res.json();

        images = Object.values(data.query?.pages || {})
            .map(p => p.imageinfo?.[0]?.url)
            .filter(Boolean)
            .filter(url =>
                url.startsWith("http") &&
                !url.includes(".tif") &&
                !url.includes(".svg")
            );

        page = 0;
        renderPage();

    } catch {
        result.innerHTML = "<p>Failed to load images.</p>";
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
            grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
            gap:10px;
            margin-top:20px;
        ">
            ${current.map(url => `
                <img
                    src="${url}"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    style="
                        width:100%;
                        height:200px;
                        object-fit:cover;
                        border-radius:6px;
                        border:1px solid #ddd;
                    "
                >
            `).join("")}
        </div>

        <div style="
            margin-top:20px;
            display:flex;
            justify-content:center;
            gap:10px;
        ">
            ${page > 0 ? `<button id="prevBtn">Previous Page</button>` : ""}
            ${end < images.length ? `<button id="nextBtn">Next Page</button>` : ""}
        </div>

        <div style="text-align:center;margin-top:10px;">
            Page ${page + 1} of ${Math.ceil(images.length / perPage)}
        </div>
    `;

    const prev = document.getElementById("prevBtn");
    const next = document.getElementById("nextBtn");

    if (prev) {
        prev.onclick = () => {
            page--;
            renderPage();
        };
    }

    if (next) {
        next.onclick = () => {
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