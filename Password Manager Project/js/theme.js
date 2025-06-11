const themes = ["light", "dark", "blood", "desert"];
let currentTheme = localStorage.getItem("theme");

if (!themes.includes(currentTheme)) {
    currentTheme = "light";
    localStorage.setItem("theme", currentTheme);
}

function updateThemeButton(theme) {
    const btn = document.getElementById("themeToggleBtn");
    if (btn && theme) {
        btn.textContent = `🎨 主題：${getThemeName(theme)}`;
    }
}

function getThemeName(theme) {
    switch (theme) {
        case "light": return "藍白";
        case "dark": return "暗綠";
        case "blood": return "血紅";
        case "desert": return "沙漠";
        default: return "未知";
    }
}

function applyTheme(theme) {
    document.body.className = "login-page";
    if (theme !== "light") {
        document.body.classList.add(`${theme}-mode`);
    }

    document.querySelectorAll(".modal-content").forEach(modal => {
        modal.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--color-bg');
        modal.style.color = getComputedStyle(document.body).getPropertyValue('--color-text');
    });

    updateThemeButton(theme);
    localStorage.setItem("theme", theme);

    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.remove("force-redraw");
        void modal.offsetHeight;
        modal.classList.add("force-redraw");
    });
}

function cycleTheme() {
    const index = (themes.indexOf(currentTheme) + 1) % themes.length;
    currentTheme = themes[index];
    applyTheme(currentTheme);
}

document.addEventListener("DOMContentLoaded", () => {
    currentTheme = localStorage.getItem("theme");
    if (!themes.includes(currentTheme)) {
        currentTheme = "light";
    }

    applyTheme(currentTheme);

    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.addEventListener("click", cycleTheme);

    document.addEventListener('shown.bs.modal', () => {
        document.querySelectorAll(".modal-content").forEach(modal => {
            modal.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--color-bg');
            modal.style.color = getComputedStyle(document.body).getPropertyValue('--color-text');
        });
    });
});

// ✅ 對外匯出
export { applyTheme, getThemeName, cycleTheme };
