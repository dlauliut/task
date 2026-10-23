const billsModal = document.getElementById("billsModal");
const billsForm = document.getElementById("billsForm");
const billTitleInput = document.getElementById("billTitle");
const billPeriodInput = document.getElementById("billPeriod");
const billDueDayInput = document.getElementById("billDueDay");
const billDueMonthInput = document.getElementById("billDueMonth");
const billDueMonthField = document.querySelector(".due-month-field");
const billDueDateFields = document.querySelector(".due-date-fields");
const billsModalTitle = document.getElementById("billsModalTitle");
const billsSaveButton = document.getElementById("billsSaveButton");
const billsFeedback = document.getElementById("billsFeedback");
const billsList = document.getElementById("billList");
const monthlyTab = document.getElementById("monthlyTab");
const yearlyTab = document.getElementById("yearlyTab");

let billsClient;
let activeBillPeriod = "Monthly";
let editingBillId = null;
let billItems = [];

function setupBillsClient() {
    if (!window.dashboardSupabaseClient) {
        throw new Error("Koneksi Supabase belum siap.");
    }
    billsClient = window.dashboardSupabaseClient;
}

function createBillElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function showBillsError(message) {
    billsList.replaceChildren();
    billsList.setAttribute("aria-busy", "false");
    const state = createBillElement("div", "panel-empty panel-error");
    state.append(createBillElement("p", "", message));
    const retry = createBillElement("button", "text-button", "Coba lagi");
    retry.type = "button";
    retry.addEventListener("click", loadBills);
    state.append(retry);
    billsList.append(state);
}

async function loadBills() {
    billsList.setAttribute("aria-busy", "true");
    try {
        const { data, error } = await billsClient
            .from("bills")
            .select("id, title, period_type, is_paid, due_day, due_month")
            .eq("period_type", activeBillPeriod)
            .order("created_at", { ascending: false });

        if (error) throw error;
        billItems = data || [];
        renderBills();
    } catch (error) {
        console.error("Gagal memuat daftar bayar:", error);
        showBillsError(error.code === "PGRST205"
            ? "Tabel bills belum tersedia di Supabase."
            : error.message || "Daftar bayar gagal dimuat.");
    }
}

function renderBills() {
    billsList.replaceChildren();
    billsList.setAttribute("aria-busy", "false");

    if (!billItems.length) {
        const empty = createBillElement("div", "panel-empty");
        empty.append(createBillElement(
            "p",
            "",
            activeBillPeriod === "Monthly" ? "Belum ada pembayaran bulanan." : "Belum ada pembayaran tahunan.",
        ));
        billsList.append(empty);
        return;
    }

    billItems.forEach((bill) => {
        const row = createBillElement("article", `panel-item bill-item${bill.is_paid ? " is-paid" : ""}`);
        const paidLabel = createBillElement("label", "bill-status");
        const checkbox = createBillElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(bill.is_paid);
        checkbox.dataset.action = "paid";
        checkbox.dataset.id = String(bill.id);
        checkbox.setAttribute("aria-label", `Tandai ${bill.title} ${bill.is_paid ? "belum dibayar" : "sudah dibayar"}`);
        paidLabel.append(checkbox);

        const title = createBillElement("span", "panel-item-title", bill.title);
        const dueDate = createBillElement("time", "bill-due-date", formatBillDueDate(bill));
        const dueDateState = getDueDateState(bill);
        if (!bill.is_paid && dueDateState) dueDate.classList.add(dueDateState);
        const dateValue = getBillDate(bill);
        if (dateValue) {
            dueDate.dateTime = dateValue.toISOString().slice(0, 10);
        }
        const actions = createBillElement("div", "panel-actions");
        const edit = createBillElement("button", "panel-action", "✎");
        edit.type = "button";
        edit.dataset.action = "edit";
        edit.dataset.id = String(bill.id);
        edit.setAttribute("aria-label", `Edit ${bill.title}`);
        const remove = createBillElement("button", "panel-action", "×");
        remove.type = "button";
        remove.dataset.action = "delete";
        remove.dataset.id = String(bill.id);
        remove.setAttribute("aria-label", `Hapus ${bill.title}`);
        actions.append(edit, remove);
        row.append(paidLabel, title, dueDate, actions);
        billsList.append(row);
    });
}

function getBillDate(bill) {
    const now = new Date();
    const month = bill.period_type === "Monthly" ? now.getMonth() : Number(bill.due_month) - 1;
    const year = now.getFullYear();
    const day = Number(bill.due_day);
    const validMonth = Number.isInteger(month) && month >= 0 && month <= 11;
    const validDay = Number.isInteger(day) && day >= 1 && day <= 31;
    if (!validMonth || !validDay) return null;

    const date = new Date(year, month, 1);
    date.setDate(Math.min(day, new Date(year, month + 1, 0).getDate()));
    date.setHours(0, 0, 0, 0);
    return date;
}

function formatBillDueDate(bill) {
    const date = getBillDate(bill);
    if (!date) return "Tanggal belum diatur";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
    }).format(date).replace(" ", "-");
}

function getDueDateState(bill) {
    const dueDate = getBillDate(bill);
    if (!dueDate) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    if (daysUntilDue < 0) return "overdue";
    if (bill.period_type === "Yearly" && daysUntilDue <= 30) return "upcoming";
    return "";
}

function updateDueMonthVisibility() {
    const isYearly = billPeriodInput.value === "Yearly";
    billDueMonthField.classList.toggle("hidden", !isYearly);
    billDueDateFields.classList.toggle("monthly-due", !isYearly);
    billDueMonthInput.required = isYearly;
}

function openBillsModal(bill = null) {
    editingBillId = bill ? bill.id : null;
    billsModalTitle.textContent = bill ? "Edit daftar bayar" : "Tambah daftar bayar";
    billsSaveButton.textContent = bill ? "Simpan perubahan" : "Simpan";
    billTitleInput.value = bill?.title || "";
    billPeriodInput.value = bill?.period_type || activeBillPeriod;
    billDueDayInput.value = bill?.due_day ?? "";
    billDueMonthInput.value = String(bill?.due_month || new Date().getMonth() + 1);
    updateDueMonthVisibility();
    billsFeedback.textContent = "";
    billsModal.classList.remove("hidden");
    billsModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    billTitleInput.focus();
}

function closeBillsModal() {
    billsModal.classList.add("hidden");
    billsModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    billsForm.reset();
    editingBillId = null;
}

async function saveBill(event) {
    event.preventDefault();
    const title = billTitleInput.value.trim();
    const dueDay = Number(billDueDayInput.value);
    const period = billPeriodInput.value;
    if (!title) {
        billsFeedback.textContent = "Nama pembayaran wajib diisi.";
        billTitleInput.focus();
        return;
    }
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        billsFeedback.textContent = "Tanggal jatuh tempo harus antara 1 dan 31.";
        billDueDayInput.focus();
        return;
    }

    const values = {
        title,
        period_type: period,
        due_day: dueDay,
        due_month: period === "Yearly" ? Number(billDueMonthInput.value) : null,
        ...(editingBillId ? {} : { is_paid: false }),
    };
    const savedPeriod = values.period_type;
    const isEditing = editingBillId !== null;
    billsSaveButton.disabled = true;
    billsSaveButton.textContent = "Menyimpan…";
    billsFeedback.textContent = "";

    try {
        const query = editingBillId
            ? billsClient.from("bills").update(values).eq("id", editingBillId)
            : billsClient.from("bills").insert([values]);
        const { error } = await query;
        if (error) throw error;

        const shouldReload = savedPeriod === activeBillPeriod;
        closeBillsModal();
        if (shouldReload) await loadBills();
        else selectBillPeriod(savedPeriod);
    } catch (error) {
        console.error("Gagal menyimpan pembayaran:", error);
        billsFeedback.textContent = error.message || "Pembayaran tidak dapat disimpan.";
    } finally {
        billsSaveButton.disabled = false;
        billsSaveButton.textContent = isEditing ? "Simpan perubahan" : "Simpan";
    }
}

async function setBillPaid(id, isPaid) {
    try {
        const { error } = await billsClient
            .from("bills")
            .update({ is_paid: isPaid })
            .eq("id", id);
        if (error) throw error;
        await loadBills();
    } catch (error) {
        console.error("Gagal memperbarui status pembayaran:", error);
        window.alert(error.message || "Status pembayaran tidak dapat diperbarui.");
        await loadBills();
    }
}

async function deleteBill(id) {
    if (!window.confirm("Hapus item daftar bayar ini?")) return;
    try {
        const { error } = await billsClient.from("bills").delete().eq("id", id);
        if (error) throw error;
        await loadBills();
    } catch (error) {
        console.error("Gagal menghapus pembayaran:", error);
        window.alert(error.message || "Pembayaran tidak dapat dihapus.");
    }
}

function selectBillPeriod(period) {
    activeBillPeriod = period;
    monthlyTab.classList.toggle("active", period === "Monthly");
    yearlyTab.classList.toggle("active", period === "Yearly");
    monthlyTab.setAttribute("aria-selected", String(period === "Monthly"));
    yearlyTab.setAttribute("aria-selected", String(period === "Yearly"));
    loadBills();
}

billsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const bill = billItems.find((item) => String(item.id) === button.dataset.id);
    if (!bill) return;

    if (button.dataset.action === "delete") deleteBill(bill.id);
    if (button.dataset.action === "edit") openBillsModal(bill);
});

billsList.addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[data-action="paid"]');
    if (checkbox) setBillPaid(checkbox.dataset.id, checkbox.checked);
});

document.getElementById("addBillButton").addEventListener("click", () => openBillsModal());
billPeriodInput.addEventListener("change", updateDueMonthVisibility);
monthlyTab.addEventListener("click", () => selectBillPeriod("Monthly"));
yearlyTab.addEventListener("click", () => selectBillPeriod("Yearly"));
billsForm.addEventListener("submit", saveBill);
billsModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-bills]")) closeBillsModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !billsModal.classList.contains("hidden")) closeBillsModal();
});

document.addEventListener("DOMContentLoaded", () => {
    try {
        setupBillsClient();
        loadBills();
    } catch (error) {
        console.error("Inisialisasi daftar bayar gagal:", error);
        showBillsError(error.message);
    }
});
