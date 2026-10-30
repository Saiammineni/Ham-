function onCondition() {
    if (g_form.getValue('requested_for') != g_user.userID) {
        g_form.setValue('requested_for', g_user.userID);
    }
}