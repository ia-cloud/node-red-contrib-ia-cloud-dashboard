# node-red-contrib-ia-cloud-dashboard - ui_spreadsheet

## 名称
dashboard - spreadsheetノード


## 機能概要
「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノードです。  
ia-cloudオブジェクトデータの集計結果をテーブル(表)を表示します。 



## 入力メッセージ
この関数を利用する際には、「ノード：[dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-output/tree/master/dynamodb-iacloud)」から出力されたia-cloudオブジェクトデータを直接本ノードに入力します。 
以下に入力データの例を示します。 

        {
            "dataObject": {
                "ObjectContent": {
                "contentData": [
                    {
                        "commonName": "Alarm&Event",
                        "dataValue": {
                            "AnECode": "HR100",
                            "AnEdescription": "HR100の警報",
                            "AnEStatus": "on"
                        }
                    },
                    {
                        "commonName": "Alarm&Event",
                        "dataValue": {
                            "AnECode": "HR200",
                            "AnEdescription": "HR200の警報",
                            "AnEStatus": "on"
                        }
                    },
                    {
                        "commonName": "Alarm&Event",
                        "dataValue": {
                            "AnECode": "HR300",
                            "AnEdescription": "HR300の警報",
                            "AnEStatus": "set"
                        }
                    }
                ],
                "contentType": "Alarm&Event"
                },
                "objectDescription": "アラーム",
                "objectKey": "PLCAnE",
                "objectType": "iaCloudObject",
                "timestamp": "2019-04-01T09:00:00+09:00"
            },
            "objectKey": "PLCAnE",
            "timestamp": "2019-04-01T09:00:00+09:00"
        }


## プロパティー
変換するデータに応じて、以下のパラメータを設定します。

- ### グループ名
  結果を出力するダッシュボードグループを設定します。

- ### サイズ
  結果出力時のテーブルサイズを設定します。

- ### ラベル
  ダッシュボード上での表示名を設定します。

- ### 集計データ対応
  集計するデータを設定します。  
  「アラーム&イベント」から選択可能です。  

- ### 表示項目
  ダッシュボード上に表示する際の項目を設定します。  
  「A&E No,A&E詳細」、「A&E No」、「A&E詳細」から選択可能です。  

- ### ステータス
  集計するステータスを設定します。  
  「set」、「reset」、「on」、「off」から選択可能です。  

- ### ノード名
  フロー上で表示するノード名を設定します。


## 出力メッセージ
ダッシュボード上に入力パラメータに入力されたia-cloud アラーム&イベントモデルデータの集計結果をテーブル(表)形式で出力されます。