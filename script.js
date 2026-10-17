
const originalDestinations = [
    {
        id: "swiss-alps",
        name: "Swiss Alps",
        country: "Switzerland",
        category: "nature",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=800&q=80",
        description: "Discover snow-capped mountains, beautiful lakes and peaceful alpine villages."
    },
    {
        id: "santorini",
        name: "Santorini",
        country: "Greece",
        category: "beach",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80",
        description: "Explore whitewashed houses, blue domes and spectacular Mediterranean sunsets."
    },
    {
        id: "rome",
        name: "Rome",
        country: "Italy",
        category: "historic",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
        description: "Experience ancient landmarks, fascinating history and authentic Italian cuisine."
    },
    {
        id: "bali",
        name: "Bali",
        country: "Indonesia",
        category: "beach",
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
        description: "Enjoy tropical beaches, green rice terraces and beautiful temples."
    },
    {
        id: "kyoto",
        name: "Kyoto",
        country: "Japan",
        category: "cultural",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80",
        description: "Discover traditional Japanese gardens, historic temples and quiet streets."
    },
    {
        id: "banff",
        name: "Banff National Park",
        country: "Canada",
        category: "nature",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
        description: "Admire turquoise lakes, towering mountains and incredible hiking trails."
    }
];

let destinations = [...originalDestinations];
let itinerary = [];
let savedApiPlaces = [];
let apiRequestNumber = 0;

const destinationList = document.getElementById("destinationList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const statusMessage = document.getElementById("statusMessage");
const resultsCount = document.getElementById("resultsCount");

const itineraryList = document.getElementById("itineraryList");
const emptyTrip = document.getElementById("emptyTrip");
const tripCount = document.getElementById("tripCount");
const navCount = document.getElementById("navCount");

const detailsSection = document.getElementById("details");
const detailsContent = document.getElementById("detailsContent");
const closeDetails = document.getElementById("closeDetails");

// Load previously saved information.

try {
    const savedTrip = JSON.parse(
        localStorage.getItem("tripwise-itinerary")
    );

    if (Array.isArray(savedTrip)) {
        itinerary = savedTrip;
    }

    const savedPlaces = JSON.parse(
        localStorage.getItem("tripwise-api-places")
    );

    if (Array.isArray(savedPlaces)) {
        savedApiPlaces = savedPlaces;
    }
} catch (error) {
    console.error("Could not load saved trip:", error);
}

// Find a destination in either the original or API results.

function findDestination(id) {
    return destinations.find(place => place.id === id) ||
        savedApiPlaces.find(place => place.id === id);
}

// Keep text from API responses safe to display.

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Display destination cards.

function renderDestinations() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;
    const sortBy = sortSelect.value;

    let filtered = destinations.filter(place => {
        const matchesSearch =
            place.name.toLowerCase().includes(searchTerm) ||
            place.country.toLowerCase().includes(searchTerm) ||
            place.description.toLowerCase().includes(searchTerm);

        const matchesCategory =
            category === "all" || place.category === category;

        return matchesSearch && matchesCategory;
    });

    if (sortBy === "rating") {
        filtered.sort((a, b) =>
            (b.rating ?? 0) - (a.rating ?? 0)
        );
    } else {
        filtered.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    resultsCount.textContent = filtered.length + " places";

    if (filtered.length === 0) {
        destinationList.innerHTML =
            '<p class="empty-results">No destinations found. Try another search.</p>';
        return;
    }

    destinationList.innerHTML = filtered.map(place => {
        const isAdded = itinerary.includes(place.id);

        return `
            <article class="destination-card">
                <div class="card-image">
                    <img
                        src="${place.image}"
                        alt="${escapeHTML(place.name)}"
                        loading="lazy"
                    >

                    <span class="category-badge">
                        ${escapeHTML(place.category)}
                    </span>

                    <button
                        class="favorite-button ${isAdded ? "saved" : ""}"
                        data-action="favorite"
                        data-id="${escapeHTML(place.id)}"
                        aria-label="Toggle ${escapeHTML(place.name)} in My Trip"
                    >${isAdded ? "♥" : "♡"}</button>
                </div>

                <div class="card-body">
                    <div class="card-title-row">
                        <h3>${escapeHTML(place.name)}</h3>

                        ${place.rating != null
                            ? `<span class="rating">★ ${place.rating}</span>`
                            : `<span class="rating">City</span>`
                        }
                    </div>

                    <p class="card-location">
                        ⌖ ${escapeHTML(place.country)}
                    </p>

                    <p class="card-description">
                        ${escapeHTML(place.description)}
                    </p>

                    <div class="card-actions">
                        <button
                            class="details-button"
                            data-action="details"
                            data-id="${escapeHTML(place.id)}"
                        >View Details</button>

                        <button
                            class="add-button"
                            data-action="add"
                            data-id="${escapeHTML(place.id)}"
                            ${isAdded ? "disabled" : ""}
                        >${isAdded ? "✓ Added" : "+ Add to Trip"}</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// Save itinerary and API destinations selected for the trip.

function saveItinerary() {
    try {
        localStorage.setItem(
            "tripwise-itinerary",
            JSON.stringify(itinerary)
        );

        localStorage.setItem(
            "tripwise-api-places",
            JSON.stringify(savedApiPlaces)
        );
    } catch (error) {
        statusMessage.textContent =
            "Your trip could not be saved in this browser.";
    }
}

// Add or remove a destination.

function toggleItinerary(id) {
    const place = findDestination(id);

    if (!place) return;

    if (itinerary.includes(id)) {
        itinerary = itinerary.filter(item => item !== id);
    } else {
        itinerary.push(id);

        if (
            place.id.startsWith("api-") &&
            !savedApiPlaces.some(item => item.id === place.id)
        ) {
            savedApiPlaces.push(place);
        }
    }

    saveItinerary();
    renderDestinations();
    renderItinerary();
}

// Display My Trip.

function renderItinerary() {
    const savedPlaces = itinerary
        .map(id => findDestination(id))
        .filter(Boolean);

    tripCount.textContent = savedPlaces.length;
    navCount.textContent = savedPlaces.length;

    emptyTrip.hidden = savedPlaces.length > 0;

    itineraryList.innerHTML = savedPlaces.map(place => `
        <article class="itinerary-item">
            <img
                src="${place.image}"
                alt="${escapeHTML(place.name)}"
            >

            <div class="itinerary-item-info">
                <h3>${escapeHTML(place.name)}</h3>
                <p>${escapeHTML(place.country)}</p>
            </div>

            <button
                class="remove-button"
                data-action="remove"
                data-id="${escapeHTML(place.id)}"
                aria-label="Remove ${escapeHTML(place.name)}"
            >×</button>
        </article>
    `).join("");
}

// Show destination details.

function showDetails(id) {
    const place = findDestination(id);

    if (!place) return;

    detailsContent.innerHTML = `
        <div class="detail-layout">
            <img
                class="detail-image"
                src="${place.image}"
                alt="${escapeHTML(place.name)}"
            >

            <div class="detail-copy">
                <p class="eyebrow">
                    ${escapeHTML(place.category)} DESTINATION
                </p>

                <h2>${escapeHTML(place.name)}</h2>
                <p>⌖ ${escapeHTML(place.country)}</p>

                ${place.rating != null
                    ? `<p>★ ${place.rating} traveller rating</p>`
                    : ""
                }

                <p>${escapeHTML(place.description)}</p>

                <button class="primary-action" id="detailAddButton">
                    ${itinerary.includes(id)
                        ? "✓ Already in My Trip"
                        : "+ Add to My Trip"
                    }
                </button>
            </div>
        </div>
    `;

    detailsSection.hidden = false;

    document.getElementById("detailAddButton").onclick = () => {
        if (!itinerary.includes(id)) {
            toggleItinerary(id);
        }

        showDetails(id);
    };

    detailsSection.scrollIntoView({ behavior: "smooth" });
}

// Search the external city API using the EXISTING search bar.

async function searchCitiesFromAPI(query) {
    const term = query.trim();
    const requestNumber = ++apiRequestNumber;

    if (term.length < 2) {
        destinations = [...originalDestinations];
        renderDestinations();
        statusMessage.textContent =
            "Explore places around the world.";
        return;
    }

    statusMessage.textContent = "Searching destinations...";

    try {
        const response = await fetch(
            "https://countries.dev/cities?q=" +
            encodeURIComponent(term)
        );

        if (!response.ok) {
            throw new Error("City search failed");
        }

        const cities = await response.json();

        // Ignore results from an older search.

        if (
            requestNumber !== apiRequestNumber ||
            searchInput.value.trim() !== term
        ) {
            return;
        }

        const apiPlaces = cities
            .filter(city =>
                !originalDestinations.some(
                    place =>
                        place.name.toLowerCase() ===
                        city.name.toLowerCase()
                )
            )
            .map(city => ({
                id: "api-" + city.geonameId,
                name: city.name,
                country: city.countryCode,
                category: "city",
                rating: null,
                image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
                description:
                    city.name + ", country code " +
                    city.countryCode +
                    ". Population: " +
                    Number(city.population || 0).toLocaleString()
            }));

        destinations = [...originalDestinations, ...apiPlaces];

        statusMessage.textContent =
            "Showing matching destinations and city search results.";

        renderDestinations();

    } catch (error) {
        console.error("City API error:", error);

        statusMessage.textContent =
            "City search is temporarily unavailable. Showing local destinations.";

        destinations = [...originalDestinations];
        renderDestinations();
    }
}

// Handle Add, Favorite, Remove and Details buttons.

document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (["add", "favorite", "remove"].includes(action)) {
        toggleItinerary(id);
    }

    if (action === "details") {
        showDetails(id);
    }
});

// Connect search, filters and sorting.

searchInput.addEventListener("input", () => {
    renderDestinations();
    searchCitiesFromAPI(searchInput.value);
});

categoryFilter.addEventListener("change", renderDestinations);
sortSelect.addEventListener("change", renderDestinations);

// Close destination details.

closeDetails.addEventListener("click", () => {
    detailsSection.hidden = true;

    document.getElementById("explore").scrollIntoView({
        behavior: "smooth"
    });
});

// Start TripWise.

function loadDestinations() {
    statusMessage.textContent = "Explore places around the world.";
    renderDestinations();
    renderItinerary();
}

loadDestinations();
