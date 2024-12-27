// Seleciona os elementos do botão "hambúrguer" e da navegação
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

// Adiciona um evento de clique ao botão "hambúrguer"
menuToggle.addEventListener('click', () => {
    // Verifica o estado atual do menu e alterna entre expandido e recolhido
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded); // Atualiza o atributo para acessibilidade
    navLinks.classList.toggle('active'); // Adiciona ou remove a classe 'active' para exibir/esconder o menu
});