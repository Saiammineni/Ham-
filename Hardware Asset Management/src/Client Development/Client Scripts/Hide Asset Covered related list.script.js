function onLoad() {
	// Applies to contract models 'Lease' (1881a836c3102000b959fd251eba8fc9)
	if (g_scratchpad.AssetsCoveredRelatedList && !g_scratchpad.AssetsCoveredRelatedList.isVisible) {
		g_form.hideRelatedList('clm_m2m_contract_asset');
	}
}