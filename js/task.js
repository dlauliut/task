async function getTasks() {

    const response = await fetch(
        `https://api.github.com/gists/${CONFIG.gistId}`
    );

    const gist = await response.json();

    return JSON.parse(
        gist.files["task.json"].content
    );
}
