# node-red-contrib-ia-cloud-dasshboard - ui_dateset

## 名称
dashboard - datesetノード


## 機能概要

「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノードです。  
開始日時・終了日時の取得ができます。  
「ノード：[dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-dashboard/tree/master/dynamodb-iacloud)」、「ノード：[getChartdata-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-dashboard/tree/master/getchartdata-iacloud)」の入力に使用します。  


## プロパティー

以下のパラメータを設定します。

- ### グループ名
  結果を出力するダッシュボードグループを設定します。

- ### サイズ
  ダッシュボード表示時のサイズを設定します。

- ### 名前
  フロー上で表示するノード名を設定します。


## 出力メッセージ
ダッシュボードから開始日時、終了日時が取得できます。  
本ノードの出力を「ノード：[dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-dashboard/tree/master/dynamodb-iacloud)」、「ノード：[getChartdata-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-dashboard/tree/master/getchartdata-iacloud)」の入力に使用することが可能です。

開始日時がsdate, 終了日時がedateに設定されたオブジェクトが出力されます。  
開始日時、終了日付が入力されていなかった場合、入力されなかった項目が削除された結果が出力されます。  
出力されるメッセージ例は以下の通りです。    

        [例1:開始日時、終了日時共に入力あり]
        {
            "sdate":"2019-05-01",
            "edate":"2019-05-31"
        }

        [例2:開始日時入力なし、終了日時入力あり]
        {
            "edate":"2019-05-31"
        }
   
