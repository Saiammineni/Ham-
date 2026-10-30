(function executeRule(current, previous) {
	var PO_TYPE_BUYOUT_DESC = gs.getMessage('Automatically generated expense line for buyout of leased asset');
	var PO_TYPE_EXTENSION_DESC = gs.getMessage('Automatically generated expense line for lease extension of asset');
	var PO_TYPE_SETTLEMENT_DESC = gs.getMessage('Automatically generated expense line for settlement of leased asset');

	var poType = current.getValue('po_type');
	var expenseLineDesc;
	if (poType === 'lease_buyout') { expenseLineDesc = PO_TYPE_BUYOUT_DESC; }
	if (poType === 'lease_extension') { expenseLineDesc = PO_TYPE_EXTENSION_DESC; }
	if (poType === 'lease_settlement') { expenseLineDesc = PO_TYPE_SETTLEMENT_DESC; }

	new global.GlideQuery('proc_po_item')
		.where('purchase_order', current.getUniqueValue())
		.whereNotNull('asset_task')
		.select('asset_task', 'cost$CURRENCY_STRING')
		.forEach(function (pol) {
			new global.GlideQuery('sn_hamp_contract_asset_task')
				.where('sys_id', pol.asset_task)
				.selectOne('contract_asset.contract', 'contract_asset.sys_id', 'asset')
				.ifPresent(function (contractAssetTask) {
					new global.GlideQuery('fm_expense_line')
						.insert({
							amount: pol.cost$CURRENCY_STRING,
							process_date: new GlideDateTime(),
							state: 'processed',
							short_description: expenseLineDesc,
							source_table: 'clm_m2m_contract_asset',
							source_id: contractAssetTask.contract_asset.sys_id,
							summary_type: 'run_business',
							asset: contractAssetTask.asset,
							contract: contractAssetTask.contract_asset.contract,
							task: contractAssetTask.sys_id,
						})
						.get();
				});
		});
}(current, previous));