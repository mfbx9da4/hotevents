## Dev

Requires redis to be running.

## Crawl and update db

    node index.js --run


## Deploy

Generate json file of hot events

    node meetup.js

Update index from json file

    node meetupUpload.js

Uploads static files index.html and style.css
    
    node UploadStaticFiles.js

All together now

    node meetup.js && node meetupUpload.js && node UploadStaticFiles.js

##Origin aws s3

http://aws-website-sfhotevents-rtg2c.s3-website-us-east-1.amazonaws.com/
