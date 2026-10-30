(function executeRule(current, previous) {
    if (current.getValue('cat_item') !== '73e47230345013107f44de1b321144a4') {
        return;
    }

    var assetSysId = current.variables.asset ? current.variables.asset.toString() : '';
    var stateValue = current.variables.state ? current.variables.state.toString() : '';
    if (!assetSysId || !stateValue) {
        gs.error('[Hardware State Catalog] Missing asset or state on request item ' +
            current.getUniqueValue() + '.');
        return;
    }

    var asset = new GlideRecordSecure('alm_hardware');
    if (!asset.get(assetSysId)) {
        gs.error('[Hardware State Catalog] Hardware asset ' + assetSysId +
            ' was not found or is not accessible for request item ' +
            current.getUniqueValue() + '.');
        return;
    }

    if (!asset.canWrite()) {
        gs.error('[Hardware State Catalog] Current user cannot update asset ' + assetSysId +
            ' for request item ' + current.getUniqueValue() + '.');
        return;
    }

    var validChoice = new GlideRecord('sys_choice');
    validChoice.addQuery('name', 'IN', 'alm_hardware,alm_asset');
    validChoice.addQuery('element', 'install_status');
    validChoice.addQuery('value', stateValue);
    validChoice.addQuery('inactive', false);
    validChoice.setLimit(1);
    validChoice.query();
    if (!validChoice.next()) {
        gs.error('[Hardware State Catalog] Invalid install_status value on request item ' +
            current.getUniqueValue() + '; asset ' + assetSysId + ' was not changed.');
        return;
    }

    asset.setValue('install_status', stateValue);
    if (!asset.update()) {
        gs.error('[Hardware State Catalog] Could not update asset ' + assetSysId +
            ' for request item ' + current.getUniqueValue() + '.');
    }
})(current, previous);
