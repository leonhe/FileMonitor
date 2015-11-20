CC = g++ -std=c++11
CFLAGS=-O3 -std=c++0x -pg -D_DEBUG -g -c -Wall

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
