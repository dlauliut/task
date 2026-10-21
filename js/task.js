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

async function toggleTask(id){

    const data =
    await getTasks();

    const task =
    data.tasks.find(
        x=>x.id===id
    );

    task.done = !task.done;

    await saveTasks(data);

    renderTasks(data.tasks);
}

async function deleteTask(id){

    const data =
    await getTasks();

    data.tasks =
    data.tasks.filter(
        x=>x.id!==id
    );

    await saveTasks(data);

    renderTasks(data.tasks);
}

async function addTask(){

    const data =
    await getTasks();

    data.tasks.push({

        id:Date.now(),

        title:
        document.getElementById(
        "taskInput").value,

        deadline:
        document.getElementById(
        "deadlineInput").value,

        done:false,

        createdAt:
        new Date().toISOString()
    });

    await saveTasks(data);

    renderTasks(data.tasks);
}
