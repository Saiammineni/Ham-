function onLoad() {
	if (g_scratchpad.isLeaseContractPresent) {
		if (g_scratchpad.isLeaseContractAsset) {
			g_form.setReadOnly('lease_contract', true);
			g_form.setReadOnly('like_kind_exchange', true);
		}
		g_form.setReadOnly('lease_expiration_date', true);
		g_form.setReadOnly('lease_term_months', true);
	}
}