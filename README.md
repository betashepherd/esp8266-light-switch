# esp8266-light-switch

mos build --arch esp8266 --verbose --clean --local

mos flash build/fw.zip --esp-erase-chip --catch-core-dumps no


connect to esp ap

ssid: "xswitch_??????"
pass: "s123456790"

define config in conf9.json

mos put conf9.json