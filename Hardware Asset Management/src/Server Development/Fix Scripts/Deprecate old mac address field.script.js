var script = 'new sn_hamp.HAMFixScripts().deprecateColumn(\'alm_hardware\',\'mac_address\',\'MAC Address\',\'mac_addr\');';
var job = new global.AssetManagementBaseJob();
job.runScriptByJob(script, new GlideDateTime(), 'HAM Deprecate old mac address field');