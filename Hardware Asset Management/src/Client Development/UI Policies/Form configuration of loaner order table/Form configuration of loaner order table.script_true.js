function onCondition() {
    if (g_scratchpad.asset_prepared === 'true' || g_form.getValue('stage') === 'cancelled') {
        g_form.setReadOnly('asset', true);
		g_form.setReadOnly('model', true);
    }
}