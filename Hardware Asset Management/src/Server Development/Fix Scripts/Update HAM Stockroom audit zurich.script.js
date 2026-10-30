(function updateReferenceQualifier() {
    new global.GlideQuery('sys_dictionary')
        .where('name', 'sn_hamp_asset_audit')
        .where('element', 'assigned_to')
        .whereNull('reference_qual')
        .updateMultiple({
            'reference_qual': "javascript:sn_itam_common.AssetAuditUtil.assignedToRefQual(current)"
        });

    new global.GlideQuery('sys_dictionary')
        .where('name', 'sn_hamp_asset_audit')
        .where('element', 'assigned_to')
		.whereNull('dependent')
		.updateMultiple({
			'dependent': 'assignment_group'
		});

    new global.GlideQuery('sys_dictionary')
        .where('name', 'sn_hamp_asset_audit')
        .where('element', 'assigned_to')
        .where('mandatory', true)
        .updateMultiple({
            'mandatory': false
        });
}());