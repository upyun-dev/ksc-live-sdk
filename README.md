### 金山云 nodejs 直播SDK 

### 使用方式: 

```javascript

const Client = require('ksc-live-sdk').Client;
const client = new Client({
    accessKeyId: '<accesskey id>',
    secretAccessKey: '<accesskey secret>',
    apiVersion: '2017-01-01',
});

client.request('<金山云接口名称>', {
        // 金山与接口所需参数, 其中 Action 与 Version 可以忽略
    },
    options: {
        headers,
        timeout,
        ....
    },
});
```

#### client.request 示例
如查询 [查询推流实时信息接口](https://docs.ksyun.com/documents/1081)
```javascript
client.request('ListRealtimePubStreamsInfo', {
        UniqueName: 'xxx',
        App: 'xxx',
        Pubdomain: 'xxx',
    },
});
```
