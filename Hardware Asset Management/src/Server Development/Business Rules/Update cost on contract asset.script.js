(function executeRule(current, previous) {
	var costField = null;
	var poType = String(current.purchase_order.po_type);
	if (poType === 'lease_extension') { costField = 'extension_cost'; }
	if (poType === 'lease_buyout') { costField = 'buyout_amount'; }
	if (poType === 'lease_settlement') { costField = 'lease_settlement_amount'; }
	if (gs.nil(costField)) { return; }

	var contractAssetUpdate = {};
	contractAssetUpdate[costField] = current.cost.getCurrencyString();

	new global.GlideQuery('clm_m2m_contract_asset')
		.where('sys_id', current.asset_task.contract_asset)
		.update(contractAssetUpdate);
}(current, previous));