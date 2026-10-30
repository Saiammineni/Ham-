if ('false' == cancelled && !gs.nil(bundleId)) {
sn_hamp.HAMUtils.releaseAssets(bundleId);
response.sendRedirect('alm_bundle.do?sys_id=' + bundleId);
}