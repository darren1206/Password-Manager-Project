export function checkLogin() {
    const user = localStorage.getItem("currentUser");
    if (!user) window.location.href = "login.html";
}

export function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");

    // ✅ 加這一行防止 login.html 又跳回 index
    localStorage.setItem("justLoggedOut", "true");

    window.location.href = "login.html";
}

