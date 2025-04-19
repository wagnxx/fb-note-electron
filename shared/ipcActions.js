// 定义公共的 IPC_ACTIONS
 const IPC_ACTIONS = {
    START_SOCKS_SERVICE: 'start-socks-service',
    SOCKS_SERVICE_OUTPUT: 'socks-service-output',
    SOCKS_SERVICE_ERROR: 'socks-service-error',
    SOCKS_SERVICE_STOPPED: 'socks-service-stopped',
    STOP_SOCKS_SERVICE: 'stop-socks-service',
    CHECK_SOCKS_SERVICE: 'check-socks-service',
    GET_SOCKS_SERVICE_INFO: 'get-socks-service-info',

    
    GET_LOGS: 'get-logs',
    SUBPROCESS_ERROR: 'subprocess-errors',

    SELECT_FILE: 'select-file',
    GET_DIRECTORY_STRUCTURE: 'get-directory-structure',
    PARSE_DOC_FILE: 'parse-doc-file',
    CONVERT_DOC_TO_IMAGE: 'convert-doc-to-image',
    SAVE_BASE64_IMAGE: 'save-base64-image',
    LS_FOLDER: 'ls-folder',
    LOAD_VIDEO: 'load-video',
    READ_STREAM: 'read-stream',
    CHECK_FOLDER_EXIST: 'check_folder_exist',
    READ_JSON: 'read-json',
    SAVE_JSON: 'save-json',
    DELETE_FILE: 'delete-file',
    
    SAVE_SCREENSHOT: 'save-screenshot',
    REMOVE_SCREENSHOT: 'remove-screenshot',
    BATCH_CROP_IMAGE: 'batch-crop-image',
    MERGE_IMAGES: 'merge-images',
    COMPARE_IMAGES: 'compare-images',
    EXRACT_IMAGES_TEXT: 'exract-images-text',
    EXRACT_VIDEO_FRAME_TEXT: 'exract-video-frame-text',
    PAUSE_DOWNLOAD: 'pause-download',
    RESUME_DOWNLOAD: 'resume-download',
    CANCEL_DOWNLOAD: 'cancel-download',
    
    IMAGE_TO_ICONS: 'image_to_icons',
  };
  
 module.exports = {
    IPC_ACTIONS
 } 