function renderTasks(tasks){

    const list =
    document.getElementById("taskList");

    list.innerHTML="";

    tasks.forEach(task=>{

        list.innerHTML += `

        <div class="task-item">

            <div class="task-left">

                <input
                    type="checkbox"
                    ${task.done ? "checked" : ""}
                    onchange="toggleTask(${task.id})">

                <div>

                    <div class="
                    task-title
                    ${task.done ? "done" : ""}">
                        ${task.title}
                    </div>

                    <div class="deadline">
                        📅 ${task.deadline || "-"}
                    </div>

                </div>

            </div>

            <button
              class="delete-btn"
              onclick="deleteTask(${task.id})">
              🗑
            </button>

        </div>

        `;
    });
}
