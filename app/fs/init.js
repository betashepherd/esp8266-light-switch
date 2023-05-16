load('api_config.js');
load('api_events.js');
load('api_gpio.js');
//load('api_mqtt.js');
load('api_net.js');
//load('api_sys.js');
load('api_timer.js');

//let led = Cfg.get('board.led1.pin');
let switch_pin = 5; // swich pin
//let button = Cfg.get('pins.button');
//let topic = '/devices/' + Cfg.get('device.id') + '/events';

// print('LED GPIO:', led, 'button GPIO:', button);

//let getInfo = function() {
//  return JSON.stringify({
//    total_ram: Sys.total_ram(),
//    free_ram: Sys.free_ram()
//  });
//};

// Blink built-in LED every second
//GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.set_mode(switch_pin, GPIO.MODE_INPUT);

//Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {
//  let value = GPIO.toggle(led);
//  print(value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
  //GPIO.set_mode(switch_pin, value ? GPIO.MODE_OUTPUT : GPIO.MODE_INPUT);
//}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
//GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 20, function() {
//  let message = getInfo();
//  let ok = MQTT.pub(topic, message, 1);
//  print('Published:', ok, topic, '->', message);
//}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);

let switch_status = 0;

//HTTP header, body
let http_header = 'HTTP/1.1 200 OK\n' +
    'Server: openresty\n' +
    'Content-Type: application/json; charset=utf-8\n' +
    'Access-Control-Allow-Origin:*\n' +
    'Access-Control-Allow-Methods:GET, POST, OPTIONS\n' +
    'Access-Control-Allow-Headers:DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type\n' +
    'Connection: Close\n\n';
let http_body = JSON.stringify({code: 0, msg: 'ok'});

Net.serve({
    addr: 'tcp://8080',
    ondata: function (conn, data) {
        let pos = data.indexOf('----') + 4;
        let request = data.slice(pos, data.length);
        let op = JSON.parse(request);
        if (op.action === 'set') {
            if (op.value === 'on') {
                GPIO.set_mode(switch_pin, GPIO.MODE_OUTPUT);
                switch_status = 1;
            } else if (op.value === 'off') {
                GPIO.set_mode(switch_pin, GPIO.MODE_INPUT);
                switch_status = 0;
            }
        } else if (op.action === 'get') {
            http_body = JSON.stringify({code: 0, msg: 'ok', data: {status: switch_status ? 'on' : 'off'}});
        }
        Net.send(conn, http_header + http_body);
        Net.discard(conn, data.length);
        Net.close(conn);
    },
    onclose: function (conn) {
        Net.close(conn);
    },
    onerror: function (conn) {
        Net.close(conn);
    },
});
