# node-red-contrib-ia-cloud-dashboard - getlatestdata-iacloud

## 名称
getLatestdataノード



## 機能概要
このノードはiacloudオブジェクトをdashboradの各ウィジェットへ入力する際の形へ変換することができます。 
対象ウィジェットは以下の通りです。  
- ボタン    
- ゲージ  
- 数値  
- テキスト  
- テキスト入力    
- スライダー  
- チャート(*リアルタイム入力の場合)

※チャートへの入力は「ノード：[node-red-contrib-getchartdata-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-dashboard/tree/master/getchartdata-iacloud)」を使用してください。

AWS-SDK DynamoDB関数をラップしており、DynamoDBからデータを取得する処理にはQueryを使用しています。  
より詳細に知るには、[APIドキュメント](https://docs.aws.amazon.com/sdkforruby/api/Aws/DynamoDB/Client.html)を参照してください。

このノードを使用するには、DynamoDB操作ユーザの情報が必要になります。ユーザ情報は別途発行・取得する必要があります。  




## プロパティー

取得するデータに応じて以下のパラメータを設定します。  

- ### ノード名
  フロー上で表示するノード名を設定します。

- ### 接続用ID
  使用するDynamoDB操作ユーザのIDを設定します。

- パスワード
  使用するDynamoDB操作ユーザのパスワードを設定します。

- ### テーブル名
  検索を行うテーブル名を設定します。

- ### オブジェクトキー  
  検索を行うデータのobjectKeyを設定します。

- ### 項目名(dataName)
  出力する項目名(dataName)を入力します。  
  複数の項目名を指定することはできません。  
  例：CPU温度
  


## 出力メッセージ
入力されたiacloudオブジェクトをdashborad - chartへ入力する際の形に変換した結果が出力されます。  
以下に例を示します。

    35.938

