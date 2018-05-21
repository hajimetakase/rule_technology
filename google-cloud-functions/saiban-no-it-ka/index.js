/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */

const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const { WebClient } = require('@slack/client');
const Twitter = require('twitter');
const Storage = require('@google-cloud/storage');
const rcloadenv = require('@google-cloud/rcloadenv');

//Google Storageクライアント
const storage = new Storage({
    projectId: process.env.X_GOOGLE_GCLOUD_PROJECT,
});
const filename = "hash.txt"
const filepath = "/tmp/" + filename
const bucketName = 'bouchou';
const bucket = storage.bucket(bucketName);
const file = bucket.file(filename);

//前回保存したhashを取得
var previous_hash = "";
file.download(function(err, contents) {
    previous_hash = contents.toString()
    console.log(contents.toString());
});

exports.helloWorld = (req, res) => {
    console.log("start")
    const url = "https://www.kantei.go.jp/jp/singi/keizaisaisei/saiban"
    console.log(url);
    var title = "no result"
    var hash = "no hash";

    var request = require('request');
    var cheerio = require('cheerio');
    var URL = require('url-parse');
    var crypto = require('crypto');
    var shasum = crypto.createHash('sha1');
    // Example input: {"message": "Hello!"}
    if (req.body.message === undefined) {
        // This is an error case, as "message" is required.
        res.status(400).send('No message defined!');
    } else {
        request(url, function(error, response, body) {
            if (error) {
                console.log("Error: " + error);
            }
            // Check status code (200 is HTTP OK)
            console.log("Status code: " + response.statusCode);
            if (response.statusCode === 200) {
                //hash値の取得
                   var $ = cheerio.load(body);
                 title = $('title').text()
                 console.log("Page title:  " +title);
                shasum.update(body);
                hash = shasum.digest('hex');
                console.log("Page hash:  " + hash);
                console.log("Page previous hash:  " + previous_hash);
                //TODO 書き方
                //TOOD エラー処理
                //環境変数を取得
                rcloadenv.getAndApply('saiban')
                    .then((env) => {
                        //Twitterクライアント
                        const twitter_client = new Twitter({
                            consumer_key: env.TWITTER_CONSUMER_KEY,
                            consumer_secret: env.TWITTER_CONSUMER_SECRET,
                            access_token_key: env.TWITTER_ACCESS_TOKEN_KEY,
                            access_token_secret: env.TWITTER_ACCESS_TOKEN_SECRET
                        });

                        //Slackクライアント
                        const token = env.SLACK_TOKEN;
                        const slack = new WebClient(token);
                        const conversationId = 'general';
                        var message = ""
                        if (hash != previous_hash) {
                            message = "HASH is different" + " " + hash
                            console.log(message);
                            console.log("twitter");
                            //prevent duplicate
                            var timeInMs = new Date();
                            var formatted = dateFormat(timeInMs)
                            const tweet_message = formatted + "\n\n" + message + "\n\n" + url
                            twitter_client.post('statuses/update', { status: tweet_message}, function(error, tweet, response) {
                                console.log(tweet);
                                console.log(response);
                            })

                            console.log("slack")
                            slack.chat.postMessage({ channel: conversationId, text: message })
                                .then((res) => {
                                    console.log('Message sent: ', res.ts);
                                })
                                .catch(console.error);

                            //新しいハッシュ値をGoogle Storageに書き込む
                            file.createWriteStream()
                                .on('error', function(err) {})
                                .on('finish', function() {})
                                .end(hash);
                        } else {
                            message = "HASH is same " + " " + hash
                            console.log(message);
                        }　　　
                    }).catch((err) => {
                        console.error('ERROR:', err);
                    });
            }
        });
        res.status(200).send('Success: ' + hash);
    }
};

function dateFormat(date) {
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  var d = date.getDate();
  var w = date.getDay();
  var h = date.getHours();
  var mm = date.getMinutes();
  var wNames = ['日', '月', '火', '水', '木', '金', '土'];
  if (m < 10) {
    m = '0' + m;
  }
  if (d < 10) {
    d = '0' + d;
  }
  return y + '年' + m + '月' + d + '日(' + wNames[w] + ') ' + h + ':' + mm;
}