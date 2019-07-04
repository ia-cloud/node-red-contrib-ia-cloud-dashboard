# node-red-contrib-ia-cloud-output - json2csv-iacloud

## 名称
json2csv ノード



## 機能概要
json2csv npmモジュールをラップするノードです。  
このノードはjson入力をcsv形式へ変換することができます。



## 入力メッセージ
この関数を利用する際はノード前にクエリを作成し、入力パラメータとしてjson形式の文字列を記述します。  
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
      },
      {
          "objectKey":"com.atbridge-cnsltg.raspberrypi-1.CPUInfo",
          "timeStamp":"2017-10-16T08:17:42.476071+09:00",
          "dataObject":{
              "timeStamp":"2017-10-16T08:17:42.476071+09:00",
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
              "ObjectContent":{"contentType":"iaCloudData",
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

- ### 変換先パス
  変換を行うJSONのパスを設定します。  
  デフォルト値：payload.Items

- ### フィールド名
  CSV出力する際のヘッダー名を記述します。  
  例：item.list.itemoCode, item.list.itemName, item.list.itemPrice

- ### リストパス
  入力値の中にリストが存在する場合は、そのリストのパスを記述します。  
  例：item.list



## 出力メッセージ
入力された文字列をcsv形式に変換した結果が出力されます。  
以下に例を示します。

    "objectKey","timeStamp","dataObject.objectKey","dataObject.objectType","dataObject.objectDescription","dataObject.timeStamp","dataObject.instanceKey","dataObject.ObjectContent.contentType","dataObject.ObjectContent.contentData.dataName","dataObject.ObjectContent.contentData.dataValue","dataObject.ObjectContent.contentData.unit"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:18:12.477214+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:18:12.477214+09:00",,"iaCloudData","CPU温度",35.938,"°C"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:18:12.477214+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:18:12.477214+09:00",,"iaCloudData","CPU使用率",0,"%"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:18:12.477214+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:18:12.477214+09:00",,"iaCloudData","空きメモリ量",500.3,"MB"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:17:42.476071+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:17:42.476071+09:00",,"iaCloudData","CPU温度",35.938,"°C"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:17:42.476071+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:17:42.476071+09:00",,"iaCloudData","CPU使用率",0,"%"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:17:42.476071+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:17:42.476071+09:00",,"iaCloudData","空きメモリ量",499.92,"MB"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:17:12.476207+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:17:12.476207+09:00",,"iaCloudData","CPU温度",35.399,"°C"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:17:12.476207+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:17:12.476207+09:00",,"iaCloudData","CPU使用率",0,"%"
    "com.atbridge-cnsltg.raspberrypi-1.CPUInfo","2017-10-16T08:17:12.476207+09:00","com.atbridge-cnsltg.raspberrypi-1.CPUInfo","iaCloudObject","RaspberryPi CPU情報","2017-10-16T08:17:12.476207+09:00",,"iaCloudData","空きメモリ量",500.092,"MB"
