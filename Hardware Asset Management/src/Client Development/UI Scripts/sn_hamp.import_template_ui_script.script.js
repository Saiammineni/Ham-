function uploadAttach(recordSysId, fileName, fileData) {
    var returnObj = {
        result: false,
        message: ""
    };
    var client = new XMLHttpRequest();
    client.open(
        'post',
        '/api/now/attachment/file?table_name=sys_import_set&table_sys_id=' +
        recordSysId +
        '&file_name=' +
        fileName,
        false
    );
    client.setRequestHeader('Accept', 'application/json');
    client.setRequestHeader('Content-Type', 'application/json');
    client.setRequestHeader('X-UserToken', window.g_ck);
    client.addEventListener('load', function() {
        jQuery
            .ajax({
                method: 'PUT',
                url: '/api/now/v2/table/sys_import_set' + '/' + recordSysId,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-UserToken': window.g_ck
                },
                data: JSON.stringify({
                    status: 'loading'
                }),
                async: false
            })
            .success(function(response) {
                returnObj.result = true;
                returnObj.message = "success";
            })
            .error(function(error) {
                returnObj.result = false;
                returnObj.message = error;
            });
    });
    client.send(fileData);
    return returnObj;
}