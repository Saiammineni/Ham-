(function updateReferenceQualifier(){
	new global.GlideQuery('sys_dictionary')
	.where('name','clm_m2m_contract_asset')
	.where('element','like_kind_returned_asset')
	.whereNull('reference_qual')
	.updateMultiple({'reference_qual' : "javascript: sn_hamp.HAMLeaseContractExpirationUtils.getLikeKindReturnedAssetRefQualifier(current);"});
}
());