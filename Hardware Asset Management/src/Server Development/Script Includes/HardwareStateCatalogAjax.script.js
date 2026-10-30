var HardwareStateCatalogAjax = Class.create();
HardwareStateCatalogAjax.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
    getStates: function() {
        var assetSysId = this.getParameter('sysparm_asset_sys_id');
        if (!assetSysId) {
            return JSON.stringify({ ok: true, choices: [] });
        }

        var asset = new GlideRecordSecure('alm_hardware');
        if (!asset.get(assetSysId)) {
            return JSON.stringify({
                ok: false,
                message: 'The selected hardware asset is unavailable.'
            });
        }

        var choices = [];
        var seenValues = {};
        var tables = ['alm_hardware', 'alm_asset'];

        for (var tableIndex = 0; tableIndex < tables.length; tableIndex++) {
            var choice = new GlideRecord('sys_choice');
            choice.addQuery('name', tables[tableIndex]);
            choice.addQuery('element', 'install_status');
            choice.addQuery('inactive', false);
            choice.orderBy('sequence');
            choice.query();

            while (choice.next()) {
                var value = choice.getValue('value');
                if (!value || seenValues[value]) {
                    continue;
                }

                seenValues[value] = true;
                choices.push({
                    value: value,
                    label: choice.getValue('label')
                });
            }
        }

        return JSON.stringify({ ok: true, choices: choices });
    },

    type: 'HardwareStateCatalogAjax'
});
