function renamePowerLabel() {
    try {
        global.AssetFixScriptUtil.renameFieldLabel('sn_hamp_hw_product_model', 'power', 'Electrical Specifications');
        global.AssetFixScriptUtil.renameFieldLabel('sn_hamp_hw_product_model', 'stage_power', 'Stage electrical specifications');
    } catch (e) {
        gs.info('Error in fix script -> Rename label for Power field: ' + e);
    }
}
renamePowerLabel();