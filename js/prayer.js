async function loadPrayer() {

    navigator.geolocation.getCurrentPosition(
        async function(position) {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            let locationName = "Unknown Location";

            try {

                const geo = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
                );

                const geoData = await geo.json();

                const addr = geoData.address || {};

                locationName =
                    addr.suburb ||
                    addr.city_district ||
                    addr.city ||
                    addr.county ||
                    "Unknown Location";

            } catch(e) {
                console.error(e);
            }

            const timezone =
                Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone;

            const response = await fetch(
                `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=11`
            );

            const data = await response.json();

            const t = data.data.timings;

            document.getElementById(
                "prayerResult"
            ).innerHTML = `

            <div class="location-info">

                <div class="location-name">
                    📍 ${locationName}
                </div>

                <div class="location-timezone">
                    🌎 ${timezone}
                </div>

            </div>

            <div class="prayer-table">

                <div class="prayer-row">
                    <span class="prayer-name">Subuh</span>
                    <span class="prayer-time">${t.Fajr}</span>
                </div>

                <div class="prayer-row">
                    <span class="prayer-name">Dzuhur</span>
                    <span class="prayer-time">${t.Dhuhr}</span>
                </div>

                <div class="prayer-row">
                    <span class="prayer-name">Ashar</span>
                    <span class="prayer-time">${t.Asr}</span>
                </div>

                <div class="prayer-row">
                    <span class="prayer-name">Maghrib</span>
                    <span class="prayer-time">${t.Maghrib}</span>
                </div>

                <div class="prayer-row">
                    <span class="prayer-name">Isya</span>
                    <span class="prayer-time">${t.Isha}</span>
                </div>

            </div>

            `;

        },
        function(error) {

            document.getElementById(
                "prayerResult"
            ).innerHTML = `
                Lokasi tidak dapat diambil.
            `;

        }
    );

}
