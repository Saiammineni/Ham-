# Update Hardware State catalog item

The catalog item lets a requester select a hardware record and one of its
configured state choices. Submitting the request updates the asset's
`install_status` immediately.

The local catalog item specification is in
[`catalog-item.json`](catalog-item.json). The item has been created in the
ServiceNow instance as sys_id `73e47230345013107f44de1b321144a4`. The linked
Business Rule, client script, and Script Include have also been created; their
sys_ids are recorded in the catalog specification.

## Instance records

The catalog item, variables, Business Rule, Catalog Client Script, and Script
Include have been created in the instance. The Script Include requires the
`asset` role, and the Business Rule only processes this catalog item.

1. Catalog item: **Update Hardware State**. Set it active and apply the
   appropriate catalog, user criteria, and access controls for your
   organization.
2. Variables in this order:

   | Order | Name | Type | Configuration |
   |---:|---|---|---|
   | 100 | `asset` | Reference | Reference table `alm_hardware`; mandatory |
   | 200 | `state` | Select Box | Mandatory; choices are populated by the client script |
3. Script Include from
   [`HardwareStateCatalogAjax.script.js`](../../Server%20Development/Script%20Includes/HardwareStateCatalogAjax.script.js).
   Name it `HardwareStateCatalogAjax`, set it active and client callable. The
   Script Include extends `global.AbstractAjaxProcessor`; the client script
   calls it as a Global-scope Script Include named `HardwareStateCatalogAjax`.
   Its client-callable ACL requires the `asset` role.
4. Catalog Client Script from
   [`Load%20hardware%20state%20choices.script.js`](../Catalog%20Client%20Scripts/Load%20hardware%20state%20choices.script.js).
   Set Type to **onChange**, Variable name to `asset`, and UI Type to **All**.
5. Business Rule on `sc_req_item` from
   [`Apply catalog hardware state.script.js`](../../Server%20Development/Business%20Rules/Apply%20catalog%20hardware%20state.script.js).
   It is active, **After**, and **Insert** only; its script checks the catalog
   item sys_id before changing an asset.

The Ajax Script Include loads active `install_status` choices from
`alm_hardware` and its parent table, `alm_asset`. The Business Rule revalidates
the choice and writes the selected value to `alm_hardware.install_status`.
It uses `GlideRecordSecure`, so the executing user must have write access to
the selected asset.

## Verify

- Select an asset and confirm its `install_status` choices load. Change the asset and
  confirm the state selection clears and reloads.
- Submit a request as a user authorized to update the selected asset. Confirm
  its `install_status` changes immediately.
- Confirm an unauthorized user cannot update the asset and an invalid state
  value does not change it.

Confirm the records are captured in the intended update set, then test the full
request flow before publishing.
