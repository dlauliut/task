async function getTasks() {

    const response = await fetch(
        `https://api.github.com/gists/${CONFIG.gistId}`
    );

    const gist = await response.json();

    return JSON.parse(
        gist.files["task.json"].content
    );
}

function renderTasks(tasks) {

    const list = document.getElementById(
        "taskList"
    );

    list.innerHTML = "";

    if (!tasks.length) {

        list.innerHTML =
            "<p>Tidak ada task.</p>";

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

                    <div class="task-title ${task.done ? "done" : ""}">
                        ${task.title}
                    </div>

                    <div class="deadline">
                        📅 ${task.deadline || "-"}
                    </div>

                </div>

            </div>

        </div>

        `;
    });
}

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            const data =
                await getTasks();

            renderTasks(data.tasks);

        } catch (err) {

            console.error(err);

            document.getElementById(
                "taskList"
            ).innerHTML =
                "Gagal membaca task.";

        }

    }
);
