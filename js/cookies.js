document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("cookie-banner");
    const acceptButton = document.getElementById("accept-cookies");

    // Verifica se o usuário já aceitou os cookies
    if (!localStorage.getItem("cookiesAccepted")) {
        banner.style.display = "block";
    }

    // Evento para aceitar cookies
    acceptButton.addEventListener("click", function () {
        localStorage.setItem("cookiesAccepted", "true");
        banner.style.display = "none";
    });
});
