async function loadTasks() {

    const response = await fetch(
        `https://api.github.com/gists/${CONFIG.gistId}`
    );

    const data = await response.json();

    const tasks = JSON.parse(
        data.files["task.json"].content
    ).tasks;

    const list = document.getElementById("taskList");

    list.innerHTML = "";

    tasks.forEach(t => {

        list.innerHTML += `
            <li>
                ${t.title}
            </li>
        `;
    });
}

loadTasks();