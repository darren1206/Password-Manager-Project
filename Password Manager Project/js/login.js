// 📁 login.js (模組版)
import { showToast, shakeElement, showInputError } from './utils.js';
import { applyTheme } from './theme.js';
import {
    getUsers, saveUsers, getLoginFailInfo, setLoginFailInfo,
    resetLoginFail, saveLoginToken, applyRememberedAccount,
    generateVerifyCode, getStoredVerifyCode, clearVerifyCode,
    isUsernameTaken, isEmailTaken, isPhoneTaken, registerUser,
    saveLoginLog
} from './storage.js';

function updateStrengthBarAndLabel(password, barId, labelId) {
    const bar = document.getElementById(barId);
    const label = document.getElementById(labelId);
    let strength = 0;

    if (!password) {
        bar.style.width = "0%";
        label.textContent = "尚未輸入，無法判斷強度";
        label.className = "form-text";
        return;
    }

    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthLabels = ["弱", "中", "強"];
    const strengthClasses = ["weak", "medium", "strong"];
    const strengthPercents = ["33%", "66%", "100%"];

    if (strength === 0) {
        bar.style.width = "0%";
        label.textContent = "密碼強度：太弱";
        label.className = "form-text weak";
        return;
    }

    const idx = Math.min(strength - 1, 2);
    bar.style.width = strengthPercents[idx];
    label.textContent = `密碼強度：${strengthLabels[idx]}`;
    label.className = `form-text ${strengthClasses[idx]}`;
}

// 🔐 DOM Ready 初始化
document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    applyRememberedAccount();
    bindEvents();
    setupModalThemeSync();
    setupPasswordToggles();
    setupInputTooltips();
    document.getElementById("loginUsername")?.focus();
});

function bindEvents() {
    document.getElementById("loginBtn")?.addEventListener("click", handleLogin);
    document.getElementById("registerBtn")?.addEventListener("click", handleRegister);
    document.getElementById("forgotPasswordBtn")?.addEventListener("click", () => {
        new bootstrap.Modal(document.getElementById("forgotPasswordModal")).show();
    });
    document.getElementById("resetPasswordBtn")?.addEventListener("click", handleResetPassword);

    // Enter 快捷鍵
    document.querySelectorAll('#loginTab input').forEach(input => {
        input.addEventListener("keypress", e => e.key === "Enter" && handleLogin());
    });
    document.querySelectorAll('#registerTab input').forEach(input => {
        input.addEventListener("keypress", e => e.key === "Enter" && handleRegister());
    });

    // Tab 切換自動 focus
    document.querySelectorAll('#authTabs a[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', event => {
            const targetId = event.target.getAttribute("href");
            const focusTarget = targetId === "#loginTab" ? "loginUsername" : "registerUsername";
            document.getElementById(focusTarget)?.focus();
        });
    });

    // ✅ 密碼強度監聽
    const registerPwd = document.getElementById("registerPassword");
    const resetPwd = document.getElementById("newPassword");

    registerPwd?.addEventListener("input", () => {
        updateStrengthBarAndLabel(registerPwd.value, "pwdStrengthBar", "pwdStrengthLabel");
    });

    resetPwd?.addEventListener("input", () => {
        updateStrengthBarAndLabel(resetPwd.value, "resetPwdStrengthBar", "resetPwdStrengthLabel");
    });
}

// ✅ 顯示 / 隱藏 密碼切換
function setupPasswordToggles() {
    const setupToggle = (inputId, iconId, btnId) => {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        const btn = document.getElementById(btnId);
        if (!input || !icon || !btn) return;

        btn.addEventListener("click", () => {
            const isText = input.type === "text";
            input.type = isText ? "password" : "text";
            icon.classList.toggle("bi-eye", isText);
            icon.classList.toggle("bi-eye-slash", !isText);
        });
    };

    setupToggle("registerPassword", "registerEyeIcon", "toggleRegisterPwd");
    setupToggle("loginPassword", "loginEyeIcon", "toggleLoginPwd");
    setupToggle("newPassword", "resetEyeIcon", "toggleResetPwd");
}

function setupModalThemeSync() {
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
}

function handleLogin() {
    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // ✅ 清除舊狀態
    [usernameInput, passwordInput].forEach(input => {
        input.classList.remove("is-invalid");
        bootstrap.Tooltip.getInstance(input)?.dispose();
        input.removeAttribute("title");
    });

    // ✅ 檢查空值
    if (!username || !password) {
        if (!username) {
            shakeElement(usernameInput);
            showInputError(usernameInput, "請輸入帳號");
        }
        if (!password) {
            shakeElement(passwordInput);
            showInputError(passwordInput, "請輸入密碼");
        }
        return showToast("請輸入帳號與密碼", true);
    }

    const users = getUsers();
    const failInfo = getLoginFailInfo(username);
    const now = Date.now();

    // ✅ 帳號鎖定中
    if (failInfo.lockedUntil > now) {
        const secondsLeft = Math.ceil((failInfo.lockedUntil - now) / 1000);
        return showToast(`此帳號已鎖定，請 ${secondsLeft} 秒後再試`, true);
    }

    const user = users.find(u => u.username === username);

    // ✅ 查無此帳號
    if (!user) {
        shakeElement(usernameInput);
        showInputError(usernameInput, "查無此帳號");
        return showToast("查無此帳號", true);
    }

    // ✅ 密碼錯誤
    if (user.password !== password) {
        shakeElement(passwordInput);
        showInputError(passwordInput, "密碼錯誤");
        let count = failInfo.count + 1;
        let lockedUntil = count >= 5 ? Date.now() + 30000 : 0;
        setLoginFailInfo(username, count >= 5 ? 0 : count, lockedUntil);
        return showToast(count >= 5 ? "🚫 密碼錯誤 5 次，帳號鎖定 30 秒" : `🔑 密碼錯誤：第 ${count} 次`, true);
    }

    // ✅ 登入成功流程
    saveLoginToken(username);
    localStorage.setItem("currentUser", username);
    saveLoginLog(username);
    resetLoginFail(username);
    showToast("登入成功，即將跳轉...");

    if (user.role === "admin") {
        localStorage.setItem("isAdmin", "true");
    } else {
        localStorage.removeItem("isAdmin");
    }

    const rememberU = document.getElementById("rememberUsername").checked;
    const rememberP = document.getElementById("rememberPassword").checked;
    rememberU ? localStorage.setItem("rememberedUsername", username) : localStorage.removeItem("rememberedUsername");
    rememberP ? localStorage.setItem("rememberedPassword", password) : localStorage.removeItem("rememberedPassword");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

function handleRegister() {
    const username = document.getElementById("registerUsername");
    const password = document.getElementById("registerPassword");
    const email = document.getElementById("registerEmail");
    const phone = document.getElementById("registerPhone");
    const nickname = document.getElementById("registerNickname");
    const agree = document.getElementById("agreeTerms").checked;

    // 清除狀態
    [username, password, email, phone, nickname].forEach(input => {
        input.classList.remove("is-valid", "is-invalid");
        bootstrap.Tooltip.getInstance(input)?.dispose();
        input.removeAttribute("title");
    });

    let hasError = false;

    // ✅ 空值檢查
    [username, password, email, phone, nickname].forEach(input => {
        if (!input.value.trim()) {
            showInputError(input, "此欄位為必填");
            hasError = true;
        } else {
            input.classList.add("is-valid");
        }
    });
    if (hasError) return showToast("所有欄位皆為必填", true);

    // ✅ 條款檢查
    if (!agree) return showToast("請勾選同意條款", true);

    const usernameVal = username.value.trim();
    const passwordVal = password.value.trim();
    const emailVal = email.value.trim();
    const phoneVal = phone.value.trim();
    const nicknameVal = nickname.value.trim();

    // ✅ 規則驗證
    if (
        usernameVal.length < 6 || usernameVal.length > 20 ||
        !/[A-Za-z]/.test(usernameVal) || !/\d/.test(usernameVal)
    ) {
        showInputError(username, "帳號需為 6～20 字，含英文字母與數字");
        return showToast("帳號格式錯誤", true);
    }

    if (
        passwordVal.length < 6 || passwordVal.length > 20 ||
        !/[A-Za-z]/.test(passwordVal) || !/\d/.test(passwordVal)
    ) {
        showInputError(password, "密碼需為 6～20 字，含英文字母與數字");
        return showToast("密碼格式錯誤", true);
    }

    if (usernameVal === passwordVal) {
        showInputError(password, "密碼不能與帳號相同");
        return showToast("密碼不能與帳號相同", true);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        showInputError(email, "請輸入有效的 Email 格式");
        return showToast("Email 格式錯誤", true);
    }

    if (!/^09\d{8}$/.test(phoneVal)) {
        showInputError(phone, "請輸入正確的手機號碼格式（如 09xxxxxxxx）");
        return showToast("手機號碼格式錯誤", true);
    }

    if (nicknameVal.length > 20) {
        showInputError(nickname, "暱稱不能超過 20 字元");
        return showToast("暱稱過長", true);
    }

    // ✅ 重複檢查
    if (isUsernameTaken(usernameVal)) {
        showInputError(username, "此帳號已被註冊");
        return showToast("帳號重複", true);
    }
    if (isEmailTaken(emailVal)) {
        showInputError(email, "此 Email 已被註冊");
        return showToast("Email 重複", true);
    }
    if (isPhoneTaken(phoneVal)) {
        showInputError(phone, "此手機號碼已被註冊");
        return showToast("手機號碼重複", true);
    }

    // ✅ 模擬發送驗證碼流程
    const failCount = { count: 0 };
    const resendBtn = document.getElementById("resendCodeBtn");
    const input = document.getElementById("verifyCodeInput");

    const sendCode = () => {
        const code = generateVerifyCode(emailVal);
        showToast(`模擬驗證碼：${code}（有效 5 分鐘）`, false, 15000);
        input.value = "";
        startResendCountdown(resendBtn);
    };

    sendCode();

    resendBtn.onclick = () => {
        if (!resendBtn.disabled) sendCode();
    };

    const modal = new bootstrap.Modal(document.getElementById("verifyModal"));
    modal.show();

    document.getElementById("verifyCodeBtn").onclick = () => {
        const inputCode = input.value.trim();
        const stored = getStoredVerifyCode(emailVal);

        if (!stored || Date.now() > stored.expiresAt) {
            showInputError(input, "驗證碼已過期");
            return showToast("驗證碼已過期，請重新註冊", true);
        }

        if (inputCode !== stored.code) {
            failCount.count++;
            showInputError(input, `驗證碼錯誤，還剩 ${5 - failCount.count} 次機會`);
            if (failCount.count >= 5) {
                clearVerifyCode(emailVal);
                modal.hide();
                return showToast("❌ 驗證錯誤超過 5 次，請重新註冊", true);
            }
            return;
        }

        clearVerifyCode(emailVal);
        registerUser({ username: usernameVal, password: passwordVal, email: emailVal, phone: phoneVal, nickname: nicknameVal });
        modal.hide();
        showToast("註冊成功，請登入使用");

        document.querySelector('a[href="#loginTab"]').click();
        setTimeout(() => {
            document.getElementById("loginUsername").value = usernameVal;
            document.getElementById("loginPassword").value = passwordVal;
            document.getElementById("loginUsername").focus();
        }, 300);
    };
}

function startResendCountdown(btn) {
    let seconds = 10;
    btn.disabled = true;
    btn.textContent = `重新發送驗證碼(${seconds}秒)`;

    const timer = setInterval(() => {
        seconds--;
        btn.textContent = `重新發送驗證碼(${seconds}秒)`;
        if (seconds <= 0) {
            clearInterval(timer);
            btn.disabled = false;
            btn.textContent = "重新發送驗證碼";
        }
    }, 1000);
}

function handleResetPassword() {
    const emailInput = document.getElementById("resetEmail");
    const pwdInput = document.getElementById("newPassword");
    const email = emailInput.value.trim();
    const newPwd = pwdInput.value.trim();
    const users = getUsers();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        shakeElement(emailInput);
        return showToast("請輸入有效 Email 格式", true);
    }
    if (!/[A-Za-z]/.test(newPwd) || !/[0-9]/.test(newPwd) || newPwd.length < 6 || newPwd.length > 20) {
        shakeElement(pwdInput);
        return showToast("密碼需含英文與數字，6～20 字元", true);
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        shakeElement(emailInput);
        return showToast("查無此 Email", true);
    }
    if (user.username === newPwd) {
        shakeElement(pwdInput);
        return showToast("密碼不能與帳號相同", true);
    }

    user.password = newPwd;
    saveUsers(users);
    showToast("密碼重設成功，請重新登入");
    bootstrap.Modal.getInstance(document.getElementById("forgotPasswordModal")).hide();
}

function setupInputTooltips() {
    const tips = [
        { id: "registerUsername", text: "帳號需為 6～20 字，含英文字母與數字" },
        { id: "registerPassword", text: "密碼需為 6～20 字，含英文與數字，不能與帳號相同" },
        { id: "registerEmail", text: "請輸入有效 Email，例如 abc@mail.com" },
        { id: "registerPhone", text: "手機號碼需為 09 開頭的 10 位數" },
        { id: "registerNickname", text: "暱稱不能超過 20 字元" },
        { id: "newPassword", text: "密碼需為 6～20 字，含英文與數字，不能與帳號相同" }
    ];

    tips.forEach(({ id, text }) => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute("title", text);
            el.setAttribute("data-bs-toggle", "tooltip");
            el.setAttribute("data-bs-placement", "right");

            const tooltip = new bootstrap.Tooltip(el, {
                trigger: "manual",
                delay: { show: 100, hide: 100 }
            });

            el.addEventListener("focus", () => tooltip.show());
            el.addEventListener("blur", () => tooltip.hide());
        }
    });
}


