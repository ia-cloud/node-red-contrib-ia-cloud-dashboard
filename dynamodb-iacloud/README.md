# node-red-contrib-ia-cloud-dashboard - dynamodb-iacloud

## 名称
AWS DynamoDB 操作ノード



## 機能概要

AWS-SDKでDynamoDB関数をラップするノードのセットです。

このノードはscan, query, put関数のみを使用できます。

使用しているAWS IAMユーザが使用する機能に十分な権限を持っていることを確認してください。  
権限を持っていない場合、エラーメッセージが表示されます。

本ノードはJavascript APIをラップしたものです。  
より詳細に知るには、[APIドキュメント](https://docs.aws.amazon.com/sdkforruby/api/Aws/DynamoDB/Client.html)を参照してください。



## プロパティー

操作に応じて以下のパラメータを設定します。  

- ### テーブル名
  検索を行うテーブル名を設定します。

- ### 機能  
  利用する機能を設定します。  
  機能の詳細は次項目「機能」を参照してください。

- ### オブジェクトキー  
  検索を行うデータのobjectKeyを設定します。

- ### 期間  
  検索期間を設定します。  
  開始日付と終了日付を記述してください。

- ### 並び順  
  検索結果の並び順(昇順/降順)を設定します。  

- ### データ件数   
  出力する結果件数を設定します。  


## 機能

### (1) scan
テーブルまたはセカンダリインデックスの全てのアイテムにアクセスして、一つ以上のアイテムとアイテムの属性を返します。  


### (2) query
主キー値に基づいて項目が検索されます。  


### (3) put
新しい項目を作成するか、古い項目を新しい項目に書き換えます。  
新しい項目と同じ主キーを持つ項目が指定された表にすでに存在する場合、新しい項目は既存の項目を完全に置き換えます。  


<!--
## ポリシー
次のユーザポリシーまたは権限を持つIAMユーザをセットアップする必要があります。  
権限を持っていない場合、エラーメッセージが表示されます。

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AccessDynamoDBStreamOnly",
                "Effect": "Allow",
                "Action": [
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams"
                ],
                "Resource": "arn:aws:dynamodb:eu-west-1:952427577739:table/example/stream/*"
            }
        ]
    }



## 内部プロパティー

AWS接続先に応じて、ノード内のAWS項目で以下のパラメータを設定する必要があります。  
Access Id, Secret Keyの詳細は [AWS - アクセスキーについて](https://aws.amazon.com/jp/developers/access-keys/)を参照してください。
- ### Name
    接続先の名称を記述します。  
    例：AWS-User1

- ### Region
    接続先のリージョン名を記述します。  
    例：ap-northeast-1

- ### Access Id
    接続を行うアカウントのアクセスIDを記述します。  
    例：AKIAIOSFODNN7EXAMPLE

- ### Secret Key
    接続を行うアカウントのシークレットキーを記述します。  
    例：wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

-->