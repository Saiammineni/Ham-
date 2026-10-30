function setLocation(user) {
    g_form.setValue('location', user.location);
}

function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading) {
        return;
    }
    if (newValue != '') {
        g_form.getReference('requested_for', setLocation);
    } else {
        g_form.setValue('location', '');
    }
}