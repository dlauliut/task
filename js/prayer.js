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
                <p>Subuh : ${t.Fajr}</p>
                <p>Dzuhur : ${t.Dhuhr}</p>
                <p>Ashar : ${t.Asr}</p>
                <p>Maghrib : ${t.Maghrib}</p>
                <p>Isya : ${t.Isha}</p>
            `;
        }
    );
}

window.addEventListener(
    "DOMContentLoaded",
    () => loadPrayer()
);
