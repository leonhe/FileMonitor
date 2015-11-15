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
    FileMonitorClient::getInstance()->connect("127.0.0.1", "6969");
    return 0;
}
