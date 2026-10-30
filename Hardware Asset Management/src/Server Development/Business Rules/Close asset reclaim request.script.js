(function executeRule(current, previous /* null when async */) {
	new global.AssetReclamationUtil().closeAssetReclamationRequest(current.getValue('asset_reclaim_request'));
}(current, previous));