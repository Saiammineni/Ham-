(function buildJSON(/*GlideRecord*/ current, /*String*/ message, /*Object*/ attributes) {

    var json = {};
    
    json = {
        "aps" : {
            "sound" : "default"
        },
        "Redirection" : {
            "Title" : gs.getMessage("New Asset"),
            "To" : "Embedded",
            "Destination": {
                "DocumentId": "acf79176b5421010fa9b1db771f5b940",
                "ItemId": current.sys_id
            },
			"Context" : {
				"ContextType": "RECORD",
				"TableName": current.sys_class_name,
				"RecordId": current.sys_id
			}
        }
    };
    
    return json;
    
})(current, message, attributes);