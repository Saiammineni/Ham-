if ('false' == cancelled) {
	new sn_hamp.HAMAssetBundleUtils().associateAssets(bundleId, JSON.parse(selectAssetHash));
	response.sendRedirect("alm_bundle.do?sys_id=" + bundleId);
}