import { showToast, togglePassword, shakeElement, showInputError } from './utils.js';

export const subCategoryMap = {
    "社群": ["Facebook", "Instagram", "LINE", "Discord"],
    "銀行": ["網銀", "信用卡", "投資平台"],
    "購物": ["蝦皮", "PChome", "Momo", "Amazon"],
    "工作": ["Slack", "Trello", "Jira"],
    "遊戲": ["Steam", "PlayStation", "Xbox", "Switch"]
};

export let passwords = JSON.parse(localStorage.getItem("passwords")) || [];
let editingIndex = null;

export function setEditingIndex(i) {
    editingIndex = i;
}

export function savePassword(data) {
    if (editingIndex !== null) {
        passwords[editingIndex] = data;
        editingIndex = null;
    } else {
        passwords.push(data);
    }
    localStorage.setItem("passwords", JSON.stringify(passwords));
}

export function deletePassword(i) {
    // 🧼 刪除前先移除那顆按鈕的 tooltip（避免殘留）
    const deleteBtn = document.querySelector(`.delete-btn[data-index="${i}"]`);
    bootstrap.Tooltip.getInstance(deleteBtn)?.dispose();

    passwords.splice(i, 1);
    localStorage.setItem("passwords", JSON.stringify(passwords));
    renderTable(); // 重繪表格
}

export function editPassword(i) {
    const p = passwords[i];
    document.getElementById("siteName").value = p.site;
    document.getElementById("account").value = p.account;
    document.getElementById("password").value = p.password;
    document.getElementById("mainCategory").value = p.mainCategory;
    document.getElementById("mainCategory").dispatchEvent(new Event("change"));

    setTimeout(() => {
        document.getElementById("subCategory").value = p.subCategory;
    }, 100);

    document.getElementById("email").value = p.email || "";
    document.getElementById("phone").value = p.phone || "";
    document.getElementById("subPassword").value = p.subPassword || "";
    document.getElementById("userCode").value = p.userCode || "";
    document.getElementById("idNumber").value = p.idNumber || "";
    document.getElementById("note").value = p.note || "";

    setEditingIndex(i);
    new bootstrap.Modal(document.getElementById("addModal")).show();
}

export function renderTable() {

    // 清理所有 tooltip（避免殘留）
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        bootstrap.Tooltip.getInstance(el)?.dispose();
    });

    const tbody = document.getElementById("passwordTable");
    const search = document.getElementById("searchInput").value.trim().toLowerCase();
    const filter = document.getElementById("categoryFilter").value;
    const sort = document.getElementById("sortOption").value;

    let data = [...passwords];

    // ✅ 搜尋 & 篩選
    if (search) {
        data = data.filter(p => p.site.toLowerCase().includes(search));
    }
    if (filter) {
        data = data.filter(p => p.mainCategory === filter);
    }

    // ✅ 排序
    if (sort === "site") {
        data.sort((a, b) => a.site.localeCompare(b.site));
    } else if (sort === "category") {
        data.sort((a, b) => a.mainCategory.localeCompare(b.mainCategory));
    }

    // ✅ 清空表格
    tbody.innerHTML = "";

    // ✅ 判斷提示訊息類型
    if (passwords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">🈳 尚未新增任何密碼</td></tr>`;
        return;
    }
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">🔍 沒有符合條件的資料</td></tr>`;
        return;
    }

    data.forEach((item, i) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.site}</td>
            <td>
            <span id="account-${i}">${item.account}</span>
            <button class="btn btn-sm btn-outline-success ms-1 copy-account-btn"
            data-index="${i}" title="複製帳號" data-bs-toggle="tooltip">📄</button>
            </td>
            <td class="pw-cell">
                <span id="pw-${i}" data-password="${item.password}" data-visible="false" class="pw-dot">••••••••</span>
                <button class="btn btn-sm btn-outline-secondary ms-2 toggle-btn" data-index="${i}" title="顯示/隱藏密碼">👁️</button>
                <button class="btn btn-sm btn-outline-success ms-1 copy-btn" data-index="${i}" title="複製密碼" data-bs-toggle="tooltip">📋</button>
            </td>
            <td>${item.mainCategory}</td>
            <td>${item.subCategory}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2 edit-btn"
        data-index="${i}" title="編輯資料" data-bs-toggle="tooltip">✏️</button>
                <button class="btn btn-sm btn-outline-danger delete-btn"
        data-index="${i}" title="刪除資料" data-bs-toggle="tooltip">🗑️</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // 初始化 tooltip
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        new bootstrap.Tooltip(el);
    });

    // 綁定 👁️ 顯示/隱藏密碼
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener("click", () => {
            const i = btn.dataset.index;
            const pwSpan = document.getElementById(`pw-${i}`);
            const isVisible = pwSpan.dataset.visible === "true";

            if (isVisible) {
                pwSpan.textContent = "••••••••";
                pwSpan.dataset.visible = "false";
            } else {
                pwSpan.textContent = pwSpan.dataset.password;
                pwSpan.dataset.visible = "true";
            }
        });
    });

    //  📋複製密碼
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener("click", () => {
            const i = btn.dataset.index;
            const password = document.getElementById(`pw-${i}`).dataset.password;

            navigator.clipboard.writeText(password).then(() => {
                showToast("已複製密碼");
            }).catch(err => {
                showToast("複製失敗", true);
                console.error("Clipboard error:", err);
            });
        });
    });

    // 📄 複製帳號
    document.querySelectorAll('.copy-account-btn').forEach(btn => {
        btn.addEventListener("click", () => {
            const i = btn.dataset.index;
            const account = document.getElementById(`account-${i}`).textContent;

            navigator.clipboard.writeText(account).then(() => {
                showToast("已複製帳號");
            }).catch(err => {
                showToast("複製失敗", true);
                console.error("Clipboard error:", err);
            });
        });
    });

}

const toggleBtn = document.getElementById("toggleAdvanced");
if (toggleBtn) {
    toggleBtn.addEventListener("click", e => {
        e.preventDefault();
        const advanced = document.getElementById("advancedFields");
        const toggleText = toggleBtn;

        if (advanced.classList.contains("d-none")) {
            advanced.classList.remove("d-none");
            toggleText.textContent = "－ 隱藏進階欄位";
        } else {
            advanced.classList.add("d-none");
            toggleText.textContent = "＋ 顯示進階欄位";
        }
    });
}
