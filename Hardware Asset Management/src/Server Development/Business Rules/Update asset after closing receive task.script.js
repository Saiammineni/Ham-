(function executeRule(current, previous /* null when async */) {
	var updateAsset = true;
	var currentAsset = current.asset_reclaim_line.asset;
	var gq = new global.GlideQuery('sn_hamp_asset_reclaim_task')
		.where('asset_reclaim_line', current.asset_reclaim_line)
		.where('task_name', 'IN', ['ship', 'drop_off', 'pick_up'])
		.limit(1)
		.select('return_stockroom')
		.toArray(100);
	var assetUpdateJSON = {
		assigned_to: 'NULL',
		stockroom: gq[0].return_stockroom,
		install_status: 6,
		substatus: 'pending_repair',
	};
	// check if asset is a consumable
	if (currentAsset.sys_class_name.toString() === 'alm_consumable') {
		assetUpdateJSON.quantity = parseInt(current.getValue('quantity_received'), 10);
		var expectedQuantity = parseInt(currentAsset.quantity.toString(), 10);

		if (assetUpdateJSON.quantity === 0) {
			assetUpdateJSON.quantity = expectedQuantity;
			assetUpdateJSON.install_status = 8; // missing
			assetUpdateJSON.substatus = 'lost';
			assetUpdateJSON.stockroom = 'NULL';
			assetUpdateJSON.location = 'NULL';
		} else if (assetUpdateJSON.quantity < expectedQuantity) {
			var assetName = currentAsset.display_name.toString();
			// split consumable into quantity, move to pending evaluation, and update processid.
			var newConsumable = new global.Consumables().split(
				currentAsset.sys_id,
				assetUpdateJSON.quantity,
				assetUpdateJSON.install_status,
				assetUpdateJSON.substatus,
				'',
				assetUpdateJSON.stockroom,
				assetUpdateJSON.location,
				'',
				'', {
					sn_itam_common_process_id: currentAsset.sn_itam_common_process_id,
					sn_itam_common_process_table: currentAsset.sn_itam_common_process_table,
				}
			);
			//Assign split consumable to current task.
			
			current.asset = newConsumable;

			//Change reclaim asset on reclaim line to split consumeable record.
			new global.GlideQuery('sn_hamp_asset_reclaim_line')
			.where('sys_id', current.asset_reclaim_line)
			.update({
				'asset': newConsumable,
			});
			//create new assetUpdateJson to remove processId from old record.
			assetUpdateJSON = {
				sn_itam_common_process_id: '',
				sn_itam_common_process_table: ''
			};
			current.work_notes = (expectedQuantity - assetUpdateJSON.quantity) + ' ' + assetName + ' not returned';
		} else if (assetUpdateJSON.quantity > expectedQuantity){
			gs.addErrorMessage(gs.getMessage("Entered quantity is more than the quantity on asset."));
			updateAsset = false;
			current.setAbortAction(true);
		}
	}
	if(updateAsset){
		new global.GlideQuery('alm_asset')
			.where('sys_id', currentAsset)
			.update(assetUpdateJSON);
	}
}(current, previous));