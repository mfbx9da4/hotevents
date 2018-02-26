var algoliasearch = require('algoliasearch');

const client = algoliasearch('8AOQAW9EZA', '71f20daab287dc303ab79c66c8f1a0b0');
const index = client.initIndex('sf-events');

// index.deleteByQuery('', function(err) {
//   if (!err) {
//     console.log('success');
//   }
// });

const chunk = require('lodash.chunk')
const records = require('./hot-sf.json');

const chunks = chunk(records, 1000);

chunks.map(function(batch) {
  return index.addObjects(batch);
});
