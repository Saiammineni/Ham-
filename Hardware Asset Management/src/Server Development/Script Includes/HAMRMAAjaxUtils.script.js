var HAMRMAAjaxUtils = Class.create();
HAMRMAAjaxUtils.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
	canReplaceAsset: function() {
		var assetId = this.getParameter('sysparm_asset');
		var replacementAssetId = this.getParameter('sysparm_replacement_asset');

		return JSON.stringify(HAMRMAUtils.canReplaceAsset(assetId, replacementAssetId));
	},
	showMessageIfAssetExcluded: function() {
		var assetId = this.getParameter('sysparm_sysId');
		var assetGr = new GlideRecord('alm_asset');
    var result = {isExcluded: 'false'};
		if (assetGr.get(assetId)) {
      var isExcluded = String(sn_hamp.HAMLicensingUtility.isAssetExcludedFromHAMFlows(assetGr));
      result =  {isExcluded: isExcluded};
      if (isExcluded === 'true') {
			  result.message = HAMLicensingUtility.getAssetWorkNotesMessage(assetGr);
		  }
    }
		return JSON.stringify(result);
	},
	type: 'HAMRMAAjaxUtils',
});