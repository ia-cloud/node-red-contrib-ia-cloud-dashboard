# node-red-contrib-ia-cloud-dashboard - ui_spreadsheet

## 名称
dashboard - spreadsheetノード


## 機能概要
「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノードです。  
ia-cloud アラーム&イベントモデルデータの集計結果をテーブル(表)を表示します。 



## 入力メッセージ
この関数を利用する際には、「ノード：[dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-output/tree/master/dynamodb-iacloud)」からの出力を直接本ノードに入力します。  
以下に入力データの例を示します。 

        {
            "Items": [
                {
                    "objectKey": "jp.co.iacloud.alarm",
                    "timeStamp": "2019-04-01T13:07:30+09:00",
                    "dataObject": {
                        "timeStamp": "2019-04-01T13:07:30+09:00",
                        "ObjectContent": {
                            "contentType": "Alarm&Event",
                            "contentData": [
                                {
                                    "dataValue": "set",
                                    "dataName": "A&E Status",
                                    "unit": "null"
                                },
                                {
                                    "dataValue": 28,
                                    "dataName": "A&E Code",
                                    "unit": "null"
                                },
                                {
                                    "dataValue": "0001：ｲﾝﾊﾞｰﾀ異常",
                                    "dataName": "A&E Description",
                                    "unit": "null"
                                }
                            ]
                        },
                        "objectKey": "jp.co.iacloud.alarm",
                        "objectType": "iaCloudObject",
                        "objectDescription": "null",
                        "instanceKey": "null"
                    }
                },
                {
                    "objectKey": "jp.co.iacloud.alarm",
                    "timeStamp": "2019-04-01T13:07:40+09:00",
                    "dataObject": {
                        "timeStamp": "2019-04-01T13:07:40+09:00",
                        "ObjectContent": {
                            "contentType": "Alarm&Event",
                            "contentData": [
                                {
                                    "dataValue": "set",
                                    "dataName": "A&E Status",
                                    "unit": "null"
                                },
                                {
                                    "dataValue": 56,
                                    "dataName": "A&E Code",
                                    "unit": "null"
                                },
                                {
                                    "dataValue": "0005：過負荷異常",
                                    "dataName": "A&E Description",
                                    "unit": "null"
                                }
                            ]
                        },
                        "objectKey": "jp.co.iacloud.alarm",
                        "objectType": "iaCloudObject",
                        "objectDescription": "null",
                        "instanceKey": "null"
                    }
                }
            ]
        }


## プロパティー
変換するデータに応じて、以下のパラメータを設定します。

- ### グループ名
  結果を出力するダッシュボードグループを設定します。

- ### サイズ
  結果出力時のテーブルサイズを設定します。

- ### ラベル
  ダッシュボード上での表示名を設定します。

- ### 表示項目
  ダッシュボード上に表示する際の項目を設定します。  
  「A&E No,A&E詳細」、「A&E No」、「A&E詳細」から選択可能です。  

- ### ノード名
  フロー上で表示するノード名を設定します。


## 出力メッセージ
ダッシュボード上に入力パラメータに入力されたia-cloud アラーム&イベントモデルデータの集計結果をテーブル(表)形式で出力されます。