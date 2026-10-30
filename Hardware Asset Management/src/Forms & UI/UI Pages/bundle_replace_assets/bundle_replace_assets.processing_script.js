if ('false' == cancelled) {
	new sn_hamp.HAMAssetBundleUtils().replaceAssets(bundleId, JSON.parse(replaceAssetHash));
	response.sendRedirect("alm_bundle.do?sys_id=" + bundleId);
}