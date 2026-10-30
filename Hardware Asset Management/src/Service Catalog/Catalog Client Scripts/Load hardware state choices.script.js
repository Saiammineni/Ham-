function onChange(control, oldValue, newValue, isLoading) {
    if (newValue === oldValue && !isLoading) {
        return;
    }

    g_form.clearValue('state');
    g_form.clearOptions('state');
    g_form.addOption('state', '', '-- Select state --');

    if (!newValue) {
        return;
    }

    var requestedAsset = newValue;
    var ajax = new GlideAjax('HardwareStateCatalogAjax');
    ajax.addParam('sysparm_name', 'getStates');
    ajax.addParam('sysparm_asset_sys_id', requestedAsset);
    ajax.getXMLAnswer(function(answer) {
        if (g_form.getValue('asset') !== requestedAsset) {
            return;
        }

        if (!answer) {
            g_form.addErrorMessage('Unable to load hardware state choices.');
            return;
        }

        var result;
        try {
            result = JSON.parse(answer);
        } catch (error) {
            g_form.addErrorMessage('Unable to read hardware state choices.');
            return;
        }

        if (!result.ok) {
            g_form.addErrorMessage(result.message || 'Unable to load hardware state choices.');
            return;
        }

        for (var i = 0; i < result.choices.length; i++) {
            g_form.addOption('state', result.choices[i].value, result.choices[i].label);
        }

        if (result.choices.length === 0) {
            g_form.addErrorMessage('No active state choices are configured for hardware assets.');
        }
    });
}
