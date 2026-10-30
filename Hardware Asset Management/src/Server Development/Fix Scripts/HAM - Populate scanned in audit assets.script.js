var script = 'new sn_hamp.HAMFixScripts().populateScannedforExisitingAuditRecords();';
var job = new global.AssetManagementBaseJob();
job.runScriptByJob(script, new GlideDateTime(), 'HAM - Populate scanned in audit assets');