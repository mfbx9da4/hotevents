## Dev

Requires redis to be running.

## Crawl and update db

    node meetup.js && node meetupUpload.js


## Deploy

Generate json file of hot events

    node meetup.js

Update index from json file

    node meetupUpload.js

Uploads static files index.html and style.css
    
    node UploadStaticFiles.js

All together now

    node meetup.js && node meetupUpload.js && node UploadStaticFiles.js
