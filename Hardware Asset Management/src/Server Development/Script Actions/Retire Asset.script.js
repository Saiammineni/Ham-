var payload = JSON.parse(event.parm1);
payload.sourceTable = current.getClassDisplayValue();
payload.sourceRecord = current.getDisplayValue();
new sn_hamp.AssetAutomationAPI().retireAsset(payload);// (ciId, assetId, location)