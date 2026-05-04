export function mountTemplate(view, templateId) {
    const template = document.getElementById(templateId);
    if (!template) {
        view.innerHTML = `<p>Missing template: ${templateId}</p>`;
        return;
    }
    view.innerHTML = '';
    view.appendChild(template.content.cloneNode(true));
}
