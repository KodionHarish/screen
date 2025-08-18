const socket = io("https://screen-tracker-backend-production.up.railway.app");
const loginForm = document.getElementById("loginForm");
const errorBox = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm).entries());
  errorBox.textContent = "";

  try {
    const res = await fetch("https://screen-tracker-backend-production.up.railway.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const result = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMessage = isJson ? result.message || "Login failed" : result;
      throw new Error(errorMessage);
    }

    await window.electronAPI.setToken(result.token);
    await window.electronAPI.setUserId(result.user.id);

    socket.emit("user-online", { userId: result.user.id });  
    window.location.href = "dashboard.html";
  } catch (err) {
    errorBox.textContent = err.message;
    console.error("Login error:", err);
  }
});