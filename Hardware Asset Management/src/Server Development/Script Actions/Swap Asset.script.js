var payload = JSON.parse(event.parm1);
payload.sourceTable = current.getClassDisplayValue();
payload.sourceRecord = current.getDisplayValue();
new sn_hamp.AssetAutomationAPI().swapAsset(payload); // (oldCIId, newCIId, oldAssetId, newAssetId, userId, location, assignedTime, installedTime)