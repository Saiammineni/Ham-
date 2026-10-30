function _updateLeaseContractOnAsset(assetID, contractID) {
	new global.GlideQuery('alm_asset')
		.where('sys_id', assetID)
		.update({
			lease_contract: contractID,
		});
}

function _clearLeaseContractOnAsset(asset, contractID) {
	if (String(asset.lease_contract) === contractID) {
		_updateLeaseContractOnAsset(asset.sys_id, null);
	}
}

(function executeRule(current, previous) {
	// If insert/update fails, return
	if (current.isActionAborted()) { return; }

	var PRODUCT_MODEL_LEASE = '1881a836c3102000b959fd251eba8fc9';

	var isCurrentContractLease = false;
	if (current.contract && current.contract.contract_model) {
		isCurrentContractLease = (String(current.contract.contract_model) === PRODUCT_MODEL_LEASE);
	}

	var isPreviousContractLease = false;
	if (previous.contract && previous.contract.contract_model) {
		isPreviousContractLease = (String(previous.contract.contract_model) === PRODUCT_MODEL_LEASE);
	}

	// If current or previous contract's model is not lease, return
	if (!isCurrentContractLease && !isPreviousContractLease) { return; }

	var currentContractID = String(current.contract);
	var currentAssetID = String(current.asset);
	var previousContractID = String(previous.contract);

	var isContractUpdated = current.contract.changes();
	var isAssetUpdated = current.asset.changes();

	// If only contract is updated and,
	// current contract is lease, then stamp current contract on asset
	// current contract is not lease, then clear lease contract on asset
	if (isContractUpdated && !isAssetUpdated) {
		if (isCurrentContractLease) {
			_updateLeaseContractOnAsset(currentAssetID, currentContractID);
		} else { // Previous contract was lease. Current contract is not.
			_clearLeaseContractOnAsset(current.asset, previousContractID);
		}
		return;
	}

	// If only asset is updated (current contract is lease accd. to conditions)
	// then stamp current contract on new asset and,
	// clear lease contract on the previous asset
	if (!isContractUpdated && isAssetUpdated) {
		_clearLeaseContractOnAsset(previous.asset, currentContractID);
		_updateLeaseContractOnAsset(currentAssetID, currentContractID);
		return;
	}

	// If both contract and asset are updated and,
	// case 1: previous contract is not lease, current contract is lease
	//     stamp current contract on current asset
	// case 2: previous contract is lease. current contract is not lease
	//     clear previous contract on previous asset
	// case 3: previous contract is lease. current contract is lease
	//     clear previous contract on previous asset
	//     stamp current contract on current asset
	if (isContractUpdated && isAssetUpdated) {
		if (!isPreviousContractLease && isCurrentContractLease) { // case 1
			_updateLeaseContractOnAsset(currentAssetID, currentContractID);
		} else if (isPreviousContractLease && !isCurrentContractLease) { // case 2
			_clearLeaseContractOnAsset(previous.asset, previousContractID);
		} else if (isPreviousContractLease && isCurrentContractLease) { // case 3
			_clearLeaseContractOnAsset(previous.asset, previousContractID);
			_updateLeaseContractOnAsset(currentAssetID, currentContractID);
		}
	}
}(current, previous));