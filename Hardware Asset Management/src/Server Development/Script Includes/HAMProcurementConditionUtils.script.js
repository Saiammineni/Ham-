var HAMProcurementConditionUtils = Class.create();
HAMProcurementConditionUtils.prototype = {

	PO_TYPE_LEASE_BUYOUT: 'lease_buyout',
	PO_TYPE_LEASE_EXTENSION: 'lease_extension',
	PO_TYPE_LEASE_SETTLEMENT: 'lease_settlement',

	initialize: function () {
	},

	/* ***************************************************
						ACL Checks
	*************************************************** */
	allowWriteOnProductModel: function (pol) {
		if (this._isPurchaseOrderTypeLease(null, pol)) { return false; }
		return true;
	},

	allowWriteOnOrderedQuantity: function (pol) {
		if (this._isPurchaseOrderTypeLease(null, pol)) { return false; }
		return true;
	},

	allowWriteOnReceivedQuantity: function (pol) {
		if (this._isPurchaseOrderTypeLease(null, pol)) { return false; }
		return true;
	},

	allowWriteOnRemainingQuantity: function (pol) {
		if (this._isPurchaseOrderTypeLease(null, pol)) { return false; }
		return true;
	},

	allowWriteOnProductCatalog: function (pol) {
		if (this._isPurchaseOrderTypeLease(null, pol)) { return false; }
		return true;
	},

	allowWriteOnPartNumber: function (pol) {
		if (this._isPurchaseOrderTypeLease(null, pol)) { return false; }
		return true;
	},

	allowWriteOnListPrice: function (pol) {
		if (this._isPurchaseOrderTypeLease(null, pol)) { return false; }
		return true;
	},

	allowWriteOnContractInList: function (po) {
		if (this._isPurchaseOrderTypeLease(po, null)) { return false; }
		return true;
	},

	/* ***************************************************
					Related list checks
	*************************************************** */
	getLeasedAssetsForPurchaseOrder: function (po) {
		var assetIDs = [];
		if (this._isPurchaseOrderTypeLease(po, null) && this._isPurchaseOrderStatusAllows(po, null)) {
			new global.GlideQuery('proc_po_item')
				.whereNotNull('asset_task')
				.where('purchase_order', po.getUniqueValue())
				.select('asset_task.asset')
				.forEach(function(pol) { assetIDs.push(pol.asset_task.asset); });
		}
		return assetIDs;
	},

	getLeasedAssetsForPurchaseOrderLine: function (pol) {
		var assetIDs = [];
		if (this._isPurchaseOrderTypeLease(null, pol) && this._isPurchaseOrderStatusAllows(null, pol)) {
			new global.GlideQuery('proc_po_item')
				.whereNotNull('asset_task')
				.where('sys_id', pol.getUniqueValue())
				.select('asset_task.asset')
				.forEach(function(poItem) { assetIDs.push(poItem.asset_task.asset); });
		}
		return assetIDs;
	},

	/* ***************************************************
						Utilities
	*************************************************** */
	_isPurchaseOrderTypeLease: function (po, pol) {
		var poType;
		if (po) {
			poType = po.getValue('po_type');
		} else if (pol) {
			poType = String(pol.purchase_order.po_type);
		}
		if (poType === this.PO_TYPE_LEASE_BUYOUT || poType === this.PO_TYPE_LEASE_EXTENSION
			|| poType === this.PO_TYPE_LEASE_SETTLEMENT) { return true; }
		return false;
	},

	_isPurchaseOrderStatusAllows: function (po, pol) {
		var status;
		if (po) { status = po.getValue('status'); }
		if (pol) { status = String(pol.purchase_order.status); }
		if (status && ((status === 'requested') || (status === 'ordered'))) { return true; }
		return false;
	},

	type: 'HAMProcurementConditionUtils',
};