var BundleReplaceAssetUtil = {
	payload: jQuery('#meta-data-container').data("payload"),
	selectedUniqueIds: [],
	
	getUniqueIds: function() {
		return this.payload.map(function(assetInfo) {
			return 	assetInfo.sys_id;	 
		});
	},
	
	getUniqueIdAssetLabelHash: function() {
		var hash = {};
		this.payload.forEach(function(assetInfo) {
			hash[assetInfo.sys_id] = assetInfo.display_name;
		});
		
		return hash;
	},
	
	getRemainingUniqueIds: function() {
		var remainingUniqueIds = [];
		
		this.uniqueIds.forEach(function(uniqueId) {
			if (this.selectedUniqueIds.indexOf(uniqueId) === -1) {
				remainingUniqueIds.push(uniqueId);
			}
		}.bind(this));
		
		return remainingUniqueIds;
	},
	
	hideAllRows: function() {
		var idStr = this.uniqueIds.map(function(uniqueId) { return "#id_" + uniqueId; }).join(", ");
		
		jQuery(idStr).hide();
	},
	
	showSelectedRows: function() {
		this.hideAllRows();
		
		this.selectedUniqueIds.concat(this.getRemainingUniqueIds()).forEach(function(uniqueId) {
			jQuery("#bundle-list-container").append(jQuery("#id_" + uniqueId));
		});
		
		var idStr = this.selectedUniqueIds.map(function(uniqueId) { return "#id_" + uniqueId; }).join(", ");
		jQuery(idStr).show();
		
		if (this.selectedUniqueIds.length < this.uniqueIds.length) {
			this.loadAssetDropdown();
		} else {
			this.hideAssetDropdown();
		}
	},
	
	removeRow: function(uniqueId) {
		event.preventDefault();
		event.stopPropagation();

		var index = this.selectedUniqueIds.indexOf(uniqueId);
		
		if (index !== -1) {
			this.selectedUniqueIds.splice(index, 1);
		}
		
		this.showSelectedRows();
		gel('asset-select').focus();
	},
	
	selectAsset: function(uniqueId) {
		this.selectedUniqueIds.push(uniqueId);
		this.showSelectedRows();
		gel('sys_display.ref_' + uniqueId).focus();
	},
	
	hideAssetDropdown: function() {
		jQuery("#asset-select-container select").hide();
	},
	
	showAssetDropdown: function() {
		jQuery("#asset-select-container select").show();
	},
	
	loadAssetDropdown: function() {
		var uniqueIds = this.uniqueIds; 
		
		select = jQuery("#asset-select-container select");
		select.empty();
		select.append("<option disabled='disabled' selected='selected'>" + jQuery("#translation-div").data("replace-assets-text") + "</option>");

		var hash = this.getUniqueIdAssetLabelHash();
		
		uniqueIds.forEach(function(uniqueId) {
			if (this.selectedUniqueIds.indexOf(uniqueId) !== -1) {
				select.append("<option disabled='disabled' value='" + uniqueId + "'>" + hash[uniqueId] + "</option>");
			} else {
				select.append("<option value='" + uniqueId + "'>" + hash[uniqueId] + "</option>");
			}
		}.bind(this));
		
		this.showAssetDropdown();
	},
		
	getRequestJson: function() {
		var replaceAssetHash = {};

		this.uniqueIds.forEach(function(id) {
			var val = jQuery("#ref_" + id).val();
			var quantity = jQuery("#quantity_" + id).val();
			
			if (val) {
				replaceAssetHash[id] = {
					sysId: val,
					quantity: quantity
				};
			}
		});
		
		return replaceAssetHash;
	},
	
	showErrorMessage: function() {
		jQuery("#error-message-container").show().delay(3000).fadeOut();
	},
	
	validateSubmit: function() {
		var json = this.getRequestJson();
		if (Object.keys(json).length > 0) {
			return true;
		} else {
			this.showErrorMessage();
			return false;
		}
	},
	
	replaceAssets: function() {
		var json = this.getRequestJson();
		jQuery('#replaceAssetHash').val(JSON.stringify(json));
		return true;
	},
	
	init: function() {
		this.uniqueIds = this.getUniqueIds();
		this.selectedUniqueIds = [];
		this.showSelectedRows();
	},
};

BundleReplaceAssetUtil.init();