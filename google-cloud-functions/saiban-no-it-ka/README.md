google cloud funcions for saiban-no-it-ka
===========================================

what is this?
--------------

1. fetch html from the page
2. check hash value
3. if hash value is different from previous, alert on slack/twitter

How to execute
---------------

prepare:
```
gcloud beta runtime-config configs variables set TWITTER_CONSUMER_KEY SOME_STRING --config-name saiban --is-text
gcloud beta runtime-config configs variables set TWITTER_CONSUMER_SECRET SOME_STRING --config-name saiban --is-text
gcloud beta runtime-config configs variables set TWITTER_ACCESS_TOKEN_KEY SOME_STRING --config-name saiban --is-text
gcloud beta runtime-config configs variables set TWITTER_ACCESS_TOKEN_SECRET SOME_STRING --config-name saiban --is-text
gcloud beta runtime-config configs variables set SLACK_TOKEN SOME_STRING --config-name saiban --is-text
```

execute command:
`curl -X POST -H "Content-Type:application/json" HOST_URL -d '{"message": "Hello"}'`
HOST_URL shall be the endpoint for the google cloud function

Sample
-------
- [twitter](https://twitter.com/saiban_no_it_ka)

TODO
-----
- 開発環境
- スケジューリング
- jar の実行
- エラーハンドリング
- response