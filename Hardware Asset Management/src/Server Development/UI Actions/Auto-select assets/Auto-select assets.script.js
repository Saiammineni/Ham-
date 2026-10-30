new sn_hamp.HAMAssetBundleUtils().autoAssociateAssets(current);
var inputURL = String(gs.action.getGlideURI());
// Doing dummy update to relaod page on seismic
if (inputURL.indexOf('.do?') === -1) {
	current.update();
} else {
	action.setRedirectURL(current);
}