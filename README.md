# CreateVideoThumbnails

Create video thumbnails by &lt;video> and OffscreenCanvas.

# Usage

```js
const vt = createVideoThumbnails(url, { width: 100 });
vt.make(10, (result) => {
  console.log(result);
  result.destory();
  vt.destory();
});
```

# License

Licensed by MPL-2.0
