echo "Start Crontab" `date`
cd /Users/da/code/misc/meetup-hot/
/Users/da/.nvm/versions/node/v8.9.4/bin/node meetup.js 2>&1 && /Users/da/.nvm/versions/node/v8.9.4/bin/node meetupUpload.js 2>&1
