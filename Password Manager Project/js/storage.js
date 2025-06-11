// 📁 storage.js（localStorage 管理模組）

// ✅ 使用者資料
export function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

export function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

// ✅ 登入失敗次數紀錄
export function getLoginFailInfo(username) {
    const raw = localStorage.getItem("loginFail_" + username);
    return raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 };
}

export function setLoginFailInfo(username, count, lockedUntil) {
    localStorage.setItem("loginFail_" + username, JSON.stringify({ count, lockedUntil }));
}

export function resetLoginFail(username) {
    localStorage.removeItem("loginFail_" + username);
}

// ✅ 模擬登入 token
export function saveLoginToken(username) {
    const token = btoa(username + Date.now());
    localStorage.setItem("authToken", token);
}

// ✅ 記住帳號密碼
export function applyRememberedAccount() {
    const savedUser = localStorage.getItem("rememberedUsername");
    const savedPass = localStorage.getItem("rememberedPassword");

    if (savedUser) {
        document.getElementById("loginUsername").value = savedUser;
        document.getElementById("rememberUsername").checked = true;
    } else {
        document.getElementById("rememberUsername").checked = false;
    }

    if (savedPass) {
        document.getElementById("loginPassword").value = savedPass;
        document.getElementById("rememberPassword").checked = true;
    } else {
        document.getElementById("rememberPassword").checked = false;
    }
}

// ✅ 驗證碼模擬資料處理
export function generateVerifyCode(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 分鐘有效
    localStorage.setItem("verify_" + email, JSON.stringify({ code, expiresAt }));
    return code;
}

export function getStoredVerifyCode(email) {
    return JSON.parse(localStorage.getItem("verify_" + email));
}

export function clearVerifyCode(email) {
    localStorage.removeItem("verify_" + email);
}

// ✅ 登入狀態管理
export function isUserLoggedIn() {
    const token = localStorage.getItem("authToken");
    const currentUser = localStorage.getItem("currentUser");
    const users = getUsers();
    return token && currentUser && users.some(u => u.username === currentUser);
}

export function clearLoginState() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
}

// ✅ Email、帳號、手機是否已存在
export function isUsernameTaken(username) {
    return getUsers().some(u => u.username === username);
}

export function isEmailTaken(email) {
    return getUsers().some(u => u.email === email);
}

export function isPhoneTaken(phone) {
    return getUsers().some(u => u.phone === phone);
}

// ✅ 註冊新帳號
export function registerUser(user) {
    const users = getUsers();
    user.role = "user"; // ✅ 預設角色為 user，可手動改 admin
    users.push(user);
    saveUsers(users);
}

// ✅ 登入紀錄（localStorage 模擬）
export function saveLoginLog(username) {
    const logs = JSON.parse(localStorage.getItem("loginLogs")) || [];
    logs.push({ user: username, time: new Date().toISOString() });
    localStorage.setItem("loginLogs", JSON.stringify(logs));
}

export function getLoginLogs() {
    return JSON.parse(localStorage.getItem("loginLogs")) || [];
}
