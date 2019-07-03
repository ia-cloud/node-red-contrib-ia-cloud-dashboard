# node-red-contrib-ia-cloud-output - json2inwidget-iacloud

## 名称
json2inwidgetノード



## 機能概要

このノードはiacloudオブジェクト（json形式）をdashboradの各ウィジェットへ入力する際の形へ変換することができます。  
対象ウィジェットは以下の通り。  
- ボタン    
- ゲージ  
- 数値  
- テキスト  
- テキスト入力    
- スライダー  
- チャート(*リアルタイム入力の場合)

※チャートへの入力は「ノード：[node-red-contrib-json2inchart-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-output/tree/master/json2inchart-iacloud)」を使用する



## 入力メッセージ
この関数を利用する際は、入力パラメータとしてiacloudオブジェクト（json形式）を記述します。 
直接変換対象データを入力する場合は、リストItems内にデータを入力します。  
「ノード：[node-red-contrib-dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-dynamodb-iacloud)」 からの出力を直接本ノードに入力して使用することができます。  
 
連続したデータが入力されても、取得できるdataValueは1件目のみです。

以下に例を示します。  

       Items":[
        {
            "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
            "timeStamp":"2017-10-16T08:18:12.477214+09:00",
            "dataObject":{
                "timeStamp":"2017-10-16T08:18:12.477214+09:00",
                "ObjectContent":{"contentType":"iaCloudData",
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
        }
    ]




## プロパティー

変換するデータに応じて、以下のパラメータを設定します。

- ### 項目名(dataName)
  出力する項目名(dataName)を入力します。  
  複数の項目名を指定することはできません。  
  例：CPU温度



## 出力メッセージ

入力されたiacloudオブジェクトを各ウィジェットに入力する値に変換した結果が出力されます。  
以下に例を示します。

    35.938

