// Purge Asset Audits, their related Audit to Asset records 
var assetAuditGR = new GlideRecord('sn_hamp_asset_audit');
assetAuditGR.addEncodedQuery('sys_created_onRELATIVELT@year@ago@1');
assetAuditGR.addQuery('status', '!=', 'in_progress');
assetAuditGR.query();
assetAuditGR.deleteMultiple();

