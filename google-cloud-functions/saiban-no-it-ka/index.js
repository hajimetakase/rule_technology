/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */

const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const { WebClient }  = require('@slack/client');
const Twitter = require('twitter');
const Storage = require('@google-cloud/storage');
const rcloadenv = require('@google-cloud/rcloadenv');

var project_id = ""
var slack_token = ""
var twitter_consumer_key = ""
var twitter_consumer_secret = ""
var twitter_access_token_key = ""
var twitter_access_token_secret = ""

//環境変数を取得
rcloadenv.getAndApply('saiban')
    .then((env) => {
        project_id = env.PROJECT_ID;
        slack_token = env.SLACK_TOKEN;
        twitter_consumer_key = env.TWITTER_CONSUMER_KEY;
        twitter_consumer_secret = env.TWITTER_CONSUMER_SECRET;
        twitter_access_token_key = env.TWITTER_ACCESS_TOKEN_KEY;
        twitter_access_token_secret = env.TWITTER_ACCESS_TOKEN_SECRET;

    })
    .catch((err) => {
        console.error('ERROR:', err);
    });

//Google Storageクライアント
const storage = new Storage({
    projectId: project_id,
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

//Twitterクライアント
const twitter_client = new Twitter({
    consumer_key: twitter_consumer_key,
    consumer_secret: twitter_consumer_secret,
    access_token_key: twitter_access_token_key,
    access_token_secret: twitter_access_token_secret
});

//Slackクライアント
const token = slack_token
const slack = new WebClient(token);
const conversationId = 'general';

exports.helloWorld = (req, res) => {
    const url = "https://www.kantei.go.jp/jp/singi/keizaisaisei/saiban"
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
                shasum.update(body);
                hash = shasum.digest('hex');
                console.log("Page hash:  " + hash);
                console.log("Page previous hash:  " + previous_hash);
                //TODO 書き方
                //TOOD エラー処理
                var message = ""
                if (hash != previous_hash) {
                    message = "hash is different"
                    console.log(message);
                    //新しいハッシュ値をGoogle Storageに書き込む
                    file.createWriteStream()
                        .on('error', function(err) {})
                        .on('finish', function() {})
                        .end(hash);
                    console.log("slack")
                    slack.chat.postMessage({ channel: conversationId, text: message })
                        .then((res) => {
                            console.log('Message sent: ', res.ts);
                        })
                        .catch(console.error);
                } else {
                    message = "HASH is same"
                    console.log(message);
                }　　　
                console.log("twitter")
                twitter_client.post('statuses/update', { status: message }, function(error, tweet, response) {
                    if (error) throw error;
                    console.log(tweet);
                    console.log(response);
                });
            }
        });
        res.status(200).send('Success: ' + hash);
    }
};