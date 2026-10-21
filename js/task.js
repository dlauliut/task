async function getTasks() {

    const response = await fetch(
        `https://api.github.com/gists/${CONFIG.gistId}`
    );

    if (!response.ok) {
        throw new Error(
            `HTTP Error ${response.status}`
        );
    }

    const gist = await response.json();

    if (!gist.files["task.json"]) {
        throw new Error(
            "File task.json tidak ditemukan di Gist"
        );
    }

    return JSON.parse(
        gist.files["task.json"].content
    );

}

function renderTasks(tasks) {

    const list =
        document.getElementById("taskList");

    if (!list) {
        console.error(
            "Element #taskList tidak ditemukan"
        );
        return;
    }

    list.innerHTML = "";

    if (!tasks || tasks.length === 0) {

        list.innerHTML = `
            <div class="empty-task">
                Belum ada task
            </div>
        `;

        return;
    }

    tasks.forEach(task => {

        list.innerHTML += `
            <div class="task-item">

                <div class="task-left">

                    <input
                        type="checkbox"
                        ${task.done ? "checked" : ""}
                        disabled>

                    <div>

                        <div class="
                            task-title
                            ${task.done ? "done" : ""}
                        ">
                            ${task.title}
                        </div>

                        <div class="deadline">
                            📅 Deadline:
                            ${task.deadline || "-"}
                        </div>

                    </div>

                </div>

            </div>
        `;

    });

}

window.onload = async function () {

    try {

        const data =
            await getTasks();

        console.log(
            "Task Loaded:",
            data
        );

        renderTasks(
            data.tasks
        );

        if (
            typeof loadPrayer ===
            "function"
        ) {
            loadPrayer();
        }

    }
    catch (err) {

        console.error(err);

        document.getElementById(
            "taskList"
        ).innerHTML = `
            <div style="color:red">
                Gagal membaca task dari Gist
            </div>
        `;

    }

};
