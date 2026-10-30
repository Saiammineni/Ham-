var script = 'new sn_hamp.HAMContractManagementUtils().runLeaseContractDataFixScript();';
var job = new global.AssetManagementBaseJob();
job.runScriptByJob(script, new GlideDateTime(), 'HAM Populate lease contract information');