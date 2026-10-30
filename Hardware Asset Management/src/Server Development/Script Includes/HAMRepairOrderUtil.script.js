var HAMRepairOrderUtil = Class.create();
HAMRepairOrderUtil.prototype = {
    initialize: function() {},

    type: 'HAMRepairOrderUtil'
};

HAMRepairOrderUtil.assetRefGlideRecord = function(gr) {
	return sn_hamp.HAMLicensingUtility.addHAMFlowsInclusionCriteria(gr);
};

HAMRepairOrderUtil.isValidAsset = function(asset) {
	return sn_hamp.HAMLicensingUtility.isAssetIncludedInHAMFlows(asset);
};