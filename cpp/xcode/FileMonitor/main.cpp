//
//  main.cpp
//  FileMonitor
//
//  Created by Yuanfei He on 15/11/15.
//  Copyright © 2015年 Yuanfei He. All rights reserved.
//

#include <iostream>
#include "FileMonitorClient.h"

int main(int argc, const char * argv[]) {
    auto fileMoition=FileMonitorClient::getInstance();
    fileMoition->connect("192.168.1.8", "6969");
    while (true) {
        if (fileMoition->isClose()) {
            break;
        }
        fileMoition->excuteRecvList();
    }
    return 0;
}
