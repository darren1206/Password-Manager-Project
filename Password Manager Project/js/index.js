// ✅ 認證 / 主題
import { checkLogin, logout } from './auth.js';
import { applyTheme } from './theme.js';

// ✅ 工具函式
import { showMessage, showToast, togglePassword } from './utils.js';

// ✅ 密碼管理邏輯
import {
    subCategoryMap, renderTable, editPassword,
    deletePassword, passwords, setEditingIndex, savePassword
} from './passwords.js';

// ✅ 使用者資料管理
import { getUsers } from './storage.js';


function bindPasswordToggleButtons() {
    document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
        btn.addEventListener("click", () => {
            const index = btn.id.split("-")[1];
            togglePassword(index);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    applyTheme(); // ✅ 先套主題

    // ✅ DOM 元素取得
    const logoutBtn = document.getElementById("logoutBtn");
    const currentUserSpan = document.getElementById("currentUser");
    const mainSection = document.getElementById("mainSection");

    const form = document.getElementById("passwordForm");
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const sortOption = document.getElementById("sortOption");
    const mainSelect = document.getElementById("mainCategory");
    const subSelect = document.getElementById("subCategory");

    // ✅ 綁定登出事件
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            logout(); // ✅ 清掉 localStorage 並跳轉 login
        });
    }

    // ✅ 驗證登入
    checkLogin();

    // ✅ 登入顯示用戶名
    const user = localStorage.getItem("currentUser");
    if (user) {
        const users = getUsers();
        const userObj = users.find(u => u.username === user);
        const displayName = userObj?.nickname || user;

        const logs = JSON.parse(localStorage.getItem("loginLogs")) || [];
        const lastLogin = logs.reverse().find(log => log.user === user);

        currentUserSpan.textContent = `👋 歡迎 ${displayName}${lastLogin ? `（上次登入：${new Date(lastLogin.time).toLocaleString()}）` : ''}`;
        mainSection.style.display = "block";

        // ✅ 如果是管理員，就顯示 adminPanel 區塊
        if (localStorage.getItem("isAdmin") === "true") {
            document.getElementById("adminPanel")?.classList.remove("d-none");
        }
    }

    // ✅ 暱稱編輯邏輯
    const editNicknameBtn = document.getElementById("editNicknameBtn");
    const saveNicknameBtn = document.getElementById("saveNicknameBtn");
    const newNicknameInput = document.getElementById("newNickname");
    const editNicknameModal = new bootstrap.Modal(document.getElementById("editNicknameModal"));

    editNicknameBtn?.addEventListener("click", () => {
        const users = getUsers();
        const user = localStorage.getItem("currentUser");
        const userObj = users.find(u => u.username === user);
        newNicknameInput.value = userObj?.nickname || "";
        editNicknameModal.show();
    });

    saveNicknameBtn?.addEventListener("click", () => {
        const newNickname = newNicknameInput.value.trim();
        if (newNickname.length > 20) return showToast("暱稱最多 20 字", true);

        const users = getUsers();
        const user = localStorage.getItem("currentUser");
        const userObj = users.find(u => u.username === user);
        if (userObj) {
            userObj.nickname = newNickname;
            localStorage.setItem("users", JSON.stringify(users));
            showToast("暱稱已更新");
            location.reload(); // ✅ 重新整理頁面以更新顯示
        }
    });


    // ✅ 主分類改變時，刷新子分類
    mainSelect.addEventListener("change", () => {
        const category = mainSelect.value;
        subSelect.innerHTML = '<option value="">請選擇</option>';
        if (subCategoryMap[category]) {
            subCategoryMap[category].forEach(sub => {
                const option = document.createElement("option");
                option.value = sub;
                option.textContent = sub;
                subSelect.appendChild(option);
            });
        }
    });

    // ✅ 表單送出處理
    form.addEventListener("submit", e => {
        e.preventDefault();

        const site = document.getElementById("siteName").value.trim();
        const account = document.getElementById("account").value.trim();
        const password = document.getElementById("password").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const subPassword = document.getElementById("subPassword").value.trim();
        const userCode = document.getElementById("userCode").value.trim();
        const idNumber = document.getElementById("idNumber")?.value.trim() || "";
        const note = document.getElementById("note").value.trim();
        const mainCategory = mainSelect.value;
        const subCategory = subSelect.value;

        // ✅ 必填欄位檢查
        if (!site || !account || !password || !mainCategory || !subCategory) {
            showToast("所有欄位皆為必填！", true);
            return;
        }

        // ✅ 格式驗證（選填欄位有填才檢查）
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            showToast("Email 格式錯誤", true);
            return;
        }
        if (idNumber && !/^[A-Z][0-9]{9}$/.test(idNumber)) {
            showToast("身分證格式錯誤", true);
            return;
        }
        if (phone && !/^09\d{2}-?\d{3}-?\d{3}$/.test(phone)) {
            showToast("手機號碼格式錯誤", true);
            return;
        }

        // ✅ 資料儲存
        savePassword({
            site,
            account,
            password,
            email,
            phone,
            subPassword,
            userCode,
            idNumber,
            note,
            mainCategory,
            subCategory
        });

        form.reset();
        bootstrap.Modal.getInstance(document.getElementById("addModal")).hide();
        renderTable();
    });

    // ✅ 篩選與搜尋事件
    searchInput.addEventListener("input", renderTable);
    categoryFilter.addEventListener("change", renderTable);
    sortOption.addEventListener("change", renderTable);

    renderTable();
    bindPasswordToggleButtons();

    document.getElementById("passwordTable").addEventListener("click", e => {
        if (e.target.classList.contains("edit-btn")) {
            const index = parseInt(e.target.dataset.index);
            editPassword(index);
        } else if (e.target.classList.contains("delete-btn")) {
            const index = parseInt(e.target.dataset.index);
            if (confirm("確定要刪除這筆資料？")) {
                deletePassword(index);
                renderTable(); // ❗重新渲染
            }
        }
    });

    // ✅ Modal 顏色刷新
    document.addEventListener('shown.bs.modal', () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('force-redraw');
            void modal.offsetHeight;
            modal.classList.add('force-redraw');
        });

        document.querySelectorAll('.modal-content').forEach(content => {
            content.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--color-bg');
            content.style.color = getComputedStyle(document.body).getPropertyValue('--color-text');
        });
    });
});

