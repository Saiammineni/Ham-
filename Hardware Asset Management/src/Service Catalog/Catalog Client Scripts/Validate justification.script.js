function onSubmit() {
    var justification = g_form.getValue('justification');
    if (justification.length > 2000) {
        g_form.addErrorMessage(getMessage('Justification cannot be more than 2000 characters. Please use attachment for longer justification.'));
        return false;
    }
}