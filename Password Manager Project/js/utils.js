export function showMessage(msg, success = true) {
    const toastEl = document.getElementById("toastBox");
    const toastMsg = document.getElementById("toastMsg");
    toastMsg.textContent = msg;
    toastEl.classList.remove("bg-success", "bg-danger");
    toastEl.classList.add(success ? "bg-success" : "bg-danger");
    new bootstrap.Toast(toastEl).show();
}

export function showToast(msg, error = false, delay = 8000) {
    const toastEl = document.getElementById("toastBox");
    const toastMsg = document.getElementById("toastMsg");
    toastMsg.textContent = msg;
    toastEl.classList.remove("bg-success", "bg-danger");
    toastEl.classList.add(error ? "bg-danger" : "bg-success");
    const toast = new bootstrap.Toast(toastEl, { delay });
    toast.show();
}

export function shakeElement(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    el.addEventListener("animationend", function handler() {
        el.classList.remove("shake");
        el.removeEventListener("animationend", handler);
    }, { once: true });
}

export function showInputError(input, message) {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
    input.setAttribute("data-bs-toggle", "tooltip");
    input.setAttribute("data-bs-placement", "top");
    input.setAttribute("title", message);
    bootstrap.Tooltip.getInstance(input)?.dispose();
    new bootstrap.Tooltip(input).show();
    shakeElement(input);
}

export function togglePassword(index) {
    const span = document.getElementById(`pw-${index}`);
    const btn = document.getElementById(`btn-${index}`);
    const isHidden = span.textContent.includes("•");

    if (isHidden) {
        span.textContent = span.dataset.password;
        btn.textContent = "🚫"; // 可改成 👁️‍🗨️ 等 icon
    } else {
        span.textContent = "••••••••";
        btn.textContent = "👁️";
    }
}

