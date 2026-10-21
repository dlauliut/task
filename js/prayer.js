navigator.geolocation.getCurrentPosition(
async function(position){

    const lat = position.coords.latitude;

    const lon = position.coords.longitude;

    const result = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=11`
    );

    const data = await result.json();

    console.log(data.data.timings);

});