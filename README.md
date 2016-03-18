###Data input:
1. url params: "/user/:id" => this.params.id
2. url query string: "/user/search?name=jonathan&age=27" => this.query.name & this.query.age
3. post body: curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:3001/api/1.0/login => this.request.body.username & ...