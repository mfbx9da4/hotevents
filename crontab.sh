cd /Users/da/code/misc/meetup-hot/
node=/Users/da/.nvm/versions/node/v8.9.4/bin/node
echo "Start Crontab" `date` > crontab.log
USE_CACHE=false $node meetup.js 2>&1 >> crontab.log && $node meetupUpload.js 2>&1 >> crontab.log
cat crontab.log
