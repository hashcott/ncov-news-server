# NCOV NEWS API

# [(https://news-ncov-api.herokuapp.com/)](https://news-ncov-api.herokuapp.com/)

## Routes

### Plural routes

```
GET    /news
GET    /news/1
```

### Singular routes

```
GET    /timelines
```

### Filter

Use `.` to access deep properties

```
GET /news?title=hanh&content="dep trai"
GET /news?id=1&id=2
```

### Paginate

Use `_page` and optionally `_limit` to paginate returned data.

In the `Link` header you'll get `first`, `prev`, `next` and `last` links.

```
GET /news?_page=7
GET /news?_page=7&_limit=20
```

_10 items are returned by default_

### Sort

Add `_sort` and `_order` (ascending order by default)

```
GET /news?_sort=datetime&_order=asc
```

For multiple fields, use the following format:

```
GET /news?_sort=datetime,id&_order=desc,asc
```

### Slice

Add `_start` and `_end` or `_limit` (an `X-Total-Count` header is included in the response)

```
GET /news?_start=20&_end=30
```

_Works exactly as [Array.slice](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) (i.e. `_start` is inclusive and `_end` exclusive)_

### Operators

Add `_gte` or `_lte` for getting a range

```
GET /news?views_gte=10&views_lte=20
```

Add `_ne` to exclude a value

```
GET /news?id_ne=1
```

Add `_like` to filter (RegExp supported)

```
GET /news?title_like=server
```

### Full-text search

Add `q`

```
GET /news?q=internet
```

### Relationships

To include children resources, add `_embed`

```
GET /news?_embed=comments
GET /news/1?_embed=comments
```

To include parent resource, add `_expand`

```
GET /news?_expand=post
GET /news/1?_expand=post
```

To get or create nested resources (by default one level, [add custom routes](#add-custom-routes) for more)

```
GET  /news/1/comments
```

### Database

```
GET /db
```

### Homepage

Returns default index file or serves `./public` directory

```
GET /
```

### Third-party tools

- [Grunt JSON Server](https://github.com/tfiwm/grunt-json-server)
- [Docker JSON Server](https://github.com/clue/docker-json-server)
- [JSON Server GUI](https://github.com/naholyr/json-server-gui)
- [JSON file generator](https://github.com/dfsq/json-server-init)
- [JSON Server extension](https://github.com/maty21/json-server-extension)

## License

MIT

[Supporters](https://thanks.typicode.com) ✨
