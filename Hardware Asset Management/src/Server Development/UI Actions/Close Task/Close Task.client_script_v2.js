function onClick(g_form) {
    g_form.setValue('state', '3');
    var ret = g_form.save();
    if (ret) {
        ret.then(function() {
            g_aw.closeRecord();
        });
    }
}