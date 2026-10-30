// verify 'com.sn_hamp.content.update.lastRunDate' asset property already present => HAM already installed
var assetPropertyGR = new GlideRecord('asset_property');
assetPropertyGR.addQuery('key', 'com.sn_hamp.content.update.lastRunDate');
assetPropertyGR.query();
var isHAMPreviouslyInstalled = assetPropertyGR.hasNext();

var value = (isHAMPreviouslyInstalled ? 'true' : 'false');

// Create is HAM installed asset property
var key = 'com.sn_hamp.is.ham.already.installed';
var description = 'Property indicates whether HAM plugin is installed or not';
// create asset property
assetPropertyGR = new GlideRecord('asset_property');
assetPropertyGR.initialize();
assetPropertyGR.addQuery('key', key);
assetPropertyGR.query();
if (!assetPropertyGR.next()) {
	assetPropertyGR.initialize();
	assetPropertyGR.setValue('key', key);
	assetPropertyGR.setValue('description', description);
	assetPropertyGR.setValue('value', value);
	assetPropertyGR.insert();
} else {
	assetPropertyGR.setValue('value', value);
	assetPropertyGR.update();
}