#!/usr/bin
command -v node >/dev/null 2>&1 || {
  curl "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg" > "$HOME/Downloads/node-latest.pkg" && sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg" -target "/"
}
echo "--------------------------------------------"
echo "NodeJS Vesion:"
node --version

node nodejs/FileMonitorClient.js &
# node nodejs/test.js
