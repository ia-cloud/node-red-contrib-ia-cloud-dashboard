# node-red-contrib-ia-cloud-output - json2inchart-iacloud

## 名称
json2inchartノード



## 機能概要
このノードはiacloudオブジェクト（json形式）をdashborad - chartへ入力する際の形へ変換することができます。



## 入力メッセージ
この関数を利用する際は、入力パラメータとしてiacloudオブジェクトを記述します。 
直接変換対象データを入力する場合は、リストItems内にデータを入力します。  
「ノード：[node-red-contrib-dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-dynamodb-iacloud)」 からの出力を直接本ノードに入力して使用することができます。  

以下に入力データの例を示します。 

       Items":[
        {
            "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
            "timeStamp":"2017-10-16T08:18:12.477214+09:00",
            "dataObject":{
                "timeStamp":"2017-10-16T08:18:12.477214+09:00",
                "ObjectContent":{
                    "contentType":"iaCloudData",
                    "contentData":[
                        {
                            "dataValue":35.938,
                            "dataName":"CPU温度",
                            "unit":"°C"
                        },
                        {
                            "dataValue":0,
                            "dataName":"CPU使用率",
                            "unit":"%"
                        },
                        {
                            "dataValue":500.3,
                            "dataName":"空きメモリ量",
                            "unit":"MB"
                        }
                    ]
                },
                "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
                "objectType":"iaCloudObject",
                "objectDescription":"RaspberryPi CPU情報"
            }
        },
        {
            "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
            "timeStamp":"2017-10-16T08:17:42.476071+09:00",
            "dataObject":{
                "timeStamp":"2017-10-16T08:17:42.476071+09:00",
                "ObjectContent":{
                    "contentType":"iaCloudData",
                    "contentData":[
                        {
                            "dataValue":35.938,
                            "dataName":"CPU温度",
                            "unit":"°C"
                        },
                        {
                            "dataValue":0,
                            "dataName":"CPU使用率",
                            "unit":"%"
                        },
                        {
                            "dataValue":499.92,
                            "dataName":"空きメモリ量",
                            "unit":"MB"
                        }
                    ]
                },
                "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
                "objectType":"iaCloudObject",
                "objectDescription":"RaspberryPi CPU情報"
            }
        },
        {
            "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
            "timeStamp":"2017-10-16T08:17:12.476207+09:00",
            "dataObject":{
                "timeStamp":"2017-10-16T08:17:12.476207+09:00",
                "ObjectContent":{
                    "contentType":"iaCloudData",
                    "contentData":[
                        {
                            "dataValue":35.939,
                            "dataName":"CPU温度",
                            "unit":"°C"
                        },
                        {
                            "dataValue":0,
                            "dataName":"CPU使用率",
                            "unit":"%"
                        },
                        {
                            "dataValue":500.92,
                            "dataName":"空きメモリ量",
                            "unit":"MB"
                        }
                    ]
                },
                "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
                "objectType":"iaCloudObject",
                "objectDescription":"RaspberryPi CPU情報"
            }
        }
    ]




## プロパティー
変換するデータに応じて、以下のパラメータを設定します。

- ### ノード名
  フロー上で表示するノード名を設定します。

- ### 入力値
  入力データの形式を設定します。  
  「ノード：[node-red-contrib-dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-dynamodb-iacloud)」 からの出力がアグリゲーション処理を行われていない場合は「生データ」、アグリゲーション処理が行われている場合は「アグリゲーションデータ」を選択します

- ### 項目名(dataName)
  出力する項目名(dataName)をカンマ区切りで入力します。  
  例：CPU温度,CPU使用率



## 出力メッセージ
入力されたiacloudオブジェクトをdashborad - chartへ入力する際の形に変換した結果が出力されます。  
以下に例を示します。

    [
        {
            "series": [ "CPU温度", "CPU使用率", "空きメモリ量" ],
            "data": [
                [ { x: "2017-10-16T08:18:12.477214+09:00", y: 35.938 },
                { x: "2017-10-16T08:17:42.476071+09:00", y: 35.938 },
                { x: "2017-10-16T08:17:12.476207+09:00", y: 35.399 } ],
                [ { x: "2017-10-16T08:18:12.477214+09:00", y: 0 },
                { x: "2017-10-16T08:17:42.476071+09:00", y: 0 },
                { x: "2017-10-16T08:17:12.476207+09:00", y: 0 } ],
                [ { x: "2017-10-16T08:18:12.477214+09:00", y: 500.3 },
                { x: "2017-10-16T08:17:42.476071+09:00", y: 499.92 },
                { x: "2017-10-16T08:17:12.476207+09:00", y: 500.092 } ],
            ],
            labels: [ "" ]
        }
    ]

