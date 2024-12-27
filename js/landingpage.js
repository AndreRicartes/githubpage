// Seleciona os elementos do menu "hambúrguer" e da navegação
const menuToggle = document.getElementById('menu-toggle');
//const navLinks = document.querySelector('.nav-links');

// Função para alternar o menu "hambúrguer"
menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    navLinks.classList.toggle('active');
});

// Captura o formulário da seção "Solicite uma Demonstração"
const demoForm = document.getElementById('demoForm');

// Adiciona evento de envio ao formulário
demoForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Impede o envio padrão do formulário

    // Captura os valores dos campos
    const nome = demoForm.nome.value.trim();
    const email = demoForm.email.value.trim();

    // Valida os campos
    if (nome === '' || email === '') {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    if (!validateEmail(email)) {
        alert('Por favor, insira um email válido!');
        return;
    }

    // Exibe uma mensagem de sucesso
    alert(`Obrigado, ${nome}! Sua solicitação foi enviada com sucesso.`);
    demoForm.reset(); // Limpa o formulário
});

// Função para validar o formato do email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expressão regular para emails válidos
    return re.test(email);
}