var script = "new sn_hamp.HAMFixScripts().excludeAssets('" + sn_hamp.HAMConstants.LICENSABLE_RESOURCE_CATEGORIES + "');";
var job = new global.AssetManagementBaseJob();
job.runScriptByJob(script, new GlideDateTime(), 'HAM - Mark assets for exclusion');