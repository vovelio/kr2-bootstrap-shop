// Только базовая обработка учебных форм, как в КР №1.
// Карточки, каталог и описание товара заданы обычной HTML-разметкой.
const forms = document.querySelectorAll('.demo-form');

forms.forEach((form) => {
  const message = form.querySelector('[role="status"]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    form.reset();
    message.hidden = false;
    message.focus();
  });

  form.addEventListener('reset', () => {
    message.hidden = true;
  });

  form.addEventListener('input', () => {
    message.hidden = true;
  });
});
