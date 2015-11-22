CC = g++ -std=c++11
CFLAGS=-c -Wall -std=gnu++0x

FileMonitor : main.o FileMonitorClient.o
	$(CC) -F /System/Library/Frameworks -framework Cocoa main.o FileMonitorClient.o -o FileMonitor

main.o : cpp/xcode/FileMonitor/main.cpp cpp/xcode/FileMonitor/FileMonitorClient.h
	$(CC) -c cpp/xcode/FileMonitor/main.cpp

FileMonitorClient.o : cpp/xcode/FileMonitor/FileMonitorClient.cpp
	$(CC) -c cpp/xcode/FileMonitor/FileMonitorClient.cpp

install:FileMonitor
	mv FileMonitor /usr/local

run:FileMonitor
	./FileMonitor 1
clean:
	rm FileMonitor FileMonitorClient.o main.o
