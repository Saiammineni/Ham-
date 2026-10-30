function updateNormModelAssetNameProperty() {
	var isHAMPreviouslyInstalled = new global.GlideQuery('asset_property')
		.where('key','com.sn_hamp.is.ham.already.installed')
		.selectOne('value').get().value;
	if (isHAMPreviouslyInstalled === 'true') {
		gs.setProperty('sn_hamp.update_assets_norm_model_name', 'false');
	}
}
updateNormModelAssetNameProperty();