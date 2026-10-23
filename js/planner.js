const plannerModal = document.getElementById("plannerModal");
const plannerForm = document.getElementById("plannerForm");
const plannerName = document.getElementById("plannerName");
const plannerDay = document.getElementById("plannerDay");
const plannerStartTime = document.getElementById("plannerStartTime");
const plannerFinishTime = document.getElementById("plannerFinishTime");
const plannerModalTitle = document.getElementById("plannerModalTitle");
const plannerModalEyebrow = document.getElementById("plannerModalEyebrow");
const plannerSaveButton = document.getElementById("plannerSaveButton");
const plannerFeedback = document.getElementById("plannerFeedback");
const agendaList = document.getElementById("agendaList");

let plannerClient;
let plannerEditId = null;
let agendaItems = [];

function getIsoDayOfWeek(date = new Date()) {
    return ((date.getDay() + 6) % 7) + 1;
}

function getCurrentDayName() {
    return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date());
}

function setupPlannerClient() {
    if (!window.dashboardSupabaseClient) {
        throw new Error("Koneksi Supabase belum siap.");
    }
    plannerClient = window.dashboardSupabaseClient;
}

function createPlannerElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function setAgendaError(message) {
    agendaList.replaceChildren();
    agendaList.setAttribute("aria-busy", "false");
    const state = createPlannerElement("div", "panel-empty panel-error");
    state.append(createPlannerElement("p", "", message));
    const retry = createPlannerElement("button", "text-button", "Coba lagi");
    retry.type = "button";
    retry.addEventListener("click", loadAgenda);
    state.append(retry);
    agendaList.append(state);
}

async function loadAgenda() {
    agendaList.setAttribute("aria-busy", "true");
    try {
        const { data, error } = await plannerClient
            .from("planners")
            .select("id, title, day_of_week, start_time, finish_time")
            .eq("day_of_week", getIsoDayOfWeek())
            .order("start_time", { ascending: true });

        if (error) throw error;
        agendaItems = data || [];
        renderAgenda();
    } catch (error) {
        console.error("Gagal memuat planner hari ini:", error);
        const message = error.code === "PGRST205"
            ? "Tabel planners belum tersedia di Supabase."
            : error.message || "Jadwal hari ini gagal dimuat.";
        setAgendaError(message);
    }
}

function renderAgenda() {
    agendaList.replaceChildren();
    agendaList.setAttribute("aria-busy", "false");

    if (!agendaItems.length) {
        const empty = createPlannerElement("div", "panel-empty");
        empty.append(createPlannerElement("p", "", `Belum ada jadwal untuk ${getCurrentDayName().toLocaleLowerCase("id-ID")}.`));
        agendaList.append(empty);
        return;
    }

    agendaItems.forEach((item) => {
        const row = createPlannerElement("article", "panel-item agenda-item");
        const time = createPlannerElement(
            "time",
            "agenda-time",
            `${item.start_time?.slice(0, 5) || "--:--"}–${item.finish_time?.slice(0, 5) || "--:--"}`,
        );
        const title = createPlannerElement("span", "panel-item-title", item.title);
        const actions = createPlannerElement("div", "panel-actions");
        const edit = createPlannerElement("button", "panel-action", "✎");
        edit.type = "button";
        edit.dataset.action = "edit";
        edit.dataset.id = String(item.id);
        edit.setAttribute("aria-label", `Edit jadwal ${item.title}`);
        const remove = createPlannerElement("button", "panel-action", "×");
        remove.type = "button";
        remove.dataset.action = "delete";
        remove.dataset.id = String(item.id);
        remove.setAttribute("aria-label", `Hapus jadwal ${item.title}`);
        actions.append(edit, remove);
        row.append(time, title, actions);
        agendaList.append(row);
    });
}

function openPlannerModal(item = null) {
    plannerEditId = item ? item.id : null;
    plannerModalTitle.textContent = item ? "Edit jadwal" : "Tambah jadwal";
    plannerModalEyebrow.textContent = "JADWAL MINGGUAN";
    plannerName.value = item?.title || "";
    plannerDay.value = String(item?.day_of_week || getIsoDayOfWeek());
    plannerStartTime.value = item?.start_time?.slice(0, 5) || "";
    plannerFinishTime.value = item?.finish_time?.slice(0, 5) || "";
    plannerFeedback.textContent = "";
    plannerSaveButton.textContent = item ? "Simpan perubahan" : "Simpan";
    plannerModal.classList.remove("hidden");
    plannerModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    plannerName.focus();
}

function closePlannerModal() {
    plannerModal.classList.add("hidden");
    plannerModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    plannerForm.reset();
    plannerEditId = null;
}

async function savePlannerItem(event) {
    event.preventDefault();
    const title = plannerName.value.trim();
    if (!title) {
        plannerFeedback.textContent = "Nama jadwal wajib diisi.";
        plannerName.focus();
        return;
    }
    if (plannerFinishTime.value <= plannerStartTime.value) {
        plannerFeedback.textContent = "Waktu selesai harus setelah waktu mulai.";
        plannerFinishTime.focus();
        return;
    }

    const values = {
        title,
        day_of_week: Number(plannerDay.value),
        start_time: plannerStartTime.value,
        finish_time: plannerFinishTime.value,
    };
    const isEditing = plannerEditId !== null;

    plannerSaveButton.disabled = true;
    plannerSaveButton.textContent = "Menyimpan…";
    plannerFeedback.textContent = "";
    try {
        const query = plannerEditId
            ? plannerClient.from("planners").update(values).eq("id", plannerEditId)
            : plannerClient.from("planners").insert([values]);
        const { error } = await query;
        if (error) throw error;

        closePlannerModal();
        await loadAgenda();
    } catch (error) {
        console.error("Gagal menyimpan planner:", error);
        plannerFeedback.textContent = error.message || "Jadwal tidak dapat disimpan.";
    } finally {
        plannerSaveButton.disabled = false;
        plannerSaveButton.textContent = isEditing ? "Simpan perubahan" : "Simpan";
    }
}

async function deletePlannerItem(id) {
    if (!window.confirm("Hapus jadwal ini?")) return;
    try {
        const { error } = await plannerClient.from("planners").delete().eq("id", id);
        if (error) throw error;
        await loadAgenda();
    } catch (error) {
        console.error("Gagal menghapus jadwal:", error);
        window.alert(error.message || "Jadwal tidak dapat dihapus.");
    }
}

agendaList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "delete") {
        deletePlannerItem(button.dataset.id);
    } else {
        const item = agendaItems.find((record) => String(record.id) === button.dataset.id);
        if (item) openPlannerModal(item);
    }
});

document.getElementById("addAgendaButton").addEventListener("click", () => openPlannerModal());
plannerForm.addEventListener("submit", savePlannerItem);
plannerModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-planner]")) closePlannerModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !plannerModal.classList.contains("hidden")) closePlannerModal();
});

document.addEventListener("DOMContentLoaded", () => {
    try {
        setupPlannerClient();
        loadAgenda();
    } catch (error) {
        console.error("Inisialisasi planner gagal:", error);
        setAgendaError(error.message);
    }
});
