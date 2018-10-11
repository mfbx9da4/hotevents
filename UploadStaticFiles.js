// Origin http://aws-website-sfhotevents-rtg2c.s3-website-us-east-1.amazonaws.com/

var AWS = require('aws-sdk'),
    fs = require('fs');
var config = require('config');
AWS.config.update({ accessKeyId: config.get('aws.accessKeyId'), secretAccessKey: config.get('aws.secretAccessKey') });
var s3 = new AWS.S3();

const files = [
  {
    Key: 'index.html',
    ContentType: 'text/html'
  },
  {
    Key: 'main.js',
    ContentType: 'text/javascript'
  },
  {
    Key: 'images/unibg.png',
    ContentType: 'image/png'
  },
  {
    Key: 'style.css',
    ContentType: 'text/css'
  }
]
files.map((file) => {
  fs.readFile(`public/${file.Key}`, function (err, data) {
    if (err) { throw err; }
    var base64data = new Buffer(data, 'binary');
    const putParams = {
      Bucket: config.get('aws.bucket'),
      Body: data,
      ACL: 'public-read',
      ...file
    }
    console.info('putParams', putParams);

    s3.putObject(putParams, function (res) {
      console.log(arguments);
      console.log(`Successfully uploaded ${file.Key}.`);
    });

    const headParams = {
      Bucket: config.get('aws.bucket'),
      Key: file.Key
    }

    s3.headObject(headParams, function (res) {
      console.info(file.Key, arguments);
    })
  });
})
