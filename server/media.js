const generate721HTML = url => {
  let text = decodeURIComponent(url.split('?')[1]);
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  text = text.replace(/\n/g, '<br />');
  text = text.replace(/(?![^<]*>|[^<>]*<\/)((https?:)\/\/[a-z0-9&#=.\/\-?_]+)/ig, function (match) {
    return '<a target="_blank" href="'+match+'">'+match+'</a>';
  });
  text = text.replace(/(?![^<]*>|[^<>]*<\/)(@[a-z0-9_]+)/ig, function (match) {
    return '<a target="_blank" href="https://twitter.com/'+match+'">'+match+'</a>';
  });
  text = text.replace(/(?![^<]*>|[^<>]*<\/)(#[a-z0-9_]+)/ig, function (match) {
    return '<a target="_blank" href="https://twitter.com/hashtag/'+match+'">'+match+'</a>';
  });
  return (
`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>📀</title>
    <style>
      body {
        font-family: Helvetica;
        padding: 0;
        margin: 0 auto;
      }
      #root {
        margin:  0 auto;
        max-width: 500px;
        min-height:  250px;
      }
      #wrap {
        padding: 16px;
        font-size: 16px;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      a, a:visited, a:hover {
        text-decoration: none;
        color: rgb(29, 155, 240);
      }
      @media(max-width: 499px) {
        #root {
          max-width: auto;
        }
      }
    </style>
  </head>
  <body>
    <div id="root"><div id="wrap">${text}</div></div>
    <script>
      var wrap = document.getElementById('wrap');
      if (wrap.getBoundingClientRect().height < 210) {
        var fontSize = 16;
        while (wrap.getBoundingClientRect().height < 210) {
          wrap.style.fontSize = '' + ++fontSize + 'px';
        }
        wrap.style.fontSize = '' + --fontSize + 'px';
      }
    </script>
  </body>
</html>
`
  );
}

module.exports = {
  generate721HTML
};
