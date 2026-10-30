function callback(type) {
    var gdw = GlideDialogWindow.get();
    var f;
    if (type == 'ok') {
        f = gdw.getPreference('onOk');
    } else {
        f = gdw.getPreference('onCancel');
    }
	if (typeof(f) == 'function') {
		try {
			f.call(gdw);
		} catch (err) {
			
		}
	}
	gdw.destroy();
	return false;
}