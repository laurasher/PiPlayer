/// soso utility functions.
var soso = (function () {
  var obj = {};

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function mixPoint(a, b, t) {
    return [mix(a.x, b.x, t), mix(a.y, b.y, t)];
  }

  function lerp(a, i_min, i_max, o_min, o_max) {
    return mix(o_min, o_max, (a - i_min) / (i_max - i_min));
  }

  function aspectRatio(o) {
    return o.width / o.height;
  }

  function debounce(fn, amount) {
    var timeout,
        amount = amount || 100;
    function debounced () {
      function delayed () {
        fn();
        timeout = null;
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(delayed, amount);
    }

    return debounced;
  }

  obj.mix = mix;
  obj.mixPoint = mixPoint;
  obj.lerp = lerp;
  obj.aspectRatio = aspectRatio;
  obj.debounce = debounce;

  return obj;
}());

/// Display configurations
var configuration = (function () {
  var config = {
    bos: {
      width: 10,
      height: 15,
      id: "BOS"
    },
    san: {
      width: 6,
      height: 8,
      id: "SAN"
    }
  };

  config.load = function (key) {
    if (config.hasOwnProperty(key)) {
      return config[key];
    }
    // default to boston
    return config.bos;
  };

  // One would hope for frozenness to be recursive, but it isn't.
  Object.freeze(config);
  Object.freeze(config.bos);
  Object.freeze(config.san);
  return config;
}());

/// Pixel Pusher Publishing functions

/// Converts RGBA Uint8tArray to premultiplied RGB Array.
function pixelsToRGBArray(imageData) {
  var pixels = [],
      i = 0,
      stride = 4,
      data = imageData.data,
      end = imageData.width * imageData.height * stride;
  for (i = 0; i < end; i += stride) {
    var a = data[i + 3] / 255.0;
    var rgb = Array.prototype.slice.call(data, i, i + 3).map(function (channel) {
      return Math.floor(channel * a);
    });

    pixels = pixels.concat(rgb);
  }

  return pixels;
}

/// Calls fn(x, y, [colorValues]) for each x,y pixel in pixels.
function iteratePixels(stride, width, height, pixels, fn) {
  for (var y = 0; y < height; y += 1) {
    for (var x = 0; x < width; x += 1) {
      var index = (y * width + x) * stride;
      fn(x, y, Array.prototype.slice.call(pixels, index, index + stride));
    }
  }
}

/// Loop through the pixels in a message and call fn(x, y, rgb) for each pixel.
function iterateMessageRGB(message, fn) {
  iteratePixels(3, message.width, message.height, message.pixels, fn);
}

function colorRGB(r, g, b) {
  return "rgb(" + r + ", " + g + ", " + b + ")";
}

/// Create a pixel publisher from config and optional source canvas.
/// All subscribers receive messages describing the canvas on an interval.
function createPublisher(config, source_canvas) {
  source_canvas = source_canvas || document.createElement("canvas");

  var obj = {},
      subscribers = [],
      input = source_canvas.getContext("2d"),
      name = "Web Drawing Client",
      frame = 0,
      broadcast_rate = 30, // Hz
      broadcast_interval = Math.floor(60 / broadcast_rate),
      is_running = false;

  source_canvas.width = config.width;
  source_canvas.height = config.height;

  function createMessage() {
    return {
      id: name,
      width: config.width,
      height: config.height,
      pixels: pixelsToRGBArray(input.getImageData(0, 0, config.width, config.height))
    }
  }

  function broadcastData() {
    var data = createMessage();
    subscribers.forEach(function (r) { r(data); });
  }

  function update() {
    if (frame % broadcast_interval === 0) {
      broadcastData();
    }
    frame += 1;

    if (is_running) {
      requestAnimationFrame(update);
    }
  }

  obj.subscribe = function (subscriber) {
    subscribers.push(subscriber);
  };

  obj.unsubscribe = function (subscriber) {
    subscribers = subscribers.filter(function (item) { return item !== subscriber; });
  };

  obj.start = function () {
    is_running = true;
    requestAnimationFrame(update);
  };

  obj.stop = function () {
    is_running = false;
  };

  obj.setBroadcastRate = function (hertz) {
    broadcast_rate = hertz;
    broadcast_interval = Math.floor(60 / broadcast_rate);
  }

  Object.freeze(source_canvas);
  obj.canvas = source_canvas;
  obj.start();

  return obj;
}

/// Preview rendering functions

var paper_lib = paper; // keep global object accessible after we overwrite it.

function createReader(input, output, name, circle_color) {
  var paper = new paper_lib.PaperScope(),
      reader = {},
      rows = input.height,
      columns = input.width,
      scale = 30,
      padding = 10,
      r = scale * 0.3,
      name = name || "default_web",
      source = input.getContext("2d"),
      preview_circles = [];

  output.width = input.width * scale;
  output.height = input.height * scale;
  paper.setup(output);

  var circle = new paper.Path.Circle({radius: r, fillColor: "#fff"});

  for (var y = 0; y < rows; y += 1) {
    for (var x = 0; x < columns; x += 1) {
      var c = circle.clone(),
          xp = soso.lerp(x, 0, columns - 1, padding, output.width - padding),
          yp = soso.lerp(y, 0, rows - 1, padding, output.height - padding);
      c.position = [xp, yp];

      preview_circles.push(c);
    }
  }
  circle.remove();

  function updatePreview(imageData) {
    var data = imageData.data,
        i,
        stride = 4;

    for (i = 0; i < (imageData.height * imageData.width); i += 1) {
      var id = i * stride,
          ir = id,
          ig = id + 1,
          ib = id + 2,
          ia = id + 3;

      preview_circles[i].fillColor = [data[ir] / 255.0, data[ig] / 255.0, data[ib] / 255.0, data[ia] / 255.0];
    }
  }

  function broadcastPixels(imageData) {
    var msg = {
        id: name,
        width: input.width,
        height: input.height
      },
      pixels = [],
      i,
      stride = 4,
      end = (imageData.height * imageData.width * stride),
      data = imageData.data;

    for (i = 0; i < end; i += stride) {
      var r = data[i],
          g = data[i + 1],
          b = data[i + 2],
          a = data[i + 3] / 255.0;
      r = Math.floor(r * a);
      g = Math.floor(g * a);
      b = Math.floor(b * a);

      pixels.push(r, g, b);
    }

    msg.pixels = pixels;
  }

  var frame = 0,
      broadcastRate = 2, // Hz
      broadcastInterval = Math.floor(60 / broadcastRate);
  paper.view.onFrame = function (event) {
    var data = source.getImageData(0, 0, input.width, input.height);
    updatePreview(data);
    // Broadcast at a reduced rate
    if(frame % broadcastInterval === 0) {
      broadcastPixels(data);
    }
    frame += 1;
  };

  reader.source = source;

  return reader;
}

function createPreview(output, width, height) {
  var context = output.getContext("2d"),
      obj = {};

  output.width = width || 200,
  output.height = height || 200;

  function radius(scale) { return scale.min * 0.4; }
  function padding(scale) { return scale.min * 0.66; }

  function drawCircles(message) {
    var scale = {
      x: output.width / message.width,
      y: output.height / message.height,
    };
    scale.min = Math.min(scale.x, scale.y);

    context.fillStyle = "#282828"; //color of circle mask
    context.fillRect(0, 0, output.width, output.height);

    iterateMessageRGB(message, function (x, y, rgb) {
      x = soso.lerp(x, 0, message.width - 1, padding(scale), output.width - padding(scale)),
      y = soso.lerp(y, 0, message.height - 1, padding(scale), output.height - padding(scale));
      context.beginPath();
      context.fillStyle = "rgb(" + rgb.toString() + ")";
      context.arc(x, y, radius(scale), 0, Math.PI * 2);
      context.fill();
    });
  }

  obj.setSize = function(w, h) {
    output.width = w;
    output.height = h;
  }

  obj.update = drawCircles;
  obj.canvas = output;

  return obj;
}

function createWriter(element, options) {
  var paper = new paper_lib.PaperScope(),
      updateFunctions = [],
      scale = options.scale || 1.0,
      size = options.size || {width: 10, height: 8},
      obj = {};

  element.width = size.width * scale;
  element.height = size.height * scale;

  paper.setup(element);
  // Undo the size change that paper forces if there is a CSS border.
  element.width = size.width * scale;
  element.height = size.height * scale;

  paper.view.onFrame = function (event) {
    paper.activate();

    updateFunctions.forEach(function (fn) {
      fn(event);
    });
  }

  obj.addUpdateFunction = function (fn) {
    updateFunctions.push(fn);
  }

  obj.clearUpdateFunctions = function () {
    updateFunctions.splice(0, updateFunctions.length);
  }

  obj.paper = function () {
    paper.activate();
    return paper;
  };
  return obj;
}


function createSocketIoSender() {
  if (typeof io === "undefined") {
    console.log("Make sure to include `https://cdn.socket.io/socket.io-1.3.5.js` in your scripts!",
                "We are not broadcasting to the server");

    return { update: function () {} };
  }

  var obj = {},
      socket = io('', {query: 'location='+config.id}),
      is_connected = false,
      is_sending = false;

  socket.on("connect", function (data) {
    is_connected = true;
    is_sending = true;
  });

  socket.on('some-server-message', function (data) {
    console.log(data);
  });

  socket.on('message', function (data) {
    displayFlashMessage(data);
  });

  obj.update = function (msg) {
    if (is_sending) {
      socket.emit("client-frame", msg);
    }
  }

  return obj;
}

// Flash Message Handler
function displayFlashMessage( iMessageData ) {
  if ( $('.flash-message-container').length == 0 ) {
    $('body').prepend('<div class="flash-message-container"></div>');
  }

  // build message string
  var messageString = '<div class="flash-message ' + iMessageData.class + '">' + iMessageData.message + '</div>';

  // append message.
  var message = $(messageString).hide().prependTo('.flash-message-container').fadeIn();

  setTimeout(function(){
    message.fadeOut();
  }, 3000);
}