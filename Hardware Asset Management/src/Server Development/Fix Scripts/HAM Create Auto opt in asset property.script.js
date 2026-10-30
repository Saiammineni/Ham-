// verify 'com.sn_hamp.content.update.lastRunDate' asset property already present => HAM already installed
var assetPropertyGR = new GlideRecord('asset_property');
assetPropertyGR.addQuery('key', 'com.sn_hamp.content.update.lastRunDate');
assetPropertyGR.query();
var isHAMPreviouslyInstalled = assetPropertyGR.hasNext();

var value = (isHAMPreviouslyInstalled ? 'true' : 'false');

// Create Auto opt in resource categories asset property
var key = 'com.sn_hamp.auto_opt_in_resource_categories';
// eslint-disable-next-line max-len
var description = 'Property indicates whether or not to auto opt in resource categories when HAM is installed/ upgraded';
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