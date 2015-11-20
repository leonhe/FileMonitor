CC = g++ -std=gnu++0x
CFLAGS=-c -Wall -std=gnu++0x

FileMonitor : main.o FileMonitorClient.o
	$(CC) -o main.o FileMonitorClient.o 

main.o : cpp/xcode/FileMonitor/main.cpp cpp/xcode/FileMonitor/FileMonitorClient.h
	$(CC) -c cpp/xcode/FileMonitor/main.cpp

FileMonitorClient.o : cpp/developUtils/FileMonitorClient.cpp cpp/xcode/FileMonitor/FileMonitorClient.h
	$(CC) -c cpp/xcode/FileMonitor/FileMonitorClient.cpp

# install:GLMain
# 	mv GLMain /usr/local

# run:GLMain
# 	./GLMain
# clean:
# 	rm GLMain GLMain.o
