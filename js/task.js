const taskList = document.getElementById("taskList");
const taskSummary = document.getElementById("taskSummary");
const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskDeadlineInput = document.getElementById("taskDeadline");
const modalTitle = document.getElementById("modalTitle");
const saveButton = document.getElementById("saveButton");
const formFeedback = document.getElementById("formFeedback");

let supabaseClient;
let editId = null;
let tasks = [];

function initializeSupabase() {
    if (
        !window.supabase
        || typeof CONFIG === "undefined"
        || !CONFIG.supabaseUrl
        || !CONFIG.supabaseKey
    ) {
        throw new Error("Konfigurasi Supabase belum tersedia. Periksa config.js.");
    }

    supabaseClient = window.supabase.createClient(
        CONFIG.supabaseUrl,
        CONFIG.supabaseKey
    );
    window.dashboardSupabaseClient = supabaseClient;
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function showTaskError(message) {
    taskSummary.textContent = "Daftar task belum dapat dimuat.";
    taskList.replaceChildren();

    const errorState = createElement("div", "error-state");
    errorState.append(
        createElement("p", "", message),
    );
    const retryButton = createElement("button", "text-button", "Coba lagi");
    retryButton.type = "button";
    retryButton.dataset.action = "retry";
    errorState.append(retryButton);
    taskList.append(errorState);
    taskList.setAttribute("aria-busy", "false");
}

async function loadTasks() {
    taskList.setAttribute("aria-busy", "true");
    try {
        const { data, error } = await supabaseClient
            .from("tasks")
            .select("*")
            .order("id");

        if (error) throw error;

        tasks = data || [];
        renderTasks();
    } catch (error) {
        console.error("Gagal memuat task:", error);
        showTaskError(error.message || "Terjadi kesalahan saat memuat task.");
    }
}

function formatDeadline(deadline) {
    if (!deadline) return "Tanpa tenggat";

    const date = new Date(`${deadline}T00:00:00`);
    if (Number.isNaN(date.getTime())) return `Tenggat: ${deadline}`;

    return `Tenggat ${new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date)}`;
}

function renderTasks() {
    taskList.replaceChildren();
    taskList.setAttribute("aria-busy", "false");

    const completedCount = tasks.filter((task) => task.done).length;
    taskSummary.textContent = tasks.length
        ? `${completedCount} dari ${tasks.length} task selesai`
        : "Mulai dengan menambahkan task pertamamu.";

    if (tasks.length === 0) {
        const emptyState = createElement("div", "empty-state");
        const icon = createElement("span", "empty-icon", "✳");
        icon.setAttribute("aria-hidden", "true");
        emptyState.append(
            icon,
            createElement("strong", "", "Belum ada task"),
            createElement("p", "", "Tambahkan satu hal yang ingin kamu selesaikan."),
        );
        taskList.append(emptyState);
        return;
    }

    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");
    tasks.forEach((task) => {
        const item = createElement("article", "task-item");
        const left = createElement("div", "task-left");
        const checkbox = createElement("input", "task-checkbox");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(task.done);
        checkbox.dataset.action = "toggle";
        checkbox.dataset.id = String(task.id);
        checkbox.setAttribute("aria-label", `Tandai "${task.title}" sebagai selesai`);

        const details = createElement("div");
        const title = createElement("div", `task-title${task.done ? " done" : ""}`, task.title || "Task tanpa judul");
        const isOverdue = task.deadline && task.deadline < today && !task.done;
        const deadline = createElement(
            "div",
            `deadline${isOverdue ? " overdue" : ""}`,
            formatDeadline(task.deadline),
        );
        details.append(title, deadline);
        left.append(checkbox, details);

        const actions = createElement("div", "task-actions");
        const editButton = createElement("button", "task-action", "✎");
        editButton.type = "button";
        editButton.dataset.action = "edit";
        editButton.dataset.id = String(task.id);
        editButton.setAttribute("aria-label", `Edit task ${task.title}`);
        const deleteButton = createElement("button", "task-action delete", "×");
        deleteButton.type = "button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = String(task.id);
        deleteButton.setAttribute("aria-label", `Hapus task ${task.title}`);
        actions.append(editButton, deleteButton);

        item.append(left, actions);
        taskList.append(item);
    });
}

function openModal(task = null) {
    editId = task ? task.id : null;
    modalTitle.textContent = task ? "Edit task" : "Tambah task";
    saveButton.textContent = task ? "Simpan perubahan" : "Simpan task";
    taskTitleInput.value = task?.title || "";
    taskDeadlineInput.value = task?.deadline || "";
    formFeedback.textContent = "";
    taskModal.classList.remove("hidden");
    taskModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    taskTitleInput.focus();
}

function closeModal() {
    taskModal.classList.add("hidden");
    taskModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    taskForm.reset();
    editId = null;
}

async function saveTask(event) {
    event.preventDefault();
    const title = taskTitleInput.value.trim();
    const deadline = taskDeadlineInput.value;

    if (!title) {
        formFeedback.textContent = "Nama task wajib diisi.";
        taskTitleInput.focus();
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = editId ? "Menyimpan…" : "Menambahkan…";
    formFeedback.textContent = "";
    try {
        const result = editId
            ? await supabaseClient
                .from("tasks")
                .update({ title, deadline: deadline || null })
                .eq("id", editId)
            : await supabaseClient
                .from("tasks")
                .insert([{ title, deadline: deadline || null, done: false }]);

        if (result.error) throw result.error;

        closeModal();
        await loadTasks();
    } catch (error) {
        console.error("Gagal menyimpan task:", error);
        formFeedback.textContent = error.message || "Task tidak dapat disimpan. Coba lagi.";
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editId ? "Simpan perubahan" : "Simpan task";
    }
}

async function toggleTask(id, checked) {
    try {
        const { error } = await supabaseClient
            .from("tasks")
            .update({ done: checked })
            .eq("id", id);

        if (error) throw error;
        await loadTasks();
    } catch (error) {
        console.error("Gagal memperbarui status task:", error);
        window.alert(error.message || "Status task tidak dapat diperbarui.");
        await loadTasks();
    }
}

async function deleteTask(id) {
    if (!window.confirm("Hapus task ini?")) return;

    try {
        const { error } = await supabaseClient
            .from("tasks")
            .delete()
            .eq("id", id);

        if (error) throw error;
        await loadTasks();
    } catch (error) {
        console.error("Gagal menghapus task:", error);
        window.alert(error.message || "Task tidak dapat dihapus.");
    }
}

document.getElementById("addTaskButton").addEventListener("click", () => openModal());
taskForm.addEventListener("submit", saveTask);

taskModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !taskModal.classList.contains("hidden")) closeModal();
});

taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "retry") {
        loadTasks();
    } else if (action === "edit") {
        const task = tasks.find((item) => String(item.id) === id);
        if (task) openModal(task);
    } else if (action === "delete") {
        deleteTask(id);
    }
});

taskList.addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[data-action="toggle"]');
    if (checkbox) toggleTask(checkbox.dataset.id, checkbox.checked);
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date()).toLocaleUpperCase("id-ID");

    try {
        initializeSupabase();
        loadTasks();
    } catch (error) {
        console.error("Inisialisasi dashboard gagal:", error);
        showTaskError(error.message);
    }
});
