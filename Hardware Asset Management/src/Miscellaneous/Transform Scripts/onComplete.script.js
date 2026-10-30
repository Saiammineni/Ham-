(function runTransformScript(source, map, log, target /*undefined onStart*/ ) {

    var getAttachmentID = new GlideRecord('sys_attachment');
    if (getAttachmentID.get('table_sys_id', source.sys_import_set)) {
        var attachmentID = getAttachmentID.sys_id;
        var deleteAttach = new GlideSysAttachment();
        deleteAttach.deleteAttachment(attachmentID);
    }

})(source, map, log, target);