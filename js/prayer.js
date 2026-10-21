async function loadPrayer() {

    navigator.geolocation.getCurrentPosition(
        async function(position) {

            const lat =
                position.coords.latitude;

            const lon =
                position.coords.longitude;

            const response =
                await fetch(
                    `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=11`
                );

            const data =
                await response.json();

            const t =
                data.data.timings;

            document.getElementById(
                "prayerResult"
            ).innerHTML = `
            
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
        }
    );
}

window.addEventListener(
    "DOMContentLoaded",
    () => loadPrayer()
);
