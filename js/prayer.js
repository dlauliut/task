const prayerResult = document.getElementById("prayerResult");
const refreshPrayerButton = document.getElementById("refreshPrayerButton");
const prayerTimes = [
    ["Subuh", "Fajr"],
    ["Dzuhur", "Dhuhr"],
    ["Ashar", "Asr"],
    ["Maghrib", "Maghrib"],
    ["Isya", "Isha"],
];

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Browser ini tidak mendukung akses lokasi."));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 300000,
        });
    });
}

function getLocationError(error) {
    if (error.code === 1) return "Izin lokasi ditolak. Aktifkan izin lokasi untuk melihat jadwal.";
    if (error.code === 2) return "Lokasi tidak tersedia. Periksa koneksi atau pengaturan lokasi perangkat.";
    if (error.code === 3) return "Pencarian lokasi terlalu lama. Silakan coba lagi.";
    return error.message || "Lokasi tidak dapat diambil.";
}

async function getLocationName(latitude, longitude) {
    const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(latitude),
        lon: String(longitude),
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
    if (!response.ok) throw new Error(`Layanan lokasi merespons ${response.status}.`);

    const result = await response.json();
    const address = result.address || {};
    return address.suburb
        || address.city_district
        || address.city
        || address.town
        || address.county
        || "Lokasi saat ini";
}

function renderPrayerError(message) {
    prayerResult.replaceChildren();
    prayerResult.setAttribute("aria-busy", "false");

    const state = document.createElement("div");
    state.className = "error-state";
    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    const retryButton = document.createElement("button");
    retryButton.className = "text-button";
    retryButton.type = "button";
    retryButton.textContent = "Coba lagi";
    retryButton.addEventListener("click", loadPrayer);
    state.append(messageElement, retryButton);
    prayerResult.append(state);
}

function renderPrayerTimes(locationName, timezone, timings) {
    prayerResult.replaceChildren();
    prayerResult.setAttribute("aria-busy", "false");

    const locationInfo = document.createElement("div");
    locationInfo.className = "location-info";
    const pin = document.createElement("span");
    pin.className = "location-pin";
    pin.setAttribute("aria-hidden", "true");
    pin.textContent = "⌖";

    const locationDetails = document.createElement("div");
    const name = document.createElement("div");
    name.className = "location-name";
    name.textContent = locationName;
    const timezoneLabel = document.createElement("div");
    timezoneLabel.className = "location-timezone";
    timezoneLabel.textContent = timezone;
    locationDetails.append(name, timezoneLabel);
    locationInfo.append(pin, locationDetails);

    const table = document.createElement("div");
    table.className = "prayer-table";
    table.setAttribute("role", "list");

    prayerTimes.forEach(([label, key]) => {
        const row = document.createElement("div");
        row.className = "prayer-row";
        row.setAttribute("role", "listitem");
        const time = document.createElement("span");
        time.className = "prayer-time";
        time.textContent = timings[key] || "--:--";
        const prayerName = document.createElement("span");
        prayerName.className = "prayer-name";
        prayerName.textContent = label;
        row.append(time, prayerName);
        table.append(row);
    });

    prayerResult.append(locationInfo, table);
}

async function loadPrayer() {
    refreshPrayerButton.disabled = true;
    prayerResult.setAttribute("aria-busy", "true");
    prayerResult.replaceChildren();

    const loading = document.createElement("div");
    loading.className = "loading-state compact";
    const spinner = document.createElement("span");
    spinner.className = "loading-spinner";
    spinner.setAttribute("aria-hidden", "true");
    const message = document.createElement("span");
    message.textContent = "Mencari jadwal…";
    loading.append(spinner, message);
    prayerResult.append(loading);

    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        const locationName = await getLocationName(latitude, longitude)
            .catch((error) => {
                console.warn("Nama lokasi tidak dapat ditemukan:", error);
                return "Lokasi saat ini";
            });
        const params = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            method: "11",
        });
        const response = await fetch(`https://api.aladhan.com/v1/timings?${params}`);
        if (!response.ok) throw new Error(`Layanan jadwal salat merespons ${response.status}.`);

        const result = await response.json();
        if (result.code !== 200 || !result.data?.timings) {
            throw new Error(result.status || "Jadwal salat belum tersedia untuk lokasi ini.");
        }

        const timezone = result.data.meta?.timezone
            || Intl.DateTimeFormat().resolvedOptions().timeZone;
        renderPrayerTimes(locationName, timezone, result.data.timings);
    } catch (error) {
        console.error("Gagal memuat jadwal salat:", error);
        renderPrayerError(error.code ? getLocationError(error) : error.message);
    } finally {
        refreshPrayerButton.disabled = false;
    }
}

refreshPrayerButton.addEventListener("click", loadPrayer);
document.addEventListener("DOMContentLoaded", loadPrayer);
