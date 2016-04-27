### Data input:
1. url params: "/user/:id" => this.params.id
2. url query string: "/user/search?name=jonathan&age=27" => this.query.name & this.query.age
3. post body: curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:3001/api/1.0/login => this.request.body.username & ...

client api
client model validation

如果uri上使用了 /user/:id 这样的占位符
下面的参数列表顺序必须和uri上的参数顺序一致
此外uri里的参数名必须和下面joi定义的参数名一致

orm的spec里,waterline之外的属性有 cacheKey

waterline的模型定义中的几个回调函数,应该清除缓存数据,如果有自己实现内容的话

解释OrmModel里的带缓存函数find的相关业务

koa context里的reqId

客户端脚本在调用patch方法的时候除了按规定的scheme传递参数外，还可以传递id和一个json的数据进行部分更新
clientJs.patchComment(id, jsonData)
