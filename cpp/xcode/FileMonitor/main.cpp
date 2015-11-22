//
//  main.cpp
//  FileMonitor
//
//  Created by Yuanfei He on 15/11/15.
//  Copyright © 2015年 Yuanfei He. All rights reserved.
//

#include <iostream>
#include <unistd.h>
#include <netdb.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "FileMonitorClient.h"

int main(int argc, const char * argv[]) {
    
    char hname[128];
    struct hostent *hent;
    
    gethostname(hname, sizeof(hname));
    
    //hent = gethostent();
    hent = gethostbyname(hname);
    
    printf("hostname: %s\n", hent->h_name);
    bool isTest=(argc>1);
    
    const char* ip =inet_ntoa(*(struct in_addr*)(hent->h_addr_list[0]));
    std::cout<<"host ip:"<<ip<<std::endl;
    auto fileMoition=FileMonitorClient::getInstance();
    fileMoition->connect(ip, "6969",isTest);
    
    while (true) {
        if (fileMoition->isClose()) {
            break;
        }
        fileMoition->excuteRecvList();
    }
    return 0;
}
