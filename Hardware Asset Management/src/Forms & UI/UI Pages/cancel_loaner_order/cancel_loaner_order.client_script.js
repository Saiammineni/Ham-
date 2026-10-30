function cancel() {
    var c = gel('cancelled');
    c.value = "true";
    GlideDialogWindow.get().destroy();
    return false;
}

function actionOK() {
    return true;
}