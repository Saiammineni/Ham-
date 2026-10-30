function onSubmit() {
    // Clear the variable set based on type of refresh
    if (g_form.getValue('type_of_refresh') === 'single_model') {
        g_form.setValue('multi_model_set', '');
        return true;
    } else if (g_form.getValue('type_of_refresh') === 'multi_model') {
        // check for duplicate asset entries in multi model refresh
        var multiModelVar = JSON.parse(g_form.getValue('multi_model_set') || "[]");
        var assetsList = {};
        var asset;
        if (parseInt(multiModelVar.length) === 0) {
			g_form.addErrorMessage(getMessage('Select one or more asset records to refresh.'));
			g_form.submitted = false;
			return false;
		}
        for (var i = 0; i < multiModelVar.length; i++) {
            asset = multiModelVar[i].asset;
            if (asset in assetsList) {
                g_form.addErrorMessage(getMessage('Duplicate entries exist for assets to be refreshed. Please remove duplicate lines prior to order submission.'));
                g_form.submitted = false;
                return false;
            }
            assetsList[asset] = 1;
        }
        g_form.clearValue('replacement_model');
        g_form.clearValue('assets');
    }

}